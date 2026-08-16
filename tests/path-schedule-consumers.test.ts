import assert from "node:assert/strict";
import test from "node:test";
import type {
  CourseVersionId,
  PublishedProgramBundle,
} from "../app/domain/catalog";
import { resolveLearnerPath } from "../app/domain/learner-path";
import { evaluateTermProgress } from "../app/domain/term-evaluator";
import { calculateTodayQueue } from "../app/domain/today-queue";
import type { StoredProgramProgress } from "../app/progress-storage";
import { computerScienceBundle } from "../content/programs/computer-science-v1-1";
import { practicalSpreadsheetsProgram } from "./fixtures/practical-spreadsheets";

const bundle = computerScienceBundle;

function masteredCourses(
  courseVersionIds: ReadonlySet<CourseVersionId>,
): Pick<
  StoredProgramProgress,
  "courses" | "unitEvidences" | "assessmentAttempts"
> {
  const courses = Object.fromEntries(
    [...courseVersionIds].map((courseVersionId) => [
      courseVersionId,
      {
        completedUnitIds: bundle.learningUnits
          .filter((unit) => unit.courseVersionId === courseVersionId)
          .map((unit) => unit.id),
      },
    ]),
  );
  const units = bundle.learningUnits.filter((unit) =>
    courseVersionIds.has(unit.courseVersionId),
  );
  const unitEvidences = Object.fromEntries(
    units
      .filter(
        (unit) =>
          unit.kind === "project" ||
          ["project", "lab", "portfolio", "presentation"].includes(
            unit.assessmentKind ?? "",
          ),
      )
      .map((unit) => [
        unit.id,
        {
          learningUnitId: unit.id,
          courseVersionId: unit.courseVersionId,
          textOrUrl: `evidence-${unit.id}`,
        },
      ]),
  );
  const assessmentAttempts = Object.fromEntries(
    bundle.courseVersions
      .filter((course) => courseVersionIds.has(course.id))
      .flatMap((course) =>
        course.gradingPolicy.contributions.map((contribution, index) => {
          const assessment = bundle.assessmentVersions.find(
            (candidate) => candidate.id === contribution.assessmentVersionId,
          );
          assert.ok(assessment);
          const id = `path-attempt-${course.id}-${index}`;
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
              submissionEvidence: ["artifact"],
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

test("Today uses one 30-course, 240-unit Computer Science concentration path", () => {
  const selectedConcentration = bundle.concentrations[1];
  assert.ok(selectedConcentration);

  const allConcentrationCourseIds = new Set<CourseVersionId>(
    bundle.concentrations.flatMap(
      (concentration) => concentration.courseVersionIds,
    ),
  );
  const coreCourseIds = new Set<CourseVersionId>(
    bundle.courseVersions
      .map((courseVersion) => courseVersion.id)
      .filter((id) => !allConcentrationCourseIds.has(id)),
  );
  const unselectedConcentrationCourseIds = new Set<CourseVersionId>(
    [...allConcentrationCourseIds].filter(
      (id) => !selectedConcentration.courseVersionIds.includes(id),
    ),
  );

  // Historical progress in another concentration must not leak into the
  // currently selected path's totals or daily assignments.
  const completedOutsideSelectedPath = new Set<CourseVersionId>([
    ...coreCourseIds,
    ...unselectedConcentrationCourseIds,
  ]);
  const masteredOutsideSelectedPath = masteredCourses(
    completedOutsideSelectedPath,
  );
  const progress: StoredProgramProgress = {
    selectedConcentrationId: selectedConcentration.id,
    enrollment: {
      startDate: "2026-08-08",
      paceHoursPerWeek: 40,
      enrolledAt: "2026-08-08T00:00:00Z",
      status: "enrolled",
    },
    ...masteredOutsideSelectedPath,
  };

  const queue = calculateTodayQueue(bundle, progress, "2028-09-18");

  assert.equal(coreCourseIds.size, 28);
  assert.equal(queue.totalUnits, 240);
  assert.equal(queue.totalCompletedUnits, 224);
  assert.ok(queue.blocks.length > 0);
  assert.ok(
    queue.blocks.every((block) =>
      selectedConcentration.courseVersionIds.includes(block.courseVersionId),
    ),
  );
  assert.ok(
    queue.blocks.every(
      (block) => !unselectedConcentrationCourseIds.has(block.courseVersionId),
    ),
  );
});

test("term progress excludes the four unselected Computer Science alternatives", () => {
  const selectedConcentration = bundle.concentrations[1];
  assert.ok(selectedConcentration);

  const evaluation = evaluateTermProgress(
    bundle,
    new Set<CourseVersionId>(),
    selectedConcentration.id,
  );
  const selectedTitles = new Set(
    bundle.courseVersions
      .filter((courseVersion) =>
        selectedConcentration.courseVersionIds.includes(courseVersion.id),
      )
      .map((courseVersion) => courseVersion.title),
  );
  const unselectedTitles = new Set(
    bundle.concentrations
      .filter((concentration) => concentration.id !== selectedConcentration.id)
      .flatMap((concentration) => concentration.courseVersionIds)
      .map(
        (courseVersionId) =>
          bundle.courseVersions.find(
            (courseVersion) => courseVersion.id === courseVersionId,
          )?.title,
      )
      .filter((title): title is string => Boolean(title)),
  );
  const termSix = evaluation.periods.find((period) => period.label === "Term 6");

  assert.equal(
    evaluation.periods.reduce((total, period) => total + period.totalCourses, 0),
    30,
  );
  assert.ok(termSix);
  assert.equal(termSix.totalCourses, 5);
  assert.deepEqual(
    [...selectedTitles].filter((title) => !termSix.courseTitles.includes(title)),
    [],
  );
  assert.deepEqual(
    [...unselectedTitles].filter((title) => termSix.courseTitles.includes(title)),
    [],
  );
});

test("schedule consumers deterministically resolve an omitted concentration", () => {
  const queue = calculateTodayQueue(bundle, {
    enrollment: {
      startDate: "2026-08-08",
      paceHoursPerWeek: 40,
      enrolledAt: "2026-08-08T00:00:00Z",
      status: "enrolled",
    },
  });
  const terms = evaluateTermProgress(bundle, new Set<CourseVersionId>());

  assert.equal(queue.totalUnits, 240);
  assert.equal(
    terms.periods.reduce((total, period) => total + period.totalCourses, 0),
    30,
  );
});

test("Today validates a completed unit against its owning course", () => {
  const concentration = bundle.concentrations[0];
  assert.ok(concentration);
  const selectedPathCourseIds = new Set<CourseVersionId>([
    ...bundle.courseVersions
      .map((courseVersion) => courseVersion.id)
      .filter((id) =>
        bundle.concentrations.every(
          (candidate) => !candidate.courseVersionIds.includes(id),
        ),
      ),
    ...concentration.courseVersionIds,
  ]);
  const [owningCourseId, wrongCourseId] = [...selectedPathCourseIds];
  assert.ok(owningCourseId);
  assert.ok(wrongCourseId);
  const unitId = bundle.learningUnits.find(
    (unit) => unit.courseVersionId === owningCourseId,
  )?.id;
  assert.ok(unitId);

  const queue = calculateTodayQueue(bundle, {
    selectedConcentrationId: concentration.id,
    courses: {
      [wrongCourseId]: { completedUnitIds: [unitId] },
    },
  });

  assert.equal(queue.totalCompletedUnits, 0);
});

function spreadsheetBundleWithOnlyPlacement(
  subject: (typeof practicalSpreadsheetsProgram.schedules)[number]["placements"][number]["subject"],
): PublishedProgramBundle {
  const schedule = practicalSpreadsheetsProgram.schedules[0];
  const placement = schedule?.placements[0];
  assert.ok(schedule);
  assert.ok(placement);
  return {
    ...practicalSpreadsheetsProgram,
    programVersion: {
      ...practicalSpreadsheetsProgram.programVersion,
      requirements:
        practicalSpreadsheetsProgram.programVersion.requirements.map(
          (group) => ({
            ...group,
            options: group.options.map((option) => ({
              ...option,
              recommendedPeriodId: undefined,
            })),
          }),
        ),
    },
    schedules: [
      {
        ...schedule,
        placements: [{ ...placement, subject }],
      },
    ],
  };
}

test("unit-only and assessment-only schedules still place their course in a term", () => {
  const unit = practicalSpreadsheetsProgram.learningUnits[0];
  const assessment = practicalSpreadsheetsProgram.assessmentVersions[0];
  assert.ok(unit);
  assert.ok(assessment);
  const variants = [
    spreadsheetBundleWithOnlyPlacement({ kind: "learningUnit", id: unit.id }),
    spreadsheetBundleWithOnlyPlacement({
      kind: "assessmentVersion",
      id: assessment.id,
    }),
  ];

  for (const variant of variants) {
    const path = resolveLearnerPath(variant);
    const terms = evaluateTermProgress(variant, new Set<CourseVersionId>());

    assert.equal(path.isResolved, true);
    assert.equal(path.totals.courseCount, 1);
    assert.equal(terms.periods[0]?.totalCourses, 1);
  }
});

test("an unscheduled course is diagnosed and an empty calendar never reports completion", () => {
  const schedule = practicalSpreadsheetsProgram.schedules[0];
  assert.ok(schedule);
  const unscheduled: PublishedProgramBundle = {
    ...spreadsheetBundleWithOnlyPlacement(
      schedule.placements[0]?.subject ?? {
        kind: "courseVersion",
        id: practicalSpreadsheetsProgram.courseVersions[0]!.id,
      },
    ),
    schedules: [{ ...schedule, placements: [] }],
  };
  const noCalendar: PublishedProgramBundle = {
    ...practicalSpreadsheetsProgram,
    calendars: [],
  };

  const path = resolveLearnerPath(unscheduled);
  const terms = evaluateTermProgress(
    noCalendar,
    new Set<CourseVersionId>([practicalSpreadsheetsProgram.courseVersions[0]!.id]),
  );

  assert.equal(path.isResolved, false);
  assert.ok(
    path.diagnostics.some(
      (diagnostic) => diagnostic.code === "unscheduled_course",
    ),
  );
  assert.equal(terms.allTermsSatisfied, false);
});
