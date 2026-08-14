import assert from "node:assert/strict";
import test from "node:test";
import type { CourseVersionId } from "../app/domain/catalog";
import { buildAcademicCalendar } from "../app/domain/academic-calendar";
import type { ScheduleEntry } from "../app/learner-progress-contract";
import type { StoredProgramProgress } from "../app/progress-storage";
import { computerScienceBundleV12 as bundle } from "../content/programs/computer-science-v1-2";

const concentration = bundle.concentrations[0];
assert.ok(concentration);

function progress(
  overrides: Partial<StoredProgramProgress> = {},
  options: {
    readonly startDate?: string;
    readonly paceHoursPerWeek?: number;
    readonly preferredStudyDays?: readonly (0 | 1 | 2 | 3 | 4 | 5 | 6)[];
  } = {},
): StoredProgramProgress {
  return {
    selectedConcentrationId: concentration.id,
    enrollment: {
      startDate: options.startDate ?? "2026-08-10",
      paceHoursPerWeek: options.paceHoursPerWeek ?? 40,
      preferredStudyDays: options.preferredStudyDays ?? [0, 1, 2, 3, 4, 5, 6],
      timezone: "UTC",
      enrolledAt: "2026-08-09T00:00:00Z",
      status: "enrolled",
    },
    ...overrides,
  };
}

function materializedEntries(
  operations: ReturnType<typeof buildAcademicCalendar>["reconciliationOperations"],
) {
  return Object.fromEntries(
    operations.flatMap((operation) =>
      operation.type === "upsert-schedule-entry"
        ? [[operation.entry.id, operation.entry] as const]
        : [],
    ),
  );
}

test("the academic calendar starts from enrollment and interleaves realistic sessions", () => {
  const plan = buildAcademicCalendar(bundle, progress(), "2026-08-10");
  const todayMinutes = plan.todaySessions.reduce(
    (total, session) => total + session.entry.plannedMinutes,
    0,
  );
  const firstWeekCourses = new Set(
    plan.sessions
      .filter(
        (session) =>
          session.entry.scheduledDate >= "2026-08-10" &&
          session.entry.scheduledDate <= "2026-08-16",
      )
      .map((session) => session.courseVersionId),
  );
  const firstSubject = plan.sessions[0]?.entry.subject;

  assert.equal(plan.totalUnits, 240);
  assert.equal(plan.terms.length, 6);
  assert.equal(plan.terms[0]?.startDate, "2026-08-10");
  assert.equal(plan.dailyCapacityMinutes, 343);
  assert.equal(plan.effectiveWeeklyMinutes, 2_400);
  assert.ok(todayMinutes <= plan.dailyCapacityMinutes);
  assert.ok(plan.todaySessions.every((session) => session.entry.plannedMinutes <= 90));
  assert.equal(firstWeekCourses.size, 5);
  assert.ok(firstSubject);
  assert.ok(
    plan.sessions.filter(
      (session) =>
        session.entry.subject.kind === firstSubject.kind &&
        session.entry.subject.id === firstSubject.id,
    ).length > 1,
  );
  assert.deepEqual(
    new Set(plan.sessions.map((session) => session.taskKind)),
    new Set(["study", "project", "midterm", "final"]),
  );
  assert.equal(
    plan.terms[0]?.breakAfter?.endDate,
    "2027-01-10",
  );
  assert.ok(
    plan.sessions.every(
      (session) => session.deadlineDate >= session.entry.scheduledDate,
    ),
  );
});

test("every selected CS week maps to its exact location, activity, and deliverable", () => {
  const plan = buildAcademicCalendar(bundle, progress(), "2026-08-10");
  const unitById = new Map(bundle.learningUnits.map((unit) => [unit.id, unit]));
  const assessmentByUnitId = new Map(
    bundle.assessmentVersions.flatMap((assessment) =>
      assessment.unitId ? [[assessment.unitId, assessment] as const] : [],
    ),
  );
  const observedWeeks = new Set<string>();

  for (const session of plan.sessions) {
    const unit = unitById.get(session.unitId);
    assert.ok(unit);
    const assignments = unit.weeklyAssignments ?? [];
    let elapsedMinutes = 0;
    const assignment = assignments.find((candidate) => {
      elapsedMinutes += candidate.estimatedHours * 60;
      return session.workOffsetMinutes < elapsedMinutes;
    });
    assert.ok(assignment, `missing weekly assignment for ${session.unitId}`);
    const assessment = assessmentByUnitId.get(unit.id);
    const assessmentStartMinutes = assessment
      ? unit.nominalHours * 60 - assessment.estimatedHours * 60
      : Number.POSITIVE_INFINITY;
    const isAssessmentPhase = session.workOffsetMinutes >= assessmentStartMinutes;
    if (isAssessmentPhase) {
      assert.ok(assessment);
      assert.equal(assignment.activity, assessment.instructions);
      assert.equal(
        assignment.deliverable,
        assessment.submissionEvidence.join("; "),
      );
      assert.equal(session.taskKind, assessment.stage);
      assert.equal(session.unitTitle, assessment.title);
      assert.equal(session.activity, assessment.instructions);
      assert.equal(session.produce, assessment.submissionEvidence.join("; "));
    } else {
      assert.equal(session.activity, assignment.activity);
      assert.equal(session.produce, assignment.deliverable);
      assert.match(session.unitTitle, new RegExp(`^Week ${assignment.week}:`));
    }
    assert.equal(session.where, assignment.resourceLocator);
    assert.equal(
      session.resourceUrl,
      assignment.resourceLocator.match(/https?:\/\/[^\s)\]}]+/u)?.[0],
    );
    observedWeeks.add(`${session.unitId}:${assignment.week}`);
  }

  assert.equal(observedWeeks.size, 480);
});

test("CS101 embeds the actual midterm and final in weeks 8 and 16", () => {
  const plan = buildAcademicCalendar(bundle, progress(), "2026-08-10");
  const courseIdentity = bundle.courses.find(
    (course) => course.canonicalSlug === "programming-1",
  );
  assert.ok(courseIdentity);
  const courseVersion = bundle.courseVersions.find(
    (course) => course.courseId === courseIdentity.id,
  );
  assert.ok(courseVersion);

  for (const stage of ["midterm", "final"] as const) {
    const assessment = bundle.assessmentVersions.find(
      (candidate) =>
        candidate.courseVersionId === courseVersion.id &&
        candidate.stage === stage,
    );
    assert.ok(assessment?.unitId);
    const sessions = plan.sessions.filter(
      (session) =>
        session.courseVersionId === courseVersion.id &&
        session.unitId === assessment.unitId,
    );
    const learningSessions = sessions.filter(
      (session) => session.workOffsetMinutes < 600,
    );
    const assessmentSessions = sessions.filter(
      (session) => session.workOffsetMinutes >= 600,
    );

    assert.ok(learningSessions.length > 0);
    assert.ok(assessmentSessions.length > 0);
    assert.ok(
      learningSessions.every((session) => session.unitTitle.startsWith("Week ")),
    );
    assert.ok(
      assessmentSessions.every(
        (session) =>
          session.taskKind === stage &&
          session.unitTitle === assessment.title &&
          session.activity === assessment.instructions &&
          session.produce === assessment.submissionEvidence.join("; "),
      ),
    );
  }
});

test("generated sessions stop at every ten-hour weekly boundary", () => {
  const plan = buildAcademicCalendar(bundle, progress(), "2026-08-10");
  const unitById = new Map(bundle.learningUnits.map((unit) => [unit.id, unit]));

  for (const session of plan.sessions) {
    const unit = unitById.get(session.unitId);
    assert.ok(unit);
    const endOffset = session.workOffsetMinutes + session.entry.plannedMinutes;
    let boundary = 0;
    for (const assignment of unit.weeklyAssignments ?? []) {
      boundary += assignment.estimatedHours * 60;
      assert.ok(
        session.workOffsetMinutes >= boundary || endOffset <= boundary,
        `${session.unitId} session ${session.workOffsetMinutes}–${endOffset} crossed ${boundary}`,
      );
    }
  }

  assert.ok(
    plan.sessions.some((session) => session.workOffsetMinutes === 600),
    "the plan should start a new session exactly at the week-two boundary",
  );
});

test("generated assignments are idempotent and completed sessions remain in daily history", () => {
  const initial = buildAcademicCalendar(bundle, progress(), "2026-08-10");
  const scheduleEntries = materializedEntries(initial.reconciliationOperations);
  const replay = buildAcademicCalendar(
    bundle,
    progress({ scheduleEntries }),
    "2026-08-10",
  );
  assert.equal(replay.reconciliationOperations.length, 0);

  const first = Object.values(scheduleEntries)[0];
  assert.ok(first);
  const completed: ScheduleEntry = {
    ...first,
    status: "completed",
    completedAt: "2026-08-10T10:30:00Z",
  };
  const afterCompletion = buildAcademicCalendar(
    bundle,
    progress({ scheduleEntries: { ...scheduleEntries, [completed.id]: completed } }),
    "2026-08-10",
  );
  const todayMinutes = afterCompletion.todaySessions.reduce(
    (total, session) => total + session.entry.plannedMinutes,
    0,
  );

  assert.ok(
    afterCompletion.todaySessions.some(
      (session) =>
        session.entry.id === completed.id && session.entry.status === "completed",
    ),
  );
  assert.ok(
    afterCompletion.recentHistory.some(
      (session) => session.entry.id === completed.id,
    ),
  );
  assert.ok(todayMinutes <= afterCompletion.dailyCapacityMinutes);
});

test("completed Week 1 sessions retain their historical assignment after crossing Week 2", () => {
  const initial = buildAcademicCalendar(bundle, progress(), "2026-08-10");
  const firstUnit = bundle.learningUnits[0];
  assert.ok(firstUnit);
  const unitSessions = initial.sessions.filter(
    (session) =>
      session.entry.subject.kind === "learningUnit" &&
      session.entry.subject.id === firstUnit.id,
  );
  const completedEntries: ScheduleEntry[] = [];
  let completedMinutes = 0;
  for (const session of unitSessions) {
    if (completedMinutes >= 600) break;
    completedEntries.push({
      ...session.entry,
      status: "completed",
      completedAt: `${session.entry.scheduledDate}T18:00:00Z`,
    });
    completedMinutes += session.entry.plannedMinutes;
  }
  assert.equal(completedMinutes, 600);
  const today = completedEntries.at(-1)?.scheduledDate;
  assert.ok(today);

  const rebuilt = buildAcademicCalendar(
    bundle,
    progress({
      scheduleEntries: Object.fromEntries(
        completedEntries.map((entry) => [entry.id, entry]),
      ),
    }),
    today,
  );
  const entryIds = new Set(completedEntries.map((entry) => entry.id));
  const history = rebuilt.recentHistory.filter((session) =>
    entryIds.has(session.entry.id),
  );

  assert.ok(history.length > 0);
  assert.ok(
    history.every((session) => session.unitTitle.startsWith("Week 1:")),
  );
  assert.ok(history.every((session) => session.workOffsetMinutes < 600));
});

test("unfinished assignments carry forward once and future dates recalculate", () => {
  const monday = buildAcademicCalendar(
    bundle,
    progress({}, { preferredStudyDays: [1, 2, 3, 4, 5] }),
    "2026-08-10",
  );
  const mondayEntries = materializedEntries(monday.reconciliationOperations);
  const tuesday = buildAcademicCalendar(
    bundle,
    progress(
      { scheduleEntries: mondayEntries },
      { preferredStudyDays: [1, 2, 3, 4, 5] },
    ),
    "2026-08-11",
  );
  const carried = tuesday.reconciliationOperations.flatMap((operation) =>
    operation.type === "upsert-schedule-entry" &&
    operation.entry.source === "carry-forward"
      ? [operation.entry]
      : [],
  );
  const carriedOrigins = new Set(carried.map((entry) => entry.originEntryId));

  assert.equal(carried.length, Object.keys(mondayEntries).length);
  assert.deepEqual(carriedOrigins, new Set(Object.keys(mondayEntries)));
  assert.ok(
    tuesday.todaySessions.reduce(
      (total, session) => total + session.entry.plannedMinutes,
      0,
    ) <= tuesday.dailyCapacityMinutes,
  );
  assert.ok(tuesday.projectedCompletionDate >= monday.projectedCompletionDate);

  const reconciledEntries = materializedEntries(tuesday.reconciliationOperations);
  const stable = buildAcademicCalendar(
    bundle,
    progress(
      { scheduleEntries: reconciledEntries },
      { preferredStudyDays: [1, 2, 3, 4, 5] },
    ),
    "2026-08-11",
  );
  assert.equal(stable.reconciliationOperations.length, 0);
});

test("graduation uses actual remaining hours and safe achievable capacity", () => {
  const selectedCourseIds = new Set<CourseVersionId>([
    ...bundle.courseVersions
      .map((course) => course.id)
      .filter((id) =>
        bundle.concentrations.every(
          (candidate) => !candidate.courseVersionIds.includes(id),
        ),
      ),
    ...concentration.courseVersionIds,
  ]);
  const firstTermCourseIds = new Set(
    bundle.schedules[0]?.placements
      .filter((placement) => placement.periodId === bundle.calendars[0]?.periods[0]?.id)
      .flatMap((placement) =>
        placement.subject.kind === "courseVersion" &&
        selectedCourseIds.has(placement.subject.id)
          ? [placement.subject.id]
          : [],
      ) ?? [],
  );
  const completedFirstTerm = Object.fromEntries(
    [...firstTermCourseIds].map((courseVersionId) => [
      courseVersionId,
      {
        completedUnitIds: bundle.learningUnits
          .filter((unit) => unit.courseVersionId === courseVersionId)
          .map((unit) => unit.id),
      },
    ]),
  );
  const plan = buildAcademicCalendar(
    bundle,
    progress({ courses: completedFirstTerm }),
    "2026-12-26",
  );
  const constrained = buildAcademicCalendar(
    bundle,
    progress({}, { preferredStudyDays: [6], paceHoursPerWeek: 40 }),
    "2026-08-15",
  );
  const oldPace = buildAcademicCalendar(
    bundle,
    progress({}, { preferredStudyDays: [1, 2, 3, 4, 5], paceHoursPerWeek: 40 }),
    "2026-08-10",
  );
  const reducedPace = buildAcademicCalendar(
    bundle,
    progress(
      { scheduleEntries: materializedEntries(oldPace.reconciliationOperations) },
      {
        preferredStudyDays: [0, 1, 2, 3, 4, 5, 6],
        paceHoursPerWeek: 10,
      },
    ),
    "2026-08-10",
  );

  assert.equal(firstTermCourseIds.size, 5);
  assert.equal(plan.completedUnits, 40);
  // Checked learning units no longer erase the still-unsubmitted assessment
  // workload for those five courses (40 hours per course).
  assert.equal(plan.remainingMinutes, 4_200 * 60);
  assert.equal(constrained.dailyCapacityMinutes, 480);
  assert.equal(constrained.effectiveWeeklyMinutes, 480);
  assert.equal(constrained.capacityLimited, true);
  assert.ok(constrained.projectedCompletionDate > plan.projectedCompletionDate);
  assert.ok(
    reducedPace.todaySessions.reduce(
      (total, session) =>
        total +
        (session.entry.status === "planned" || session.entry.status === "completed"
          ? session.entry.plannedMinutes
          : 0),
      0,
    ) <= reducedPace.dailyCapacityMinutes,
  );
});

test("a future enrollment creates future terms without assigning work today", () => {
  const plan = buildAcademicCalendar(
    bundle,
    progress({}, { startDate: "2026-09-01" }),
    "2026-08-10",
  );

  assert.equal(plan.terms[0]?.startDate, "2026-09-01");
  assert.equal(plan.todaySessions.length, 0);
  assert.equal(plan.reconciliationOperations.length, 0);
});
