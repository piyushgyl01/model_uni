import type {
  CourseVersionId,
  ProgramRequirementEvaluation,
  ProgramVersionId,
  PublishedProgramBundle,
} from "../domain/catalog";
import {
  todayInTimezone,
  type DatedAcademicTerm,
} from "../domain/academic-calendar";
import {
  buildIndependentLearningRecord,
  type IndependentLearningRecord,
  type LearningRecordAssessment,
  type LearningRecordCourse,
  type LearningRecordEvidence,
  type LearningRecordProject,
} from "../domain/independent-learning-record";
import {
  COURSE_MASTERY_STATE_LABELS,
  type CourseMasteryState,
} from "../domain/mastery";
import {
  calculateTodayQueue,
  type TodayQueueResult,
  type TodayStudyBlock,
} from "../domain/today-queue";
import type { TermProgressEvaluation } from "../domain/term-evaluator";
import type { ScheduleEntry } from "../learner-progress-contract";
import type { StoredProgramProgress } from "../progress-storage";
import {
  assertD1Success,
  d1All,
  d1Batch,
  type D1DatabaseLike,
} from "./d1-contract";
import {
  D1LearnerProgressRepository,
  type LearnerProgressSnapshot,
} from "./learner-progress-repository";

export const LEARNER_READ_MODEL_PROJECTION_VERSION = 1;

const MAX_LEARNER_PROGRAMS = 100;
const MAX_PATHWAY_COURSES = 512;
const MAX_TERMS = 64;
const MAX_DAY_ASSIGNMENTS = 512;
const MAX_OPEN_ASSIGNMENTS = 512;
const MAX_HISTORY_ASSIGNMENTS = 512;
const IN_PROGRESS_CALENDAR_DATE = "1900-01-01";

interface ProjectionMetadataRow {
  readonly bundle_id: string;
  readonly payload_hash: string;
  readonly revision: number | null;
  readonly timezone: string | null;
  readonly projected_revision: number | null;
  readonly projected_payload_hash: string | null;
  readonly projected_version: number | null;
  readonly projected_calendar_date: string | null;
}

interface SnapshotRow {
  readonly bundle_id: string;
  readonly source_progress_revision: number;
  readonly calendar_as_of_date: string;
  readonly selected_concentration_id: string | null;
  readonly selected_concentration_title: string | null;
  readonly path_resolved: number;
  readonly requirements_satisfied: number;
  readonly course_count: number;
  readonly learning_unit_count: number;
  readonly assessment_count: number;
  readonly nominal_hours: number;
  readonly requirement_evaluation_json: string;
  readonly diagnostics_json: string;
  readonly calendar_summary_json: string;
  readonly source_payload_hash: string;
  readonly projection_version: number;
  readonly rebuilt_at: string;
}

interface PathwayCourseRow {
  readonly course_version_id: string;
  readonly course_id: string;
  readonly canonical_slug: string;
  readonly code: string | null;
  readonly title: string;
  readonly summary: string;
  readonly format: string;
  readonly nominal_hours: number;
  readonly position: number;
  readonly period_id: string | null;
  readonly period_label: string | null;
  readonly requirement_group_ids_json: string;
  readonly prerequisite_course_version_ids_json: string;
  readonly learning_unit_count: number;
  readonly assessment_count: number;
}

interface TermScheduleRow {
  readonly term_key: string;
  readonly period_id: string | null;
  readonly label: string;
  readonly position: number;
  readonly start_date: string;
  readonly end_date: string;
  readonly status: "completed" | "current" | "upcoming";
  readonly course_version_ids_json: string;
  readonly milestones_json: string;
  readonly break_start_date: string | null;
  readonly break_end_date: string | null;
  readonly total_planned_minutes: number;
  readonly completed_minutes: number;
}

interface AssignmentRow {
  readonly assignment_id: string;
  readonly schedule_entry_id: string;
  readonly scheduled_date: string;
  readonly status: ScheduleEntry["status"];
  readonly completed_at: string | null;
  readonly assignment_json: string;
}

interface TranscriptRow {
  readonly course_version_id: string;
  readonly course_canonical_slug: string;
  readonly code: string;
  readonly title: string;
  readonly format: string;
  readonly position: number;
  readonly nominal_hours: number;
  readonly total_units: number;
  readonly completed_units: number;
  readonly completed_learning_hours: number;
  readonly mastery_state: CourseMasteryState;
  readonly passed: number;
  readonly weighted_score_percentage: number | null;
  readonly assessment_hours: number;
  readonly assessment_count: number;
  readonly assessment_attempt_count: number;
  readonly project_count: number;
  readonly evidenced_project_count: number;
  readonly evidence_count: number;
  readonly assessments_json: string;
  readonly projects_json: string;
  readonly evidence_json: string;
}

interface LearnerProgramRow {
  readonly program_version_id: string;
  readonly canonical_slug: string;
  readonly semantic_version: string;
  readonly title: string;
  readonly school: string;
  readonly discipline: string;
  readonly kind: string;
  readonly credential_label: string;
  readonly enrollment_status: string | null;
  readonly start_date: string | null;
  readonly pace_hours_per_week: number | null;
  readonly timezone: string | null;
  readonly revision: number | null;
  readonly updated_at: string;
}

interface CalendarProjectionSummary {
  readonly program: {
    readonly programVersionId: ProgramVersionId;
    readonly slug: string;
    readonly title: string;
    readonly school: string;
    readonly version: string;
    readonly selectedConcentrationTitle?: string;
  };
  readonly enrollment: LearnerProgressSnapshot["enrollment"];
  readonly selectedConcentrationId?: string;
  readonly selectedConcentrationTitle?: string;
  readonly pathwayRequirementsCompleted: boolean;
  readonly requirementGroups: readonly LearnerRequirementGroupView[];
  readonly termProgress: TermProgressEvaluation;
  readonly today: Omit<
    TodayQueueResult,
    "blocks" | "recentHistory" | "terms" | "reconciliationOperations"
  >;
  readonly recordTotals: IndependentLearningRecord["totals"];
}

export interface LearnerProgramReference {
  readonly programVersionId: ProgramVersionId;
  readonly slug: string;
  readonly semanticVersion: string;
  readonly title: string;
  readonly school: string;
  readonly discipline: string;
  readonly kind: string;
  readonly credentialLabel: string;
  readonly enrollmentStatus:
    | "not_enrolled"
    | "enrolled"
    | "paused"
    | "completed";
  readonly startDate?: string;
  readonly paceHoursPerWeek?: number;
  readonly timezone?: string;
  readonly revision: number;
  readonly updatedAt: string;
}

export interface LearnerPathwayCourseView {
  readonly courseVersionId: CourseVersionId;
  readonly courseId: string;
  readonly canonicalSlug: string;
  readonly canonicalPath: string;
  readonly code?: string;
  readonly title: string;
  readonly summary: string;
  readonly format: string;
  readonly nominalHours: number;
  readonly position: number;
  readonly periodId?: string;
  readonly periodLabel?: string;
  readonly requirementGroupIds: readonly string[];
  readonly prerequisiteCourseVersionIds: readonly string[];
  readonly learningUnitCount: number;
  readonly assessmentCount: number;
}

export interface LearnerTermView extends DatedAcademicTerm {
  readonly key: string;
  readonly position: number;
  readonly status: "completed" | "current" | "upcoming";
  readonly totalPlannedMinutes: number;
  readonly completedMinutes: number;
}

export interface LearnerTodayView {
  readonly projectionVersion: number;
  readonly sourceProgressRevision: number;
  readonly rebuiltAt: string;
  readonly program: CalendarProjectionSummary["program"];
  readonly queue: Omit<
    TodayQueueResult,
    "reconciliationOperations" | "terms"
  > & { readonly terms: readonly LearnerTermView[] };
  readonly termProgress: TermProgressEvaluation;
}

export interface LearnerRecordCourseView extends LearningRecordCourse {
  readonly canonicalPath: string;
}

export interface LearnerRequirementGroupView {
  readonly id: string;
  readonly title: string;
  readonly minSelections: number;
  readonly evaluation: ProgramRequirementEvaluation["groups"][number];
}

export interface LearnerRecordView {
  readonly projectionVersion: number;
  readonly sourceProgressRevision: number;
  readonly rebuiltAt: string;
  readonly program: CalendarProjectionSummary["program"];
  readonly enrollment: LearnerProgressSnapshot["enrollment"];
  readonly requirementGroups: readonly LearnerRequirementGroupView[];
  readonly exactPath: {
    readonly isResolved: boolean;
    readonly diagnostics: readonly unknown[];
    readonly totals: {
      readonly courseCount: number;
      readonly learningUnitCount: number;
      readonly assessmentCount: number;
      readonly nominalHours: number;
    };
    readonly courses: readonly LearnerPathwayCourseView[];
  };
  readonly record: {
    readonly requirementEvaluation: ProgramRequirementEvaluation;
    readonly pathwayRequirementsCompleted: boolean;
    readonly courses: readonly LearnerRecordCourseView[];
    readonly projects: readonly LearningRecordProject[];
    readonly evidence: readonly LearningRecordEvidence[];
    readonly totals: IndependentLearningRecord["totals"];
  };
}

export class LearnerReadModelNotFoundError extends Error {
  constructor(readonly programVersionId: string) {
    super(`No learner record exists for program version ${programVersionId}.`);
    this.name = "LearnerReadModelNotFoundError";
  }
}

export class LearnerReadModelDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LearnerReadModelDataError";
  }
}

function parseJson<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new LearnerReadModelDataError(`${label} is not valid JSON.`);
  }
}

function assertWithinLimit(
  count: number,
  maximum: number,
  label: string,
): void {
  if (count > maximum) {
    throw new LearnerReadModelDataError(
      `${label} exceeds the bounded read-model limit of ${maximum}.`,
    );
  }
}

function toStoredProgress(
  snapshot: LearnerProgressSnapshot,
  projectedScheduleEntries: Readonly<Record<string, ScheduleEntry>>,
): StoredProgramProgress {
  return {
    serverRevision: snapshot.revision,
    courses: snapshot.courses,
    ...(snapshot.selectedConcentrationId
      ? { selectedConcentrationId: snapshot.selectedConcentrationId }
      : {}),
    requirementSelections: snapshot.requirementSelections,
    ...(snapshot.enrollment ? { enrollment: snapshot.enrollment } : {}),
    unitEvidences: snapshot.unitEvidences,
    assessmentAttempts: snapshot.assessmentAttempts,
    scheduleEntries: {
      ...projectedScheduleEntries,
      ...snapshot.scheduleEntries,
    },
    prerequisiteWaivers: snapshot.prerequisiteWaivers,
    history: snapshot.history,
    ...(snapshot.updatedAt ? { updatedAt: snapshot.updatedAt } : {}),
  };
}

function dayBefore(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function subjectColumns(block: TodayStudyBlock) {
  if (block.scheduleEntry.subject.kind === "learningUnit") {
    return {
      subjectKind: "learning_unit",
      learningUnitId: block.scheduleEntry.subject.id,
      assessmentVersionId: null,
    } as const;
  }
  if (block.scheduleEntry.subject.kind === "assessmentVersion") {
    return {
      subjectKind: "assessment_version",
      learningUnitId: block.unitId,
      assessmentVersionId: block.scheduleEntry.subject.id,
    } as const;
  }
  throw new LearnerReadModelDataError(
    `Today assignment ${block.scheduleEntryId} has an unsupported course-level subject.`,
  );
}

function cloneBlockForEntry(
  block: TodayStudyBlock,
  entry: ScheduleEntry,
): TodayStudyBlock {
  return {
    ...block,
    scheduleEntry: entry,
    scheduleEntryId: entry.id,
    plannedMinutes: entry.plannedMinutes,
    estimatedHours: Math.round((entry.plannedMinutes / 60) * 10) / 10,
    completed: entry.status === "completed",
    deadlineDate:
      block.deadlineDate >= entry.scheduledDate
        ? block.deadlineDate
        : entry.scheduledDate,
    completesUnit:
      block.scheduleEntryId === entry.id ? block.completesUnit : false,
  };
}

function completionStateForTerm(
  term: DatedAcademicTerm,
  today: string,
  currentPeriodLabel: string,
  passedCourseVersionIds: ReadonlySet<string>,
) {
  if (
    term.courseVersionIds.length > 0 &&
    term.courseVersionIds.every((id) => passedCourseVersionIds.has(id))
  ) {
    return "completed" as const;
  }
  if (term.label === currentPeriodLabel || term.startDate <= today) {
    return "current" as const;
  }
  return "upcoming" as const;
}

function termProgressFor(
  terms: readonly DatedAcademicTerm[],
  record: IndependentLearningRecord,
): TermProgressEvaluation {
  const courseById = new Map(
    record.courses.map((course) => [course.courseVersionId, course]),
  );
  const periods = terms.map((term, index) => {
    const courses = term.courseVersionIds
      .map((courseVersionId) => courseById.get(courseVersionId))
      .filter((course): course is LearningRecordCourse => course !== undefined);
    const completedCourses = courses.filter((course) => course.passed).length;
    const totalCourses = courses.length;
    return {
      periodId: term.periodId ?? `term-${index + 1}`,
      label: term.label,
      order: index + 1,
      totalCourses,
      completedCourses,
      isCompleted: totalCourses > 0 && completedCourses === totalCourses,
      percentage:
        totalCourses > 0
          ? Math.round((completedCourses / totalCourses) * 100)
          : 0,
      courseTitles: courses.map((course) => course.title),
    };
  });
  const activeIndex = periods.findIndex((period) => !period.isCompleted);
  const effectiveActiveIndex = Math.max(
    0,
    activeIndex === -1 ? periods.length - 1 : activeIndex,
  );
  const activeTermProgress = periods[effectiveActiveIndex] ?? {
    periodId: "term-1",
    label: "Term 1",
    order: 1,
    totalCourses: 0,
    completedCourses: 0,
    isCompleted: false,
    percentage: 0,
    courseTitles: [],
  };
  return {
    totalTerms: Math.max(1, periods.length),
    activeTermNumber: activeTermProgress.order,
    activeTermLabel: activeTermProgress.label,
    activeTermProgress,
    ...(periods[effectiveActiveIndex + 1]
      ? { nextTermProgress: periods[effectiveActiveIndex + 1] }
      : {}),
    allTermsSatisfied:
      periods.length > 0 && periods.every((period) => period.isCompleted),
    periods,
  };
}

export class LearnerReadModelRepository {
  readonly database: D1DatabaseLike;
  readonly progressRepository: D1LearnerProgressRepository;

  constructor(progressRepository: D1LearnerProgressRepository) {
    this.progressRepository = progressRepository;
    this.database = progressRepository.database;
  }

  async listLearnerPrograms(
    learnerId: string,
  ): Promise<readonly LearnerProgramReference[]> {
    const rows = await d1All<LearnerProgramRow>(
      this.database
        .prepare(
          `SELECT
             progress.program_version_id,
             summary.canonical_slug,
             summary.semantic_version,
             summary.title,
             summary.school,
             summary.discipline,
             summary.kind,
             summary.credential_label,
             state.enrollment_status,
             state.start_date,
             state.pace_hours_per_week,
             state.timezone,
             state.revision,
             COALESCE(state.updated_at, progress.updated_at) AS updated_at
           FROM learner_program_progress AS progress
           JOIN catalog_program_summaries AS summary
             ON summary.program_version_id = progress.program_version_id
           LEFT JOIN learner_program_states AS state
             ON state.learner_id = progress.learner_id
            AND state.program_version_id = progress.program_version_id
           WHERE progress.learner_id = ?
           ORDER BY
             CASE state.enrollment_status
               WHEN 'enrolled' THEN 0
               WHEN 'paused' THEN 1
               WHEN 'completed' THEN 2
               ELSE 3
             END,
             updated_at DESC,
             summary.title_sort_key,
             progress.program_version_id
           LIMIT ?`,
        )
        .bind(learnerId, MAX_LEARNER_PROGRAMS + 1),
      "list learner program read models",
    );
    assertWithinLimit(rows.length, MAX_LEARNER_PROGRAMS, "Learner programs");
    return rows.map((row) => ({
      programVersionId: row.program_version_id as ProgramVersionId,
      slug: row.canonical_slug,
      semanticVersion: row.semantic_version,
      title: row.title,
      school: row.school,
      discipline: row.discipline,
      kind: row.kind,
      credentialLabel: row.credential_label,
      enrollmentStatus: (row.enrollment_status ?? "not_enrolled") as
        LearnerProgramReference["enrollmentStatus"],
      ...(row.start_date ? { startDate: row.start_date } : {}),
      ...(row.pace_hours_per_week !== null
        ? { paceHoursPerWeek: row.pace_hours_per_week }
        : {}),
      ...(row.timezone ? { timezone: row.timezone } : {}),
      revision: row.revision ?? 0,
      updatedAt: row.updated_at,
    }));
  }

  async getTodayView(
    learnerId: string,
    programVersionId: ProgramVersionId,
    requestedDate?: string,
  ): Promise<LearnerTodayView> {
    const date = await this.ensureProjection(
      learnerId,
      programVersionId,
      requestedDate,
    );
    const [snapshotRows, assignmentRows, historyRows, termRows] = await Promise.all([
      this.loadSnapshot(learnerId, programVersionId),
      d1All<AssignmentRow>(
        this.database
          .prepare(
            `SELECT assignment_id, schedule_entry_id, scheduled_date, status,
                    completed_at, assignment_json
             FROM learner_today_assignment_rows
             WHERE learner_id = ? AND program_version_id = ?
               AND scheduled_date = ?
             ORDER BY position, assignment_id
             LIMIT ?`,
          )
          .bind(learnerId, programVersionId, date, MAX_DAY_ASSIGNMENTS + 1),
        "load learner today assignments",
      ),
      d1All<AssignmentRow>(
        this.database
          .prepare(
            `SELECT assignment_id, schedule_entry_id, scheduled_date, status,
                    completed_at, assignment_json
             FROM learner_today_assignment_rows
             WHERE learner_id = ? AND program_version_id = ?
               AND scheduled_date >= ? AND scheduled_date < ?
               AND status <> 'planned'
             ORDER BY scheduled_date DESC, position, assignment_id
             LIMIT ?`,
          )
          .bind(
            learnerId,
            programVersionId,
            dayBefore(date, 7),
            date,
            MAX_HISTORY_ASSIGNMENTS + 1,
          ),
        "load learner assignment history",
      ),
      d1All<TermScheduleRow>(
        this.database
          .prepare(
            `SELECT term_key, period_id, label, position, start_date, end_date,
                    status, course_version_ids_json, milestones_json,
                    break_start_date, break_end_date, total_planned_minutes,
                    completed_minutes
             FROM learner_term_schedule_rows
             WHERE learner_id = ? AND program_version_id = ?
             ORDER BY position, term_key
             LIMIT ?`,
          )
          .bind(learnerId, programVersionId, MAX_TERMS + 1),
        "load learner term schedule",
      ),
    ]);
    assertWithinLimit(assignmentRows.length, MAX_DAY_ASSIGNMENTS, "Today assignments");
    assertWithinLimit(
      historyRows.length,
      MAX_HISTORY_ASSIGNMENTS,
      "Assignment history",
    );
    assertWithinLimit(termRows.length, MAX_TERMS, "Term schedule");
    const snapshot = snapshotRows[0];
    if (!snapshot) throw new LearnerReadModelNotFoundError(programVersionId);
    const summary = parseJson<CalendarProjectionSummary>(
      snapshot.calendar_summary_json,
      "Learner calendar summary",
    );
    const historyByDate = new Map<string, TodayStudyBlock[]>();
    for (const row of historyRows) {
      const block = this.blockFromRow(row);
      const blocks = historyByDate.get(row.scheduled_date) ?? [];
      blocks.push(block);
      historyByDate.set(row.scheduled_date, blocks);
    }
    return {
      projectionVersion: snapshot.projection_version,
      sourceProgressRevision: snapshot.source_progress_revision,
      rebuiltAt: snapshot.rebuilt_at,
      program: summary.program,
      queue: {
        ...summary.today,
        blocks: assignmentRows.map((row) => this.blockFromRow(row)),
        recentHistory: [...historyByDate.entries()].map(
          ([historyDate, blocks]) => ({
            date: historyDate,
            blocks,
          }),
        ),
        terms: termRows.map((row) => this.termFromRow(row)),
      },
      termProgress: summary.termProgress,
    };
  }

  async getRecordView(
    learnerId: string,
    programVersionId: ProgramVersionId,
    requestedDate?: string,
  ): Promise<LearnerRecordView> {
    await this.ensureProjection(learnerId, programVersionId, requestedDate);
    const [snapshotRows, pathwayRows, transcriptRows] = await Promise.all([
      this.loadSnapshot(learnerId, programVersionId),
      d1All<PathwayCourseRow>(
        this.database
          .prepare(
            `SELECT course_version_id, course_id, canonical_slug, code, title,
                    summary, format, nominal_hours, position, period_id,
                    period_label, requirement_group_ids_json,
                    prerequisite_course_version_ids_json, learning_unit_count,
                    assessment_count
             FROM learner_pathway_course_rows
             WHERE learner_id = ? AND program_version_id = ?
             ORDER BY position, course_version_id
             LIMIT ?`,
          )
          .bind(learnerId, programVersionId, MAX_PATHWAY_COURSES + 1),
        "load exact learner pathway",
      ),
      d1All<TranscriptRow>(
        this.database
          .prepare(
            `SELECT course_version_id, course_canonical_slug, code, title,
                    format, position, nominal_hours, total_units,
                    completed_units, completed_learning_hours, mastery_state,
                    passed, weighted_score_percentage, assessment_hours,
                    assessment_count, assessment_attempt_count, project_count,
                    evidenced_project_count, evidence_count, assessments_json,
                    projects_json, evidence_json
             FROM learner_transcript_rows
             WHERE learner_id = ? AND program_version_id = ?
             ORDER BY position, course_version_id
             LIMIT ?`,
          )
          .bind(learnerId, programVersionId, MAX_PATHWAY_COURSES + 1),
        "load independent learning record rows",
      ),
    ]);
    assertWithinLimit(pathwayRows.length, MAX_PATHWAY_COURSES, "Pathway courses");
    assertWithinLimit(transcriptRows.length, MAX_PATHWAY_COURSES, "Record courses");
    const snapshot = snapshotRows[0];
    if (!snapshot) throw new LearnerReadModelNotFoundError(programVersionId);
    const summary = parseJson<CalendarProjectionSummary>(
      snapshot.calendar_summary_json,
      "Learner calendar summary",
    );
    const projects = transcriptRows.flatMap((row) =>
      parseJson<LearningRecordProject[]>(row.projects_json, `Projects for ${row.title}`),
    );
    const evidence = transcriptRows.flatMap((row) =>
      parseJson<LearningRecordEvidence[]>(row.evidence_json, `Evidence for ${row.title}`),
    );
    return {
      projectionVersion: snapshot.projection_version,
      sourceProgressRevision: snapshot.source_progress_revision,
      rebuiltAt: snapshot.rebuilt_at,
      program: summary.program,
      enrollment: summary.enrollment,
      requirementGroups: summary.requirementGroups,
      exactPath: {
        isResolved: Boolean(snapshot.path_resolved),
        diagnostics: parseJson<unknown[]>(
          snapshot.diagnostics_json,
          "Learner pathway diagnostics",
        ),
        totals: {
          courseCount: snapshot.course_count,
          learningUnitCount: snapshot.learning_unit_count,
          assessmentCount: snapshot.assessment_count,
          nominalHours: snapshot.nominal_hours,
        },
        courses: pathwayRows.map((row) => this.pathwayCourseFromRow(row, summary.program.slug)),
      },
      record: {
        requirementEvaluation: parseJson<ProgramRequirementEvaluation>(
          snapshot.requirement_evaluation_json,
          "Learner requirement evaluation",
        ),
        pathwayRequirementsCompleted: Boolean(snapshot.requirements_satisfied),
        courses: transcriptRows.map((row) =>
          this.recordCourseFromRow(row, summary.program.slug),
        ),
        projects,
        evidence,
        totals: summary.recordTotals,
      },
    };
  }

  private async ensureProjection(
    learnerId: string,
    programVersionId: ProgramVersionId,
    requestedDate?: string,
    attempt = 0,
  ): Promise<string> {
    const metadata = await this.loadProjectionMetadata(learnerId, programVersionId);
    if (!metadata) throw new LearnerReadModelNotFoundError(programVersionId);
    const date = requestedDate ?? todayInTimezone(metadata.timezone ?? "UTC");
    const revision = metadata.revision ?? 0;
    if (
      metadata.projected_revision === revision &&
      metadata.projected_payload_hash === metadata.payload_hash &&
      metadata.projected_version === LEARNER_READ_MODEL_PROJECTION_VERSION &&
      metadata.projected_calendar_date === date
    ) {
      return date;
    }

    const [snapshot, bundle] = await Promise.all([
      this.progressRepository.loadProgress(learnerId, programVersionId),
      this.progressRepository.catalog.loadByProgramVersionId(programVersionId),
    ]);
    if (!bundle || bundle.id !== metadata.bundle_id) {
      throw new LearnerReadModelDataError(
        `Program version ${programVersionId} is not pinned to its published bundle.`,
      );
    }
    const openScheduleEntries = await this.loadOpenProjectedScheduleEntries(
      learnerId,
      programVersionId,
      snapshot,
    );
    const progress = toStoredProgress(snapshot, openScheduleEntries);
    const queue = calculateTodayQueue(bundle, progress, date);
    const record = buildIndependentLearningRecord(bundle, progress);
    await this.persistProjection(
      learnerId,
      bundle,
      metadata.payload_hash,
      snapshot,
      queue,
      record,
    );

    const current = await this.loadProjectionMetadata(learnerId, programVersionId);
    if ((current?.revision ?? 0) !== snapshot.revision) {
      if (attempt >= 1) {
        throw new LearnerReadModelDataError(
          "Learner progress changed repeatedly while rebuilding its read model.",
        );
      }
      return this.ensureProjection(learnerId, programVersionId, date, attempt + 1);
    }
    return date;
  }

  private async loadProjectionMetadata(
    learnerId: string,
    programVersionId: ProgramVersionId,
  ) {
    const rows = await d1All<ProjectionMetadataRow>(
      this.database
        .prepare(
          `SELECT
             progress.bundle_id,
             bundle.payload_hash,
             state.revision,
             state.timezone,
             snapshot.source_progress_revision AS projected_revision,
             snapshot.source_payload_hash AS projected_payload_hash,
             snapshot.projection_version AS projected_version,
             snapshot.calendar_as_of_date AS projected_calendar_date
           FROM learner_program_progress AS progress
           JOIN catalog_bundles AS bundle
             ON bundle.id = progress.bundle_id
            AND bundle.program_version_id = progress.program_version_id
           LEFT JOIN learner_program_states AS state
             ON state.learner_id = progress.learner_id
            AND state.program_version_id = progress.program_version_id
           LEFT JOIN learner_pathway_snapshots AS snapshot
             ON snapshot.learner_id = progress.learner_id
            AND snapshot.program_version_id = progress.program_version_id
           WHERE progress.learner_id = ? AND progress.program_version_id = ?`,
        )
        .bind(learnerId, programVersionId),
      "load learner projection metadata",
    );
    if (rows.length > 1) {
      throw new LearnerReadModelDataError(
        `Multiple learner projection headers exist for ${programVersionId}.`,
      );
    }
    return rows[0];
  }

  private async loadSnapshot(
    learnerId: string,
    programVersionId: ProgramVersionId,
  ) {
    return d1All<SnapshotRow>(
      this.database
        .prepare(
          `SELECT bundle_id, source_progress_revision, calendar_as_of_date,
                  selected_concentration_id, selected_concentration_title,
                  path_resolved, requirements_satisfied, course_count,
                  learning_unit_count, assessment_count, nominal_hours,
                  requirement_evaluation_json, diagnostics_json,
                  calendar_summary_json, source_payload_hash,
                  projection_version, rebuilt_at
           FROM learner_pathway_snapshots
           WHERE learner_id = ? AND program_version_id = ?
             AND calendar_as_of_date <> ?`,
        )
        .bind(learnerId, programVersionId, IN_PROGRESS_CALENDAR_DATE),
      "load learner pathway snapshot",
    );
  }

  private async loadOpenProjectedScheduleEntries(
    learnerId: string,
    programVersionId: ProgramVersionId,
    progress: LearnerProgressSnapshot,
  ) {
    const rows = await d1All<AssignmentRow>(
      this.database
        .prepare(
          `SELECT assignment_id, schedule_entry_id, scheduled_date, status,
                  completed_at, assignment_json
           FROM learner_today_assignment_rows
           WHERE learner_id = ? AND program_version_id = ?
             AND status = 'planned'
           ORDER BY scheduled_date, assignment_id
           LIMIT ?`,
        )
        .bind(learnerId, programVersionId, MAX_OPEN_ASSIGNMENTS + 1),
      "load open projected assignments",
    );
    assertWithinLimit(rows.length, MAX_OPEN_ASSIGNMENTS, "Open assignments");
    const completedUnits = new Map(
      Object.entries(progress.courses).map(([courseVersionId, course]) => [
        courseVersionId,
        new Set(course.completedUnitIds),
      ]),
    );
    const closedAssessments = new Set(
      Object.values(progress.assessmentAttempts)
        .filter((attempt) =>
          attempt.status === "submitted" || attempt.status === "evaluated",
        )
        .map((attempt) => attempt.assessmentVersionId),
    );
    return Object.fromEntries(
      rows.flatMap((row) => {
        const block = this.blockFromRow(row);
        const subject = block.scheduleEntry.subject;
        if (
          subject.kind === "learningUnit" &&
          completedUnits.get(block.courseVersionId)?.has(subject.id)
        ) {
          return [];
        }
        if (
          subject.kind === "assessmentVersion" &&
          closedAssessments.has(subject.id)
        ) {
          return [];
        }
        if (progress.scheduleEntries[row.schedule_entry_id]) return [];
        return [[row.schedule_entry_id, block.scheduleEntry] as const];
      }),
    );
  }

  private async persistProjection(
    learnerId: string,
    bundle: PublishedProgramBundle,
    sourcePayloadHash: string,
    progress: LearnerProgressSnapshot,
    queue: TodayQueueResult,
    record: IndependentLearningRecord,
  ) {
    const programVersionId = bundle.programVersion.id;
    const concentration = bundle.concentrations.find(
      (candidate) => candidate.id === record.learnerPath.selectedConcentrationId,
    );
    const todaySummary: CalendarProjectionSummary["today"] = {
      isEnrolled: queue.isEnrolled,
      ...(queue.enrollment ? { enrollment: queue.enrollment } : {}),
      programTitle: queue.programTitle,
      programSlug: queue.programSlug,
      programVersionId: queue.programVersionId,
      today: queue.today,
      todayIsStudyDay: queue.todayIsStudyDay,
      dailyTargetHours: queue.dailyTargetHours,
      effectiveWeeklyHours: queue.effectiveWeeklyHours,
      capacityLimited: queue.capacityLimited,
      totalCompletedUnits: queue.totalCompletedUnits,
      totalUnits: queue.totalUnits,
      completedBlocksToday: queue.completedBlocksToday,
      totalBlocksToday: queue.totalBlocksToday,
      estimatedWeeksRemaining: queue.estimatedWeeksRemaining,
      estimatedCompletionDate: queue.estimatedCompletionDate,
      remainingHours: queue.remainingHours,
      currentPeriodLabel: queue.currentPeriodLabel,
    };
    const summary: CalendarProjectionSummary = {
      program: {
        programVersionId,
        slug: bundle.program.canonicalSlug,
        title: bundle.programVersion.title,
        school: bundle.program.school,
        version: bundle.programVersion.version,
        ...(concentration
          ? { selectedConcentrationTitle: concentration.title }
          : {}),
      },
      enrollment: progress.enrollment,
      ...(record.learnerPath.selectedConcentrationId
        ? { selectedConcentrationId: record.learnerPath.selectedConcentrationId }
        : {}),
      ...(concentration ? { selectedConcentrationTitle: concentration.title } : {}),
      pathwayRequirementsCompleted: record.pathwayRequirementsCompleted,
      requirementGroups: bundle.programVersion.requirements.map((group) => {
        const evaluation = record.requirementEvaluation.groups.find(
          (candidate) => candidate.requirementGroupId === group.id,
        );
        if (!evaluation) {
          throw new LearnerReadModelDataError(
            `Requirement evaluation ${group.id} is missing from the shared resolver.`,
          );
        }
        return {
          id: group.id,
          title: group.title,
          minSelections: group.rule.minSelections,
          evaluation,
        };
      }),
      termProgress: termProgressFor(queue.terms, record),
      today: todaySummary,
      recordTotals: record.totals,
    };

    const headerResult = await this.database
      .prepare(
        `INSERT INTO learner_pathway_snapshots (
           learner_id, program_version_id, bundle_id, source_progress_revision,
           calendar_as_of_date, selected_concentration_id,
           selected_concentration_title, path_resolved, requirements_satisfied,
           course_count, learning_unit_count, assessment_count, nominal_hours,
           requirement_evaluation_json, diagnostics_json, calendar_summary_json,
           source_payload_hash, projection_version, rebuilt_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(learner_id, program_version_id) DO UPDATE SET
           bundle_id = excluded.bundle_id,
           source_progress_revision = excluded.source_progress_revision,
           calendar_as_of_date = excluded.calendar_as_of_date,
           selected_concentration_id = excluded.selected_concentration_id,
           selected_concentration_title = excluded.selected_concentration_title,
           path_resolved = excluded.path_resolved,
           requirements_satisfied = excluded.requirements_satisfied,
           course_count = excluded.course_count,
           learning_unit_count = excluded.learning_unit_count,
           assessment_count = excluded.assessment_count,
           nominal_hours = excluded.nominal_hours,
           requirement_evaluation_json = excluded.requirement_evaluation_json,
           diagnostics_json = excluded.diagnostics_json,
           calendar_summary_json = excluded.calendar_summary_json,
           source_payload_hash = excluded.source_payload_hash,
           projection_version = excluded.projection_version,
           rebuilt_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        learnerId,
        programVersionId,
        bundle.id,
        progress.revision,
        IN_PROGRESS_CALENDAR_DATE,
        record.learnerPath.selectedConcentrationId ?? null,
        concentration?.title ?? null,
        record.learnerPath.isResolved ? 1 : 0,
        record.pathwayRequirementsCompleted ? 1 : 0,
        record.learnerPath.totals.courseCount,
        record.learnerPath.totals.learningUnitCount,
        record.learnerPath.totals.assessmentCount,
        record.learnerPath.totals.nominalHours,
        JSON.stringify(record.requirementEvaluation),
        JSON.stringify(record.learnerPath.diagnostics),
        JSON.stringify(summary),
        sourcePayloadHash,
        LEARNER_READ_MODEL_PROJECTION_VERSION,
      )
      .run();
    assertD1Success(headerResult, "mark learner read model rebuild in progress");

    await d1Batch(
      this.database,
      [
        this.database
          .prepare(
            `DELETE FROM learner_pathway_course_rows
             WHERE learner_id = ? AND program_version_id = ?`,
          )
          .bind(learnerId, programVersionId),
        this.database
          .prepare(
            `DELETE FROM learner_term_schedule_rows
             WHERE learner_id = ? AND program_version_id = ?`,
          )
          .bind(learnerId, programVersionId),
        this.database
          .prepare(
            `DELETE FROM learner_transcript_rows
             WHERE learner_id = ? AND program_version_id = ?`,
          )
          .bind(learnerId, programVersionId),
        this.database
          .prepare(
            `DELETE FROM learner_today_assignment_rows
             WHERE learner_id = ? AND program_version_id = ?
               AND scheduled_date = ? AND status = 'planned'`,
          )
          .bind(learnerId, programVersionId, queue.today),
      ],
      "clear stale learner read models",
    );

    const courseIdentityById = new Map(
      bundle.courses.map((course) => [course.id, course]),
    );
    const unitsByCourse = new Map<string, number>();
    for (const unit of record.learnerPath.learningUnits) {
      unitsByCourse.set(
        unit.courseVersionId,
        (unitsByCourse.get(unit.courseVersionId) ?? 0) + 1,
      );
    }
    const assessmentsByCourse = new Map<string, number>();
    for (const assessment of record.learnerPath.assessmentVersions) {
      assessmentsByCourse.set(
        assessment.courseVersionId,
        (assessmentsByCourse.get(assessment.courseVersionId) ?? 0) + 1,
      );
    }
    const requirementGroupsByCourse = new Map<string, string[]>();
    for (const selection of record.learnerPath.requirementSelections) {
      for (const courseVersionId of selection.courseVersionIds) {
        const groupIds = requirementGroupsByCourse.get(courseVersionId) ?? [];
        groupIds.push(selection.requirementGroupId);
        requirementGroupsByCourse.set(courseVersionId, groupIds);
      }
    }
    const periodLabels = new Map(
      (record.learnerPath.calendar?.periods ?? []).map((period) => [
        period.id,
        period.label,
      ]),
    );
    const pathwayStatements = record.learnerPath.courseVersions.map(
      (courseVersion, position) => {
        const course = courseIdentityById.get(courseVersion.courseId);
        if (!course) {
          throw new LearnerReadModelDataError(
            `Course identity ${courseVersion.courseId} is missing.`,
          );
        }
        const periodId = record.learnerPath.coursePeriodIdByCourseVersionId.get(
          courseVersion.id,
        );
        return this.database
          .prepare(
            `INSERT INTO learner_pathway_course_rows (
               learner_id, program_version_id, course_version_id, course_id,
               canonical_slug, code, title, summary, format, nominal_hours,
               position, period_id, period_label, requirement_group_ids_json,
               prerequisite_course_version_ids_json, learning_unit_count,
               assessment_count, source_progress_revision, projection_version,
               rebuilt_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          )
          .bind(
            learnerId,
            programVersionId,
            courseVersion.id,
            courseVersion.courseId,
            course.canonicalSlug,
            course.codes[0]?.value ?? null,
            courseVersion.title,
            courseVersion.summary,
            courseVersion.format,
            courseVersion.nominalHours,
            position,
            periodId ?? null,
            periodId ? (periodLabels.get(periodId) ?? null) : null,
            JSON.stringify(requirementGroupsByCourse.get(courseVersion.id) ?? []),
            JSON.stringify(
              courseVersion.prerequisites.map(
                (prerequisite) => prerequisite.courseVersionId,
              ),
            ),
            unitsByCourse.get(courseVersion.id) ?? 0,
            assessmentsByCourse.get(courseVersion.id) ?? 0,
            progress.revision,
            LEARNER_READ_MODEL_PROJECTION_VERSION,
          );
      },
    );

    const recordCourseById = new Map(
      record.courses.map((course) => [course.courseVersionId, course]),
    );
    const passedCourseVersionIds = new Set(
      record.courses
        .filter((course) => course.passed)
        .map((course) => course.courseVersionId),
    );
    const currentPeriodIndex = Math.max(
      0,
      queue.terms.findIndex((term) => term.label === queue.currentPeriodLabel),
    );
    const termStatements = queue.terms.map((term, position) => {
      const totalPlannedMinutes = term.courseVersionIds.reduce(
        (total, courseVersionId) =>
          total + (recordCourseById.get(courseVersionId)?.nominalHours ?? 0) * 60,
        0,
      );
      const completedMinutes = Math.min(
        totalPlannedMinutes,
        term.courseVersionIds.reduce(
          (total, courseVersionId) =>
            total +
            (recordCourseById.get(courseVersionId)?.completedLearningHours ?? 0) *
              60,
          0,
        ),
      );
      const status =
        position < currentPeriodIndex
          ? "completed"
          : completionStateForTerm(
              term,
              queue.today,
              queue.currentPeriodLabel,
              passedCourseVersionIds,
            );
      return this.database
        .prepare(
          `INSERT INTO learner_term_schedule_rows (
             learner_id, program_version_id, term_key, period_id, label,
             position, start_date, end_date, status, course_version_ids_json,
             milestones_json, break_start_date, break_end_date,
             total_planned_minutes, completed_minutes,
             source_progress_revision, projection_version, rebuilt_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        )
        .bind(
          learnerId,
          programVersionId,
          term.periodId ?? `term-${position + 1}`,
          term.periodId ?? null,
          term.label,
          position,
          term.startDate,
          term.endDate,
          status,
          JSON.stringify(term.courseVersionIds),
          JSON.stringify(term.milestones),
          term.breakAfter?.startDate ?? null,
          term.breakAfter?.endDate ?? null,
          Math.round(totalPlannedMinutes),
          Math.round(completedMinutes),
          progress.revision,
          LEARNER_READ_MODEL_PROJECTION_VERSION,
        );
    });

    const transcriptStatements = record.courses.map((course, position) => {
      const projects = record.projects.filter(
        (project) => project.courseVersionId === course.courseVersionId,
      );
      const evidence = record.evidence.filter(
        (item) => item.courseVersionId === course.courseVersionId,
      );
      return this.database
        .prepare(
          `INSERT INTO learner_transcript_rows (
             learner_id, program_version_id, course_version_id,
             course_canonical_slug, code, title, format, position,
             nominal_hours, total_units, completed_units,
             completed_learning_hours, mastery_state, passed,
             weighted_score_percentage, assessment_hours, assessment_count,
             assessment_attempt_count, project_count, evidenced_project_count,
             evidence_count, assessments_json, projects_json, evidence_json,
             source_progress_revision, projection_version, rebuilt_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        )
        .bind(
          learnerId,
          programVersionId,
          course.courseVersionId,
          course.canonicalSlug,
          course.code,
          course.title,
          course.format,
          position,
          course.nominalHours,
          course.totalUnits,
          course.completedUnits,
          course.completedLearningHours,
          course.masteryState,
          course.passed ? 1 : 0,
          course.weightedScorePercentage ?? null,
          course.assessments.reduce(
            (total, assessment) => total + assessment.estimatedHours,
            0,
          ),
          course.assessments.length,
          course.assessments.reduce(
            (total, assessment) => total + assessment.attempts.length,
            0,
          ),
          projects.length,
          projects.filter((project) => project.evidence).length,
          evidence.length,
          JSON.stringify(course.assessments),
          JSON.stringify(projects),
          JSON.stringify(evidence),
          progress.revision,
          LEARNER_READ_MODEL_PROJECTION_VERSION,
        );
    });

    await d1Batch(
      this.database,
      [...pathwayStatements, ...termStatements, ...transcriptStatements],
      "rebuild learner pathway, term, and record read models",
    );

    const persistedBlocks = new Map<string, TodayStudyBlock>();
    for (const block of [
      ...queue.blocks,
      ...queue.recentHistory.flatMap((history) => history.blocks),
    ]) {
      persistedBlocks.set(block.scheduleEntryId, block);
    }
    const existingRows = await d1All<AssignmentRow>(
      this.database
        .prepare(
          `SELECT assignment_id, schedule_entry_id, scheduled_date, status,
                  completed_at, assignment_json
           FROM learner_today_assignment_rows
           WHERE learner_id = ? AND program_version_id = ?
             AND status = 'planned'
           ORDER BY scheduled_date, assignment_id
           LIMIT ?`,
        )
        .bind(learnerId, programVersionId, MAX_OPEN_ASSIGNMENTS + 1),
      "load assignment carry-forward sources",
    );
    assertWithinLimit(
      existingRows.length,
      MAX_OPEN_ASSIGNMENTS,
      "Assignment carry-forward sources",
    );
    const existingBlocks = new Map(
      existingRows.map((row) => [row.schedule_entry_id, this.blockFromRow(row)]),
    );
    const statusUpdates = [];
    for (const operation of queue.reconciliationOperations) {
      if (operation.type !== "upsert-schedule-entry") continue;
      const sourceBlock = operation.entry.originEntryId
        ? existingBlocks.get(operation.entry.originEntryId)
        : existingBlocks.get(operation.entry.id);
      const currentBlock = persistedBlocks.get(operation.entry.id);
      if (currentBlock) {
        persistedBlocks.set(
          operation.entry.id,
          cloneBlockForEntry(currentBlock, operation.entry),
        );
      } else if (sourceBlock) {
        persistedBlocks.set(
          operation.entry.id,
          cloneBlockForEntry(sourceBlock, operation.entry),
        );
      }
      if (existingBlocks.has(operation.entry.id)) {
        statusUpdates.push(
          this.database
            .prepare(
              `UPDATE learner_today_assignment_rows
               SET status = ?, completed_at = ?, source_progress_revision = ?,
                   projection_version = ?, rebuilt_at = CURRENT_TIMESTAMP
               WHERE learner_id = ? AND program_version_id = ?
                 AND schedule_entry_id = ?`,
            )
            .bind(
              operation.entry.status,
              operation.entry.completedAt ?? null,
              progress.revision,
              LEARNER_READ_MODEL_PROJECTION_VERSION,
              learnerId,
              programVersionId,
              operation.entry.id,
            ),
        );
      }
    }
    const termKeyByLabel = new Map(
      queue.terms.map((term, position) => [
        term.label,
        term.periodId ?? `term-${position + 1}`,
      ]),
    );
    const assignmentStatements = [...persistedBlocks.values()].map((block) =>
      this.assignmentStatement(
        learnerId,
        programVersionId,
        block,
        termKeyByLabel.get(block.periodLabel) ?? null,
        progress.revision,
      ),
    );
    await d1Batch(
      this.database,
      [...statusUpdates, ...assignmentStatements],
      "persist learner today assignments",
    );

    const finalized = await this.database
      .prepare(
        `UPDATE learner_pathway_snapshots
         SET calendar_as_of_date = ?, rebuilt_at = CURRENT_TIMESTAMP
         WHERE learner_id = ? AND program_version_id = ?
           AND source_progress_revision = ?
           AND source_payload_hash = ?
           AND projection_version = ?`,
      )
      .bind(
        queue.today,
        learnerId,
        programVersionId,
        progress.revision,
        sourcePayloadHash,
        LEARNER_READ_MODEL_PROJECTION_VERSION,
      )
      .run();
    assertD1Success(finalized, "finalize learner read model rebuild");
  }

  private assignmentStatement(
    learnerId: string,
    programVersionId: ProgramVersionId,
    block: TodayStudyBlock,
    termKey: string | null,
    sourceProgressRevision: number,
  ) {
    const subject = subjectColumns(block);
    if (
      block.scheduleEntry.status === "completed" &&
      !block.scheduleEntry.completedAt
    ) {
      throw new LearnerReadModelDataError(
        `Completed assignment ${block.scheduleEntryId} has no recorded completion time.`,
      );
    }
    const completedAt =
      block.scheduleEntry.status === "completed"
        ? block.scheduleEntry.completedAt!
        : null;
    return this.database
      .prepare(
        `INSERT INTO learner_today_assignment_rows (
           learner_id, program_version_id, assignment_id, schedule_entry_id,
           course_version_id, course_canonical_slug, course_title,
           subject_kind, subject_id, learning_unit_id, assessment_version_id,
           term_key, period_label, task_kind, title, topic, activity,
           where_text, resource_url, produce, scheduled_date, deadline_date,
           start_time, planned_minutes, position, status, completed_at,
           assignment_json, source_progress_revision, projection_version,
           rebuilt_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(learner_id, program_version_id, assignment_id) DO UPDATE SET
           schedule_entry_id = excluded.schedule_entry_id,
           course_version_id = excluded.course_version_id,
           course_canonical_slug = excluded.course_canonical_slug,
           course_title = excluded.course_title,
           subject_kind = excluded.subject_kind,
           subject_id = excluded.subject_id,
           learning_unit_id = excluded.learning_unit_id,
           assessment_version_id = excluded.assessment_version_id,
           term_key = excluded.term_key,
           period_label = excluded.period_label,
           task_kind = excluded.task_kind,
           title = excluded.title,
           topic = excluded.topic,
           activity = excluded.activity,
           where_text = excluded.where_text,
           resource_url = excluded.resource_url,
           produce = excluded.produce,
           scheduled_date = excluded.scheduled_date,
           deadline_date = excluded.deadline_date,
           start_time = excluded.start_time,
           planned_minutes = excluded.planned_minutes,
           position = excluded.position,
           status = excluded.status,
           completed_at = excluded.completed_at,
           assignment_json = excluded.assignment_json,
           source_progress_revision = excluded.source_progress_revision,
           projection_version = excluded.projection_version,
           rebuilt_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        learnerId,
        programVersionId,
        block.scheduleEntryId,
        block.scheduleEntryId,
        block.courseVersionId,
        block.courseSlug,
        block.courseTitle,
        subject.subjectKind,
        block.scheduleEntry.subject.id,
        subject.learningUnitId,
        subject.assessmentVersionId,
        termKey,
        block.periodLabel,
        block.taskKind,
        block.unitTitle,
        block.unitTopic,
        block.activity,
        block.where,
        block.resourceUrl ?? null,
        block.produce,
        block.scheduleEntry.scheduledDate,
        block.deadlineDate,
        block.scheduleEntry.startTime ?? null,
        block.plannedMinutes,
        block.scheduleEntry.position,
        block.scheduleEntry.status,
        completedAt,
        JSON.stringify(block),
        sourceProgressRevision,
        LEARNER_READ_MODEL_PROJECTION_VERSION,
      );
  }

  private blockFromRow(row: AssignmentRow): TodayStudyBlock {
    const block = parseJson<TodayStudyBlock>(
      row.assignment_json,
      `Today assignment ${row.assignment_id}`,
    );
    const scheduleEntry: ScheduleEntry = {
      ...block.scheduleEntry,
      status: row.status,
      ...(row.completed_at ? { completedAt: row.completed_at } : {}),
    };
    return {
      ...block,
      scheduleEntry,
      scheduleEntryId: row.schedule_entry_id,
      completed: row.status === "completed",
      canComplete: row.status === "planned" && block.canComplete,
    };
  }

  private termFromRow(row: TermScheduleRow): LearnerTermView {
    return {
      key: row.term_key,
      ...(row.period_id ? { periodId: row.period_id as DatedAcademicTerm["periodId"] } : {}),
      label: row.label,
      position: row.position,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      courseVersionIds: parseJson<CourseVersionId[]>(
        row.course_version_ids_json,
        `Term ${row.term_key} courses`,
      ),
      milestones: parseJson<DatedAcademicTerm["milestones"]>(
        row.milestones_json,
        `Term ${row.term_key} milestones`,
      ),
      ...(row.break_start_date && row.break_end_date
        ? {
            breakAfter: {
              startDate: row.break_start_date,
              endDate: row.break_end_date,
            },
          }
        : {}),
      totalPlannedMinutes: row.total_planned_minutes,
      completedMinutes: row.completed_minutes,
    };
  }

  private pathwayCourseFromRow(
    row: PathwayCourseRow,
    programSlug: string,
  ): LearnerPathwayCourseView {
    return {
      courseVersionId: row.course_version_id as CourseVersionId,
      courseId: row.course_id,
      canonicalSlug: row.canonical_slug,
      canonicalPath: `/programs/${programSlug}/courses/${row.canonical_slug}`,
      ...(row.code ? { code: row.code } : {}),
      title: row.title,
      summary: row.summary,
      format: row.format,
      nominalHours: row.nominal_hours,
      position: row.position,
      ...(row.period_id ? { periodId: row.period_id } : {}),
      ...(row.period_label ? { periodLabel: row.period_label } : {}),
      requirementGroupIds: parseJson<string[]>(
        row.requirement_group_ids_json,
        `Course ${row.course_version_id} requirement groups`,
      ),
      prerequisiteCourseVersionIds: parseJson<string[]>(
        row.prerequisite_course_version_ids_json,
        `Course ${row.course_version_id} prerequisites`,
      ),
      learningUnitCount: row.learning_unit_count,
      assessmentCount: row.assessment_count,
    };
  }

  private recordCourseFromRow(
    row: TranscriptRow,
    programSlug: string,
  ): LearnerRecordCourseView {
    return {
      courseVersionId: row.course_version_id as CourseVersionId,
      canonicalSlug: row.course_canonical_slug,
      canonicalPath: `/programs/${programSlug}/courses/${row.course_canonical_slug}`,
      code: row.code,
      title: row.title,
      format: row.format,
      nominalHours: row.nominal_hours,
      totalUnits: row.total_units,
      completedUnits: row.completed_units,
      completedLearningHours: row.completed_learning_hours,
      masteryState: row.mastery_state,
      masteryLabel: COURSE_MASTERY_STATE_LABELS[row.mastery_state],
      passed: Boolean(row.passed),
      ...(row.weighted_score_percentage !== null
        ? { weightedScorePercentage: row.weighted_score_percentage }
        : {}),
      assessments: parseJson<LearningRecordAssessment[]>(
        row.assessments_json,
        `Assessments for ${row.title}`,
      ),
    };
  }
}
