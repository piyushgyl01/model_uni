import type {
  CourseVersionId,
  PublishedProgramBundle,
} from "./catalog";

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
): TermProgressEvaluation {
  const programVersion = bundle.programVersion;
  const schedule =
    bundle.schedules.find((s) => s.id === programVersion.defaultScheduleId) ??
    bundle.schedules.find((s) => s.programVersionId === programVersion.id) ??
    bundle.schedules[0];

  const calendar = schedule
    ? bundle.calendars.find((c) => c.id === schedule.calendarId) ?? bundle.calendars[0]
    : bundle.calendars[0];

  const sortedPeriods = calendar
    ? [...calendar.periods].sort((a, b) => a.order - b.order)
    : [];

  const placementsByPeriod = new Map<string, Set<CourseVersionId>>();
  if (schedule) {
    for (const placement of schedule.placements) {
      if (placement.periodId && placement.subject.kind === "courseVersion") {
        const set = placementsByPeriod.get(placement.periodId) ?? new Set();
        set.add(placement.subject.id);
        placementsByPeriod.set(placement.periodId, set);
      }
    }
  }

  const courseVersionMap = new Map(bundle.courseVersions.map((cv) => [cv.id, cv]));

  // If no placements found, fallback to chunking courses into terms (approx 5 courses/term)
  const periodDetails: TermPeriodDetail[] = sortedPeriods.map((period) => {
    const placedCourseIds = placementsByPeriod.get(period.id) ?? new Set();
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
  const allTermsSatisfied = periodDetails.every((p) => p.isCompleted);

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
