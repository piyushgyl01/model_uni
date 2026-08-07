import type {
  CourseVersionId,
  LearningUnit,
  LearningUnitId,
  PublishedCourseVersion,
  PublishedProgramBundle,
} from "./catalog";
import type { EnrollmentConfig, StoredProgramProgress } from "../progress-storage";
import { evaluateAllCoursePrerequisites } from "./prerequisite-evaluator";

export interface TodayStudyBlock {
  readonly unitId: LearningUnitId;
  readonly unitTitle: string;
  readonly unitTopic: string;
  readonly unitKind: string;
  readonly unitOrder: number;
  readonly courseTitle: string;
  readonly courseSlug: string;
  readonly courseVersionId: CourseVersionId;
  readonly estimatedHours: number;
  readonly completed: boolean;
  readonly periodLabel: string;
}

export interface TodayQueueResult {
  readonly isEnrolled: boolean;
  readonly enrollment?: EnrollmentConfig;
  readonly programTitle: string;
  readonly programSlug: string;
  readonly programVersionId: string;
  readonly blocks: readonly TodayStudyBlock[];
  readonly dailyTargetHours: number;
  readonly totalCompletedUnits: number;
  readonly totalUnits: number;
  readonly completedBlocksToday: number;
  readonly totalBlocksToday: number;
  readonly estimatedWeeksRemaining: number;
  readonly currentPeriodLabel: string;
}

export function calculateTodayQueue(
  bundle: PublishedProgramBundle,
  progress: StoredProgramProgress | undefined,
): TodayQueueResult {
  const enrollment = progress?.enrollment;
  const isEnrolled = enrollment?.status === "enrolled";
  const paceHoursPerWeek = enrollment?.paceHoursPerWeek ?? 40;
  const dailyTargetHours = Math.round((paceHoursPerWeek / 7) * 10) / 10;

  // Build a set of all completed unit IDs for this program
  const completedUnitIdsSet = new Set<string>();
  let totalCompletedUnitsCount = 0;

  if (progress?.courses) {
    for (const courseProgress of Object.values(progress.courses)) {
      if (Array.isArray(courseProgress.completedUnitIds)) {
        for (const unitId of courseProgress.completedUnitIds) {
          completedUnitIdsSet.add(unitId);
          totalCompletedUnitsCount++;
        }
      }
    }
  }

  // Maps for courseVersions, courses, units
  const courseVersionMap = new Map<CourseVersionId, PublishedCourseVersion>();
  for (const cv of bundle.courseVersions) {
    courseVersionMap.set(cv.id, cv);
  }

  const courseMap = new Map<string, (typeof bundle.courses)[number]>();
  for (const c of bundle.courses) {
    courseMap.set(c.id, c);
  }

  // Map calendar periods
  const calendar = bundle.calendars?.[0];
  const schedule = bundle.schedules?.[0];
  const periodMap = new Map<string, string>();

  if (calendar?.periods) {
    for (const period of calendar.periods) {
      periodMap.set(period.id, period.label);
    }
  }

  // Gather courses in recommended sequence order
  const orderedCourseVersions: PublishedCourseVersion[] = [];
  const visitedCourseIds = new Set<CourseVersionId>();

  if (schedule?.placements && schedule.placements.length > 0) {
    const sortedPlacements = [...schedule.placements].sort(
      (a, b) => a.order - b.order,
    );
    for (const placement of sortedPlacements) {
      if (placement.subject.kind === "courseVersion") {
        const cv = courseVersionMap.get(placement.subject.id);
        if (cv && !visitedCourseIds.has(cv.id)) {
          visitedCourseIds.add(cv.id);
          orderedCourseVersions.push(cv);
        }
      }
    }
  }

  // Add any remaining courses from requirement groups
  for (const group of bundle.programVersion.requirements) {
    for (const option of group.options) {
      const cv = courseVersionMap.get(option.courseVersionId);
      if (cv && !visitedCourseIds.has(cv.id)) {
        visitedCourseIds.add(cv.id);
        orderedCourseVersions.push(cv);
      }
    }
  }

  // Group units by course version
  const unitsByCourseVersion = new Map<CourseVersionId, LearningUnit[]>();
  for (const unit of bundle.learningUnits) {
    const list = unitsByCourseVersion.get(unit.courseVersionId) ?? [];
    list.push(unit);
    unitsByCourseVersion.set(unit.courseVersionId, list);
  }

  // Sort units in each course by unit.order
  for (const list of unitsByCourseVersion.values()) {
    list.sort((a, b) => a.order - b.order);
  }

  // Flatten all learning units across ordered courses
  const allUnitsInOrder: {
    unit: LearningUnit;
    courseVersion: PublishedCourseVersion;
    periodLabel: string;
  }[] = [];

  let totalUnitsCount = 0;

  for (const cv of orderedCourseVersions) {
    // Determine period label
    let periodLabel = "General Sequence";
    if (schedule?.placements) {
      const placement = schedule.placements.find(
        (p) => p.subject.kind === "courseVersion" && p.subject.id === cv.id,
      );
      if (placement?.periodId && periodMap.has(placement.periodId)) {
        periodLabel = periodMap.get(placement.periodId) ?? periodLabel;
      }
    }

    const units = unitsByCourseVersion.get(cv.id) ?? [];
    totalUnitsCount += units.length;

    for (const unit of units) {
      allUnitsInOrder.push({ unit, courseVersion: cv, periodLabel });
    }
  }

  // Evaluate prerequisites for all courses
  const prereqEvaluations = evaluateAllCoursePrerequisites(bundle, progress);

  // Identify active period / current position from uncompleted & unlocked units
  let currentPeriodLabel = "Term 1";
  const uncompletedUnits = allUnitsInOrder.filter(
    (item) =>
      !completedUnitIdsSet.has(item.unit.id) &&
      (prereqEvaluations.get(item.courseVersion.id)?.isUnlocked ?? true),
  );

  if (uncompletedUnits.length > 0) {
    currentPeriodLabel = uncompletedUnits[0].periodLabel;
  }

  // Select study blocks for today's queue
  const todayBlocks: TodayStudyBlock[] = [];
  let accumulatedHours = 0;

  for (const item of uncompletedUnits) {
    const unitsInCourse = unitsByCourseVersion.get(item.courseVersion.id) ?? [];
    const unitCount = Math.max(1, unitsInCourse.length);
    const estimatedHours =
      Math.round(((item.courseVersion.nominalHours ?? 40) / unitCount) * 10) / 10;

    const isDone = completedUnitIdsSet.has(item.unit.id);
    const courseObj = courseMap.get(item.courseVersion.courseId);

    todayBlocks.push({
      unitId: item.unit.id,
      unitTitle: item.unit.title,
      unitTopic: item.unit.topic,
      unitKind: item.unit.kindLabel ?? item.unit.kind,
      unitOrder: item.unit.order,
      courseTitle: item.courseVersion.title,
      courseSlug:
        courseObj?.canonicalSlug ??
        item.courseVersion.title.toLowerCase().replace(/\s+/g, "-"),
      courseVersionId: item.courseVersion.id,
      estimatedHours,
      completed: isDone,
      periodLabel: item.periodLabel,
    });

    accumulatedHours += estimatedHours;

    // Stop when we reach or slightly exceed daily target hours or 4 blocks
    if (accumulatedHours >= dailyTargetHours && todayBlocks.length >= 2) {
      break;
    }
    if (todayBlocks.length >= 4) {
      break;
    }
  }

  const completedBlocksToday = todayBlocks.filter((b) => b.completed).length;
  const remainingUnitsCount = totalUnitsCount - totalCompletedUnitsCount;
  const avgHoursPerUnit = 2;
  const estimatedHoursRemaining = remainingUnitsCount * avgHoursPerUnit;
  const estimatedWeeksRemaining = Math.max(
    1,
    Math.ceil(estimatedHoursRemaining / Math.max(1, paceHoursPerWeek)),
  );

  return {
    isEnrolled,
    enrollment,
    programTitle: bundle.programVersion.title,
    programSlug: bundle.program.canonicalSlug,
    programVersionId: bundle.programVersion.id,
    blocks: todayBlocks,
    dailyTargetHours,
    totalCompletedUnits: totalCompletedUnitsCount,
    totalUnits: totalUnitsCount,
    completedBlocksToday,
    totalBlocksToday: todayBlocks.length,
    estimatedWeeksRemaining,
    currentPeriodLabel,
  };
}
