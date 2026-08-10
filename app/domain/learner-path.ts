import type {
  AcademicCalendar,
  CalendarPeriodId,
  ConcentrationId,
  CourseVersionId,
  LearningUnitId,
  ProgramRequirementEvaluation,
  ProgramSchedule,
  PublishedAssessmentVersion,
  PublishedCourseVersion,
  PublishedProgramBundle,
  RequirementGroup,
  RequirementGroupId,
  RequirementOption,
  SchedulePlacement,
} from "./catalog";
import { evaluateProgramRequirements } from "./validation";

export interface LearnerPathSelection {
  readonly selectedConcentrationId?: string | null;
  readonly selectedCourseVersionIds?: readonly string[];
}

export type LearnerPathDiagnosticCode =
  | "defaulted_concentration"
  | "invalid_concentration"
  | "unknown_course_selection"
  | "ignored_course_selection"
  | "unsatisfied_requirement"
  | "missing_required_prerequisite"
  | "missing_schedule"
  | "missing_calendar"
  | "unscheduled_course";

export interface LearnerPathDiagnostic {
  readonly code: LearnerPathDiagnosticCode;
  readonly severity: "info" | "warning" | "error";
  readonly message: string;
  readonly requirementGroupId?: RequirementGroupId;
  readonly courseVersionId?: CourseVersionId;
}

export interface LearnerPathRequirementSelection {
  readonly requirementGroupId: RequirementGroupId;
  readonly courseVersionIds: readonly CourseVersionId[];
}

export interface ResolvedLearnerPath {
  readonly isResolved: boolean;
  readonly selectedConcentrationId?: ConcentrationId;
  readonly selectedCourseVersionIds: readonly CourseVersionId[];
  readonly selectedCourseVersionIdSet: ReadonlySet<CourseVersionId>;
  readonly requirementSelections: readonly LearnerPathRequirementSelection[];
  readonly courseVersions: readonly PublishedCourseVersion[];
  readonly learningUnits: PublishedProgramBundle["learningUnits"];
  readonly assessmentVersions: readonly PublishedAssessmentVersion[];
  readonly schedule?: ProgramSchedule;
  readonly calendar?: AcademicCalendar;
  readonly placements: readonly SchedulePlacement[];
  readonly coursePeriodIdByCourseVersionId: ReadonlyMap<
    CourseVersionId,
    CalendarPeriodId
  >;
  readonly learningUnitPeriodIdByLearningUnitId: ReadonlyMap<
    LearningUnitId,
    CalendarPeriodId
  >;
  readonly requirementEvaluation: ProgramRequirementEvaluation;
  readonly totals: {
    readonly courseCount: number;
    readonly learningUnitCount: number;
    readonly assessmentCount: number;
    readonly nominalHours: number;
  };
  readonly diagnostics: readonly LearnerPathDiagnostic[];
}

/**
 * Audits passed courses against the exact pathway selected by the resolver.
 * Historical or off-path work can remain in the learner record, but it cannot
 * satisfy the completion claim for a different concentration or elective set.
 */
export function evaluateLearnerPathCompletion(
  bundle: PublishedProgramBundle,
  learnerPath: ResolvedLearnerPath,
  passedCourseVersionIds: ReadonlySet<CourseVersionId>,
): ProgramRequirementEvaluation {
  const passedOnSelectedPath = new Set(
    [...passedCourseVersionIds].filter((courseVersionId) =>
      learnerPath.selectedCourseVersionIdSet.has(courseVersionId),
    ),
  );
  return evaluateProgramRequirements(bundle, passedOnSelectedPath);
}

function creditsSatisfied(
  group: RequirementGroup,
  options: readonly RequirementOption[],
) {
  const minimum = group.rule.minCredits;
  if (!minimum) return true;
  return (
    options
      .filter((option) => option.credits.system === minimum.system)
      .reduce((total, option) => total + option.credits.value, 0) >=
    minimum.value
  );
}

function selectionSatisfied(
  group: RequirementGroup,
  options: readonly RequirementOption[],
) {
  return (
    options.length >= group.rule.minSelections &&
    creditsSatisfied(group, options)
  );
}

function canResolveFromOptions(
  group: RequirementGroup,
  options: readonly RequirementOption[],
) {
  const limit = Math.min(
    group.rule.maxSelections ?? options.length,
    options.length,
  );
  if (limit < group.rule.minSelections) return false;

  const minimum = group.rule.minCredits;
  if (!minimum) return true;
  const attainableCredits = options
    .filter((option) => option.credits.system === minimum.system)
    .sort((left, right) => right.credits.value - left.credits.value)
    .slice(0, limit)
    .reduce((total, option) => total + option.credits.value, 0);
  return attainableCredits >= minimum.value;
}

function selectRequirementOptions(
  group: RequirementGroup,
  eligibleOptions: readonly RequirementOption[],
  explicitlySelectedIds: ReadonlySet<CourseVersionId>,
  diagnostics: LearnerPathDiagnostic[],
) {
  const limit = group.rule.maxSelections ?? eligibleOptions.length;
  const preferred = eligibleOptions.filter((option) =>
    explicitlySelectedIds.has(option.courseVersionId),
  );
  if (preferred.length > limit) {
    diagnostics.push({
      code: "ignored_course_selection",
      severity: "warning",
      requirementGroupId: group.id,
      message: `${preferred.length - limit} selected course(s) exceed the counting limit for ${group.title}.`,
    });
  }

  const selected = preferred.slice(0, limit);
  while (selected.length < limit && !selectionSatisfied(group, selected)) {
    const candidates = eligibleOptions.filter(
      (option) => !selected.some((candidate) => candidate.id === option.id),
    );
    if (candidates.length === 0) break;

    const minimum = group.rule.minCredits;
    const needsCredits = minimum && !creditsSatisfied(group, selected);
    const option = needsCredits
      ? [...candidates].sort((left, right) => {
          const leftCredits =
            left.credits.system === minimum.system ? left.credits.value : 0;
          const rightCredits =
            right.credits.system === minimum.system ? right.credits.value : 0;
          return rightCredits - leftCredits;
        })[0]
      : candidates[0];
    if (!option) break;
    selected.push(option);
  }

  return sortRequirementOptions(selected, eligibleOptions);
}

function sortRequirementOptions(
  selected: readonly RequirementOption[],
  eligibleOptions: readonly RequirementOption[],
) {
  const optionOrder = new Map(
    eligibleOptions.map((option, index) => [option.id, index]),
  );
  return [...selected].sort(
    (left, right) =>
      (optionOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (optionOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

function defaultConcentration(
  bundle: PublishedProgramBundle,
  coherentGroups: readonly RequirementGroup[],
  explicitSelections: ReadonlySet<CourseVersionId>,
) {
  const exposedConcentrationIds = new Set(
    bundle.programVersion.concentrationIds,
  );
  const explicitConcentrationIds = new Set(
    coherentGroups.flatMap((group) =>
      group.options
        .filter((option) =>
          explicitSelections.has(option.courseVersionId),
        )
        .map((option) => option.concentrationId)
        .filter(
          (id): id is ConcentrationId =>
            id !== undefined && exposedConcentrationIds.has(id),
        ),
    ),
  );
  const orderedIds = bundle.programVersion.concentrationIds.filter((id) =>
    bundle.concentrations.some((concentration) => concentration.id === id),
  );
  const candidates =
    explicitConcentrationIds.size === 1
      ? [
          ...explicitConcentrationIds,
          ...orderedIds.filter((id) => !explicitConcentrationIds.has(id)),
        ]
      : orderedIds;

  return candidates.find((concentrationId) =>
    coherentGroups.every((group) =>
      canResolveFromOptions(
        group,
        group.options.filter(
          (option) => option.concentrationId === concentrationId,
        ),
      ),
    ),
  );
}

/**
 * Resolves one deterministic, minimum valid program pathway. All learner
 * surfaces consume this projection so optional alternatives cannot leak into
 * totals, schedules, prerequisite state, or records.
 */
export function resolveLearnerPath(
  bundle: PublishedProgramBundle,
  selection: LearnerPathSelection = {},
): ResolvedLearnerPath {
  const diagnostics: LearnerPathDiagnostic[] = [];
  const courseVersionById = new Map(
    bundle.courseVersions.map((courseVersion) => [
      courseVersion.id,
      courseVersion,
    ]),
  );
  const explicitSelections = new Set<CourseVersionId>();
  for (const id of selection.selectedCourseVersionIds ?? []) {
    if (courseVersionById.has(id as CourseVersionId)) {
      explicitSelections.add(id as CourseVersionId);
    } else {
      diagnostics.push({
        code: "unknown_course_selection",
        severity: "warning",
        message: `Selected course version ${id} is not part of this publication.`,
      });
    }
  }

  const coherentGroups = bundle.programVersion.requirements.filter(
    (group) => group.rule.selectionConstraint === "same concentration",
  );
  const exposedConcentrationIds = new Set(
    bundle.programVersion.concentrationIds,
  );
  let selectedConcentrationId = bundle.concentrations.find(
    (concentration) =>
      concentration.id === selection.selectedConcentrationId &&
      exposedConcentrationIds.has(concentration.id),
  )?.id;

  if (selection.selectedConcentrationId && !selectedConcentrationId) {
    diagnostics.push({
      code: "invalid_concentration",
      severity: "warning",
      message: `Concentration ${selection.selectedConcentrationId} is not part of this publication; the default valid path was used.`,
    });
  }
  if (!selectedConcentrationId && coherentGroups.length > 0) {
    selectedConcentrationId = defaultConcentration(
      bundle,
      coherentGroups,
      explicitSelections,
    );
    if (selectedConcentrationId) {
      diagnostics.push({
        code: "defaulted_concentration",
        severity: "info",
        message: "No valid concentration was selected, so the first complete concentration path was used.",
      });
    }
  }

  const orderedRequirementGroups = [
    ...bundle.programVersion.requirements,
  ].sort((left, right) => left.order - right.order);
  const eligibleOptionsByGroup = new Map<
    RequirementGroupId,
    readonly RequirementOption[]
  >();
  const selectedOptionsByGroup = new Map<
    RequirementGroupId,
    RequirementOption[]
  >();
  for (const group of orderedRequirementGroups) {
    const eligibleOptions =
      group.rule.selectionConstraint === "same concentration"
        ? group.options.filter(
            (option) => option.concentrationId === selectedConcentrationId,
          )
        : group.options;
    eligibleOptionsByGroup.set(group.id, eligibleOptions);
    selectedOptionsByGroup.set(
      group.id,
      selectRequirementOptions(
        group,
        eligibleOptions,
        explicitSelections,
        diagnostics,
      ),
    );
  }

  const selectedRequirementCourseIds = () =>
    new Set<CourseVersionId>(
      orderedRequirementGroups.flatMap((group) =>
        (selectedOptionsByGroup.get(group.id) ?? []).map(
          (option) => option.courseVersionId,
        ),
      ),
    );

  // Repair deterministic defaults around required prerequisites. This keeps
  // an explicit learner choice, but may replace an automatically selected
  // alternative with its prerequisite when the same requirement can still be
  // satisfied. It avoids rejecting an otherwise valid elective pathway merely
  // because a dependent option appeared first in publication order.
  for (let attempt = 0; attempt < bundle.courseVersions.length; attempt += 1) {
    const selectedIds = selectedRequirementCourseIds();
    let repaired = false;

    repair: for (const courseVersionId of selectedIds) {
      const courseVersion = courseVersionById.get(courseVersionId);
      for (const prerequisite of courseVersion?.prerequisites ?? []) {
        if (
          prerequisite.kind !== "required" ||
          selectedIds.has(prerequisite.courseVersionId)
        ) {
          continue;
        }

        for (const group of orderedRequirementGroups) {
          const eligibleOptions = eligibleOptionsByGroup.get(group.id) ?? [];
          const prerequisiteOption = eligibleOptions.find(
            (option) =>
              option.courseVersionId === prerequisite.courseVersionId,
          );
          if (!prerequisiteOption) continue;

          const selectedOptions = selectedOptionsByGroup.get(group.id) ?? [];
          const limit = group.rule.maxSelections ?? eligibleOptions.length;
          const removableOptions = [
            ...selectedOptions.filter(
              (option) =>
                option.courseVersionId === courseVersionId &&
                !explicitSelections.has(option.courseVersionId),
            ),
            ...[...selectedOptions]
              .reverse()
              .filter(
                (option) =>
                  option.courseVersionId !== courseVersionId &&
                  !explicitSelections.has(option.courseVersionId),
              ),
          ];
          for (const removable of removableOptions) {
            const replacement = sortRequirementOptions(
              [
                ...selectedOptions.filter(
                  (option) => option.id !== removable.id,
                ),
                prerequisiteOption,
              ],
              eligibleOptions,
            );
            if (selectionSatisfied(group, replacement)) {
              selectedOptionsByGroup.set(group.id, replacement);
              repaired = true;
              break repair;
            }
          }
          if (selectedOptions.length < limit) {
            selectedOptionsByGroup.set(
              group.id,
              sortRequirementOptions(
                [...selectedOptions, prerequisiteOption],
                eligibleOptions,
              ),
            );
            repaired = true;
            break repair;
          }
        }
      }
    }

    if (!repaired) break;
  }

  const requirementSelections = orderedRequirementGroups.map(
    (group): LearnerPathRequirementSelection => {
      const selected = selectedOptionsByGroup.get(group.id) ?? [];
      if (!selectionSatisfied(group, selected)) {
        diagnostics.push({
          code: "unsatisfied_requirement",
          severity: "error",
          requirementGroupId: group.id,
          message: `${group.title} cannot be satisfied by the selected pathway.`,
        });
      }
      return {
        requirementGroupId: group.id,
        courseVersionIds: selected.map(
          (option) => option.courseVersionId,
        ),
      };
    },
  );

  const requirementOrder = requirementSelections.flatMap(
    (group) => group.courseVersionIds,
  );
  const requirementIds = new Set(requirementOrder);
  for (const courseVersionId of explicitSelections) {
    if (!requirementIds.has(courseVersionId)) {
      diagnostics.push({
        code: "ignored_course_selection",
        severity: "warning",
        courseVersionId,
        message: `Selected course version ${courseVersionId} does not belong to the resolved pathway.`,
      });
    }
  }
  const schedule =
    bundle.schedules.find(
      (candidate) => candidate.id === bundle.programVersion.defaultScheduleId,
    ) ??
    bundle.schedules.find(
      (candidate) =>
        candidate.programVersionId === bundle.programVersion.id,
    ) ??
    bundle.schedules[0];
  if (!schedule) {
    diagnostics.push({
      code: "missing_schedule",
      severity: "warning",
      message: "This publication has no schedule; requirement order was used.",
    });
  }
  const calendar = schedule
    ? bundle.calendars.find(
        (candidate) => candidate.id === schedule.calendarId,
      ) ?? bundle.calendars[0]
    : bundle.calendars[0];
  if (schedule && !calendar) {
    diagnostics.push({
      code: "missing_calendar",
      severity: "warning",
      message: "The selected schedule has no readable calendar.",
    });
  }

  const periodOrder = new Map(
    (calendar?.periods ?? []).map((period) => [period.id, period.order]),
  );
  const sortedPlacements = [...(schedule?.placements ?? [])].sort(
    (left, right) =>
      (left.periodId ? periodOrder.get(left.periodId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER) -
        (right.periodId ? periodOrder.get(right.periodId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER) ||
      left.order - right.order,
  );
  const selectedCourseVersionIdSet = new Set(requirementOrder);
  const learningUnitCourseVersionById = new Map(
    bundle.learningUnits.map((unit) => [unit.id, unit.courseVersionId]),
  );
  const assessmentCourseVersionById = new Map(
    bundle.assessmentVersions.map((assessment) => [
      assessment.id,
      assessment.courseVersionId,
    ]),
  );
  const courseVersionIdForPlacement = (placement: SchedulePlacement) => {
    if (placement.subject.kind === "courseVersion") {
      return placement.subject.id;
    }
    if (placement.subject.kind === "learningUnit") {
      return learningUnitCourseVersionById.get(placement.subject.id);
    }
    return assessmentCourseVersionById.get(placement.subject.id);
  };
  const coursePeriodIdByCourseVersionId = new Map<
    CourseVersionId,
    CalendarPeriodId
  >();
  const learningUnitPeriodIdByLearningUnitId = new Map<
    LearningUnitId,
    CalendarPeriodId
  >();

  // A direct course placement is authoritative. Unit and assessment
  // placements then provide a course-period fallback for schedules that use
  // finer-grained subjects instead of placing the course itself.
  for (const placement of sortedPlacements) {
    if (
      placement.subject.kind !== "courseVersion" ||
      !placement.periodId ||
      !periodOrder.has(placement.periodId) ||
      !selectedCourseVersionIdSet.has(placement.subject.id) ||
      coursePeriodIdByCourseVersionId.has(placement.subject.id)
    ) {
      continue;
    }
    coursePeriodIdByCourseVersionId.set(
      placement.subject.id,
      placement.periodId,
    );
  }
  for (const placement of sortedPlacements) {
    if (!placement.periodId || !periodOrder.has(placement.periodId)) continue;
    const courseVersionId = courseVersionIdForPlacement(placement);
    if (
      !courseVersionId ||
      !selectedCourseVersionIdSet.has(courseVersionId)
    ) {
      continue;
    }
    if (placement.subject.kind === "learningUnit") {
      learningUnitPeriodIdByLearningUnitId.set(
        placement.subject.id,
        placement.periodId,
      );
    }
    if (!coursePeriodIdByCourseVersionId.has(courseVersionId)) {
      coursePeriodIdByCourseVersionId.set(
        courseVersionId,
        placement.periodId,
      );
    }
  }
  for (const group of orderedRequirementGroups) {
    for (const option of selectedOptionsByGroup.get(group.id) ?? []) {
      if (
        option.recommendedPeriodId &&
        periodOrder.has(option.recommendedPeriodId) &&
        !coursePeriodIdByCourseVersionId.has(option.courseVersionId)
      ) {
        coursePeriodIdByCourseVersionId.set(
          option.courseVersionId,
          option.recommendedPeriodId,
        );
      }
    }
  }

  if (schedule && calendar && calendar.periods.length > 0) {
    for (const courseVersionId of selectedCourseVersionIdSet) {
      if (!coursePeriodIdByCourseVersionId.has(courseVersionId)) {
        diagnostics.push({
          code: "unscheduled_course",
          severity: "error",
          courseVersionId,
          message: `${courseVersionById.get(courseVersionId)?.title ?? courseVersionId} has no period in the selected schedule.`,
        });
      }
    }
  }

  const requirementIndex = new Map(
    [...new Set(requirementOrder)].map((id, index) => [id, index]),
  );
  const firstPlacementIndex = new Map<CourseVersionId, number>();
  sortedPlacements.forEach((placement, index) => {
    const courseVersionId = courseVersionIdForPlacement(placement);
    if (
      courseVersionId &&
      selectedCourseVersionIdSet.has(courseVersionId) &&
      !firstPlacementIndex.has(courseVersionId)
    ) {
      firstPlacementIndex.set(courseVersionId, index);
    }
  });
  const coursePeriodOrder = (courseVersionId: CourseVersionId) => {
    const periodId = coursePeriodIdByCourseVersionId.get(courseVersionId);
    return periodId
      ? periodOrder.get(periodId) ?? Number.MAX_SAFE_INTEGER
      : Number.MAX_SAFE_INTEGER;
  };
  const selectedCourseVersionIds = [...selectedCourseVersionIdSet].sort(
    (left, right) =>
      coursePeriodOrder(left) - coursePeriodOrder(right) ||
      (firstPlacementIndex.get(left) ?? Number.MAX_SAFE_INTEGER) -
        (firstPlacementIndex.get(right) ?? Number.MAX_SAFE_INTEGER) ||
      (requirementIndex.get(left) ?? Number.MAX_SAFE_INTEGER) -
        (requirementIndex.get(right) ?? Number.MAX_SAFE_INTEGER),
  );

  for (const courseVersionId of selectedCourseVersionIds) {
    const courseVersion = courseVersionById.get(courseVersionId);
    for (const prerequisite of courseVersion?.prerequisites ?? []) {
      if (
        prerequisite.kind === "required" &&
        !selectedCourseVersionIdSet.has(prerequisite.courseVersionId)
      ) {
        diagnostics.push({
          code: "missing_required_prerequisite",
          severity: "error",
          courseVersionId,
          message: `${courseVersion?.title ?? courseVersionId} requires a course outside the selected pathway.`,
        });
      }
    }
  }

  const courseOrder = new Map(
    selectedCourseVersionIds.map((id, index) => [id, index]),
  );
  const courseVersions = selectedCourseVersionIds
    .map((id) => courseVersionById.get(id))
    .filter(
      (courseVersion): courseVersion is PublishedCourseVersion =>
        Boolean(courseVersion),
    );
  const learningUnits = bundle.learningUnits
    .filter((unit) => selectedCourseVersionIdSet.has(unit.courseVersionId))
    .sort(
      (left, right) =>
        (courseOrder.get(left.courseVersionId) ?? Number.MAX_SAFE_INTEGER) -
          (courseOrder.get(right.courseVersionId) ?? Number.MAX_SAFE_INTEGER) ||
        left.order - right.order,
    );
  const learningUnitIds = new Set(learningUnits.map((unit) => unit.id));
  for (const unit of learningUnits) {
    const coursePeriodId = coursePeriodIdByCourseVersionId.get(
      unit.courseVersionId,
    );
    if (
      coursePeriodId &&
      !learningUnitPeriodIdByLearningUnitId.has(unit.id)
    ) {
      learningUnitPeriodIdByLearningUnitId.set(unit.id, coursePeriodId);
    }
  }
  const assessmentVersions = bundle.assessmentVersions.filter((assessment) =>
    selectedCourseVersionIdSet.has(assessment.courseVersionId),
  );
  const assessmentVersionIds = new Set(
    assessmentVersions.map((assessment) => assessment.id),
  );
  const placements = sortedPlacements.filter((placement) => {
    if (placement.subject.kind === "courseVersion") {
      return selectedCourseVersionIdSet.has(placement.subject.id);
    }
    if (placement.subject.kind === "learningUnit") {
      return learningUnitIds.has(placement.subject.id);
    }
    return assessmentVersionIds.has(placement.subject.id);
  });
  const requirementEvaluation = evaluateProgramRequirements(
    bundle,
    selectedCourseVersionIdSet,
  );
  if (!requirementEvaluation.satisfied) {
    diagnostics.push({
      code: "unsatisfied_requirement",
      severity: "error",
      message: "The resolved course set does not satisfy every program requirement.",
    });
  }

  return {
    isResolved:
      requirementEvaluation.satisfied &&
      !diagnostics.some((diagnostic) => diagnostic.severity === "error"),
    ...(selectedConcentrationId ? { selectedConcentrationId } : {}),
    selectedCourseVersionIds,
    selectedCourseVersionIdSet,
    requirementSelections,
    courseVersions,
    learningUnits,
    assessmentVersions,
    schedule,
    calendar,
    placements,
    coursePeriodIdByCourseVersionId,
    learningUnitPeriodIdByLearningUnitId,
    requirementEvaluation,
    totals: {
      courseCount: courseVersions.length,
      learningUnitCount: learningUnits.length,
      assessmentCount: assessmentVersions.length,
      nominalHours: courseVersions.reduce(
        (total, courseVersion) => total + courseVersion.nominalHours,
        0,
      ),
    },
    diagnostics,
  };
}
