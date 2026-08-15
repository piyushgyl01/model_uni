import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildAcademicCalendar } from "../app/domain/academic-calendar";
import type {
  CourseVersionId,
  PublishedProgramBundle,
} from "../app/domain/catalog";
import { buildIndependentLearningRecord } from "../app/domain/independent-learning-record";
import {
  evaluateLearnerPathCompletion,
  resolveLearnerPath,
} from "../app/domain/learner-path";
import { getMasteredCourseVersionIds } from "../app/domain/mastery";
import {
  evaluateAllCoursePrerequisites,
  evaluateCoursePrerequisites,
  getActiveWaivedPrerequisiteCourseVersionIds,
} from "../app/domain/prerequisite-evaluator";
import { evaluateTermProgress } from "../app/domain/term-evaluator";
import { calculateTodayQueue } from "../app/domain/today-queue";
import type { StudyDay } from "../app/learner-progress-contract";
import type { StoredProgramProgress } from "../app/progress-storage";
import { catalogRepository } from "../content/catalog";

/**
 * The release gate for the twelve published verification criteria.
 *
 * Every assertion here runs against the *latest* publication resolved through
 * the repository boundary, never a direct `content/programs/*` import. A new
 * publication therefore inherits these criteria automatically instead of
 * leaving the gate pinned to a superseded bundle.
 */
const bundle = catalogRepository.loadBySlug("computer-science");
assert.ok(bundle, "Computer Science must be published.");
assert.equal(
  bundle.programVersion.version,
  catalogRepository.listVersions("computer-science")[0],
  "The acceptance gate must run against the latest Computer Science publication.",
);

const concentration = bundle.concentrations[0];
assert.ok(concentration);

const DAY_MS = 86_400_000;

function weekdayOf(date: string): StudyDay {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay() as StudyDay;
}

function enrolled(
  overrides: Partial<StoredProgramProgress> = {},
  options: {
    readonly startDate?: string;
    readonly paceHoursPerWeek?: number;
    readonly preferredStudyDays?: readonly StudyDay[];
    readonly selectedConcentrationId?: string;
  } = {},
): StoredProgramProgress {
  return {
    selectedConcentrationId:
      options.selectedConcentrationId ?? concentration.id,
    enrollment: {
      startDate: options.startDate ?? "2026-08-10",
      paceHoursPerWeek: options.paceHoursPerWeek ?? 40,
      preferredStudyDays: options.preferredStudyDays ?? [0, 1, 2, 3, 4, 5, 6],
      timezone: "UTC",
      enrolledAt: "2026-08-09T00:00:00.000Z",
      status: "enrolled",
    },
    ...overrides,
  };
}

/**
 * Builds the learning work, project evidence and passing assessment attempts a
 * course genuinely needs to reach `passed`. Nothing here shortcuts mastery:
 * every field is the same durable state a learner would accumulate.
 */
function mastered(
  publication: PublishedProgramBundle,
  courseVersionIds: ReadonlySet<CourseVersionId>,
): Pick<
  StoredProgramProgress,
  "courses" | "unitEvidences" | "assessmentAttempts"
> {
  const courses = Object.fromEntries(
    [...courseVersionIds].map((courseVersionId) => [
      courseVersionId,
      {
        completedUnitIds: publication.learningUnits
          .filter((unit) => unit.courseVersionId === courseVersionId)
          .map((unit) => unit.id),
      },
    ]),
  );
  const unitEvidences = Object.fromEntries(
    publication.learningUnits
      .filter(
        (unit) =>
          courseVersionIds.has(unit.courseVersionId) &&
          (unit.kind === "project" ||
            ["project", "lab", "portfolio", "presentation"].includes(
              unit.assessmentKind ?? "",
            )),
      )
      .map((unit) => [
        unit.id,
        {
          learningUnitId: unit.id,
          courseVersionId: unit.courseVersionId,
          textOrUrl: `https://example.test/evidence/${unit.id}`,
          updatedAt: "2026-08-03T00:00:00.000Z",
        },
      ]),
  );
  const assessmentAttempts = Object.fromEntries(
    publication.courseVersions
      .filter((course) => courseVersionIds.has(course.id))
      .flatMap((course) =>
        course.gradingPolicy.contributions.map((contribution, index) => {
          const assessment = publication.assessmentVersions.find(
            (candidate) => candidate.id === contribution.assessmentVersionId,
          );
          assert.ok(assessment);
          const id = `acceptance-attempt-${course.id}-${index}`;
          return [
            id,
            {
              id,
              assessmentVersionId: assessment.id,
              courseVersionId: course.id,
              attemptNumber: 1,
              status: "evaluated" as const,
              startedAt: "2026-08-01T00:00:00.000Z",
              submittedAt: "2026-08-02T00:00:00.000Z",
              submissionEvidence: [
                `https://example.test/submission/${assessment.id}`,
              ],
              result: {
                score: assessment.maximumScore,
                maximumScore: assessment.maximumScore,
                passed: true,
                evaluationMethod: "self" as const,
                evaluatedAt: "2026-08-03T00:00:00.000Z",
              },
            },
          ];
        }),
      ),
  );
  return { courses, unitEvidences, assessmentAttempts };
}

test("criterion 1: the selected Computer Science path is exactly 30 courses and 240 units", () => {
  for (const exposed of bundle.programVersion.concentrationIds) {
    const path = resolveLearnerPath(bundle, {
      selectedConcentrationId: exposed,
    });
    assert.equal(path.isResolved, true, `${exposed} must resolve.`);
    assert.equal(path.selectedConcentrationId, exposed);
    assert.equal(path.totals.courseCount, 30);
    assert.equal(path.totals.learningUnitCount, 240);
    assert.equal(path.courseVersions.length, 30);
    assert.equal(path.learningUnits.length, 240);
    // The resolver's own evaluation says the selected *set* is a structurally
    // valid pathway. It is never a claim that the learner passed anything.
    assert.equal(path.requirementEvaluation.satisfied, true);
    assert.equal(
      evaluateLearnerPathCompletion(
        bundle,
        path,
        new Set<CourseVersionId>(),
      ).satisfied,
      false,
      "An empty learner record must never satisfy the pathway.",
    );
    assert.equal(
      path.diagnostics.some(
        (diagnostic) => diagnostic.severity === "error",
      ),
      false,
    );
  }

  // The publication is deliberately larger than any single path.
  assert.equal(bundle.courseVersions.length, 34);
  assert.ok(bundle.learningUnits.length > 240);
});

test("criterion 2: every product surface consumes one selected pathway", () => {
  const progress = enrolled({
    ...mastered(bundle, new Set(concentration.courseVersionIds.slice(0, 2))),
  });

  // Resolve once. Every surface below must agree with this exact set.
  const path = resolveLearnerPath(bundle, {
    selectedConcentrationId: progress.selectedConcentrationId,
    selectedCourseVersionIds: Object.values(
      progress.requirementSelections ?? {},
    ).flat(),
  });
  const selected = path.selectedCourseVersionIdSet;
  const unselected = new Set(
    bundle.courseVersions
      .map((course) => course.id)
      .filter((id) => !selected.has(id)),
  );
  assert.equal(selected.size, 30);
  assert.equal(unselected.size, 4);

  const queue = calculateTodayQueue(bundle, progress, "2026-08-10");
  const calendar = buildAcademicCalendar(bundle, progress, "2026-08-10");
  const terms = evaluateTermProgress(
    bundle,
    getMasteredCourseVersionIds(bundle, progress),
    progress.selectedConcentrationId,
  );
  const record = buildIndependentLearningRecord(bundle, progress);
  const prerequisites = evaluateAllCoursePrerequisites(bundle, progress);
  const mastery = getMasteredCourseVersionIds(bundle, progress);

  // Courses already mastered have no remaining work, so the forward-looking
  // schedule legitimately drops them. Every other surface must cover the whole
  // selected path, and none of them may ever name an unselected course.
  const remaining = new Set(
    [...selected].filter((courseVersionId) => !mastery.has(courseVersionId)),
  );
  assert.equal(mastery.size, 2);
  assert.equal(remaining.size, 28);

  const surfaces: ReadonlyArray<{
    readonly name: string;
    readonly courseVersionIds: readonly CourseVersionId[];
    readonly expected?: ReadonlySet<CourseVersionId>;
  }> = [
    {
      name: "Today queue",
      courseVersionIds: queue.blocks.map((block) => block.courseVersionId),
    },
    {
      name: "academic calendar sessions",
      courseVersionIds: calendar.sessions.map(
        (session) => session.courseVersionId,
      ),
      expected: remaining,
    },
    {
      // A term still contains a course the learner already passed; only the
      // forward-looking session list drops finished work.
      name: "calendar terms",
      courseVersionIds: calendar.terms.flatMap((term) => term.courseVersionIds),
      expected: selected,
    },
    {
      name: "independent learning record",
      courseVersionIds: record.courses.map((course) => course.courseVersionId),
      expected: selected,
    },
    {
      name: "prerequisite evaluations",
      courseVersionIds: [...prerequisites.keys()],
      expected: selected,
    },
    {
      name: "mastery projection",
      courseVersionIds: [...mastery],
      expected: mastery,
    },
    {
      name: "study plan placements",
      courseVersionIds: path.placements.flatMap((placement) =>
        placement.subject.kind === "courseVersion"
          ? [placement.subject.id as CourseVersionId]
          : [],
      ),
      expected: selected,
    },
  ];

  for (const surface of surfaces) {
    const seen = new Set(surface.courseVersionIds);
    assert.ok(seen.size > 0, `${surface.name} exposed no courses at all.`);
    for (const courseVersionId of seen) {
      assert.ok(
        selected.has(courseVersionId),
        `${surface.name} exposed unselected course ${courseVersionId}.`,
      );
    }
    if (surface.expected) {
      assert.deepEqual(
        [...seen].sort(),
        [...surface.expected].sort(),
        `${surface.name} disagrees with the resolved pathway.`,
      );
    }
  }

  // Term progress reports the same 30 courses spread across its periods.
  const termCourseTitles = new Set(
    terms.periods.flatMap((period) => period.courseTitles),
  );
  assert.equal(termCourseTitles.size, selected.size);
  assert.equal(
    terms.periods.reduce((total, period) => total + period.totalCourses, 0),
    selected.size,
  );
  assert.equal(queue.totalUnits, 240);
  assert.equal(record.totals.courses, 30);
  assert.equal(record.totals.learningUnits, 240);
});

test("criterion 3: start date and study days change the generated schedule", () => {
  const august = buildAcademicCalendar(
    bundle,
    enrolled({}, { startDate: "2026-08-10" }),
    "2026-08-10",
  );
  const october = buildAcademicCalendar(
    bundle,
    enrolled({}, { startDate: "2026-10-05" }),
    "2026-08-10",
  );

  assert.equal(august.terms[0]?.startDate, "2026-08-10");
  assert.equal(october.terms[0]?.startDate, "2026-10-05");
  assert.ok(august.sessions[0]);
  assert.ok(october.sessions[0]);
  assert.equal(august.sessions[0].entry.scheduledDate, "2026-08-10");
  assert.equal(october.sessions[0].entry.scheduledDate, "2026-10-05");
  assert.notEqual(
    august.projectedCompletionDate,
    october.projectedCompletionDate,
  );

  const weekends = buildAcademicCalendar(
    bundle,
    enrolled({}, { preferredStudyDays: [0, 6] }),
    "2026-08-10",
  );
  const weekdays = buildAcademicCalendar(
    bundle,
    enrolled({}, { preferredStudyDays: [1, 2, 3, 4, 5] }),
    "2026-08-10",
  );

  assert.deepEqual([...weekends.studyDays], [0, 6]);
  assert.deepEqual([...weekdays.studyDays], [1, 2, 3, 4, 5]);
  for (const session of weekends.sessions) {
    assert.ok(
      [0, 6].includes(weekdayOf(session.entry.scheduledDate)),
      `Weekend learner was scheduled on ${session.entry.scheduledDate}.`,
    );
  }
  for (const session of weekdays.sessions) {
    assert.ok(
      [1, 2, 3, 4, 5].includes(weekdayOf(session.entry.scheduledDate)),
      `Weekday learner was scheduled on ${session.entry.scheduledDate}.`,
    );
  }
  // Two study days cannot absorb a 40-hour request, so the plan runs longer.
  assert.equal(weekends.capacityLimited, true);
  assert.equal(weekdays.capacityLimited, false);
  assert.ok(
    weekends.projectedCompletionDate > weekdays.projectedCompletionDate,
  );
});

test("criterion 4: no day or rolling week exceeds the configured capacity", () => {
  for (const options of [
    { paceHoursPerWeek: 40, preferredStudyDays: [0, 1, 2, 3, 4, 5, 6] },
    { paceHoursPerWeek: 12, preferredStudyDays: [2, 4, 6] },
    { paceHoursPerWeek: 6, preferredStudyDays: [0] },
  ] as const) {
    const plan = buildAcademicCalendar(
      bundle,
      enrolled({}, options),
      "2026-08-10",
    );
    const minutesByDate = new Map<string, number>();
    for (const session of plan.sessions) {
      if (
        session.entry.status !== "planned" &&
        session.entry.status !== "completed"
      ) {
        continue;
      }
      const date = session.entry.scheduledDate;
      minutesByDate.set(
        date,
        (minutesByDate.get(date) ?? 0) + session.entry.plannedMinutes,
      );
      assert.ok(
        session.entry.plannedMinutes <= 90,
        `A ${session.entry.plannedMinutes}-minute session is not a realistic sitting.`,
      );
    }

    const dates = [...minutesByDate.keys()].sort();
    assert.ok(dates.length > 0);

    // Per-weekday capacity is the published bound for a single day.
    const perDayCap = Math.ceil(
      Math.min(
        options.paceHoursPerWeek * 60,
        options.preferredStudyDays.length * 8 * 60,
      ) / options.preferredStudyDays.length,
    );
    for (const [date, minutes] of minutesByDate) {
      assert.ok(
        options.preferredStudyDays.includes(
          weekdayOf(date) as never,
        ),
        `${date} is not one of the learner's study days.`,
      );
      assert.ok(
        minutes <= perDayCap,
        `${date} was assigned ${minutes} minutes against a ${perDayCap}-minute daily cap.`,
      );
      assert.ok(
        minutes <= 8 * 60,
        `${date} was assigned ${minutes} minutes, beyond any humane day.`,
      );
    }

    // Every weekday appears exactly once in any seven consecutive days, so a
    // sliding window is the anchor-free form of "within the weekly pace".
    const first = Date.parse(`${dates[0]}T00:00:00.000Z`);
    const last = Date.parse(`${dates.at(-1)}T00:00:00.000Z`);
    for (let start = first; start <= last; start += DAY_MS) {
      let windowMinutes = 0;
      for (let offset = 0; offset < 7; offset += 1) {
        const date = new Date(start + offset * DAY_MS)
          .toISOString()
          .slice(0, 10);
        windowMinutes += minutesByDate.get(date) ?? 0;
      }
      assert.ok(
        windowMinutes <= plan.effectiveWeeklyMinutes,
        `The week from ${new Date(start).toISOString().slice(0, 10)} holds ${windowMinutes} minutes against a ${plan.effectiveWeeklyMinutes}-minute weekly capacity.`,
      );
    }
  }
});

test("criterion 5: completed assignments stay in their own day's history", () => {
  const initial = buildAcademicCalendar(
    bundle,
    enrolled({}, { startDate: "2026-08-10" }),
    "2026-08-10",
  );
  const entries = Object.fromEntries(
    initial.reconciliationOperations.flatMap((operation) =>
      operation.type === "upsert-schedule-entry"
        ? [[operation.entry.id, operation.entry] as const]
        : [],
    ),
  );
  const firstDay = initial.todaySessions.map((session) => session.entry.id);
  assert.ok(firstDay.length > 0);

  const completedEntries = Object.fromEntries(
    Object.entries(entries).map(([id, entry]) => [
      id,
      firstDay.includes(id)
        ? {
            ...entry,
            status: "completed" as const,
            completedAt: "2026-08-10T18:00:00.000Z",
          }
        : entry,
    ]),
  );

  // Three days later the learner has moved on; the finished work must remain
  // attached to 2026-08-10 rather than being relabelled or dropped.
  const later = calculateTodayQueue(
    bundle,
    enrolled(
      { scheduleEntries: completedEntries },
      { startDate: "2026-08-10" },
    ),
    "2026-08-13",
  );
  const history = later.recentHistory.find((day) => day.date === "2026-08-10");
  assert.ok(history, "The completed day disappeared from recent history.");
  assert.deepEqual(
    history.blocks.map((block) => block.scheduleEntryId).sort(),
    [...firstDay].sort(),
  );
  assert.ok(history.blocks.every((block) => block.completed));
  assert.equal(later.today, "2026-08-13");
});

test("criterion 7: assessments and evidence, not checkboxes, complete a course", () => {
  const courseVersionId = concentration.courseVersionIds[0];
  assert.ok(courseVersionId);
  const unitsOnly = enrolled({
    courses: {
      [courseVersionId]: {
        completedUnitIds: bundle.learningUnits
          .filter((unit) => unit.courseVersionId === courseVersionId)
          .map((unit) => unit.id),
      },
    },
  });
  const full = enrolled(mastered(bundle, new Set([courseVersionId])));

  assert.equal(
    getMasteredCourseVersionIds(bundle, unitsOnly).has(courseVersionId),
    false,
    "Checked lesson boxes alone must never pass a course.",
  );
  assert.equal(
    getMasteredCourseVersionIds(bundle, full).has(courseVersionId),
    true,
  );

  const record = buildIndependentLearningRecord(bundle, unitsOnly);
  const recorded = record.courses.find(
    (course) => course.courseVersionId === courseVersionId,
  );
  assert.ok(recorded);
  assert.equal(recorded.passed, false);
  assert.equal(recorded.completedUnits, recorded.totalUnits);
  assert.equal(record.pathwayRequirementsCompleted, false);
});

test("criterion 8: prerequisites lock a course until passed or explicitly waived", () => {
  const locked = bundle.courseVersions.find(
    (course) =>
      concentration.courseVersionIds.includes(course.id) &&
      (course.prerequisites ?? []).some(
        (prerequisite) => prerequisite.kind === "required",
      ),
  );
  assert.ok(locked, "The path must contain a prerequisite-gated course.");
  const required = (locked.prerequisites ?? []).filter(
    (prerequisite) => prerequisite.kind === "required",
  );
  assert.ok(required.length > 0);

  const empty = enrolled();
  const closed = evaluateCoursePrerequisites(
    bundle,
    locked.id,
    new Set<CourseVersionId>(),
    new Set<CourseVersionId>(),
  );
  assert.equal(closed.isUnlocked, false);
  assert.equal(closed.missingRequired.length, required.length);
  assert.ok(closed.lockReasonText);
  assert.equal(
    evaluateAllCoursePrerequisites(bundle, empty).get(locked.id)?.isUnlocked,
    false,
  );

  const passed = enrolled(
    mastered(
      bundle,
      new Set(required.map((prerequisite) => prerequisite.courseVersionId)),
    ),
  );
  assert.equal(
    evaluateAllCoursePrerequisites(bundle, passed).get(locked.id)?.isUnlocked,
    true,
  );

  // A waiver is a durable, attributable record — never an untracked bypass.
  const waived = enrolled({
    prerequisiteWaivers: Object.fromEntries(
      required.map((prerequisite, index) => {
        const id = `acceptance-waiver-${index}`;
        return [
          id,
          {
            id,
            courseVersionId: locked.id,
            prerequisiteCourseVersionId: prerequisite.courseVersionId,
            basis: "placement" as const,
            reason: "Placement test recorded by the release acceptance gate.",
            grantedAt: "2026-08-09T00:00:00.000Z",
          },
        ];
      }),
    ),
  });
  assert.equal(
    getActiveWaivedPrerequisiteCourseVersionIds(waived, locked.id).size,
    required.length,
  );
  assert.equal(
    evaluateAllCoursePrerequisites(bundle, waived).get(locked.id)?.isUnlocked,
    true,
  );

  const revoked = enrolled({
    prerequisiteWaivers: Object.fromEntries(
      Object.entries(waived.prerequisiteWaivers ?? {}).map(([id, waiver]) => [
        id,
        { ...waiver, revokedAt: "2026-08-20T00:00:00.000Z" },
      ]),
    ),
  });
  assert.equal(
    getActiveWaivedPrerequisiteCourseVersionIds(revoked, locked.id).size,
    0,
  );
  assert.equal(
    evaluateAllCoursePrerequisites(bundle, revoked).get(locked.id)?.isUnlocked,
    false,
  );
});

test("criterion 8: learner progress controls carry no bulk-completion bypass", () => {
  for (const file of [
    "../app/course-progress.tsx",
    "../app/today-dashboard-component.tsx",
    "../app/program-progress.tsx",
    "../app/course-assessment-progress.tsx",
  ]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(
      source,
      /Mark all complete|markAllComplete|completeAllUnits/i,
      `${file} still offers a bulk-completion shortcut.`,
    );
  }
  const courseProgress = readFileSync(
    new URL("../app/course-progress.tsx", import.meta.url),
    "utf8",
  );
  // A locked prerequisite must disable the controls themselves, not merely
  // print a warning above them. Browser QA confirms every unit checkbox then
  // matches `:disabled` through its fieldset and ignores a real click.
  assert.match(courseProgress, /!prerequisites\.isUnlocked/);
  assert.match(
    courseProgress,
    /<fieldset\s+className="universal-unit-checklist"\s+disabled=\{controlsDisabled\}/,
    "The learning-unit checklist is no longer disabled by the prerequisite lock.",
  );
  assert.match(
    courseProgress,
    /<CourseAssessmentProgress\s+disabled=\{controlsDisabled\}/,
    "Assessment controls are no longer disabled by the prerequisite lock.",
  );
});

test("criterion 9: record claims and course links come from the shared resolver", () => {
  const path = resolveLearnerPath(bundle, {
    selectedConcentrationId: concentration.id,
  });
  const partial = buildIndependentLearningRecord(
    bundle,
    enrolled(mastered(bundle, new Set(path.selectedCourseVersionIds.slice(0, 3)))),
  );
  assert.equal(partial.pathwayRequirementsCompleted, false);
  assert.equal(partial.totals.passedCourses, 3);

  const complete = enrolled(
    mastered(bundle, new Set(path.selectedCourseVersionIds)),
  );
  const finished = buildIndependentLearningRecord(bundle, complete);

  assert.equal(finished.totals.passedCourses, 30);
  assert.equal(finished.pathwayRequirementsCompleted, true);
  assert.deepEqual(
    finished.requirementEvaluation,
    evaluateLearnerPathCompletion(
      bundle,
      path,
      getMasteredCourseVersionIds(bundle, complete),
    ),
    "Completion claims must be the shared resolver's verdict, not a second opinion.",
  );

  const slugs = new Set(bundle.courses.map((course) => course.canonicalSlug));
  for (const course of finished.courses) {
    assert.ok(
      slugs.has(course.canonicalSlug),
      `${course.title} does not link to a canonical course slug.`,
    );
    assert.ok(course.code.length > 0);
  }
  assert.equal(
    new Set(finished.courses.map((course) => course.canonicalSlug)).size,
    30,
  );

  // Provenance stays honest: self-submitted work is never labelled as reviewed.
  assert.ok(finished.evidence.length > 0);
  for (const evidence of finished.evidence) {
    assert.ok(evidence.provenance.length > 0);
    assert.ok(
      [
        "self-attested",
        "self-assessed",
        "automatically-checked",
        "peer-reviewed",
        "instructor-reviewed",
      ].includes(evidence.reviewStatus),
    );
  }
  assert.ok(
    finished.evidence.some(
      (evidence) => evidence.reviewStatus === "self-assessed",
    ),
  );
});

test("criterion 9: the record page makes no institutional or accreditation claim", () => {
  const sources = [
    "../app/transcript/page.tsx",
    "../app/transcript/transcript-page-client.tsx",
  ].map((file) => readFileSync(new URL(file, import.meta.url), "utf8"));

  for (const source of sources) {
    // Denials such as "not a university transcript" are the honest framing, so
    // only affirmative claims are banned.
    for (const claim of [
      /\bofficial transcript\b/i,
      /\bdegree awarded\b/i,
      /\baccredited by\b/i,
      /\bverified (?:degree|transcript|credential)\b/i,
      /\brecognized degree\b/i,
    ]) {
      assert.doesNotMatch(source, claim);
    }
  }

  const combined = sources.join("\n");
  assert.match(combined, /non-accredited/i);
  assert.match(combined, /Independent Learning Record/);
  assert.match(combined, /not a\s*\n?\s*university transcript/i);
  assert.match(combined, /nominal/i);
});

test("criteria 1-12: the acceptance gate resolves the same path the routes will", () => {
  // The repository boundary is the only supported way in. A route that reached
  // past it would be able to render a path this gate never checked.
  const viaSlug = resolveLearnerPath(bundle, {
    selectedConcentrationId: concentration.id,
  });
  const viaProgramId = catalogRepository.loadByProgramId(bundle.program.id);
  assert.ok(viaProgramId);
  assert.equal(viaProgramId.programVersion.id, bundle.programVersion.id);
  assert.deepEqual(
    resolveLearnerPath(viaProgramId, {
      selectedConcentrationId: concentration.id,
    }).selectedCourseVersionIds,
    viaSlug.selectedCourseVersionIds,
  );
});
