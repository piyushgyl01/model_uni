import type {
  AcademicCalendar,
  CompetencySubject,
  CourseVersionId,
  EvidenceSubject,
  LearningUnitId,
  ProgramRequirementEvaluation,
  PublishedProgramBundle,
  RequirementGroupEvaluation,
  ResourceVersionId,
  ScheduledSubject,
} from "./catalog";

export type ValidationIssueCode =
  | "invalid_id"
  | "duplicate_id"
  | "invalid_slug"
  | "duplicate_slug"
  | "invalid_version"
  | "invalid_value"
  | "missing_reference"
  | "prerequisite_cycle"
  | "unit_cycle"
  | "unsatisfiable_requirement"
  | "ambiguous_requirement"
  | "invalid_assessment_weights"
  | "missing_resource_fact";

export interface ValidationIssue {
  readonly code: ValidationIssueCode;
  readonly path: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
}

type ExpectedId = readonly [value: string, prefix: string, path: string];
type SlugEntry = readonly [slug: string, path: string];
type CatalogIdentityEntry = {
  readonly id: string;
  readonly path: string;
  readonly value: unknown;
};

const ID_BODY = "[A-Za-z0-9][A-Za-z0-9_-]*";
const SEMANTIC_VERSION = /^\d+\.\d+\.\d+$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const WEIGHT_TOLERANCE = 0.000_001;

function canonicalIdentityValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalIdentityValue).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([key, child]) =>
          `${JSON.stringify(key)}:${canonicalIdentityValue(child)}`,
      )
      .join(",")}}`;
  }
  const encoded = JSON.stringify(value);
  return encoded === undefined ? "null" : encoded;
}

function catalogIdentityEntries(
  bundle: PublishedProgramBundle,
  bundleIndex: number,
): readonly CatalogIdentityEntry[] {
  const root = `bundles[${bundleIndex}]`;
  const entries: CatalogIdentityEntry[] = [
    { id: bundle.id, path: `${root}.id`, value: bundle },
    { id: bundle.program.id, path: `${root}.program.id`, value: bundle.program },
    {
      id: bundle.programVersion.id,
      path: `${root}.programVersion.id`,
      value: bundle.programVersion,
    },
  ];
  const append = (
    values: readonly { readonly id: string }[],
    collectionPath: string,
  ) => {
    values.forEach((value, index) =>
      entries.push({
        id: value.id,
        path: `${root}.${collectionPath}[${index}].id`,
        value,
      }),
    );
  };

  append(bundle.programVersion.requirements, "programVersion.requirements");
  bundle.programVersion.requirements.forEach((requirement, requirementIndex) =>
    append(
      requirement.options,
      `programVersion.requirements[${requirementIndex}].options`,
    ),
  );
  append(bundle.courses, "courses");
  append(bundle.courseVersions, "courseVersions");
  append(bundle.learningUnits, "learningUnits");
  append(bundle.assessments, "assessments");
  append(bundle.assessmentVersions, "assessmentVersions");
  append(bundle.competencies, "competencies");
  append(bundle.competencyMappings, "competencyMappings");
  append(bundle.concentrations, "concentrations");
  append(bundle.resources, "resources");
  append(bundle.resourceVersions, "resourceVersions");
  append(bundle.accessOffers, "accessOffers");
  append(bundle.rights, "rights");
  append(bundle.freshness, "freshness");
  append(bundle.provenance, "provenance");
  append(bundle.calendars, "calendars");
  bundle.calendars.forEach((calendar, calendarIndex) => {
    append(calendar.periods, `calendars[${calendarIndex}].periods`);
    append(calendar.milestones, `calendars[${calendarIndex}].milestones`);
  });
  append(bundle.schedules, "schedules");
  bundle.schedules.forEach((schedule, scheduleIndex) =>
    append(schedule.placements, `schedules[${scheduleIndex}].placements`),
  );
  return entries;
}

function collectDuplicateValues(
  values: readonly (readonly [value: string, path: string])[],
  issue: (path: string, value: string) => void,
) {
  const firstPath = new Map<string, string>();
  for (const [value, path] of values) {
    const previous = firstPath.get(value);
    if (previous) {
      issue(path, previous);
    } else {
      firstPath.set(value, path);
    }
  }
}

function collectCalendarPeriodIds(calendars: readonly AcademicCalendar[]) {
  return new Set(calendars.flatMap((calendar) => calendar.periods.map((period) => period.id)));
}

function evidenceSubjectExists(
  subject: EvidenceSubject,
  ids: {
    programVersions: ReadonlySet<string>;
    courseVersions: ReadonlySet<string>;
    assessmentVersions: ReadonlySet<string>;
    competencies: ReadonlySet<string>;
    resourceVersions: ReadonlySet<string>;
    rights: ReadonlySet<string>;
    accessOffers: ReadonlySet<string>;
  },
) {
  switch (subject.kind) {
    case "programVersion":
      return ids.programVersions.has(subject.id);
    case "courseVersion":
      return ids.courseVersions.has(subject.id);
    case "assessmentVersion":
      return ids.assessmentVersions.has(subject.id);
    case "competency":
      return ids.competencies.has(subject.id);
    case "resourceVersion":
      return ids.resourceVersions.has(subject.id);
    case "resourceRights":
      return ids.rights.has(subject.id);
    case "resourceAccess":
      return ids.accessOffers.has(subject.id);
  }
}

function competencySubjectExists(
  subject: CompetencySubject,
  ids: {
    programVersions: ReadonlySet<string>;
    courseVersions: ReadonlySet<string>;
    learningUnits: ReadonlySet<string>;
    assessmentVersions: ReadonlySet<string>;
  },
) {
  switch (subject.kind) {
    case "programVersion":
      return ids.programVersions.has(subject.id);
    case "courseVersion":
      return ids.courseVersions.has(subject.id);
    case "learningUnit":
      return ids.learningUnits.has(subject.id);
    case "assessmentVersion":
      return ids.assessmentVersions.has(subject.id);
  }
}

function scheduledSubjectExists(
  subject: ScheduledSubject,
  ids: {
    courseVersions: ReadonlySet<string>;
    learningUnits: ReadonlySet<string>;
    assessmentVersions: ReadonlySet<string>;
  },
) {
  switch (subject.kind) {
    case "courseVersion":
      return ids.courseVersions.has(subject.id);
    case "learningUnit":
      return ids.learningUnits.has(subject.id);
    case "assessmentVersion":
      return ids.assessmentVersions.has(subject.id);
  }
}

function findDirectedCycles(
  nodes: readonly string[],
  edgesFor: (node: string) => readonly string[],
) {
  const state = new Map<string, "visiting" | "visited">();
  const stack: string[] = [];
  const cycles: string[][] = [];
  const seenCycle = new Set<string>();

  const visit = (node: string) => {
    const nodeState = state.get(node);
    if (nodeState === "visited") return;
    if (nodeState === "visiting") {
      const start = stack.indexOf(node);
      const cycle = [...stack.slice(start), node];
      const key = [...new Set(cycle)].sort().join("|");
      if (!seenCycle.has(key)) {
        seenCycle.add(key);
        cycles.push(cycle);
      }
      return;
    }

    state.set(node, "visiting");
    stack.push(node);
    for (const target of edgesFor(node)) visit(target);
    stack.pop();
    state.set(node, "visited");
  };

  for (const node of nodes) visit(node);
  return cycles;
}

export function evaluateProgramRequirements(
  bundle: PublishedProgramBundle,
  completedCourseVersionIds: ReadonlySet<CourseVersionId>,
): ProgramRequirementEvaluation {
  const groups: RequirementGroupEvaluation[] = bundle.programVersion.requirements.map(
    (group) => {
      const completedOptions = group.options.filter((option) =>
        completedCourseVersionIds.has(option.courseVersionId),
      );
      const selected =
        group.rule.selectionConstraint === "same concentration"
          ? [
              ...completedOptions.reduce((byConcentration, option) => {
                const key = option.concentrationId ?? "unassigned";
                byConcentration.set(key, [
                  ...(byConcentration.get(key) ?? []),
                  option,
                ]);
                return byConcentration;
              }, new Map<string, typeof completedOptions>()),
            ]
              .map(([, options]) => options)
              .sort((left, right) => right.length - left.length)[0]
              ?.slice(
                0,
                group.rule.maxSelections ?? completedOptions.length,
              ) ?? []
          : completedOptions.slice(
              0,
              group.rule.maxSelections ?? completedOptions.length,
            );
      const reasons: string[] = [];

      if (selected.length < group.rule.minSelections) {
        reasons.push(
          `Complete ${group.rule.minSelections - selected.length} more option(s).`,
        );
      }
      let selectedCredits: RequirementGroupEvaluation["selectedCredits"];
      if (group.rule.minCredits) {
        const matchingCredits = selected.filter(
          (option) => option.credits.system === group.rule.minCredits?.system,
        );
        const value = matchingCredits.reduce((sum, option) => sum + option.credits.value, 0);
        selectedCredits = { value, system: group.rule.minCredits.system };
        if (value < group.rule.minCredits.value) {
          reasons.push(
            `Complete ${group.rule.minCredits.value - value} more ${group.rule.minCredits.system} credit(s).`,
          );
        }
      }
      if (group.rule.selectionConstraint === "same concentration") {
        const selectedConcentrations = new Set(
          selected.map((option) => option.concentrationId).filter(Boolean),
        );
        if (
          selected.some((option) => !option.concentrationId) ||
          selectedConcentrations.size > 1
        ) {
          reasons.push("Selected options must belong to one concentration.");
        }
      }

      return {
        requirementGroupId: group.id,
        selectedCourseVersionIds: selected.map((option) => option.courseVersionId),
        selectedCredits,
        satisfied: reasons.length === 0,
        reasons,
      };
    },
  );

  return { satisfied: groups.every((group) => group.satisfied), groups };
}

/**
 * Validates everything needed to safely render and evaluate one published
 * program. It intentionally does not make editorial quality judgments.
 */
export function validatePublishedProgramBundle(
  bundle: PublishedProgramBundle,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const add = (code: ValidationIssueCode, path: string, message: string) =>
    issues.push({ code, path, message });

  const expectedIds: ExpectedId[] = [
    [bundle.id, "bnd", "id"],
    [bundle.program.id, "prg", "program.id"],
    [bundle.programVersion.id, "prv", "programVersion.id"],
    ...bundle.programVersion.requirements.flatMap((group, groupIndex) => [
      [group.id, "req", `programVersion.requirements[${groupIndex}].id`] as ExpectedId,
      ...group.options.map(
        (option, optionIndex) =>
          [
            option.id,
            "opt",
            `programVersion.requirements[${groupIndex}].options[${optionIndex}].id`,
          ] as ExpectedId,
      ),
    ]),
    ...bundle.courses.map(
      (course, index) => [course.id, "crs", `courses[${index}].id`] as ExpectedId,
    ),
    ...bundle.courseVersions.map(
      (version, index) =>
        [version.id, "crv", `courseVersions[${index}].id`] as ExpectedId,
    ),
    ...bundle.learningUnits.map(
      (unit, index) => [unit.id, "unt", `learningUnits[${index}].id`] as ExpectedId,
    ),
    ...bundle.assessments.map(
      (assessment, index) =>
        [assessment.id, "asm", `assessments[${index}].id`] as ExpectedId,
    ),
    ...bundle.assessmentVersions.map(
      (version, index) =>
        [version.id, "asv", `assessmentVersions[${index}].id`] as ExpectedId,
    ),
    ...bundle.competencies.map(
      (competency, index) =>
        [competency.id, "cmp", `competencies[${index}].id`] as ExpectedId,
    ),
    ...bundle.competencyMappings.map(
      (mapping, index) =>
        [mapping.id, "cpm", `competencyMappings[${index}].id`] as ExpectedId,
    ),
    ...bundle.concentrations.map(
      (concentration, index) =>
        [concentration.id, "con", `concentrations[${index}].id`] as ExpectedId,
    ),
    ...bundle.resources.map(
      (resource, index) =>
        [resource.id, "res", `resources[${index}].id`] as ExpectedId,
    ),
    ...bundle.resourceVersions.map(
      (version, index) =>
        [version.id, "rsv", `resourceVersions[${index}].id`] as ExpectedId,
    ),
    ...bundle.accessOffers.map(
      (offer, index) => [offer.id, "acc", `accessOffers[${index}].id`] as ExpectedId,
    ),
    ...bundle.rights.map(
      (record, index) => [record.id, "rgt", `rights[${index}].id`] as ExpectedId,
    ),
    ...bundle.freshness.map(
      (record, index) => [record.id, "frs", `freshness[${index}].id`] as ExpectedId,
    ),
    ...bundle.provenance.map(
      (evidence, index) =>
        [evidence.id, "prvdc", `provenance[${index}].id`] as ExpectedId,
    ),
    ...bundle.calendars.flatMap((calendar, calendarIndex) => [
      [calendar.id, "cal", `calendars[${calendarIndex}].id`] as ExpectedId,
      ...calendar.periods.map(
        (period, periodIndex) =>
          [
            period.id,
            "per",
            `calendars[${calendarIndex}].periods[${periodIndex}].id`,
          ] as ExpectedId,
      ),
      ...calendar.milestones.map(
        (milestone, milestoneIndex) =>
          [
            milestone.id,
            "mil",
            `calendars[${calendarIndex}].milestones[${milestoneIndex}].id`,
          ] as ExpectedId,
      ),
    ]),
    ...bundle.schedules.flatMap((schedule, scheduleIndex) => [
      [schedule.id, "sch", `schedules[${scheduleIndex}].id`] as ExpectedId,
      ...schedule.placements.map(
        (placement, placementIndex) =>
          [
            placement.id,
            "plc",
            `schedules[${scheduleIndex}].placements[${placementIndex}].id`,
          ] as ExpectedId,
      ),
    ]),
  ];

  for (const [value, prefix, path] of expectedIds) {
    if (!new RegExp(`^${prefix}_${ID_BODY}$`).test(value)) {
      add("invalid_id", path, `Expected a stable ${prefix}_… ID; received "${value}".`);
    }
  }
  collectDuplicateValues(
    expectedIds.map(([value, , path]) => [value, path] as const),
    (path, previous) =>
      add("duplicate_id", path, `ID is already used at ${previous}.`),
  );

  const slugs: SlugEntry[] = [
    [bundle.program.canonicalSlug, "program.canonicalSlug"],
    ...bundle.courses.map(
      (course, index) => [course.canonicalSlug, `courses[${index}].canonicalSlug`] as const,
    ),
    ...bundle.assessments.map(
      (assessment, index) =>
        [assessment.canonicalSlug, `assessments[${index}].canonicalSlug`] as const,
    ),
    ...bundle.competencies.map(
      (competency, index) =>
        [competency.canonicalSlug, `competencies[${index}].canonicalSlug`] as const,
    ),
    ...bundle.concentrations.map(
      (concentration, index) =>
        [
          concentration.canonicalSlug,
          `concentrations[${index}].canonicalSlug`,
        ] as const,
    ),
    ...bundle.resources.map(
      (resource, index) =>
        [resource.canonicalSlug, `resources[${index}].canonicalSlug`] as const,
    ),
  ];
  for (const [slug, path] of slugs) {
    if (!SLUG.test(slug)) {
      add("invalid_slug", path, `"${slug}" is not a canonical kebab-case slug.`);
    }
  }

  const slugGroups = [
    [["program", bundle.program.canonicalSlug]] as const,
    bundle.courses.map((entity) => [entity.id, entity.canonicalSlug] as const),
    bundle.assessments.map((entity) => [entity.id, entity.canonicalSlug] as const),
    bundle.competencies.map((entity) => [entity.id, entity.canonicalSlug] as const),
    bundle.concentrations.map((entity) => [entity.id, entity.canonicalSlug] as const),
    bundle.resources.map((entity) => [entity.id, entity.canonicalSlug] as const),
  ];
  for (const group of slugGroups) {
    collectDuplicateValues(
      group.map(([id, slug]) => [slug, String(id)] as const),
      (path, previous) =>
        add(
          "duplicate_slug",
          path,
          `Canonical slug is also used by ${previous} in the same entity type.`,
        ),
    );
  }

  const versions = [
    [bundle.programVersion.version, "programVersion.version"],
    ...bundle.courseVersions.map(
      (version, index) => [version.version, `courseVersions[${index}].version`] as const,
    ),
    ...bundle.assessmentVersions.map(
      (version, index) =>
        [version.version, `assessmentVersions[${index}].version`] as const,
    ),
    ...bundle.resourceVersions.map(
      (version, index) => [version.version, `resourceVersions[${index}].version`] as const,
    ),
  ] as const;
  for (const [version, path] of versions) {
    if (!SEMANTIC_VERSION.test(version)) {
      add("invalid_version", path, `"${version}" must be major.minor.patch.`);
    }
  }

  const courseIds = new Set(bundle.courses.map((course) => course.id));
  const courseVersionIds = new Set(bundle.courseVersions.map((version) => version.id));
  const learningUnitIds = new Set(bundle.learningUnits.map((unit) => unit.id));
  const assessmentVersionIds = new Set(
    bundle.assessmentVersions.map((version) => version.id),
  );
  const competencyIds = new Set(bundle.competencies.map((competency) => competency.id));
  const concentrationIds = new Set(
    bundle.concentrations.map((concentration) => concentration.id),
  );
  const resourceIds = new Set(bundle.resources.map((resource) => resource.id));
  const resourceVersionIds = new Set(
    bundle.resourceVersions.map((version) => version.id),
  );
  const evidenceIds = new Set(bundle.provenance.map((evidence) => evidence.id));
  const calendarIds = new Set(bundle.calendars.map((calendar) => calendar.id));
  const periodIds = collectCalendarPeriodIds(bundle.calendars);
  const scheduleIds = new Set(bundle.schedules.map((schedule) => schedule.id));
  const rightsIds = new Set(bundle.rights.map((record) => record.id));
  const accessOfferIds = new Set(bundle.accessOffers.map((offer) => offer.id));

  if (bundle.programVersion.programId !== bundle.program.id) {
    add(
      "missing_reference",
      "programVersion.programId",
      "The program version must reference the bundle's program.",
    );
  }

  if (
    bundle.programVersion.defaultScheduleId &&
    !scheduleIds.has(bundle.programVersion.defaultScheduleId)
  ) {
    add(
      "missing_reference",
      "programVersion.defaultScheduleId",
      "Default schedule is not present in this bundle.",
    );
  }

  bundle.courseVersions.forEach((version, index) => {
    if (!courseIds.has(version.courseId)) {
      add(
        "missing_reference",
        `courseVersions[${index}].courseId`,
        `Unknown course ${version.courseId}.`,
      );
    }
    if (version.nominalHours <= 0) {
      add(
        "invalid_value",
        `courseVersions[${index}].nominalHours`,
        "Nominal hours must be greater than zero.",
      );
    }
    for (const [prerequisiteIndex, prerequisite] of version.prerequisites.entries()) {
      if (!courseVersionIds.has(prerequisite.courseVersionId)) {
        add(
          "missing_reference",
          `courseVersions[${index}].prerequisites[${prerequisiteIndex}]`,
          `Unknown course version ${prerequisite.courseVersionId}.`,
        );
      }
    }
    for (const [resourceIndex, reference] of version.resourceReferences.entries()) {
      if (!resourceVersionIds.has(reference.resourceVersionId)) {
        add(
          "missing_reference",
          `courseVersions[${index}].resourceReferences[${resourceIndex}]`,
          `Unknown resource version ${reference.resourceVersionId}.`,
        );
      }
    }
    for (const [unitIndex, unitId] of version.rootUnitIds.entries()) {
      const unit = bundle.learningUnits.find((candidate) => candidate.id === unitId);
      if (!unit || unit.courseVersionId !== version.id || unit.parentUnitId) {
        add(
          "missing_reference",
          `courseVersions[${index}].rootUnitIds[${unitIndex}]`,
          "Root unit must exist in this course version and have no parent.",
        );
      }
    }

    const contributions = version.gradingPolicy.contributions;
    const weight = contributions.reduce(
      (sum, contribution) => sum + contribution.weight,
      0,
    );
    if (
      contributions.length === 0 ||
      Math.abs(weight - 100) > WEIGHT_TOLERANCE ||
      contributions.some(
        (contribution) => contribution.weight <= 0 || contribution.weight > 100,
      )
    ) {
      add(
        "invalid_assessment_weights",
        `courseVersions[${index}].gradingPolicy.contributions`,
        `Assessment weights must be positive and total 100; received ${weight}.`,
      );
    }
    if (
      version.gradingPolicy.passingPercentage < 0 ||
      version.gradingPolicy.passingPercentage > 100
    ) {
      add(
        "invalid_value",
        `courseVersions[${index}].gradingPolicy.passingPercentage`,
        "Passing percentage must be between 0 and 100.",
      );
    }
    for (const [contributionIndex, contribution] of contributions.entries()) {
      const assessmentVersion = bundle.assessmentVersions.find(
        (candidate) => candidate.id === contribution.assessmentVersionId,
      );
      if (!assessmentVersion || assessmentVersion.courseVersionId !== version.id) {
        add(
          "missing_reference",
          `courseVersions[${index}].gradingPolicy.contributions[${contributionIndex}]`,
          "Grading contributions must reference an assessment in the same course version.",
        );
      }
    }
  });

  const requiredPrerequisites = new Map<CourseVersionId, CourseVersionId[]>();
  for (const version of bundle.courseVersions) {
    requiredPrerequisites.set(
      version.id,
      version.prerequisites
        .filter((prerequisite) => prerequisite.kind === "required")
        .map((prerequisite) => prerequisite.courseVersionId),
    );
  }
  const prerequisiteCycles = findDirectedCycles(
    [...courseVersionIds],
    (node) =>
      requiredPrerequisites.get(node as CourseVersionId)?.filter((target) =>
        courseVersionIds.has(target),
      ) ?? [],
  );
  for (const cycle of prerequisiteCycles) {
    add(
      "prerequisite_cycle",
      "courseVersions",
      `Required prerequisite cycle: ${cycle.join(" → ")}.`,
    );
  }

  bundle.learningUnits.forEach((unit, index) => {
    if (!courseVersionIds.has(unit.courseVersionId)) {
      add(
        "missing_reference",
        `learningUnits[${index}].courseVersionId`,
        `Unknown course version ${unit.courseVersionId}.`,
      );
    }
    if (unit.parentUnitId) {
      const parent = bundle.learningUnits.find(
        (candidate) => candidate.id === unit.parentUnitId,
      );
      if (!parent || parent.courseVersionId !== unit.courseVersionId) {
        add(
          "missing_reference",
          `learningUnits[${index}].parentUnitId`,
          "Parent unit must exist in the same course version.",
        );
      }
    }
    if (unit.nominalHours < 0) {
      add(
        "invalid_value",
        `learningUnits[${index}].nominalHours`,
        "Nominal hours cannot be negative.",
      );
    }
    for (const [resourceIndex, resourceVersionId] of unit.resourceVersionIds.entries()) {
      if (!resourceVersionIds.has(resourceVersionId)) {
        add(
          "missing_reference",
          `learningUnits[${index}].resourceVersionIds[${resourceIndex}]`,
          `Unknown resource version ${resourceVersionId}.`,
        );
      }
    }
  });

  const childUnits = new Map<LearningUnitId, LearningUnitId[]>();
  for (const unit of bundle.learningUnits) {
    if (unit.parentUnitId) {
      const children = childUnits.get(unit.id) ?? [];
      children.push(unit.parentUnitId);
      childUnits.set(unit.id, children);
    }
  }
  for (const cycle of findDirectedCycles(
    [...learningUnitIds],
    (node) => childUnits.get(node as LearningUnitId) ?? [],
  )) {
    add("unit_cycle", "learningUnits", `Learning-unit cycle: ${cycle.join(" → ")}.`);
  }

  bundle.assessments.forEach((assessment, index) => {
    if (!courseIds.has(assessment.courseId)) {
      add(
        "missing_reference",
        `assessments[${index}].courseId`,
        `Unknown course ${assessment.courseId}.`,
      );
    }
  });
  bundle.assessmentVersions.forEach((version, index) => {
    const assessment = bundle.assessments.find(
      (candidate) => candidate.id === version.assessmentId,
    );
    const courseVersion = bundle.courseVersions.find(
      (candidate) => candidate.id === version.courseVersionId,
    );
    if (!assessment) {
      add(
        "missing_reference",
        `assessmentVersions[${index}].assessmentId`,
        `Unknown assessment ${version.assessmentId}.`,
      );
    }
    if (!courseVersion) {
      add(
        "missing_reference",
        `assessmentVersions[${index}].courseVersionId`,
        `Unknown course version ${version.courseVersionId}.`,
      );
    }
    if (assessment && courseVersion && assessment.courseId !== courseVersion.courseId) {
      add(
        "missing_reference",
        `assessmentVersions[${index}]`,
        "Assessment and course version belong to different courses.",
      );
    }
    if (version.unitId) {
      const unit = bundle.learningUnits.find((candidate) => candidate.id === version.unitId);
      if (!unit || unit.courseVersionId !== version.courseVersionId) {
        add(
          "missing_reference",
          `assessmentVersions[${index}].unitId`,
          "Assessment unit must belong to the same course version.",
        );
      }
    }
    if (version.maximumScore <= 0 || version.estimatedHours < 0) {
      add(
        "invalid_value",
        `assessmentVersions[${index}]`,
        "Maximum score must be positive and estimated hours cannot be negative.",
      );
    }
    for (const [resourceIndex, resourceVersionId] of version.resourceVersionIds.entries()) {
      if (!resourceVersionIds.has(resourceVersionId)) {
        add(
          "missing_reference",
          `assessmentVersions[${index}].resourceVersionIds[${resourceIndex}]`,
          `Unknown resource version ${resourceVersionId}.`,
        );
      }
    }
  });

  bundle.programVersion.requirements.forEach((group, groupIndex) => {
    const path = `programVersion.requirements[${groupIndex}]`;
    if (
      !Number.isInteger(group.rule.minSelections) ||
      group.rule.minSelections < 0 ||
      group.rule.minSelections > group.options.length
    ) {
      add(
        "unsatisfiable_requirement",
        `${path}.rule.minSelections`,
        "Minimum selections must be a non-negative integer no greater than available options.",
      );
    }
    if (
      group.rule.maxSelections !== undefined &&
      (!Number.isInteger(group.rule.maxSelections) ||
        group.rule.maxSelections < group.rule.minSelections)
    ) {
      add(
        "unsatisfiable_requirement",
        `${path}.rule.maxSelections`,
        "Maximum selections must be an integer at least as large as the minimum.",
      );
    }
    if (group.options.length === 0) {
      add(
        "unsatisfiable_requirement",
        `${path}.options`,
        "Published requirement groups must contain at least one option.",
      );
    }
    if (
      group.rule.selectionConstraint === "same concentration" &&
      group.options.some((option) => !option.concentrationId)
    ) {
      add(
        "unsatisfiable_requirement",
        `${path}.rule.selectionConstraint`,
        "Every option needs a concentration when same-concentration selection is required.",
      );
    }
    for (const [optionIndex, option] of group.options.entries()) {
      if (!courseVersionIds.has(option.courseVersionId)) {
        add(
          "missing_reference",
          `${path}.options[${optionIndex}].courseVersionId`,
          `Unknown course version ${option.courseVersionId}.`,
        );
      }
      if (option.credits.value < 0) {
        add(
          "invalid_value",
          `${path}.options[${optionIndex}].credits.value`,
          "Credits cannot be negative.",
        );
      }
      if (
        option.concentrationId &&
        !concentrationIds.has(option.concentrationId)
      ) {
        add(
          "missing_reference",
          `${path}.options[${optionIndex}].concentrationId`,
          `Unknown concentration ${option.concentrationId}.`,
        );
      }
      if (option.recommendedPeriodId && !periodIds.has(option.recommendedPeriodId)) {
        add(
          "missing_reference",
          `${path}.options[${optionIndex}].recommendedPeriodId`,
          `Unknown calendar period ${option.recommendedPeriodId}.`,
        );
      }
    }
    if (group.rule.minCredits) {
      const eligible = group.options
        .filter((option) => option.credits.system === group.rule.minCredits?.system)
        .sort((a, b) => b.credits.value - a.credits.value);
      const selectionLimit = group.rule.maxSelections ?? eligible.length;
      const attainable = eligible
        .slice(0, selectionLimit)
        .reduce((sum, option) => sum + option.credits.value, 0);
      if (group.rule.minCredits.value < 0 || attainable < group.rule.minCredits.value) {
        add(
          "unsatisfiable_requirement",
          `${path}.rule.minCredits`,
          `Credit minimum cannot be reached; maximum attainable is ${attainable} ${group.rule.minCredits.system}.`,
        );
      }
    }
  });

  const exclusiveOptionOwner = new Map<CourseVersionId, string>();
  bundle.programVersion.requirements.forEach((group, groupIndex) => {
    if (group.allowSharedCourseCounting) return;
    group.options.forEach((option, optionIndex) => {
      const owner = exclusiveOptionOwner.get(option.courseVersionId);
      const path = `programVersion.requirements[${groupIndex}].options[${optionIndex}]`;
      if (owner) {
        add(
          "ambiguous_requirement",
          path,
          `Course is already an exclusive option at ${owner}; opt in to shared counting explicitly.`,
        );
      } else {
        exclusiveOptionOwner.set(option.courseVersionId, path);
      }
    });
  });

  const competencyReference = (id: string, path: string) => {
    if (!competencyIds.has(id as never)) {
      add("missing_reference", path, `Unknown competency ${id}.`);
    }
  };
  bundle.programVersion.concentrationIds.forEach((id, index) => {
    if (!concentrationIds.has(id)) {
      add(
        "missing_reference",
        `programVersion.concentrationIds[${index}]`,
        `Unknown concentration ${id}.`,
      );
    }
  });
  bundle.concentrations.forEach((concentration, concentrationIndex) => {
    concentration.courseVersionIds.forEach((id, courseIndex) => {
      if (!courseVersionIds.has(id)) {
        add(
          "missing_reference",
          `concentrations[${concentrationIndex}].courseVersionIds[${courseIndex}]`,
          `Unknown course version ${id}.`,
        );
      }
    });
  });
  bundle.programVersion.competencyIds.forEach((id, index) =>
    competencyReference(id, `programVersion.competencyIds[${index}]`),
  );
  bundle.courseVersions.forEach((version, versionIndex) =>
    version.competencyIds.forEach((id, index) =>
      competencyReference(id, `courseVersions[${versionIndex}].competencyIds[${index}]`),
    ),
  );
  bundle.learningUnits.forEach((unit, unitIndex) =>
    unit.competencyIds.forEach((id, index) =>
      competencyReference(id, `learningUnits[${unitIndex}].competencyIds[${index}]`),
    ),
  );
  bundle.assessmentVersions.forEach((version, versionIndex) =>
    version.competencyIds.forEach((id, index) =>
      competencyReference(
        id,
        `assessmentVersions[${versionIndex}].competencyIds[${index}]`,
      ),
    ),
  );
  bundle.competencyMappings.forEach((mapping, index) => {
    competencyReference(mapping.competencyId, `competencyMappings[${index}].competencyId`);
    if (
      !competencySubjectExists(mapping.subject, {
        programVersions: new Set([bundle.programVersion.id]),
        courseVersions: courseVersionIds,
        learningUnits: learningUnitIds,
        assessmentVersions: assessmentVersionIds,
      })
    ) {
      add(
        "missing_reference",
        `competencyMappings[${index}].subject`,
        `Unknown ${mapping.subject.kind} ${mapping.subject.id}.`,
      );
    }
  });

  bundle.resourceVersions.forEach((version, index) => {
    if (!resourceIds.has(version.resourceId)) {
      add(
        "missing_reference",
        `resourceVersions[${index}].resourceId`,
        `Unknown resource ${version.resourceId}.`,
      );
    }
    try {
      new URL(version.canonicalUrl);
    } catch {
      add(
        "invalid_value",
        `resourceVersions[${index}].canonicalUrl`,
        `"${version.canonicalUrl}" is not an absolute URL.`,
      );
    }
  });

  const resourceFactReferences: readonly [
    string,
    readonly { readonly resourceVersionId: ResourceVersionId }[],
  ][] = [
    ["accessOffers", bundle.accessOffers],
    ["rights", bundle.rights],
    ["freshness", bundle.freshness],
  ];
  for (const [field, records] of resourceFactReferences) {
    records.forEach((record, index) => {
      if (!resourceVersionIds.has(record.resourceVersionId)) {
        add(
          "missing_reference",
          `${field}[${index}].resourceVersionId`,
          `Unknown resource version ${record.resourceVersionId}.`,
        );
      }
    });
    for (const resourceVersionId of resourceVersionIds) {
      if (!records.some((record) => record.resourceVersionId === resourceVersionId)) {
        add(
          "missing_resource_fact",
          field,
          `Resource version ${resourceVersionId} needs at least one ${field} record.`,
        );
      }
    }
  }

  bundle.rights.forEach((record, index) => {
    if (
      record.mayMirror &&
      record.status !== "open" &&
      record.status !== "permission granted"
    ) {
      add(
        "invalid_value",
        `rights[${index}].mayMirror`,
        "Mirroring requires open rights or recorded permission.",
      );
    }
    record.evidenceIds.forEach((evidenceId, evidenceIndex) => {
      if (!evidenceIds.has(evidenceId)) {
        add(
          "missing_reference",
          `rights[${index}].evidenceIds[${evidenceIndex}]`,
          `Unknown provenance evidence ${evidenceId}.`,
        );
      }
    });
  });

  const evidenceReferences: readonly [
    string,
    readonly { readonly provenanceEvidenceIds: readonly string[] }[],
  ][] = [
    ["programVersion", [bundle.programVersion]],
    ["courseVersions", bundle.courseVersions],
    ["assessmentVersions", bundle.assessmentVersions],
    ["resourceVersions", bundle.resourceVersions],
  ];
  for (const [field, records] of evidenceReferences) {
    records.forEach((record, recordIndex) =>
      record.provenanceEvidenceIds.forEach((evidenceId, evidenceIndex) => {
        if (!evidenceIds.has(evidenceId as never)) {
          add(
            "missing_reference",
            `${field}[${recordIndex}].provenanceEvidenceIds[${evidenceIndex}]`,
            `Unknown provenance evidence ${evidenceId}.`,
          );
        }
      }),
    );
  }

  bundle.provenance.forEach((evidence, evidenceIndex) => {
    try {
      new URL(evidence.sourceUrl);
    } catch {
      add(
        "invalid_value",
        `provenance[${evidenceIndex}].sourceUrl`,
        `"${evidence.sourceUrl}" is not an absolute URL.`,
      );
    }
    evidence.subjects.forEach((subject, subjectIndex) => {
      if (
        !evidenceSubjectExists(subject, {
          programVersions: new Set([bundle.programVersion.id]),
          courseVersions: courseVersionIds,
          assessmentVersions: assessmentVersionIds,
          competencies: competencyIds,
          resourceVersions: resourceVersionIds,
          rights: rightsIds,
          accessOffers: accessOfferIds,
        })
      ) {
        add(
          "missing_reference",
          `provenance[${evidenceIndex}].subjects[${subjectIndex}]`,
          `Unknown ${subject.kind} ${subject.id}.`,
        );
      }
    });
  });

  bundle.calendars.forEach((calendar, calendarIndex) => {
    collectDuplicateValues(
      calendar.periods.map(
        (period, periodIndex) =>
          [String(period.order), `calendars[${calendarIndex}].periods[${periodIndex}]`] as const,
      ),
      (path, previous) =>
        add("invalid_value", path, `Period order is already used at ${previous}.`),
    );
    calendar.milestones.forEach((milestone, milestoneIndex) => {
      if (milestone.periodId && !periodIds.has(milestone.periodId)) {
        add(
          "missing_reference",
          `calendars[${calendarIndex}].milestones[${milestoneIndex}].periodId`,
          `Unknown calendar period ${milestone.periodId}.`,
        );
      }
    });
  });

  bundle.schedules.forEach((schedule, scheduleIndex) => {
    if (schedule.programVersionId !== bundle.programVersion.id) {
      add(
        "missing_reference",
        `schedules[${scheduleIndex}].programVersionId`,
        "Schedule must reference this bundle's program version.",
      );
    }
    if (!calendarIds.has(schedule.calendarId)) {
      add(
        "missing_reference",
        `schedules[${scheduleIndex}].calendarId`,
        `Unknown calendar ${schedule.calendarId}.`,
      );
    }
    const scheduleCalendar = bundle.calendars.find(
      (calendar) => calendar.id === schedule.calendarId,
    );
    const schedulePeriodIds = new Set(
      scheduleCalendar?.periods.map((period) => period.id) ?? [],
    );
    schedule.placements.forEach((placement, placementIndex) => {
      const path = `schedules[${scheduleIndex}].placements[${placementIndex}]`;
      if (
        !scheduledSubjectExists(placement.subject, {
          courseVersions: courseVersionIds,
          learningUnits: learningUnitIds,
          assessmentVersions: assessmentVersionIds,
        })
      ) {
        add(
          "missing_reference",
          `${path}.subject`,
          `Unknown ${placement.subject.kind} ${placement.subject.id}.`,
        );
      }
      if (placement.periodId && !schedulePeriodIds.has(placement.periodId)) {
        add(
          "missing_reference",
          `${path}.periodId`,
          `Period ${placement.periodId} is not in the schedule's calendar.`,
        );
      }
    });
  });

  return { valid: issues.length === 0, issues };
}

/**
 * Cross-bundle rules. Different versions of one program may reuse its slug;
 * different stable programs may not.
 */
export function validateCatalogBundles(
  bundles: readonly PublishedProgramBundle[],
): ValidationResult {
  const issues: ValidationIssue[] = [];
  bundles.forEach((bundle, index) => {
    const result = validatePublishedProgramBundle(bundle);
    issues.push(
      ...result.issues.map((issue) => ({
        ...issue,
        path: `bundles[${index}].${issue.path}`,
      })),
    );
  });

  const slugOwners = new Map<string, string>();
  const versionKeys = new Set<string>();
  bundles.forEach((bundle, index) => {
    const slug = bundle.program.canonicalSlug;
    const owner = slugOwners.get(slug);
    if (owner && owner !== bundle.program.id) {
      issues.push({
        code: "duplicate_slug",
        path: `bundles[${index}].program.canonicalSlug`,
        message: `Program slug "${slug}" belongs to both ${owner} and ${bundle.program.id}.`,
      });
    } else {
      slugOwners.set(slug, bundle.program.id);
    }

    const versionKey = `${bundle.program.id}@${bundle.programVersion.version}`;
    if (versionKeys.has(versionKey)) {
      issues.push({
        code: "duplicate_id",
        path: `bundles[${index}].programVersion.version`,
        message: `Program version ${versionKey} is registered more than once.`,
      });
    }
    versionKeys.add(versionKey);
  });

  const identityOwners = new Map<
    string,
    { readonly path: string; readonly canonicalValue: string }
  >();
  bundles.forEach((bundle, bundleIndex) => {
    for (const entry of catalogIdentityEntries(bundle, bundleIndex)) {
      const canonicalValue = canonicalIdentityValue(entry.value);
      const existing = identityOwners.get(entry.id);
      if (!existing) {
        identityOwners.set(entry.id, { path: entry.path, canonicalValue });
        continue;
      }
      if (existing.canonicalValue !== canonicalValue) {
        issues.push({
          code: "duplicate_id",
          path: entry.path,
          message: `Identity ${entry.id} conflicts with the definition at ${existing.path}. Reused catalog identities must be byte-equivalent after canonicalization.`,
        });
      }
    }
  });

  return { valid: issues.length === 0, issues };
}

export function assertValidPublishedProgramBundle(bundle: PublishedProgramBundle) {
  const result = validatePublishedProgramBundle(bundle);
  if (!result.valid) {
    const details = result.issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid published program bundle:\n${details}`);
  }
  return bundle;
}
