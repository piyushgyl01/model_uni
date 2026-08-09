import type {
  AssessmentKind,
  CalendarPeriodId,
  CourseVersionId,
  LearningUnit,
  LearningUnitId,
  PublishedAssessmentVersion,
  PublishedCourseVersion,
  PublishedProgramBundle,
  SchedulePlacement,
} from "./catalog";
import type {
  ProgressMutationOperation,
  ScheduleEntry,
  ScheduleEntrySubject,
  StudyDay,
} from "../learner-progress-contract";
import type {
  EnrollmentConfig,
  StoredProgramProgress,
} from "../progress-storage";
import { resolveLearnerPath } from "./learner-path";
import { evaluateCourseMastery } from "./mastery";

const DEFAULT_STUDY_DAYS: readonly StudyDay[] = [1, 2, 3, 4, 5];
const MAX_DAILY_MINUTES = 8 * 60;
const MAX_SESSION_MINUTES = 90;
const BREAK_DAYS = 14;
const DAY_MS = 86_400_000;

export type AcademicTaskKind =
  | "study"
  | "project"
  | "midterm"
  | "final"
  | "assessment";

export interface DatedAcademicMilestone {
  readonly label: string;
  readonly kind: "checkpoint" | "break" | "exam" | "project" | "other";
  readonly date: string;
}

export interface DatedAcademicTerm {
  readonly periodId?: CalendarPeriodId;
  readonly label: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly courseVersionIds: readonly CourseVersionId[];
  readonly milestones: readonly DatedAcademicMilestone[];
  readonly breakAfter?: {
    readonly startDate: string;
    readonly endDate: string;
  };
}

export interface CalendarStudySession {
  readonly entry: ScheduleEntry;
  readonly courseVersionId: CourseVersionId;
  readonly courseTitle: string;
  readonly courseSlug: string;
  readonly unitId: LearningUnitId;
  readonly unitTitle: string;
  readonly unitTopic: string;
  readonly unitKind: string;
  readonly unitOrder: number;
  readonly periodLabel: string;
  readonly taskKind: AcademicTaskKind;
  readonly activity: string;
  readonly where: string;
  readonly resourceUrl?: string;
  readonly produce: string;
  readonly deadlineDate: string;
  readonly workOffsetMinutes: number;
  readonly totalWorkMinutes: number;
  readonly completesUnit: boolean;
}

export interface AcademicCalendarPlan {
  readonly isEnrolled: boolean;
  readonly enrollment?: EnrollmentConfig;
  readonly studyDays: readonly StudyDay[];
  readonly requestedWeeklyMinutes: number;
  readonly effectiveWeeklyMinutes: number;
  readonly dailyCapacityMinutes: number;
  readonly capacityLimited: boolean;
  readonly terms: readonly DatedAcademicTerm[];
  readonly sessions: readonly CalendarStudySession[];
  readonly todaySessions: readonly CalendarStudySession[];
  readonly recentHistory: readonly CalendarStudySession[];
  readonly reconciliationOperations: readonly ProgressMutationOperation[];
  readonly totalUnits: number;
  readonly completedUnits: number;
  readonly remainingMinutes: number;
  readonly estimatedWeeksRemaining: number;
  readonly projectedCompletionDate: string;
  readonly currentPeriodLabel: string;
  readonly today: string;
  readonly todayIsStudyDay: boolean;
}

interface WorkItem {
  readonly subject: ScheduleEntrySubject;
  readonly subjectKey: string;
  readonly courseVersion: PublishedCourseVersion;
  readonly courseSlug: string;
  readonly unit: LearningUnit;
  readonly assessment?: PublishedAssessmentVersion;
  readonly assessmentKind?: AssessmentKind;
  readonly periodId?: CalendarPeriodId;
  readonly periodLabel: string;
  readonly totalMinutes: number;
  readonly taskKind: AcademicTaskKind;
  readonly activity: string;
  readonly where: string;
  readonly resourceUrl?: string;
  readonly produce: string;
}

interface MutableWorkItem extends WorkItem {
  remainingMinutes: number;
  offsetMinutes: number;
}

interface CourseQueue {
  readonly courseVersionId: CourseVersionId;
  readonly items: MutableWorkItem[];
  itemIndex: number;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  return formatDate(new Date(parseDate(value).getTime() + days * DAY_MS));
}

function compareDates(left: string, right: string) {
  return left.localeCompare(right);
}

function laterDate(left: string, right: string) {
  return compareDates(left, right) >= 0 ? left : right;
}

function weekday(value: string) {
  return parseDate(value).getUTCDay() as StudyDay;
}

function cleanStudyDays(days: readonly StudyDay[] | undefined) {
  const selected = [...new Set(days ?? DEFAULT_STUDY_DAYS)]
    .filter((day): day is StudyDay => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((left, right) => left - right);
  return selected.length > 0 ? selected : [...DEFAULT_STUDY_DAYS];
}

function nextStudyDate(value: string, studyDays: ReadonlySet<StudyDay>) {
  let candidate = value;
  for (let offset = 0; offset < 7; offset += 1) {
    if (studyDays.has(weekday(candidate))) return candidate;
    candidate = addDays(candidate, 1);
  }
  return value;
}

function capacityByStudyDay(
  paceHoursPerWeek: number,
  studyDays: readonly StudyDay[],
) {
  const requestedWeeklyMinutes = Math.max(1, Math.round(paceHoursPerWeek * 60));
  const effectiveWeeklyMinutes = Math.min(
    requestedWeeklyMinutes,
    studyDays.length * MAX_DAILY_MINUTES,
  );
  const base = Math.floor(effectiveWeeklyMinutes / studyDays.length);
  let remainder = effectiveWeeklyMinutes - base * studyDays.length;
  const capacities = new Map<StudyDay, number>();
  for (const day of studyDays) {
    const extra = remainder > 0 ? 1 : 0;
    capacities.set(day, base + extra);
    remainder -= extra;
  }
  return { requestedWeeklyMinutes, effectiveWeeklyMinutes, capacities };
}

function subjectKey(subject: ScheduleEntrySubject) {
  return `${subject.kind}:${subject.id}`;
}

function fnv1a(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function calendarEntryId(key: string) {
  return `calendar-${fnv1a(key)}-${fnv1a([...key].reverse().join(""))}`;
}

function clockTime(workMinutes: number, sessionIndex: number) {
  const minuteOfDay = Math.min(23 * 60 + 59, 9 * 60 + workMinutes + sessionIndex * 15);
  return `${String(Math.floor(minuteOfDay / 60)).padStart(2, "0")}:${String(
    minuteOfDay % 60,
  ).padStart(2, "0")}`;
}

function taskKindFor(
  unit: LearningUnit,
  assessment: PublishedAssessmentVersion | undefined,
  assessmentKind: AssessmentKind | undefined,
  unitCount: number,
): AcademicTaskKind {
  const title = assessment?.title.toLowerCase() ?? "";
  if (title.includes("final") || (assessment && unit.order === unitCount)) {
    return "final";
  }
  if (
    assessmentKind === "project" ||
    assessmentKind === "portfolio" ||
    assessmentKind === "presentation"
  ) {
    return "project";
  }
  if (assessmentKind === "exam") {
    return unit.order <= Math.ceil(unitCount / 2) ? "midterm" : "final";
  }
  if (assessment && unit.order <= Math.ceil(unitCount / 2)) {
    return "midterm";
  }
  if (unit.kind === "project") return "project";
  return assessment ? "assessment" : "study";
}

function selectedCourseIds(progress: StoredProgramProgress | undefined) {
  return Object.values(progress?.requirementSelections ?? {}).flat();
}

function workItemsForPath(
  bundle: PublishedProgramBundle,
  progress: StoredProgramProgress | undefined,
) {
  const path = resolveLearnerPath(bundle, {
    selectedConcentrationId: progress?.selectedConcentrationId,
    selectedCourseVersionIds: selectedCourseIds(progress),
  });
  const courseById = new Map(bundle.courses.map((course) => [course.id, course]));
  const periodLabelById = new Map(
    (path.calendar?.periods ?? []).map((period) => [period.id, period.label]),
  );
  const assessmentEntityById = new Map(
    bundle.assessments.map((assessment) => [assessment.id, assessment]),
  );
  const assessmentsByUnit = new Map<LearningUnitId, PublishedAssessmentVersion[]>();
  for (const assessment of path.assessmentVersions) {
    if (!assessment.unitId) continue;
    const list = assessmentsByUnit.get(assessment.unitId) ?? [];
    list.push(assessment);
    assessmentsByUnit.set(assessment.unitId, list);
  }
  const resourceById = new Map(
    bundle.resourceVersions.map((resource) => [resource.id, resource]),
  );
  const unitsByCourse = new Map<CourseVersionId, LearningUnit[]>();
  for (const unit of path.learningUnits) {
    const list = unitsByCourse.get(unit.courseVersionId) ?? [];
    list.push(unit);
    unitsByCourse.set(unit.courseVersionId, list);
  }
  for (const units of unitsByCourse.values()) {
    units.sort((left, right) => left.order - right.order);
  }

  const items: WorkItem[] = [];
  for (const courseVersion of path.courseVersions) {
    const course = courseById.get(courseVersion.courseId);
    const units = unitsByCourse.get(courseVersion.id) ?? [];
    const coursePeriodId = path.coursePeriodIdByCourseVersionId.get(courseVersion.id);
    for (const unit of units) {
      const linkedAssessments = assessmentsByUnit.get(unit.id) ?? [];
      const subjects = linkedAssessments.length > 0 ? linkedAssessments : [undefined];
      const unitMinutes = Math.max(1, Math.round(unit.nominalHours * 60));
      const baseMinutes = Math.floor(unitMinutes / subjects.length);
      let remainder = unitMinutes - baseMinutes * subjects.length;
      for (const assessment of subjects) {
        const assessmentKind = assessment
          ? assessmentEntityById.get(assessment.assessmentId)?.kind
          : undefined;
        const periodId =
          path.learningUnitPeriodIdByLearningUnitId.get(unit.id) ?? coursePeriodId;
        const resourceIds = [
          ...(assessment?.resourceVersionIds ?? []),
          ...unit.resourceVersionIds,
          ...courseVersion.resourceReferences.map(
            (reference) => reference.resourceVersionId,
          ),
        ];
        const resource = resourceIds
          .map((id) => resourceById.get(id))
          .find((candidate) => candidate !== undefined);
        const allocatedMinutes = baseMinutes + (remainder > 0 ? 1 : 0);
        remainder -= remainder > 0 ? 1 : 0;
        const subject: ScheduleEntrySubject = assessment
          ? { kind: "assessmentVersion", id: assessment.id }
          : { kind: "learningUnit", id: unit.id };
        items.push({
          subject,
          subjectKey: subjectKey(subject),
          courseVersion,
          courseSlug: course?.canonicalSlug ?? courseVersion.id,
          unit,
          ...(assessment ? { assessment } : {}),
          ...(assessmentKind ? { assessmentKind } : {}),
          ...(periodId ? { periodId } : {}),
          periodLabel: (periodId && periodLabelById.get(periodId)) ?? "Independent sequence",
          totalMinutes: allocatedMinutes,
          taskKind: taskKindFor(unit, assessment, assessmentKind, units.length),
          activity: assessment?.instructions ?? unit.activity,
          where:
            unit.resourceLocator ??
            (resource ? `Use “${resource.title}”.` : courseVersion.firstAction),
          ...(resource ? { resourceUrl: resource.canonicalUrl } : {}),
          produce: assessment
            ? assessment.submissionEvidence.join("; ")
            : unit.evidence,
        });
      }
    }
  }
  return { path, items };
}

function completedUnitIdsForPath(
  items: readonly WorkItem[],
  progress: StoredProgramProgress | undefined,
) {
  const allowedByCourse = new Map<CourseVersionId, Set<LearningUnitId>>();
  for (const item of items) {
    const allowed = allowedByCourse.get(item.courseVersion.id) ?? new Set();
    allowed.add(item.unit.id);
    allowedByCourse.set(item.courseVersion.id, allowed);
  }
  const completed = new Set<LearningUnitId>();
  for (const [courseVersionId, courseProgress] of Object.entries(
    progress?.courses ?? {},
  )) {
    const allowed = allowedByCourse.get(courseVersionId as CourseVersionId);
    if (!allowed) continue;
    for (const unitId of courseProgress.completedUnitIds ?? []) {
      if (allowed.has(unitId as LearningUnitId)) {
        completed.add(unitId as LearningUnitId);
      }
    }
  }
  return completed;
}

function completedAssessmentVersionIdsForPath(
  bundle: PublishedProgramBundle,
  items: readonly WorkItem[],
  progress: StoredProgramProgress | undefined,
) {
  const evaluationByCourse = new Map<
    CourseVersionId,
    ReturnType<typeof evaluateCourseMastery>
  >();
  const completed = new Set<string>();
  for (const item of items) {
    if (!item.assessment) continue;
    let evaluation = evaluationByCourse.get(item.courseVersion.id);
    if (!evaluation) {
      evaluation = evaluateCourseMastery(
        bundle,
        item.courseVersion.id,
        progress,
      );
      evaluationByCourse.set(item.courseVersion.id, evaluation);
    }
    const assessment = evaluation.assessments.find(
      (candidate) =>
        candidate.assessmentVersion.id === item.assessment?.id,
    );
    if (
      assessment?.thresholdSatisfied ||
      assessment?.latestAttempt?.status === "submitted"
    ) {
      completed.add(item.assessment.id);
    }
  }
  return completed;
}

function subjectMinutes(
  entries: readonly ScheduleEntry[],
  status: ScheduleEntry["status"],
) {
  const minutes = new Map<string, number>();
  for (const entry of entries) {
    if (entry.status !== status) continue;
    const key = subjectKey(entry.subject);
    minutes.set(key, (minutes.get(key) ?? 0) + entry.plannedMinutes);
  }
  return minutes;
}

function scheduleSubjectCourseVersionId(
  subject: ScheduleEntrySubject,
  itemsBySubject: ReadonlyMap<string, WorkItem>,
) {
  return itemsBySubject.get(subjectKey(subject))?.courseVersion.id;
}

function placementsByCourse(
  placements: readonly SchedulePlacement[],
  itemsBySubject: ReadonlyMap<string, WorkItem>,
) {
  const order = new Map<CourseVersionId, number>();
  for (const placement of placements) {
    const courseVersionId = scheduleSubjectCourseVersionId(
      placement.subject,
      itemsBySubject,
    );
    if (courseVersionId && !order.has(courseVersionId)) {
      order.set(courseVersionId, placement.order);
    }
  }
  return order;
}

function sessionFromEntry(
  entry: ScheduleEntry,
  item: WorkItem,
  deadlineDate: string,
  workOffsetMinutes: number,
  completedMinutes: number,
): CalendarStudySession {
  return {
    entry,
    courseVersionId: item.courseVersion.id,
    courseTitle: item.courseVersion.title,
    courseSlug: item.courseSlug,
    unitId: item.unit.id,
    unitTitle: item.assessment?.title ?? item.unit.title,
    unitTopic: item.unit.topic,
    unitKind: item.assessmentKind ?? item.unit.kindLabel ?? item.unit.kind,
    unitOrder: item.unit.order,
    periodLabel: item.periodLabel,
    taskKind: item.taskKind,
    activity: item.activity,
    where: item.where,
    ...(item.resourceUrl ? { resourceUrl: item.resourceUrl } : {}),
    produce: item.produce,
    deadlineDate,
    workOffsetMinutes,
    totalWorkMinutes: item.totalMinutes,
    completesUnit:
      entry.status === "planned" &&
      completedMinutes + entry.plannedMinutes >= item.totalMinutes,
  };
}

function dateWithinPastDays(date: string, today: string, days: number) {
  return compareDates(date, today) <= 0 && compareDates(date, addDays(today, -days)) >= 0;
}

export function todayInTimezone(timezone = "UTC", now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const value = (type: "year" | "month" | "day") =>
      parts.find((part) => part.type === type)?.value;
    const year = value("year");
    const month = value("month");
    const day = value("day");
    if (year && month && day) return `${year}-${month}-${day}`;
    return now.toISOString().slice(0, 10);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/**
 * Builds one deterministic, dated academic plan from the learner's exact path.
 * Only assignments materialized for the current day (plus explicit carry-forward
 * records) are returned as mutations; the future remains cheap to recalculate.
 */
export function buildAcademicCalendar(
  bundle: PublishedProgramBundle,
  progress: StoredProgramProgress | undefined,
  requestedToday?: string,
): AcademicCalendarPlan {
  const enrollment = progress?.enrollment;
  const today = requestedToday ?? todayInTimezone(enrollment?.timezone);
  const isEnrolled = enrollment?.status === "enrolled";
  const studyDays = cleanStudyDays(enrollment?.preferredStudyDays);
  const studyDaySet = new Set(studyDays);
  const { requestedWeeklyMinutes, effectiveWeeklyMinutes, capacities } =
    capacityByStudyDay(enrollment?.paceHoursPerWeek ?? 40, studyDays);
  const dailyCapacity = (date: string) => capacities.get(weekday(date)) ?? 0;
  const { path, items } = workItemsForPath(bundle, progress);
  const itemsBySubject = new Map(items.map((item) => [item.subjectKey, item]));
  const completedUnitIds = completedUnitIdsForPath(items, progress);
  const completedAssessmentVersionIds = completedAssessmentVersionIdsForPath(
    bundle,
    items,
    progress,
  );
  const storedEntries = Object.values(progress?.scheduleEntries ?? {}).filter(
    (entry) => itemsBySubject.has(subjectKey(entry.subject)),
  );
  const completedMinutesBySubject = subjectMinutes(storedEntries, "completed");
  for (const item of items) {
    if (
      (item.assessment &&
        completedAssessmentVersionIds.has(item.assessment.id)) ||
      (!item.assessment && completedUnitIds.has(item.unit.id))
    ) {
      completedMinutesBySubject.set(item.subjectKey, item.totalMinutes);
    }
  }

  const reconciliationOperations: ProgressMutationOperation[] = [];
  const rawActiveEntries = storedEntries.filter(
    (entry) => entry.status === "planned" && compareDates(entry.scheduledDate, today) >= 0,
  ).sort(
    (left, right) =>
      compareDates(left.scheduledDate, right.scheduledDate) || left.position - right.position,
  );
  const completedTodayEntries = storedEntries.filter(
    (entry) => entry.status === "completed" && entry.scheduledDate === today,
  );
  const usedMinutesByDate = new Map<string, number>();
  const sessionsByDate = new Map<string, number>();
  for (const entry of completedTodayEntries) {
    usedMinutesByDate.set(
      entry.scheduledDate,
      (usedMinutesByDate.get(entry.scheduledDate) ?? 0) + entry.plannedMinutes,
    );
    sessionsByDate.set(
      entry.scheduledDate,
      (sessionsByDate.get(entry.scheduledDate) ?? 0) + 1,
    );
  }

  // A pace/day change may make assignments generated under the old capacity
  // impossible. Keep entries that still fit; carry and split only the excess.
  const activeEntries: ScheduleEntry[] = [];
  const displacedEntries: ScheduleEntry[] = [];
  for (const entry of rawActiveEntries) {
    const used = usedMinutesByDate.get(entry.scheduledDate) ?? 0;
    const fits =
      studyDaySet.has(weekday(entry.scheduledDate)) &&
      used + entry.plannedMinutes <= dailyCapacity(entry.scheduledDate);
    if (entry.source === "manual" || fits) {
      activeEntries.push(entry);
      usedMinutesByDate.set(entry.scheduledDate, used + entry.plannedMinutes);
      sessionsByDate.set(
        entry.scheduledDate,
        (sessionsByDate.get(entry.scheduledDate) ?? 0) + 1,
      );
    } else {
      displacedEntries.push(entry);
    }
  }

  const carriedEntries: ScheduleEntry[] = [];
  const overdue = [
    ...storedEntries.filter(
      (entry) => entry.status === "planned" && compareDates(entry.scheduledDate, today) < 0,
    ),
    ...displacedEntries,
  ]
    .sort(
      (left, right) =>
        compareDates(left.scheduledDate, right.scheduledDate) || left.position - right.position,
    );
  const carriedEntryIds = new Set(overdue.map((entry) => entry.id));
  for (const entry of overdue) {
    reconciliationOperations.push({
      type: "upsert-schedule-entry",
      entry: { ...entry, status: "carried", completedAt: undefined },
    });
    let minutesRemaining = entry.plannedMinutes;
    let part = 0;
    let carryCursor = nextStudyDate(
      laterDate(today, entry.scheduledDate),
      studyDaySet,
    );
    while (minutesRemaining > 0) {
      carryCursor = nextStudyDate(carryCursor, studyDaySet);
      const available = Math.max(
        0,
        dailyCapacity(carryCursor) - (usedMinutesByDate.get(carryCursor) ?? 0),
      );
      if (available === 0) {
        carryCursor = addDays(carryCursor, 1);
        continue;
      }
      const plannedMinutes = Math.min(minutesRemaining, MAX_SESSION_MINUTES, available);
      const position = sessionsByDate.get(carryCursor) ?? 0;
      const replacement: ScheduleEntry = {
        id: calendarEntryId(`carry|${entry.id}|${part}|${carryCursor}`),
        subject: entry.subject,
        scheduledDate: carryCursor,
        startTime: clockTime(usedMinutesByDate.get(carryCursor) ?? 0, position),
        plannedMinutes,
        position,
        source: "carry-forward",
        originEntryId: entry.id,
        status: "planned",
      };
      carriedEntries.push(replacement);
      reconciliationOperations.push({ type: "upsert-schedule-entry", entry: replacement });
      usedMinutesByDate.set(
        carryCursor,
        (usedMinutesByDate.get(carryCursor) ?? 0) + plannedMinutes,
      );
      sessionsByDate.set(carryCursor, position + 1);
      minutesRemaining -= plannedMinutes;
      part += 1;
    }
  }

  const fixedActiveEntries = [...activeEntries, ...carriedEntries];
  const plannedMinutesBySubject = subjectMinutes(fixedActiveEntries, "planned");
  const periodOrder = new Map(
    (path.calendar?.periods ?? []).map((period) => [period.id, period.order]),
  );
  const periodLabel = new Map(
    (path.calendar?.periods ?? []).map((period) => [period.id, period.label]),
  );
  const coursePlacementOrder = placementsByCourse(path.placements, itemsBySubject);
  const periodIds = [...(path.calendar?.periods ?? [])]
    .sort((left, right) => left.order - right.order)
    .map((period) => period.id);
  const unplacedItems = items.filter((item) => !item.periodId);
  const independentPeriodId = "per_independent_sequence" as CalendarPeriodId;
  if (unplacedItems.length > 0 || periodIds.length === 0) {
    periodIds.push(independentPeriodId);
    periodLabel.set(independentPeriodId, "Independent sequence");
    periodOrder.set(
      independentPeriodId,
      periodIds.length,
    );
  }

  const generatedSessions: Array<CalendarStudySession & { deadlineDate: string }> = [];
  const provisionalSessions: Array<{ entry: ScheduleEntry; item: WorkItem; offset: number }> = [];
  const termDrafts: Array<{
    periodId?: CalendarPeriodId;
    label: string;
    startDate: string;
    endDate: string;
    courseVersionIds: CourseVersionId[];
  }> = [];
  let termCursor = nextStudyDate(enrollment?.startDate ?? today, studyDaySet);
  let globalPosition = 0;

  const remainingUncompletedByItem = new Map<string, number>();
  for (const item of items) {
    remainingUncompletedByItem.set(
      item.subjectKey,
      Math.max(0, item.totalMinutes - (completedMinutesBySubject.get(item.subjectKey) ?? 0)),
    );
  }
  const firstIncompletePeriodIndex = periodIds.findIndex((periodId) =>
    items.some(
      (item) =>
        (item.periodId ?? independentPeriodId) === periodId &&
        (remainingUncompletedByItem.get(item.subjectKey) ?? 0) > 0,
    ),
  );

  for (let periodIndex = 0; periodIndex < periodIds.length; periodIndex += 1) {
    const periodId = periodIds[periodIndex];
    const termItems = items.filter((item) =>
      periodId === independentPeriodId
        ? !item.periodId
        : item.periodId === periodId,
    );
    if (termItems.length === 0) continue;
    const courseVersionIds = [
      ...new Set(termItems.map((item) => item.courseVersion.id)),
    ].sort(
      (left, right) =>
        (coursePlacementOrder.get(left) ?? Number.MAX_SAFE_INTEGER) -
        (coursePlacementOrder.get(right) ?? Number.MAX_SAFE_INTEGER),
    );
    const totalTermMinutes = termItems.reduce((total, item) => total + item.totalMinutes, 0);
    const completedTermMinutes = termItems.reduce(
      (total, item) =>
        total + Math.min(item.totalMinutes, completedMinutesBySubject.get(item.subjectKey) ?? 0),
      0,
    );
    const termStartDate = termCursor;

    if (firstIncompletePeriodIndex >= 0 && periodIndex < firstIncompletePeriodIndex) {
      const nominalDays = Math.max(
        1,
        Math.ceil(totalTermMinutes / Math.max(1, effectiveWeeklyMinutes)) * 7,
      );
      const endDate = addDays(termStartDate, nominalDays - 1);
      termDrafts.push({
        periodId,
        label: periodLabel.get(periodId) ?? `Term ${periodIndex + 1}`,
        startDate: termStartDate,
        endDate,
        courseVersionIds,
      });
      termCursor = nextStudyDate(addDays(endDate, BREAK_DAYS + 1), studyDaySet);
      continue;
    }

    const scheduleStart = nextStudyDate(laterDate(termStartDate, today), studyDaySet);
    const queues: CourseQueue[] = courseVersionIds.map((courseVersionId) => ({
      courseVersionId,
      itemIndex: 0,
      items: termItems
        .filter((item) => item.courseVersion.id === courseVersionId)
        .map((item) => {
          const completed = Math.min(
            item.totalMinutes,
            completedMinutesBySubject.get(item.subjectKey) ?? 0,
          );
          const planned = Math.min(
            item.totalMinutes - completed,
            plannedMinutesBySubject.get(item.subjectKey) ?? 0,
          );
          return {
            ...item,
            remainingMinutes: Math.max(0, item.totalMinutes - completed - planned),
            offsetMinutes: completed + planned,
          };
        }),
    }));
    const nextItem = (queue: CourseQueue) => {
      while (
        queue.itemIndex < queue.items.length &&
        queue.items[queue.itemIndex].remainingMinutes <= 0
      ) {
        queue.itemIndex += 1;
      }
      return queue.items[queue.itemIndex];
    };
    const hasWork = () => queues.some((queue) => nextItem(queue));
    let dateCursor = scheduleStart;
    let roundRobin = 0;
    let lastScheduledDate = termStartDate;
    let safetyDays = 0;
    while (hasWork()) {
      if (safetyDays > 50_000) {
        throw new Error("Academic calendar generation exceeded its safety horizon.");
      }
      safetyDays += 1;
      dateCursor = nextStudyDate(dateCursor, studyDaySet);
      let usedMinutes = usedMinutesByDate.get(dateCursor) ?? 0;
      let availableMinutes = Math.max(0, dailyCapacity(dateCursor) - usedMinutes);
      let sessionIndex = sessionsByDate.get(dateCursor) ?? 0;
      while (availableMinutes > 0 && hasWork()) {
        let selectedQueue: CourseQueue | undefined;
        for (let offset = 0; offset < queues.length; offset += 1) {
          const candidateIndex = (roundRobin + offset) % queues.length;
          if (nextItem(queues[candidateIndex])) {
            selectedQueue = queues[candidateIndex];
            roundRobin = (candidateIndex + 1) % queues.length;
            break;
          }
        }
        if (!selectedQueue) break;
        const item = nextItem(selectedQueue);
        if (!item) break;
        const plannedMinutes = Math.min(
          MAX_SESSION_MINUTES,
          item.remainingMinutes,
          availableMinutes,
        );
        const offsetStart = item.offsetMinutes;
        const entry: ScheduleEntry = {
          id: calendarEntryId(
            `${bundle.programVersion.id}|${item.subjectKey}|${offsetStart}|${
              offsetStart + plannedMinutes
            }`,
          ),
          subject: item.subject,
          scheduledDate: dateCursor,
          startTime: clockTime(usedMinutes, sessionIndex),
          plannedMinutes,
          position: globalPosition,
          source: "generated",
          status: "planned",
        };
        provisionalSessions.push({ entry, item, offset: offsetStart });
        item.remainingMinutes -= plannedMinutes;
        item.offsetMinutes += plannedMinutes;
        usedMinutes += plannedMinutes;
        availableMinutes -= plannedMinutes;
        sessionIndex += 1;
        globalPosition += 1;
        lastScheduledDate = dateCursor;
      }
      usedMinutesByDate.set(dateCursor, usedMinutes);
      sessionsByDate.set(dateCursor, sessionIndex);
      if (hasWork()) dateCursor = addDays(dateCursor, 1);
    }

    const fixedTermDates = fixedActiveEntries
      .filter((entry) =>
        termItems.some((item) => item.subjectKey === subjectKey(entry.subject)),
      )
      .map((entry) => entry.scheduledDate);
    for (const fixedDate of fixedTermDates) {
      lastScheduledDate = laterDate(lastScheduledDate, fixedDate);
    }
    if (completedTermMinutes >= totalTermMinutes && fixedTermDates.length === 0) {
      const nominalDays = Math.max(
        1,
        Math.ceil(totalTermMinutes / Math.max(1, effectiveWeeklyMinutes)) * 7,
      );
      lastScheduledDate = addDays(termStartDate, nominalDays - 1);
    }
    termDrafts.push({
      periodId,
      label: periodLabel.get(periodId) ?? `Term ${periodIndex + 1}`,
      startDate: termStartDate,
      endDate: laterDate(termStartDate, lastScheduledDate),
      courseVersionIds,
    });
    termCursor = nextStudyDate(
      addDays(laterDate(termStartDate, lastScheduledDate), BREAK_DAYS + 1),
      studyDaySet,
    );
  }

  const deadlineBySubject = new Map<string, string>();
  for (const { entry, item } of provisionalSessions) {
    deadlineBySubject.set(
      item.subjectKey,
      laterDate(deadlineBySubject.get(item.subjectKey) ?? entry.scheduledDate, entry.scheduledDate),
    );
  }
  for (const entry of fixedActiveEntries) {
    const key = subjectKey(entry.subject);
    deadlineBySubject.set(
      key,
      laterDate(deadlineBySubject.get(key) ?? entry.scheduledDate, entry.scheduledDate),
    );
  }
  for (const session of provisionalSessions) {
    generatedSessions.push(
      sessionFromEntry(
        session.entry,
        session.item,
        deadlineBySubject.get(session.item.subjectKey) ?? session.entry.scheduledDate,
        session.offset,
        completedMinutesBySubject.get(session.item.subjectKey) ?? 0,
      ),
    );
  }

  const persistedSession = (entry: ScheduleEntry) => {
    const item = itemsBySubject.get(subjectKey(entry.subject));
    if (!item) return undefined;
    return sessionFromEntry(
      entry,
      item,
      deadlineBySubject.get(item.subjectKey) ?? entry.scheduledDate,
      completedMinutesBySubject.get(item.subjectKey) ?? 0,
      completedMinutesBySubject.get(item.subjectKey) ?? 0,
    );
  };
  const generatedToday = generatedSessions.filter(
    (session) => session.entry.scheduledDate === today,
  );
  const persistedToday = storedEntries
    .filter((entry) => entry.scheduledDate === today)
    .map((entry) =>
      persistedSession(
        carriedEntryIds.has(entry.id)
          ? { ...entry, status: "carried", completedAt: undefined }
          : entry,
      ),
    )
    .filter((session): session is CalendarStudySession => session !== undefined);
  const carriedToday = carriedEntries
    .filter((entry) => entry.scheduledDate === today)
    .map(persistedSession)
    .filter((session): session is CalendarStudySession => session !== undefined);
  const todayById = new Map<string, CalendarStudySession>();
  for (const session of [...persistedToday, ...carriedToday, ...generatedToday]) {
    todayById.set(session.entry.id, session);
  }
  const todaySessions = [...todayById.values()].sort(
    (left, right) =>
      (left.entry.startTime ?? "99:99").localeCompare(right.entry.startTime ?? "99:99") ||
      left.entry.position - right.entry.position,
  );
  const existingIds = new Set(storedEntries.map((entry) => entry.id));
  if (isEnrolled) {
    for (const session of generatedToday) {
      if (!existingIds.has(session.entry.id)) {
        reconciliationOperations.push({
          type: "upsert-schedule-entry",
          entry: session.entry,
        });
      }
    }
  }

  const recentHistory = storedEntries
    .filter(
      (entry) =>
        entry.status !== "planned" && dateWithinPastDays(entry.scheduledDate, today, 7),
    )
    .map(persistedSession)
    .filter((session): session is CalendarStudySession => session !== undefined)
    .sort(
      (left, right) =>
        compareDates(right.entry.scheduledDate, left.entry.scheduledDate) ||
        left.entry.position - right.entry.position,
    );

  const terms: DatedAcademicTerm[] = termDrafts.map((term, index) => {
    const sourceMilestones = (path.calendar?.milestones ?? []).filter(
      (milestone) => !milestone.periodId || milestone.periodId === term.periodId,
    );
    const midpointOffset = Math.max(
      0,
      Math.floor((parseDate(term.endDate).getTime() - parseDate(term.startDate).getTime()) / DAY_MS / 2),
    );
    const milestones = sourceMilestones.map((milestone) => ({
      label: milestone.label,
      kind: milestone.kind,
      date:
        milestone.date ??
        (milestone.kind === "checkpoint"
          ? nextStudyDate(addDays(term.startDate, midpointOffset), studyDaySet)
          : term.endDate),
    }));
    const breakAfter =
      index < termDrafts.length - 1
        ? {
            startDate: addDays(term.endDate, 1),
            endDate: addDays(term.endDate, BREAK_DAYS),
          }
        : undefined;
    return { ...term, milestones, ...(breakAfter ? { breakAfter } : {}) };
  });

  const remainingMinutes = items.reduce((total, item) => {
    return (
      total +
      Math.max(0, item.totalMinutes - (completedMinutesBySubject.get(item.subjectKey) ?? 0))
    );
  }, 0);
  const projectedCompletionDate =
    remainingMinutes === 0
      ? today
      : terms.at(-1)?.endDate ?? today;
  const firstIncompleteTerm = terms.find((term) =>
    items.some(
      (item) =>
        item.periodId === term.periodId &&
        (remainingUncompletedByItem.get(item.subjectKey) ?? 0) > 0,
    ),
  );

  return {
    isEnrolled,
    ...(enrollment ? { enrollment } : {}),
    studyDays,
    requestedWeeklyMinutes,
    effectiveWeeklyMinutes,
    dailyCapacityMinutes: dailyCapacity(today),
    capacityLimited: effectiveWeeklyMinutes < requestedWeeklyMinutes,
    terms,
    sessions: generatedSessions,
    todaySessions,
    recentHistory,
    reconciliationOperations: isEnrolled ? reconciliationOperations : [],
    totalUnits: path.learningUnits.length,
    completedUnits: completedUnitIds.size,
    remainingMinutes,
    estimatedWeeksRemaining:
      remainingMinutes === 0
        ? 0
        : Math.ceil(remainingMinutes / Math.max(1, effectiveWeeklyMinutes)),
    projectedCompletionDate,
    currentPeriodLabel:
      firstIncompleteTerm?.label ?? terms.at(-1)?.label ?? "Independent sequence",
    today,
    todayIsStudyDay: studyDaySet.has(weekday(today)),
  };
}
