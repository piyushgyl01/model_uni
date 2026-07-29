import assert from "node:assert/strict";
import test from "node:test";
import { StaticCatalogRepository } from "../app/catalog/static-repository";
import {
  evaluateProgramRequirements,
  validatePublishedProgramBundle,
} from "../app/domain/validation";
import type {
  CourseVersionId,
  PublishedProgramBundle,
} from "../app/domain/catalog";
import { catalogRepository } from "../content/catalog";

test("publishes three structurally different programs through one repository", () => {
  const summaries = catalogRepository.listPrograms();
  assert.equal(summaries.length, 3);

  const ee = summaries.find((program) => program.slug === "electrical-engineering");
  const computerScience = summaries.find(
    (program) => program.slug === "computer-science",
  );
  const spreadsheets = summaries.find(
    (program) => program.slug === "practical-spreadsheets",
  );
  assert.ok(ee);
  assert.ok(computerScience);
  assert.ok(spreadsheets);
  assert.equal(ee.courseCount, 31);
  assert.equal(ee.availableCourseCount, 37);
  assert.equal(ee.learningUnitCount, 496);
  assert.equal(ee.resourceCount, 78);
  assert.equal(computerScience.courseCount, 30);
  assert.equal(computerScience.availableCourseCount, 34);
  assert.equal(computerScience.learningUnitCount, 240);
  assert.equal(computerScience.resourceCount, 34);
  assert.equal(computerScience.nominalHours, 4_800);
  assert.equal(spreadsheets.courseCount, 1);
  assert.equal(spreadsheets.availableCourseCount, 1);
  assert.equal(spreadsheets.learningUnitCount, 8);
  assert.equal(spreadsheets.resourceCount, 9);
});

test("the Computer Science publication is complete, coherent, and executable", () => {
  const bundle = catalogRepository.loadBySlug("computer-science");
  assert.ok(bundle);
  assert.deepEqual(validatePublishedProgramBundle(bundle), {
    valid: true,
    issues: [],
  });
  assert.equal(bundle.courseVersions.length, 34);
  assert.equal(bundle.learningUnits.length, 272);
  assert.equal(bundle.assessmentVersions.length, 68);
  assert.equal(bundle.resourceVersions.length, 34);
  assert.equal(bundle.accessOffers.length, 34);
  assert.equal(bundle.rights.length, 34);
  assert.equal(bundle.freshness.length, 34);
  assert.equal(bundle.calendars[0].periods.length, 6);
  assert.equal(bundle.concentrations.length, 3);

  const concentrationRequirement = bundle.programVersion.requirements.find(
    (requirement) => requirement.id === "req_cs_concentration",
  );
  assert.ok(concentrationRequirement);
  assert.equal(
    concentrationRequirement.rule.selectionConstraint,
    "same concentration",
  );
  const fixedCourseVersionIds = bundle.programVersion.requirements
    .filter((requirement) => requirement.id !== concentrationRequirement.id)
    .flatMap((requirement) =>
      requirement.options.map((option) => option.courseVersionId),
    );

  for (const concentration of bundle.concentrations) {
    const completed = new Set<CourseVersionId>([
      ...fixedCourseVersionIds,
      ...concentration.courseVersionIds,
    ]);
    assert.equal(completed.size, 30);
    assert.equal(evaluateProgramRequirements(bundle, completed).satisfied, true);
    assert.equal(
      bundle.learningUnits.filter((unit) =>
        completed.has(unit.courseVersionId),
      ).length,
      240,
    );
  }

  const placementPeriod = new Map(
    bundle.schedules[0].placements.map((placement) => [
      placement.subject.kind === "courseVersion"
        ? placement.subject.id
        : "",
      placement.periodId,
    ]),
  );
  const periodOrder = new Map(
    bundle.calendars[0].periods.map((period) => [
      period.id,
      period.order,
    ]),
  );
  for (const course of bundle.courseVersions) {
    assert.equal(
      bundle.learningUnits.filter(
        (unit) => unit.courseVersionId === course.id,
      ).length,
      8,
    );
    assert.equal(course.resourceReferences.length, 1);
    assert.equal(course.gradingPolicy.contributions.length, 2);
    const courseTerm = periodOrder.get(placementPeriod.get(course.id)!);
    for (const prerequisite of course.prerequisites) {
      const prerequisiteTerm = periodOrder.get(
        placementPeriod.get(prerequisite.courseVersionId)!,
      );
      assert.ok(
        prerequisiteTerm! <= courseTerm!,
        `${course.id} cannot precede ${prerequisite.courseVersionId}`,
      );
      if (prerequisiteTerm === courseTerm) {
        assert.equal(prerequisite.concurrentEnrollmentAllowed, true);
      }
    }
  }

  assert.equal(
    new Set(
      bundle.resourceVersions.map((resource) => resource.canonicalUrl),
    ).size,
    34,
  );
  assert.ok(
    bundle.resourceVersions.every((resource) =>
      resource.canonicalUrl.startsWith("https://"),
    ),
  );
});

test("the EE publication contains real specialization courses and valid paths", () => {
  const bundle = catalogRepository.loadBySlug("electrical-engineering");
  assert.ok(bundle);
  assert.deepEqual(validatePublishedProgramBundle(bundle), {
    valid: true,
    issues: [],
  });

  assert.equal(bundle.courseVersions.length, 37);
  assert.equal(bundle.learningUnits.length, 592);
  assert.equal(bundle.resourceVersions.length, 78);
  assert.equal(bundle.calendars[0].periods.length, 6);
  assert.equal(bundle.concentrations.length, 4);

  const codes = bundle.courses.flatMap((course) =>
    course.codes.map((code) => code.value),
  );
  assert.ok(!codes.includes("TRK401"));
  assert.ok(!codes.includes("TRK402"));

  const core = bundle.programVersion.requirements.find(
    (group) => group.id === "req_ee_common_core",
  );
  const specialization = bundle.programVersion.requirements.find(
    (group) => group.id === "req_ee_specialization",
  );
  assert.ok(core);
  assert.ok(specialization);
  assert.equal(core.options.length, 29);
  assert.equal(specialization.options.length, 8);
  assert.equal(
    specialization.rule.selectionConstraint,
    "same concentration",
  );

  for (const concentration of bundle.concentrations) {
    const completed = new Set<CourseVersionId>([
      ...core.options.map((option) => option.courseVersionId),
      ...concentration.courseVersionIds,
    ]);
    const evaluation = evaluateProgramRequirements(bundle, completed);
    assert.equal(
      evaluation.satisfied,
      true,
      `${concentration.title} should form a complete path`,
    );
    assert.equal(completed.size, 31);
    const unitCount = bundle.learningUnits.filter((unit) =>
      completed.has(unit.courseVersionId),
    ).length;
    assert.equal(unitCount, 496);
  }
});

test("extra specialization study does not invalidate a valid pathway", () => {
  const bundle = catalogRepository.loadBySlug("electrical-engineering");
  assert.ok(bundle);
  const [core, specialization] = bundle.programVersion.requirements;
  const completed = new Set<CourseVersionId>([
    ...core.options.map((option) => option.courseVersionId),
    ...bundle.concentrations[0].courseVersionIds,
    specialization.options.find(
      (option) =>
        option.concentrationId === bundle.concentrations[1].id,
    )!.courseVersionId,
  ]);
  assert.equal(evaluateProgramRequirements(bundle, completed).satisfied, true);
});

test("the same model accepts an eight-unit intensive without degree assumptions", () => {
  const bundle = catalogRepository.loadBySlug("practical-spreadsheets");
  assert.ok(bundle);
  assert.deepEqual(validatePublishedProgramBundle(bundle), {
    valid: true,
    issues: [],
  });
  assert.equal(bundle.program.kind, "certificate pathway");
  assert.equal(bundle.courseVersions.length, 1);
  assert.equal(bundle.learningUnits.length, 8);
  assert.equal(bundle.calendars[0].structure, "weeks");
  assert.equal(bundle.calendars[0].periods.length, 1);
  assert.equal(bundle.concentrations.length, 0);
  assert.equal(bundle.assessmentVersions.length, 2);
  assert.deepEqual(
    bundle.courseVersions[0].gradingPolicy.contributions.map(
      (contribution) => contribution.weight,
    ),
    [35, 65],
  );
});

test("titles and URLs are attributes rather than relationship identities", () => {
  const original = catalogRepository.loadBySlug("practical-spreadsheets");
  assert.ok(original);
  const changed = structuredClone(original) as PublishedProgramBundle;
  const mutableVersion = changed.resourceVersions[0] as {
    title: string;
    canonicalUrl: string;
  };
  mutableVersion.title = "Renamed official learning hub";
  mutableVersion.canonicalUrl = "https://support.microsoft.com/excel";

  assert.deepEqual(validatePublishedProgramBundle(changed), {
    valid: true,
    issues: [],
  });
  const repository = new StaticCatalogRepository([changed]);
  assert.equal(
    repository.loadBySlug("practical-spreadsheets")?.resourceVersions[0].id,
    original.resourceVersions[0].id,
  );
});

test("courses are schedule-neutral and references resolve by stable IDs", () => {
  for (const summary of catalogRepository.listPrograms()) {
    const bundle = catalogRepository.loadBySlug(summary.slug);
    assert.ok(bundle);
    for (const course of bundle.courseVersions) {
      assert.equal("semester" in course, false);
      assert.ok(course.id.startsWith("crv_"));
      for (const reference of course.resourceReferences) {
        assert.ok(
          bundle.resourceVersions.some(
            (resource) => resource.id === reference.resourceVersionId,
          ),
        );
      }
    }
    for (const unit of bundle.learningUnits) {
      assert.ok(unit.id.startsWith("unt_"));
      assert.ok(bundle.courseVersions.some(
        (course) => course.id === unit.courseVersionId,
      ));
    }
  }
});
