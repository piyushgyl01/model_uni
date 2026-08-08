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

test("record and prerequisite completion ignores courses outside the selected path", () => {
  const selectedConcentration = computerScienceBundle.concentrations[0];
  const otherConcentration = computerScienceBundle.concentrations[1];
  assert.ok(selectedConcentration);
  assert.ok(otherConcentration);

  const selectedCourseVersionId = selectedConcentration.courseVersionIds[0];
  const otherCourseVersionId = otherConcentration.courseVersionIds[0];
  assert.ok(selectedCourseVersionId);
  assert.ok(otherCourseVersionId);

  const progress: StoredProgramProgress = {
    selectedConcentrationId: selectedConcentration.id,
    courses: {
      [selectedCourseVersionId]: {
        completedUnitIds: completedUnitIds(selectedCourseVersionId),
      },
      [otherCourseVersionId]: {
        completedUnitIds: completedUnitIds(otherCourseVersionId),
      },
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
  });

  assert.equal(completed.has(courseVersionId), false);
});
