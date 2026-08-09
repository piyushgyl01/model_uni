import type {
  CourseVersionId,
  PublishedCourseVersion,
  PublishedProgramBundle,
} from "./catalog";
import type { StoredProgramProgress } from "../progress-storage";
import { resolveLearnerPath } from "./learner-path";
import { getMasteredCourseVersionIds } from "./mastery";

export interface CoursePrerequisiteDetail {
  readonly courseVersionId: CourseVersionId;
  readonly title: string;
  readonly canonicalSlug: string;
  readonly kind: "required" | "recommended";
  readonly isSatisfied: boolean;
}

export interface CoursePrerequisiteEvaluation {
  readonly courseVersionId: CourseVersionId;
  readonly isCompleted: boolean;
  readonly isUnlocked: boolean;
  readonly details: readonly CoursePrerequisiteDetail[];
  readonly missingRequired: readonly CoursePrerequisiteDetail[];
  readonly satisfiedRequired: readonly CoursePrerequisiteDetail[];
  readonly lockReasonText?: string;
}

export function getCompletedCourseVersionIds(
  bundle: PublishedProgramBundle,
  progress: StoredProgramProgress | undefined,
): Set<CourseVersionId> {
  return getMasteredCourseVersionIds(bundle, progress);
}

export function getActiveWaivedPrerequisiteCourseVersionIds(
  progress: StoredProgramProgress | undefined,
  courseVersionId: CourseVersionId,
) {
  return new Set(
    Object.values(progress?.prerequisiteWaivers ?? {})
      .filter(
        (waiver) =>
          waiver.courseVersionId === courseVersionId && !waiver.revokedAt,
      )
      .map((waiver) => waiver.prerequisiteCourseVersionId),
  );
}

export function evaluateCoursePrerequisites(
  bundle: PublishedProgramBundle,
  courseVersionId: CourseVersionId,
  completedCourseVersionIds: Set<CourseVersionId>,
  waivedPrerequisiteCourseVersionIds?: Set<CourseVersionId>,
): CoursePrerequisiteEvaluation {
  const courseVersion = bundle.courseVersions.find((cv) => cv.id === courseVersionId);
  const isCompleted = completedCourseVersionIds.has(courseVersionId);

  if (!courseVersion || !courseVersion.prerequisites || courseVersion.prerequisites.length === 0) {
    return {
      courseVersionId,
      isCompleted,
      isUnlocked: true,
      details: [],
      missingRequired: [],
      satisfiedRequired: [],
    };
  }

  const courseVersionMap = new Map<CourseVersionId, PublishedCourseVersion>();
  for (const cv of bundle.courseVersions) {
    courseVersionMap.set(cv.id, cv);
  }

  const courseMap = new Map<string, (typeof bundle.courses)[number]>();
  for (const c of bundle.courses) {
    courseMap.set(c.id, c);
  }

  const details: CoursePrerequisiteDetail[] = [];
  const missingRequired: CoursePrerequisiteDetail[] = [];
  const satisfiedRequired: CoursePrerequisiteDetail[] = [];

  for (const prereq of courseVersion.prerequisites) {
    const prereqCv = courseVersionMap.get(prereq.courseVersionId);
    const prereqCourse = prereqCv ? courseMap.get(prereqCv.courseId) : undefined;

    const title = prereqCv?.title ?? "Prerequisite Course";
    const canonicalSlug = prereqCourse?.canonicalSlug ?? title.toLowerCase().replace(/\s+/g, "-");
    const isSatisfied =
      completedCourseVersionIds.has(prereq.courseVersionId) ||
      Boolean(waivedPrerequisiteCourseVersionIds?.has(prereq.courseVersionId));

    const detail: CoursePrerequisiteDetail = {
      courseVersionId: prereq.courseVersionId,
      title,
      canonicalSlug,
      kind: prereq.kind,
      isSatisfied,
    };

    details.push(detail);

    if (prereq.kind === "required") {
      if (isSatisfied) {
        satisfiedRequired.push(detail);
      } else {
        missingRequired.push(detail);
      }
    }
  }

  const isUnlocked = isCompleted || missingRequired.length === 0;

  let lockReasonText: string | undefined;
  if (!isUnlocked && missingRequired.length > 0) {
    const missingNames = missingRequired.map((m) => `"${m.title}"`).join(", ");
    lockReasonText = `Locked: Requires completion of ${missingNames}`;
  }

  return {
    courseVersionId,
    isCompleted,
    isUnlocked,
    details,
    missingRequired,
    satisfiedRequired,
    lockReasonText,
  };
}

export function evaluateAllCoursePrerequisites(
  bundle: PublishedProgramBundle,
  progress: StoredProgramProgress | undefined,
  additionalWaivedPrerequisiteCourseVersionIds?: Set<CourseVersionId>,
): Map<CourseVersionId, CoursePrerequisiteEvaluation> {
  const completedIds = getCompletedCourseVersionIds(bundle, progress);
  const evaluationMap = new Map<CourseVersionId, CoursePrerequisiteEvaluation>();
  const selectedConcentrationId = bundle.concentrations.find(
    (concentration) => concentration.id === progress?.selectedConcentrationId,
  )?.id;
  const learnerPath = resolveLearnerPath(bundle, {
    selectedConcentrationId,
    selectedCourseVersionIds: Object.values(
      progress?.requirementSelections ?? {},
    ).flat(),
  });

  for (const cv of learnerPath.courseVersions) {
    const waivedPrerequisites = getActiveWaivedPrerequisiteCourseVersionIds(
      progress,
      cv.id,
    );
    for (const id of additionalWaivedPrerequisiteCourseVersionIds ?? []) {
      waivedPrerequisites.add(id);
    }
    const evalResult = evaluateCoursePrerequisites(
      bundle,
      cv.id,
      completedIds,
      waivedPrerequisites,
    );
    evaluationMap.set(cv.id, evalResult);
  }

  return evaluationMap;
}
