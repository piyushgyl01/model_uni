import type {
  CourseVersionId,
  PublishedProgramBundle,
} from "./catalog";
import { resolveLearnerPath } from "./learner-path";

export interface TermPeriodDetail {
  readonly periodId: string;
  readonly label: string;
  readonly order: number;
  readonly totalCourses: number;
  readonly completedCourses: number;
  readonly isCompleted: boolean;
  readonly percentage: number;
  readonly courseTitles: readonly string[];
}

export interface TermProgressEvaluation {
  readonly totalTerms: number;
  readonly activeTermNumber: number;
  readonly activeTermLabel: string;
  readonly activeTermProgress: TermPeriodDetail;
  readonly nextTermProgress?: TermPeriodDetail;
  readonly allTermsSatisfied: boolean;
  readonly periods: readonly TermPeriodDetail[];
}

export function evaluateTermProgress(
  bundle: PublishedProgramBundle,
  completedCourseVersionIds: ReadonlySet<CourseVersionId>,
  selectedConcentrationId?: string,
): TermProgressEvaluation {
  const learnerPath = resolveLearnerPath(bundle, {
    selectedConcentrationId,
  });
  const calendar = learnerPath.calendar;

  const sortedPeriods = calendar
    ? [...calendar.periods].sort((a, b) => a.order - b.order)
    : [];

  const courseVersionIdsByPeriod = new Map<string, Set<CourseVersionId>>();
  for (const courseVersion of learnerPath.courseVersions) {
    const periodId = learnerPath.coursePeriodIdByCourseVersionId.get(
      courseVersion.id,
    );
    if (!periodId) continue;
    const set = courseVersionIdsByPeriod.get(periodId) ?? new Set();
    set.add(courseVersion.id);
    courseVersionIdsByPeriod.set(periodId, set);
  }

  const courseVersionMap = new Map(
    learnerPath.courseVersions.map((courseVersion) => [
      courseVersion.id,
      courseVersion,
    ]),
  );

  const periodDetails: TermPeriodDetail[] = sortedPeriods.map((period) => {
    const placedCourseIds =
      courseVersionIdsByPeriod.get(period.id) ?? new Set();
    const courseVersions = Array.from(placedCourseIds)
      .map((id) => courseVersionMap.get(id))
      .filter(Boolean);

    const totalCourses = courseVersions.length;
    const completedCourses = courseVersions.filter(
      (cv) => cv && completedCourseVersionIds.has(cv.id),
    ).length;

    const isCompleted = totalCourses > 0 && completedCourses === totalCourses;
    const percentage =
      totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

    return {
      periodId: period.id,
      label: period.label,
      order: period.order,
      totalCourses,
      completedCourses,
      isCompleted,
      percentage,
      courseTitles: courseVersions.map((cv) => cv!.title),
    };
  });

  const totalTerms = Math.max(1, periodDetails.length);
  const activeIndex = periodDetails.findIndex((p) => !p.isCompleted);
  const effectiveActiveIndex = activeIndex === -1 ? totalTerms - 1 : activeIndex;
  const activeTermProgress = periodDetails[effectiveActiveIndex] ?? {
    periodId: "term-1",
    label: "Term 1",
    order: 1,
    totalCourses: 0,
    completedCourses: 0,
    isCompleted: false,
    percentage: 0,
    courseTitles: [],
  };

  const nextTermProgress = periodDetails[effectiveActiveIndex + 1];
  const allTermsSatisfied =
    periodDetails.length > 0 && periodDetails.every((p) => p.isCompleted);

  return {
    totalTerms,
    activeTermNumber: activeTermProgress.order ?? effectiveActiveIndex + 1,
    activeTermLabel: activeTermProgress.label,
    activeTermProgress,
    nextTermProgress,
    allTermsSatisfied,
    periods: periodDetails,
  };
}
