import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { CourseVersionId, LearningUnitId } from "../app/domain/catalog";
import { buildAcademicCalendar } from "../app/domain/academic-calendar";
import {
  evaluateCourseMastery,
  getMasteredCourseVersionIds,
} from "../app/domain/mastery";
import {
  evaluateCoursePrerequisites,
  getActiveWaivedPrerequisiteCourseVersionIds,
} from "../app/domain/prerequisite-evaluator";
import type {
  AssessmentAttempt,
  AssessmentAttemptStatus,
} from "../app/learner-progress-contract";
import type { StoredProgramProgress } from "../app/progress-storage";
import { computerScienceBundle } from "../content/programs/computer-science-v1-1";
import { practicalSpreadsheetsProgram } from "../content/programs/practical-spreadsheets";

const bundle = practicalSpreadsheetsProgram;
const course = bundle.courseVersions[0];
assert.ok(course);
const courseUnits = bundle.learningUnits.filter(
  (unit) => unit.courseVersionId === course.id,
);

function attempts(
  status: Exclude<AssessmentAttemptStatus, "void" | "draft">,
  score = 80,
) {
  return Object.fromEntries(
    course.gradingPolicy.contributions.map((contribution, index) => {
      const assessment = bundle.assessmentVersions.find(
        (candidate) => candidate.id === contribution.assessmentVersionId,
      );
      assert.ok(assessment);
      const id = `mastery-attempt-${index + 1}`;
      const base: AssessmentAttempt = {
        id,
        assessmentVersionId: assessment.id,
        courseVersionId: course.id,
        attemptNumber: 1,
        status,
        startedAt: "2026-08-01T00:00:00.000Z",
        submittedAt: "2026-08-02T00:00:00.000Z",
        submissionEvidence: [`artifact-${index + 1}`],
        ...(status === "evaluated"
          ? {
              result: {
                score,
                maximumScore: assessment.maximumScore,
                passed:
                  (score / assessment.maximumScore) * 100 >=
                  course.gradingPolicy.passingPercentage,
                evaluationMethod: ([
                  "self",
                  "automatic",
                  "peer",
                  "instructor",
                ] as const)[index % 4],
                evaluatedAt: "2026-08-03T00:00:00.000Z",
              },
            }
          : {}),
      };
      return [id, base];
    }),
  );
}

function completedLearningWork(): StoredProgramProgress {
  return {
    courses: {
      [course.id]: {
        completedUnitIds: courseUnits.map((unit) => unit.id),
      },
    },
  };
}

function projectEvidences() {
  return Object.fromEntries(
    courseUnits
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
          courseVersionId: course.id,
          textOrUrl: `https://example.test/evidence/${unit.id}`,
        },
      ]),
  );
}

test("course mastery follows the academic lifecycle instead of unit checkbox count", () => {
  const notStarted = evaluateCourseMastery(bundle, course.id, undefined);
  assert.equal(notStarted.state, "not-started");
  assert.equal(notStarted.passed, false);

  const workOnly = completedLearningWork();
  const assessmentDue = evaluateCourseMastery(bundle, course.id, workOnly);
  assert.equal(assessmentDue.state, "assessment-due");
  assert.equal(assessmentDue.learningWorkComplete, true);
  assert.equal(assessmentDue.passed, false);

  const submittedProgress: StoredProgramProgress = {
    ...workOnly,
    assessmentAttempts: attempts("submitted"),
  };
  const submitted = evaluateCourseMastery(
    bundle,
    course.id,
    submittedProgress,
  );
  assert.equal(submitted.state, "submitted");
  assert.equal(submitted.requiredAssessmentsSubmitted, true);
  assert.equal(submitted.passed, false);

  const evaluatedProgress: StoredProgramProgress = {
    ...workOnly,
    assessmentAttempts: attempts("evaluated"),
  };
  const evaluated = evaluateCourseMastery(
    bundle,
    course.id,
    evaluatedProgress,
  );
  assert.equal(evaluated.state, "evaluated");
  assert.equal(evaluated.passingThresholdSatisfied, true);
  assert.equal(evaluated.projectEvidenceComplete, false);

  const passedProgress: StoredProgramProgress = {
    ...evaluatedProgress,
    unitEvidences: projectEvidences(),
  };
  const passed = evaluateCourseMastery(bundle, course.id, passedProgress);
  assert.equal(passed.state, "passed");
  assert.equal(passed.passed, true);
  assert.equal(passed.weightedScorePercentage, 80);
  assert.equal(getMasteredCourseVersionIds(bundle, passedProgress).has(course.id), true);
  assert.deepEqual(
    passed.assessments.map(
      (assessment) => assessment.latestAttempt?.result?.evaluationMethod,
    ),
    ["self", "automatic"],
  );
});

test("an evaluated course below its published threshold requires a retry", () => {
  const evaluation = evaluateCourseMastery(bundle, course.id, {
    ...completedLearningWork(),
    assessmentAttempts: attempts("evaluated", 40),
    unitEvidences: projectEvidences(),
  });
  assert.equal(evaluation.state, "retry");
  assert.equal(evaluation.passingThresholdSatisfied, false);
  assert.equal(evaluation.passed, false);
});

test("project evidence is accepted only for its own required unit and course", () => {
  const evidences = projectEvidences();
  const [projectUnitId] = Object.keys(evidences) as LearningUnitId[];
  assert.ok(projectUnitId);
  const wrongCourse = computerScienceBundle.courseVersions[0];
  assert.ok(wrongCourse);
  const evaluation = evaluateCourseMastery(bundle, course.id, {
    ...completedLearningWork(),
    assessmentAttempts: attempts("evaluated"),
    unitEvidences: {
      ...evidences,
      [projectUnitId]: {
        ...evidences[projectUnitId],
        courseVersionId: wrongCourse.id,
      },
    },
  });
  assert.equal(evaluation.projectEvidenceComplete, false);
  assert.equal(evaluation.passed, false);
});

test("a durable placement or waiver record unlocks only the declared prerequisite", () => {
  const target = computerScienceBundle.courseVersions.find(
    (candidate) => candidate.prerequisites.some((item) => item.kind === "required"),
  );
  assert.ok(target);
  const prerequisite = target.prerequisites.find((item) => item.kind === "required");
  assert.ok(prerequisite);
  const unrelated = computerScienceBundle.courseVersions.find(
    (candidate) =>
      candidate.id !== target.id && candidate.id !== prerequisite.courseVersionId,
  );
  assert.ok(unrelated);

  const checkboxOnlyProgress: StoredProgramProgress = {
    courses: {
      [prerequisite.courseVersionId]: {
        completedUnitIds: computerScienceBundle.learningUnits
          .filter(
            (unit) =>
              unit.courseVersionId === prerequisite.courseVersionId,
          )
          .map((unit) => unit.id),
      },
    },
  };
  const checkboxOnlyMastered = getMasteredCourseVersionIds(
    computerScienceBundle,
    checkboxOnlyProgress,
  );
  assert.equal(checkboxOnlyMastered.has(prerequisite.courseVersionId), false);
  assert.equal(
    evaluateCoursePrerequisites(
      computerScienceBundle,
      target.id,
      checkboxOnlyMastered,
    ).isUnlocked,
    false,
  );

  const progress: StoredProgramProgress = {
    prerequisiteWaivers: {
      "placement-test-record": {
        id: "placement-test-record",
        courseVersionId: target.id,
        prerequisiteCourseVersionId: prerequisite.courseVersionId,
        basis: "placement",
        reason: "Passed the published placement review.",
        evidence: "Score 86/100; artifact https://example.test/placement",
        grantedAt: "2026-08-04T00:00:00.000Z",
      },
    },
  };
  const active = getActiveWaivedPrerequisiteCourseVersionIds(
    progress,
    target.id,
  );
  const unlocked = evaluateCoursePrerequisites(
    computerScienceBundle,
    target.id,
    new Set<CourseVersionId>(),
    active,
  );
  assert.equal(unlocked.isUnlocked, true);
  assert.equal(active.has(prerequisite.courseVersionId), true);
  assert.equal(active.has(unrelated.id), false);

  const revoked = getActiveWaivedPrerequisiteCourseVersionIds(
    {
      prerequisiteWaivers: {
        "placement-test-record": {
          ...progress.prerequisiteWaivers!["placement-test-record"],
          revokedAt: "2026-08-05T00:00:00.000Z",
        },
      },
    },
    target.id,
  );
  assert.equal(revoked.size, 0);
});

test("the academic calendar keeps assessment work due after lesson boxes are checked", () => {
  const workOnly: StoredProgramProgress = {
    ...completedLearningWork(),
    enrollment: {
      startDate: "2026-08-10",
      paceHoursPerWeek: 20,
      preferredStudyDays: [1, 2, 3, 4, 5],
      timezone: "UTC",
      enrolledAt: "2026-08-09T00:00:00.000Z",
      status: "enrolled",
    },
  };
  const dueCalendar = buildAcademicCalendar(bundle, workOnly, "2026-08-10");
  assert.ok(dueCalendar.remainingMinutes > 0);
  assert.ok(
    dueCalendar.sessions.some(
      (session) => session.entry.subject.kind === "assessmentVersion",
    ),
  );

  const submittedCalendar = buildAcademicCalendar(
    bundle,
    { ...workOnly, assessmentAttempts: attempts("submitted") },
    "2026-08-10",
  );
  assert.equal(submittedCalendar.remainingMinutes, 0);
});

test("normal learner controls contain no bulk-completion or unrecorded bypass", async () => {
  const [courseProgress, evidenceInput, prerequisiteBanner, todayQueue] = await Promise.all([
    readFile(new URL("../app/course-progress.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/unit-evidence-input.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prerequisite-lock-banner.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/domain/today-queue.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(courseProgress, /Mark all complete/i);
  assert.match(courseProgress, /!prerequisites\.isUnlocked/);
  assert.doesNotMatch(evidenceInput, /Save & Mark Unit Complete/i);
  assert.match(evidenceInput, /!prerequisites\.isUnlocked/);
  assert.doesNotMatch(prerequisiteBanner, /course-atlas-prereq-bypasses/i);
  assert.match(prerequisiteBanner, /writeLocalPrerequisiteWaiver/);
  assert.match(todayQueue, /evaluateAllCoursePrerequisites/);
});
