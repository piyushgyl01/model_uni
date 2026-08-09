import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateAllCoursePrerequisites,
  getCompletedCourseVersionIds,
} from "../app/domain/prerequisite-evaluator";
import type { StoredProgramProgress } from "../app/progress-storage";
import { computerScienceBundle } from "../content/programs/computer-science-v1-1";

function completedUnitIds(courseVersionId: string) {
  return computerScienceBundle.learningUnits
    .filter((unit) => unit.courseVersionId === courseVersionId)
    .map((unit) => unit.id);
}

function masteryRecords(courseVersionId: string) {
  const courseVersion = computerScienceBundle.courseVersions.find(
    (course) => course.id === courseVersionId,
  );
  assert.ok(courseVersion);
  const units = computerScienceBundle.learningUnits.filter(
    (unit) => unit.courseVersionId === courseVersionId,
  );
  return {
    course: { completedUnitIds: units.map((unit) => unit.id) },
    evidences: Object.fromEntries(
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
            courseVersionId: courseVersion.id,
            textOrUrl: `evidence for ${unit.id}`,
          },
        ]),
    ),
    attempts: Object.fromEntries(
      courseVersion.gradingPolicy.contributions.map((contribution, index) => {
        const assessment = computerScienceBundle.assessmentVersions.find(
          (candidate) => candidate.id === contribution.assessmentVersionId,
        );
        assert.ok(assessment);
        return [
          `test-attempt-${courseVersionId}-${index}`,
          {
            id: `test-attempt-${courseVersionId}-${index}`,
            assessmentVersionId: assessment.id,
            courseVersionId: courseVersion.id,
            attemptNumber: 1,
            status: "evaluated" as const,
            startedAt: "2026-08-01T00:00:00.000Z",
            submittedAt: "2026-08-02T00:00:00.000Z",
            submissionEvidence: ["submitted artifact"],
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
  };
}

test("record and prerequisite completion ignores courses outside the selected path", () => {
  const selectedConcentration = computerScienceBundle.concentrations[0];
  const otherConcentration = computerScienceBundle.concentrations[1];
  assert.ok(selectedConcentration);
  assert.ok(otherConcentration);

  const selectedCourseVersionId = selectedConcentration.courseVersionIds[0];
  const otherCourseVersionId = otherConcentration.courseVersionIds[0];
  assert.ok(selectedCourseVersionId);
  assert.ok(otherCourseVersionId);
  const selectedRecords = masteryRecords(selectedCourseVersionId);
  const otherRecords = masteryRecords(otherCourseVersionId);

  const progress: StoredProgramProgress = {
    selectedConcentrationId: selectedConcentration.id,
    courses: {
      [selectedCourseVersionId]: {
        ...selectedRecords.course,
      },
      [otherCourseVersionId]: {
        ...otherRecords.course,
      },
    },
    unitEvidences: {
      ...selectedRecords.evidences,
      ...otherRecords.evidences,
    },
    assessmentAttempts: {
      ...selectedRecords.attempts,
      ...otherRecords.attempts,
    },
  };

  const completed = getCompletedCourseVersionIds(
    computerScienceBundle,
    progress,
  );
  assert.equal(completed.has(selectedCourseVersionId), true);
  assert.equal(completed.has(otherCourseVersionId), false);

  const prerequisiteEvaluations = evaluateAllCoursePrerequisites(
    computerScienceBundle,
    progress,
  );
  assert.equal(prerequisiteEvaluations.size, 30);
  assert.equal(prerequisiteEvaluations.has(selectedCourseVersionId), true);
  assert.equal(prerequisiteEvaluations.has(otherCourseVersionId), false);
});

test("duplicate or foreign unit IDs cannot complete a selected-path course", () => {
  const concentration = computerScienceBundle.concentrations[0];
  assert.ok(concentration);
  const courseVersionId = concentration.courseVersionIds[0];
  assert.ok(courseVersionId);
  const units = completedUnitIds(courseVersionId);
  assert.ok(units[0]);
  const records = masteryRecords(courseVersionId);

  const completed = getCompletedCourseVersionIds(computerScienceBundle, {
    selectedConcentrationId: concentration.id,
    courses: {
      [courseVersionId]: {
        completedUnitIds: [
          ...Array.from({ length: units.length }, () => units[0]),
          "unt_not_in_the_course",
        ],
      },
    },
    unitEvidences: records.evidences,
    assessmentAttempts: records.attempts,
  });

  assert.equal(completed.has(courseVersionId), false);
});
