import type {
  CourseVersionId,
  LearningUnit,
  LearningUnitId,
  PublishedCourseVersion,
  PublishedProgramBundle,
} from "./catalog";
import type { EnrollmentConfig, StoredProgramProgress } from "../progress-storage";
import { resolveLearnerPath } from "./learner-path";
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
  const learnerPath = resolveLearnerPath(bundle, {
    selectedConcentrationId: progress?.selectedConcentrationId,
  });
  const pathUnitIdsByCourseVersion = new Map<CourseVersionId, Set<string>>();
  for (const unit of learnerPath.learningUnits) {
    const allowed =
      pathUnitIdsByCourseVersion.get(unit.courseVersionId) ?? new Set<string>();
    allowed.add(unit.id);
    pathUnitIdsByCourseVersion.set(unit.courseVersionId, allowed);
  }

  // Progress outside the selected path remains stored, but it must not affect
  // this path's totals, current position, or daily assignments.
  const completedUnitIdsSet = new Set<string>();

  if (progress?.courses) {
    for (const [courseVersionId, courseProgress] of Object.entries(
      progress.courses,
    )) {
      const allowedUnitIds = pathUnitIdsByCourseVersion.get(
        courseVersionId as CourseVersionId,
      );
      if (!allowedUnitIds) continue;
      if (Array.isArray(courseProgress.completedUnitIds)) {
        for (const unitId of courseProgress.completedUnitIds) {
          if (allowedUnitIds.has(unitId)) completedUnitIdsSet.add(unitId);
        }
      }
    }
  }
  const totalCompletedUnitsCount = completedUnitIdsSet.size;

  const courseMap = new Map<string, (typeof bundle.courses)[number]>();
  for (const c of bundle.courses) {
    courseMap.set(c.id, c);
  }

  // Map calendar periods
  const calendar = learnerPath.calendar;
  const periodMap = new Map<string, string>();

  if (calendar?.periods) {
    for (const period of calendar.periods) {
      periodMap.set(period.id, period.label);
    }
  }

  const orderedCourseVersions: readonly PublishedCourseVersion[] =
    learnerPath.courseVersions;

  // Group units by course version
  const unitsByCourseVersion = new Map<CourseVersionId, LearningUnit[]>();
  for (const unit of learnerPath.learningUnits) {
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
    const coursePeriodId = learnerPath.coursePeriodIdByCourseVersionId.get(
      cv.id,
    );
    if (coursePeriodId && periodMap.has(coursePeriodId)) {
      periodLabel = periodMap.get(coursePeriodId) ?? periodLabel;
    }

    const units = unitsByCourseVersion.get(cv.id) ?? [];
    totalUnitsCount += units.length;

    for (const unit of units) {
      const unitPeriodId =
        learnerPath.learningUnitPeriodIdByLearningUnitId.get(unit.id);
      allUnitsInOrder.push({
        unit,
        courseVersion: cv,
        periodLabel:
          (unitPeriodId && periodMap.get(unitPeriodId)) ?? periodLabel,
      });
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
  const remainingUnitsCount = Math.max(
    0,
    totalUnitsCount - totalCompletedUnitsCount,
  );
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
