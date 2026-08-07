import type {
  CourseVersionId,
  PublishedCourseVersion,
  PublishedProgramBundle,
} from "./catalog";
import type { StoredProgramProgress } from "../progress-storage";

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
  const completedIds = new Set<CourseVersionId>();
  if (!progress?.courses) return completedIds;

  // Build map of total units per course version
  const totalUnitsByCourseVersion = new Map<CourseVersionId, number>();
  for (const unit of bundle.learningUnits) {
    const current = totalUnitsByCourseVersion.get(unit.courseVersionId) ?? 0;
    totalUnitsByCourseVersion.set(unit.courseVersionId, current + 1);
  }

  for (const [courseVersionId, courseProgress] of Object.entries(progress.courses)) {
    const cvId = courseVersionId as CourseVersionId;
    const completedUnits = courseProgress.completedUnitIds ?? [];
    const totalUnits = totalUnitsByCourseVersion.get(cvId) ?? 1;

    // A course is completed if all its learning units are marked done
    if (completedUnits.length >= totalUnits && totalUnits > 0) {
      completedIds.add(cvId);
    }
  }

  return completedIds;
}

export function evaluateCoursePrerequisites(
  bundle: PublishedProgramBundle,
  courseVersionId: CourseVersionId,
  completedCourseVersionIds: Set<CourseVersionId>,
  bypassedCourseVersionIds?: Set<CourseVersionId>,
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
      Boolean(bypassedCourseVersionIds?.has(prereq.courseVersionId));

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

  const isExplicitlyBypassed = Boolean(bypassedCourseVersionIds?.has(courseVersionId));
  const isUnlocked = isCompleted || isExplicitlyBypassed || missingRequired.length === 0;

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
  bypassedCourseVersionIds?: Set<CourseVersionId>,
): Map<CourseVersionId, CoursePrerequisiteEvaluation> {
  const completedIds = getCompletedCourseVersionIds(bundle, progress);
  const evaluationMap = new Map<CourseVersionId, CoursePrerequisiteEvaluation>();

  for (const cv of bundle.courseVersions) {
    const evalResult = evaluateCoursePrerequisites(
      bundle,
      cv.id,
      completedIds,
      bypassedCourseVersionIds,
    );
    evaluationMap.set(cv.id, evalResult);
  }

  return evaluationMap;
}
