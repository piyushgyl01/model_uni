import assert from "node:assert/strict";
import test from "node:test";
import { buildIndependentLearningRecord } from "../app/domain/independent-learning-record";
import type { AssessmentEvaluationMethod } from "../app/learner-progress-contract";
import type { StoredProgramProgress } from "../app/progress-storage";
import { practicalSpreadsheetsProgram } from "../content/programs/practical-spreadsheets";

const bundle = practicalSpreadsheetsProgram;
const courseVersion = bundle.courseVersions[0];
assert.ok(courseVersion);

function completedProgress(): StoredProgramProgress {
  const units = bundle.learningUnits.filter(
    (unit) => unit.courseVersionId === courseVersion.id,
  );
  const unitEvidences = Object.fromEntries(
    units.map((unit) => [
      unit.id,
      {
        learningUnitId: unit.id,
        courseVersionId: courseVersion.id,
        textOrUrl: `https://example.test/work/${unit.id}`,
        updatedAt: "2026-08-08T12:00:00.000Z",
      },
    ]),
  );
  const assessmentAttempts = Object.fromEntries(
    courseVersion.gradingPolicy.contributions.map((contribution, index) => {
      const assessment = bundle.assessmentVersions.find(
        (candidate) => candidate.id === contribution.assessmentVersionId,
      );
      assert.ok(assessment);
      const evaluationMethod: AssessmentEvaluationMethod =
        index === 0 ? "self" : "instructor";
      return [
        `attempt-record-${index + 1}`,
        {
          id: `attempt-record-${index + 1}`,
          assessmentVersionId: assessment.id,
          courseVersionId: courseVersion.id,
          attemptNumber: index + 1,
          status: "evaluated" as const,
          startedAt: `2026-08-0${index + 1}T09:00:00.000Z`,
          submittedAt: `2026-08-0${index + 2}T09:00:00.000Z`,
          submissionEvidence: [
            `https://example.test/assessment/${assessment.id}`,
          ],
          result: {
            score: 90 - index * 5,
            maximumScore: assessment.maximumScore,
            passed: true,
            evaluationMethod,
            feedback: `Recorded ${evaluationMethod} feedback`,
            evaluatedAt: `2026-08-0${index + 3}T09:00:00.000Z`,
          },
        },
      ];
    }),
  );

  return {
    courses: {
      [courseVersion.id]: {
        completedUnitIds: units.map((unit) => unit.id),
      },
    },
    unitEvidences,
    assessmentAttempts,
  };
}

test("the independent record derives pathway completion from mastery and the shared resolver", () => {
  const incomplete = buildIndependentLearningRecord(bundle, undefined);
  assert.equal(incomplete.pathwayRequirementsCompleted, false);
  assert.equal(incomplete.requirementEvaluation.satisfied, false);
  assert.equal(incomplete.totals.passedCourses, 0);

  const record = buildIndependentLearningRecord(bundle, completedProgress());
  assert.equal(record.learnerPath.isResolved, true);
  assert.equal(record.requirementEvaluation.satisfied, true);
  assert.equal(record.pathwayRequirementsCompleted, true);
  assert.equal(record.totals.courses, 1);
  assert.equal(record.totals.passedCourses, 1);
  assert.equal(
    record.totals.completedLearningUnits,
    record.totals.learningUnits,
  );
  assert.equal(
    record.totals.completedLearningHours,
    bundle.learningUnits.reduce((total, unit) => total + unit.nominalHours, 0),
  );
});

test("the record exposes canonical links, assessment history, scores, projects, hours, and honest provenance", () => {
  const record = buildIndependentLearningRecord(bundle, completedProgress());
  const course = record.courses[0];
  assert.ok(course);
  assert.equal(
    course.canonicalSlug,
    bundle.courses.find((candidate) => candidate.id === courseVersion.courseId)
      ?.canonicalSlug,
  );
  assert.equal(course.assessments.length, 2);
  assert.equal(record.totals.assessmentAttempts, 2);
  assert.equal(
    record.totals.assessmentHours,
    bundle.assessmentVersions.reduce(
      (total, assessment) => total + assessment.estimatedHours,
      0,
    ),
  );
  assert.equal(course.assessments[0]?.attempts[0]?.score, 90);
  assert.equal(
    course.assessments[0]?.attempts[0]?.reviewStatus,
    "self-assessed",
  );
  assert.equal(
    course.assessments[1]?.attempts[0]?.reviewStatus,
    "instructor-reviewed",
  );
  assert.ok(record.projects.length > 0);
  assert.equal(record.totals.evidencedProjects, record.totals.projects);
  assert.ok(
    record.evidence.some(
      (item) =>
        item.source === "learning-unit" &&
        item.reviewStatus === "self-attested" &&
        item.provenance.includes("no independent review"),
    ),
  );
  assert.ok(
    record.evidence.some(
      (item) =>
        item.source === "assessment-submission" &&
        item.reviewStatus === "instructor-reviewed",
    ),
  );
});

test("submitted evidence without evaluated mastery never creates a completion claim", () => {
  const progress = completedProgress();
  const assessmentAttempts = Object.fromEntries(
    Object.entries(progress.assessmentAttempts ?? {}).map(([id, attempt]) => [
      id,
      {
        ...attempt,
        status: "submitted" as const,
        result: undefined,
      },
    ]),
  );
  const record = buildIndependentLearningRecord(bundle, {
    ...progress,
    assessmentAttempts,
  });

  assert.equal(record.pathwayRequirementsCompleted, false);
  assert.equal(record.totals.passedCourses, 0);
  assert.ok(
    record.evidence
      .filter((item) => item.source === "assessment-submission")
      .every((item) => item.reviewStatus === "self-attested"),
  );
});
