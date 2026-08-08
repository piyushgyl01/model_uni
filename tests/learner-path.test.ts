import assert from "node:assert/strict";
import test from "node:test";
import type { PublishedProgramBundle } from "../app/domain/catalog";
import { resolveLearnerPath } from "../app/domain/learner-path";
import { validatePublishedProgramBundle } from "../app/domain/validation";
import { catalogRepository } from "../content/catalog";
import { computerScienceBundle } from "../content/programs/computer-science-v1-1";

test("every Computer Science concentration resolves one complete 30-course path", () => {
  const allConcentrationCourseIds = new Set(
    computerScienceBundle.concentrations.flatMap(
      (concentration) => concentration.courseVersionIds,
    ),
  );

  for (const concentration of computerScienceBundle.concentrations) {
    const path = resolveLearnerPath(computerScienceBundle, {
      selectedConcentrationId: concentration.id,
    });

    assert.equal(path.isResolved, true);
    assert.equal(path.selectedConcentrationId, concentration.id);
    assert.equal(path.totals.courseCount, 30);
    assert.equal(path.totals.learningUnitCount, 240);
    assert.equal(path.totals.nominalHours, 4_800);
    assert.equal(path.requirementEvaluation.satisfied, true);
    assert.deepEqual(
      [...path.selectedCourseVersionIdSet].filter((id) =>
        allConcentrationCourseIds.has(id),
      ),
      concentration.courseVersionIds,
    );
    assert.equal(
      path.courseVersions.every((courseVersion) =>
        path.selectedCourseVersionIdSet.has(courseVersion.id),
      ),
      true,
    );
    assert.equal(
      path.learningUnits.every((unit) =>
        path.selectedCourseVersionIdSet.has(unit.courseVersionId),
      ),
      true,
    );
  }
});

test("an omitted or invalid concentration resolves the same deterministic default", () => {
  const expected = computerScienceBundle.concentrations[0];
  assert.ok(expected);

  const omitted = resolveLearnerPath(computerScienceBundle);
  const invalid = resolveLearnerPath(computerScienceBundle, {
    selectedConcentrationId: "con_not_in_this_publication",
  });

  assert.equal(omitted.isResolved, true);
  assert.equal(omitted.selectedConcentrationId, expected.id);
  assert.deepEqual(
    omitted.selectedCourseVersionIds,
    invalid.selectedCourseVersionIds,
  );
  assert.ok(
    omitted.diagnostics.some(
      (diagnostic) => diagnostic.code === "defaulted_concentration",
    ),
  );
  assert.ok(
    invalid.diagnostics.some(
      (diagnostic) => diagnostic.code === "invalid_concentration",
    ),
  );
});

test("every latest catalog program has one requirement-valid default projection", () => {
  for (const summary of catalogRepository.listPrograms()) {
    const bundle = catalogRepository.loadBySlug(summary.slug);
    assert.ok(bundle);
    const path = resolveLearnerPath(bundle);

    assert.equal(path.isResolved, true, summary.slug);
    assert.equal(path.requirementEvaluation.satisfied, true, summary.slug);
    assert.equal(path.totals.courseCount, summary.courseCount, summary.slug);
    assert.equal(
      path.totals.learningUnitCount,
      summary.learningUnitCount,
      summary.slug,
    );
    assert.equal(path.totals.nominalHours, summary.nominalHours, summary.slug);
    assert.equal(
      path.courseVersions.every((courseVersion) =>
        courseVersion.prerequisites
          .filter((prerequisite) => prerequisite.kind === "required")
          .every((prerequisite) =>
            path.selectedCourseVersionIdSet.has(
              prerequisite.courseVersionId,
            ),
          ),
      ),
      true,
      summary.slug,
    );
  }
});

test("every exposed concentration in the latest catalog resolves independently", () => {
  for (const summary of catalogRepository.listPrograms()) {
    const bundle = catalogRepository.loadBySlug(summary.slug);
    assert.ok(bundle);
    for (const concentrationId of bundle.programVersion.concentrationIds) {
      const path = resolveLearnerPath(bundle, {
        selectedConcentrationId: concentrationId,
      });
      assert.equal(path.isResolved, true, `${summary.slug}:${concentrationId}`);
      assert.equal(path.selectedConcentrationId, concentrationId);
      assert.equal(path.requirementEvaluation.satisfied, true);
    }
  }
});

test("credit-constrained electives choose a valid deterministic subset", () => {
  const targetGroup = computerScienceBundle.programVersion.requirements[5];
  assert.ok(targetGroup);
  const options = targetGroup.options.map((option, index) => ({
    ...option,
    credits: { ...option.credits, value: index === 0 ? 1 : 4 },
  }));
  const bundle: PublishedProgramBundle = {
    ...computerScienceBundle,
    programVersion: {
      ...computerScienceBundle.programVersion,
      requirements: computerScienceBundle.programVersion.requirements.map(
        (group) =>
          group.id === targetGroup.id
            ? {
                ...group,
                rule: {
                  ...group.rule,
                  minSelections: 2,
                  maxSelections: 2,
                  minCredits: {
                    value: 8,
                    system: targetGroup.rule.minCredits?.system ?? "credits",
                  },
                },
                options,
              }
            : group,
      ),
    },
  };

  const path = resolveLearnerPath(bundle, {
    selectedConcentrationId: bundle.concentrations[0]?.id,
  });
  const selected = path.requirementSelections.find(
    (group) => group.requirementGroupId === targetGroup.id,
  );

  assert.equal(path.isResolved, true);
  assert.deepEqual(
    selected?.courseVersionIds,
    options.slice(1).map((option) => option.courseVersionId),
  );
});

test("default elective selection repairs required-prerequisite closure", () => {
  const targetGroup = computerScienceBundle.programVersion.requirements[5];
  assert.ok(targetGroup);
  const reorderedOptions = [
    targetGroup.options[2],
    targetGroup.options[0],
    targetGroup.options[1],
  ];
  assert.equal(reorderedOptions.every(Boolean), true);
  const bundle: PublishedProgramBundle = {
    ...computerScienceBundle,
    programVersion: {
      ...computerScienceBundle.programVersion,
      requirements: computerScienceBundle.programVersion.requirements.map(
        (group) =>
          group.id === targetGroup.id
            ? {
                ...group,
                rule: {
                  ...group.rule,
                  minSelections: 2,
                  maxSelections: 2,
                  minCredits: {
                    value: 8,
                    system: targetGroup.rule.minCredits?.system ?? "credits",
                  },
                },
                options: reorderedOptions.filter(
                  (option): option is (typeof targetGroup.options)[number] =>
                    Boolean(option),
                ),
              }
            : group,
      ),
    },
  };

  const path = resolveLearnerPath(bundle, {
    selectedConcentrationId: bundle.concentrations[0]?.id,
  });
  const selected = path.requirementSelections.find(
    (group) => group.requirementGroupId === targetGroup.id,
  );

  assert.equal(path.isResolved, true);
  assert.deepEqual(
    selected?.courseVersionIds,
    targetGroup.options.slice(0, 2).map((option) => option.courseVersionId),
  );
  assert.equal(
    path.diagnostics.some(
      (diagnostic) => diagnostic.code === "missing_required_prerequisite",
    ),
    false,
  );
});

test("publication validation rejects concentration metadata that disagrees with coherent options", () => {
  const concentration = computerScienceBundle.concentrations[0];
  assert.ok(concentration);
  const invalid: PublishedProgramBundle = {
    ...computerScienceBundle,
    concentrations: [
      {
        ...concentration,
        courseVersionIds: concentration.courseVersionIds.slice(1),
      },
      ...computerScienceBundle.concentrations.slice(1),
    ],
  };
  const result = validatePublishedProgramBundle(invalid);

  assert.equal(result.valid, false);
  assert.ok(
    result.issues.some(
      (issue) =>
        issue.path === "concentrations[0].courseVersionIds" &&
        issue.code === "ambiguous_requirement",
    ),
  );
});

test("path placements never expose an unselected course, unit, or assessment", () => {
  const concentration = computerScienceBundle.concentrations[2];
  assert.ok(concentration);
  const path = resolveLearnerPath(computerScienceBundle, {
    selectedConcentrationId: concentration.id,
  });
  const unitIds = new Set(path.learningUnits.map((unit) => unit.id));
  const assessmentIds = new Set(
    path.assessmentVersions.map((assessment) => assessment.id),
  );

  for (const placement of path.placements) {
    if (placement.subject.kind === "courseVersion") {
      assert.equal(
        path.selectedCourseVersionIdSet.has(placement.subject.id),
        true,
      );
    } else if (placement.subject.kind === "learningUnit") {
      assert.equal(unitIds.has(placement.subject.id), true);
    } else {
      assert.equal(assessmentIds.has(placement.subject.id), true);
    }
  }
});
