import assert from "node:assert/strict";
import test from "node:test";
import type { CourseVersionId } from "../app/domain/catalog";
import { buildAcademicCalendar } from "../app/domain/academic-calendar";
import type { ScheduleEntry } from "../app/learner-progress-contract";
import type { StoredProgramProgress } from "../app/progress-storage";
import { computerScienceBundle as bundle } from "../content/programs/computer-science-v1-1";

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
  assert.equal(plan.remainingMinutes, 4_000 * 60);
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
