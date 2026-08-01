import assert from "node:assert/strict";
import test from "node:test";
import { StaticCatalogRepository } from "../app/catalog/static-repository";
import {
  evaluateProgramRequirements,
  validateCatalogBundles,
  validatePublishedProgramBundle,
} from "../app/domain/validation";
import type {
  CourseVersionId,
  PublishedProgramBundle,
} from "../app/domain/catalog";
import { catalogRepository } from "../content/catalog";
import { computerScienceIdentities } from "../content/manifests/computer-science-identities";
import { computerScienceV11Identities } from "../content/manifests/computer-science-v1-1-identities";
import { mechanicalEngineeringIdentities } from "../content/manifests/mechanical-engineering-identities";
import {
  computerScienceCourseSpecs,
  type ComputerScienceCourseSpec,
} from "../content/programs/computer-science-course-specs";
import { computerScienceCourseSpecsV1_1 } from "../content/programs/computer-science-course-specs-v1-1";
import { computerScienceBundle } from "../content/programs/computer-science-v1-1";
import { computerScienceBundleV1 } from "../content/programs/computer-science";
import {
  mechanicalEngineeringCourseSpecs,
  type MechanicalEngineeringCourseSpec,
} from "../content/programs/mechanical-engineering-course-specs";
import { mechanicalEngineeringBundle } from "../content/programs/mechanical-engineering";

function collectManifestIdentityValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(collectManifestIdentityValues);
}

function collectBundleEntityIds(bundle: PublishedProgramBundle): string[] {
  return [
    bundle.id,
    bundle.program.id,
    bundle.programVersion.id,
    ...bundle.programVersion.requirements.flatMap((requirement) => [
      requirement.id,
      ...requirement.options.map((option) => option.id),
    ]),
    ...bundle.courses.map((course) => course.id),
    ...bundle.courseVersions.map((courseVersion) => courseVersion.id),
    ...bundle.learningUnits.map((unit) => unit.id),
    ...bundle.assessments.map((assessment) => assessment.id),
    ...bundle.assessmentVersions.map(
      (assessmentVersion) => assessmentVersion.id,
    ),
    ...bundle.competencies.map((competency) => competency.id),
    ...bundle.competencyMappings.map((mapping) => mapping.id),
    ...bundle.concentrations.map((concentration) => concentration.id),
    ...bundle.resources.map((resource) => resource.id),
    ...bundle.resourceVersions.map((resourceVersion) => resourceVersion.id),
    ...bundle.accessOffers.map((offer) => offer.id),
    ...bundle.rights.map((record) => record.id),
    ...bundle.freshness.map((record) => record.id),
    ...bundle.provenance.map((evidence) => evidence.id),
    ...bundle.calendars.flatMap((calendar) => [
      calendar.id,
      ...calendar.periods.map((period) => period.id),
      ...calendar.milestones.map((milestone) => milestone.id),
    ]),
    ...bundle.schedules.flatMap((schedule) => [
      schedule.id,
      ...schedule.placements.map((placement) => placement.id),
    ]),
  ];
}

test("publishes four structurally different programs from five publication versions", () => {
  const summaries = catalogRepository.listPrograms();
  assert.equal(summaries.length, 4);
  assert.equal(
    summaries.reduce(
      (total, program) =>
        total + catalogRepository.listVersions(program.slug).length,
      0,
    ),
    5,
  );

  const ee = summaries.find((program) => program.slug === "electrical-engineering");
  const computerScience = summaries.find(
    (program) => program.slug === "computer-science",
  );
  const mechanicalEngineering = summaries.find(
    (program) => program.slug === "mechanical-engineering",
  );
  const spreadsheets = summaries.find(
    (program) => program.slug === "practical-spreadsheets",
  );
  assert.ok(ee);
  assert.ok(computerScience);
  assert.ok(mechanicalEngineering);
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
  assert.equal(computerScience.latestVersion, "1.1.0");
  assert.equal(mechanicalEngineering.courseCount, 30);
  assert.equal(mechanicalEngineering.availableCourseCount, 34);
  assert.equal(mechanicalEngineering.learningUnitCount, 240);
  assert.equal(mechanicalEngineering.resourceCount, 34);
  assert.equal(mechanicalEngineering.nominalHours, 4_800);
  assert.equal(mechanicalEngineering.latestVersion, "1.0.0");
  assert.equal(spreadsheets.courseCount, 1);
  assert.equal(spreadsheets.availableCourseCount, 1);
  assert.equal(spreadsheets.learningUnitCount, 8);
  assert.equal(spreadsheets.resourceCount, 9);
});

test("the Computer Science publication is complete, coherent, and executable", () => {
  const bundle = catalogRepository.loadBySlug("computer-science");
  assert.ok(bundle);
  assert.equal(bundle.programVersion.version, "1.1.0");
  assert.deepEqual(catalogRepository.listVersions("computer-science"), [
    "1.1.0",
    "1.0.0",
  ]);
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
    (requirement) =>
      requirement.id ===
      computerScienceV11Identities.requirementGroupIds.concentration,
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

test("the Mechanical Engineering publication has complete, coherent, safe paths", () => {
  const bundle = catalogRepository.loadBySlug("mechanical-engineering");
  assert.ok(bundle);
  assert.equal(bundle.id, mechanicalEngineeringBundle.id);
  assert.equal(bundle.programVersion.version, "1.0.0");
  assert.deepEqual(catalogRepository.listVersions("mechanical-engineering"), [
    "1.0.0",
  ]);
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
  assert.equal(bundle.programVersion.requirements.length, 7);
  assert.equal(bundle.calendars[0].periods.length, 6);
  assert.equal(bundle.calendars[0].milestones.length, 12);
  assert.equal(bundle.concentrations.length, 3);

  const concentrationRequirement = bundle.programVersion.requirements.find(
    (requirement) =>
      requirement.id ===
      mechanicalEngineeringIdentities.requirementGroupIds.concentration,
  );
  assert.ok(concentrationRequirement);
  assert.equal(concentrationRequirement.options.length, 6);
  assert.equal(
    concentrationRequirement.rule.selectionConstraint,
    "same concentration",
  );
  const fixedCourseVersionIds = bundle.programVersion.requirements
    .filter((requirement) => requirement.id !== concentrationRequirement.id)
    .flatMap((requirement) =>
      requirement.options.map((option) => option.courseVersionId),
    );
  assert.equal(fixedCourseVersionIds.length, 28);

  for (const concentration of bundle.concentrations) {
    assert.equal(concentration.courseVersionIds.length, 2);
    const completed = new Set<CourseVersionId>([
      ...fixedCourseVersionIds,
      ...concentration.courseVersionIds,
    ]);
    assert.equal(completed.size, 30);
    assert.equal(evaluateProgramRequirements(bundle, completed).satisfied, true);
    assert.equal(
      bundle.courseVersions
        .filter((course) => completed.has(course.id))
        .reduce((total, course) => total + course.nominalHours, 0),
      4_800,
    );
    assert.equal(
      bundle.learningUnits.filter((unit) =>
        completed.has(unit.courseVersionId),
      ).length,
      240,
    );
  }

  const mixedConcentrations = new Set<CourseVersionId>([
    ...fixedCourseVersionIds,
    bundle.concentrations[0].courseVersionIds[0],
    bundle.concentrations[1].courseVersionIds[0],
  ]);
  assert.equal(
    evaluateProgramRequirements(bundle, mixedConcentrations).satisfied,
    false,
  );

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
    assert.equal(course.nominalHours, 160);
    assert.equal(course.resourceReferences.length, 1);
    assert.equal(course.gradingPolicy.contributions.length, 2);
    const courseTerm = periodOrder.get(placementPeriod.get(course.id)!);
    assert.ok(courseTerm);
    for (const prerequisite of course.prerequisites) {
      const prerequisiteTerm = periodOrder.get(
        placementPeriod.get(prerequisite.courseVersionId)!,
      );
      assert.ok(
        prerequisiteTerm! < courseTerm,
        `${course.id} must follow ${prerequisite.courseVersionId}`,
      );
      assert.equal(prerequisite.concurrentEnrollmentAllowed, undefined);
    }
  }

  assert.ok(
    bundle.resourceVersions.every((resource) =>
      resource.canonicalUrl.startsWith("https://"),
    ),
  );
  assert.equal(
    new Set(
      bundle.resourceVersions.map((resource) => resource.canonicalUrl),
    ).size,
    34,
  );
  assert.ok(
    bundle.accessOffers.every(
      (offer) =>
        offer.type === "free" &&
        offer.loginRequired === false &&
        !("price" in offer),
    ),
  );
  assert.ok(
    bundle.rights.every(
      (record) =>
        record.status === "link only" &&
        record.mayMirror === false &&
        record.mayAdapt === false,
    ),
  );
  assert.ok(
    bundle.freshness.every(
      (record) => record.status === "healthy" && record.httpStatus === 200,
    ),
  );
  assert.equal(
    bundle.courseVersions.filter((course) => course.safetyNote).length,
    27,
  );
  assert.ok(
    bundle.courseVersions.every((course) =>
      course.setup.some((step) => /integrity and safety agreement/i.test(step)),
    ),
  );
});

function assertComputerScienceManifestParity(
  bundle: PublishedProgramBundle,
  identities: unknown,
  specs: readonly ComputerScienceCourseSpec[],
) {
  const bundleIds = collectBundleEntityIds(bundle);
  const manifestIds = collectManifestIdentityValues(identities);
  const uuidV7Identity =
    /^[a-z]+_[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  assert.ok(bundleIds.every((id) => uuidV7Identity.test(id)));
  assert.ok(manifestIds.every((id) => uuidV7Identity.test(id)));
  assert.equal(new Set(bundleIds).size, bundleIds.length);
  assert.equal(new Set(manifestIds).size, manifestIds.length);
  assert.equal(
    new Set(bundleIds.map((id) => id.slice(id.indexOf("_") + 1))).size,
    bundleIds.length,
  );
  assert.deepEqual([...manifestIds].sort(), [...bundleIds].sort());

  const courseIdentities = (identities as typeof computerScienceIdentities)
    .courses as Readonly<
      Record<
        string,
        { readonly learningUnitIds: Readonly<Record<string, string>> }
      >
    >;
  for (const spec of specs) {
    const topicKeys = spec.topics.map((topic) => topic.key);
    assert.equal(new Set(topicKeys).size, 8);
    assert.deepEqual(
      Object.keys(
        courseIdentities[spec.key].learningUnitIds,
      ).sort(),
      [...topicKeys].sort(),
    );
    assert.deepEqual(
      spec.topics
        .flatMap((topic) =>
          "assessmentPosition" in topic
            ? [topic.assessmentPosition]
            : [],
        ),
      ["applied", "final"],
    );
  }

  for (const course of bundle.courseVersions) {
    assert.deepEqual(
      bundle.learningUnits
        .filter((unit) => unit.courseVersionId === course.id)
        .sort((left, right) => left.order - right.order)
        .map((unit) => unit.label),
      [
        "Unit 1",
        "Unit 2",
        "Unit 3",
        "Unit 4",
        "Unit 5",
        "Unit 6",
        "Unit 7",
        "Unit 8",
      ],
    );
  }
}

test("every Computer Science identity is a unique manifest-owned UUIDv7", () => {
  assertComputerScienceManifestParity(
    computerScienceBundleV1,
    computerScienceIdentities,
    computerScienceCourseSpecs,
  );
  assertComputerScienceManifestParity(
    computerScienceBundle,
    computerScienceV11Identities,
    computerScienceCourseSpecsV1_1,
  );
});

function assertMechanicalEngineeringManifestParity(
  bundle: PublishedProgramBundle,
  identities: typeof mechanicalEngineeringIdentities,
  specs: readonly MechanicalEngineeringCourseSpec[],
) {
  const bundleIds = collectBundleEntityIds(bundle);
  const manifestIds = collectManifestIdentityValues(identities);
  const uuidV7Identity =
    /^[a-z]+_[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  assert.ok(bundleIds.every((id) => uuidV7Identity.test(id)));
  assert.ok(manifestIds.every((id) => uuidV7Identity.test(id)));
  assert.equal(new Set(bundleIds).size, bundleIds.length);
  assert.equal(new Set(manifestIds).size, manifestIds.length);
  assert.equal(
    new Set(bundleIds.map((id) => id.slice(id.indexOf("_") + 1))).size,
    bundleIds.length,
  );
  assert.deepEqual([...manifestIds].sort(), [...bundleIds].sort());

  assert.deepEqual(
    Object.keys(identities.courses).sort(),
    specs.map((spec) => spec.key).sort(),
  );
  assert.deepEqual(
    Object.keys(identities.resources).sort(),
    specs.map((spec) => spec.key).sort(),
  );
  for (const spec of specs) {
    const topicKeys = spec.topics.map((topic) => topic.key);
    assert.equal(new Set(topicKeys).size, 8);
    assert.deepEqual(
      Object.keys(
        identities.courses[spec.key as keyof typeof identities.courses]
          .learningUnitIds,
      ).sort(),
      [...topicKeys].sort(),
    );
    assert.deepEqual(
      spec.topics.flatMap((topic) =>
        topic.assessmentPosition ? [topic.assessmentPosition] : [],
      ),
      ["applied", "final"],
    );
  }

  for (const course of bundle.courseVersions) {
    assert.deepEqual(
      bundle.learningUnits
        .filter((unit) => unit.courseVersionId === course.id)
        .sort((left, right) => left.order - right.order)
        .map((unit) => unit.label),
      [
        "Unit 1",
        "Unit 2",
        "Unit 3",
        "Unit 4",
        "Unit 5",
        "Unit 6",
        "Unit 7",
        "Unit 8",
      ],
    );
  }
}

test("every Mechanical Engineering identity is a unique manifest-owned UUIDv7", () => {
  assertMechanicalEngineeringManifestParity(
    mechanicalEngineeringBundle,
    mechanicalEngineeringIdentities,
    mechanicalEngineeringCourseSpecs,
  );
});

test("Computer Science 1.1 preserves 1.0 and strengthens the audited sequence", () => {
  assert.deepEqual(validateCatalogBundles([
    computerScienceBundleV1,
    computerScienceBundle,
  ]), {
    valid: true,
    issues: [],
  });
  assert.equal(
    catalogRepository.loadBySlug("computer-science", "1.0.0"),
    computerScienceBundleV1,
  );

  const latest = catalogRepository.loadBySlug("computer-science", "1.1.0");
  assert.equal(latest, computerScienceBundle);
  assert.ok(latest);

  const courseVersion = (key: keyof typeof computerScienceV11Identities.courses) =>
    latest.courseVersions.find(
      (version) =>
        version.id ===
        computerScienceV11Identities.courses[key].courseVersionId,
    );
  const courseUnits = (key: keyof typeof computerScienceV11Identities.courses) =>
    latest.learningUnits.filter(
      (unit) =>
        unit.courseVersionId ===
        computerScienceV11Identities.courses[key].courseVersionId,
    );

  const architecture = courseVersion("computer-architecture");
  assert.ok(architecture);
  assert.match(architecture.summary, /pipelining/i);
  assert.match(architecture.summary, /memory hierarchy/i);
  assert.ok(
    courseUnits("computer-architecture").some((unit) =>
      /virtual memory/i.test(unit.topic),
    ),
  );

  const algorithms = courseVersion("algorithms");
  assert.ok(algorithms);
  assert.match(algorithms.summary, /network flow/i);
  assert.ok(
    courseUnits("algorithms").some((unit) => /NP-completeness/i.test(unit.topic)),
  );
  assert.ok(
    courseUnits("algorithms").some((unit) => /approximation/i.test(unit.topic)),
  );

  const programmingLanguages = courseVersion("programming-languages");
  assert.ok(programmingLanguages);
  assert.match(programmingLanguages.summary, /functional/i);
  assert.ok(
    courseUnits("programming-languages").some((unit) =>
      /algebraic data types/i.test(unit.topic),
    ),
  );

  const machineLearning = courseVersion("machine-learning");
  assert.ok(machineLearning);
  assert.match(machineLearning.summary, /margin-based/i);
  assert.ok(
    courseUnits("machine-learning").some((unit) =>
      /generalization/i.test(unit.topic),
    ),
  );

  const parallel = courseVersion("parallel-computing");
  assert.ok(parallel);
  assert.match(parallel.summary, /work-span/i);
  assert.ok(
    courseUnits("parallel-computing").some((unit) => /work efficiency/i.test(unit.topic)),
  );

  const placementByCourseVersion = new Map(
    latest.schedules[0].placements.map((placement) => [
      placement.subject.kind === "courseVersion" ? placement.subject.id : "",
      placement.periodId,
    ]),
  );
  const periodOrder = new Map(
    latest.calendars[0].periods.map((period) => [period.id, period.order]),
  );
  const programmingLanguagesTerm = periodOrder.get(
    placementByCourseVersion.get(programmingLanguages.id)!,
  );
  const compilers = courseVersion("compilers");
  assert.ok(compilers);
  const compilersTerm = periodOrder.get(
    placementByCourseVersion.get(compilers.id)!,
  );
  assert.equal(programmingLanguagesTerm, 3);
  assert.equal(compilersTerm, 4);
  const languagePrerequisite = compilers.prerequisites.find(
    (prerequisite) => prerequisite.courseVersionId === programmingLanguages.id,
  );
  assert.ok(languagePrerequisite);
  assert.equal(languagePrerequisite.concurrentEnrollmentAllowed, undefined);
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
    const completed: Set<CourseVersionId> = new Set([
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
    const unitCount: number = bundle.learningUnits.filter((unit) =>
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
