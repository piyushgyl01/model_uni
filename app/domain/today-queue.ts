import type {
  CourseVersionId,
  LearningUnitId,
  PublishedProgramBundle,
} from "./catalog";
import type {
  ProgressMutationOperation,
  ScheduleEntry,
} from "../learner-progress-contract";
import type { EnrollmentConfig, StoredProgramProgress } from "../progress-storage";
import {
  buildAcademicCalendar,
  type AcademicTaskKind,
  type CalendarStudySession,
  type DatedAcademicTerm,
} from "./academic-calendar";

export interface TodayStudyBlock {
  readonly scheduleEntry: ScheduleEntry;
  readonly scheduleEntryId: string;
  readonly unitId: LearningUnitId;
  readonly unitTitle: string;
  readonly unitTopic: string;
  readonly unitKind: string;
  readonly unitOrder: number;
  readonly courseTitle: string;
  readonly courseSlug: string;
  readonly courseVersionId: CourseVersionId;
  readonly estimatedHours: number;
  readonly plannedMinutes: number;
  readonly completed: boolean;
  readonly canComplete: boolean;
  readonly completesUnit: boolean;
  readonly periodLabel: string;
  readonly taskKind: AcademicTaskKind;
  readonly activity: string;
  readonly where: string;
  readonly resourceUrl?: string;
  readonly produce: string;
  readonly deadlineDate: string;
}

export interface TodayHistoryDay {
  readonly date: string;
  readonly blocks: readonly TodayStudyBlock[];
}

export interface TodayQueueResult {
  readonly isEnrolled: boolean;
  readonly enrollment?: EnrollmentConfig;
  readonly programTitle: string;
  readonly programSlug: string;
  readonly programVersionId: string;
  readonly blocks: readonly TodayStudyBlock[];
  readonly recentHistory: readonly TodayHistoryDay[];
  readonly terms: readonly DatedAcademicTerm[];
  readonly reconciliationOperations: readonly ProgressMutationOperation[];
  readonly today: string;
  readonly todayIsStudyDay: boolean;
  readonly dailyTargetHours: number;
  readonly effectiveWeeklyHours: number;
  readonly capacityLimited: boolean;
  readonly totalCompletedUnits: number;
  readonly totalUnits: number;
  readonly completedBlocksToday: number;
  readonly totalBlocksToday: number;
  readonly estimatedWeeksRemaining: number;
  readonly estimatedCompletionDate: string;
  readonly remainingHours: number;
  readonly currentPeriodLabel: string;
}

function studyBlock(session: CalendarStudySession): TodayStudyBlock {
  return {
    scheduleEntry: session.entry,
    scheduleEntryId: session.entry.id,
    unitId: session.unitId,
    unitTitle: session.unitTitle,
    unitTopic: session.unitTopic,
    unitKind: session.unitKind,
    unitOrder: session.unitOrder,
    courseTitle: session.courseTitle,
    courseSlug: session.courseSlug,
    courseVersionId: session.courseVersionId,
    estimatedHours: Math.round((session.entry.plannedMinutes / 60) * 10) / 10,
    plannedMinutes: session.entry.plannedMinutes,
    completed: session.entry.status === "completed",
    canComplete: session.entry.status === "planned",
    completesUnit: session.completesUnit,
    periodLabel: session.periodLabel,
    taskKind: session.taskKind,
    activity: session.activity,
    where: session.where,
    ...(session.resourceUrl ? { resourceUrl: session.resourceUrl } : {}),
    produce: session.produce,
    deadlineDate: session.deadlineDate,
  };
}

function historyDays(sessions: readonly CalendarStudySession[]) {
  const grouped = new Map<string, TodayStudyBlock[]>();
  for (const session of sessions) {
    const blocks = grouped.get(session.entry.scheduledDate) ?? [];
    blocks.push(studyBlock(session));
    grouped.set(session.entry.scheduledDate, blocks);
  }
  return [...grouped.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([date, blocks]) => ({ date, blocks }));
}

export function calculateTodayQueue(
  bundle: PublishedProgramBundle,
  progress: StoredProgramProgress | undefined,
  today?: string,
): TodayQueueResult {
  const calendar = buildAcademicCalendar(bundle, progress, today);
  const blocks = calendar.todaySessions
    .filter(
      (session) =>
        session.entry.status === "planned" || session.entry.status === "completed",
    )
    .map(studyBlock);
  return {
    isEnrolled: calendar.isEnrolled,
    ...(calendar.enrollment ? { enrollment: calendar.enrollment } : {}),
    programTitle: bundle.programVersion.title,
    programSlug: bundle.program.canonicalSlug,
    programVersionId: bundle.programVersion.id,
    blocks,
    recentHistory: historyDays(calendar.recentHistory),
    terms: calendar.terms,
    reconciliationOperations: calendar.reconciliationOperations,
    today: calendar.today,
    todayIsStudyDay: calendar.todayIsStudyDay,
    dailyTargetHours: Math.round((calendar.dailyCapacityMinutes / 60) * 10) / 10,
    effectiveWeeklyHours:
      Math.round((calendar.effectiveWeeklyMinutes / 60) * 10) / 10,
    capacityLimited: calendar.capacityLimited,
    totalCompletedUnits: calendar.completedUnits,
    totalUnits: calendar.totalUnits,
    completedBlocksToday: blocks.filter((block) => block.completed).length,
    totalBlocksToday: blocks.length,
    estimatedWeeksRemaining: calendar.estimatedWeeksRemaining,
    estimatedCompletionDate: calendar.projectedCompletionDate,
    remainingHours: Math.round((calendar.remainingMinutes / 60) * 10) / 10,
    currentPeriodLabel: calendar.currentPeriodLabel,
  };
}
