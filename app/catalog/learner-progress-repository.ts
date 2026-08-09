import type {
  AssessmentVersionId,
  ConcentrationId,
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
  PublishedProgramBundle,
  RequirementGroupId,
} from "../domain/catalog";
import { resolveLearnerPath } from "../domain/learner-path";
import type {
  AssessmentAttempt,
  LearnerEnrollment,
  PrerequisiteWaiver,
  ProgressMutationOperation,
  ScheduleEntry,
  StudyDay,
  UnitEvidence,
} from "../learner-progress-contract";
import { canonicalJson, sha256Hex } from "./canonical-json";
import {
  d1All,
  d1Batch,
  type D1DatabaseLike,
  type D1ResultLike,
} from "./d1-contract";
import { D1CatalogRepository } from "./d1-repository";

export interface LearnerIdentityInput {
  readonly provider: string;
  readonly subject: string;
  readonly email?: string | null;
  readonly displayName?: string | null;
}

export interface ResolvedLearner {
  readonly learnerId: string;
  readonly accountId: string;
  readonly provider: string;
  readonly subject: string;
  readonly email?: string;
  readonly displayName?: string;
}

export interface LearnerCourseProgress {
  readonly completedUnitIds: readonly LearningUnitId[];
  readonly updatedAt?: string;
}

export type LearnerEnrollmentStatus = "enrolled" | "paused" | "completed";

export interface LearnerEnrollmentState {
  readonly startDate: string;
  readonly paceHoursPerWeek: number;
  readonly preferredStudyDays: readonly StudyDay[];
  readonly timezone: string;
  readonly enrolledAt: string;
  readonly status: LearnerEnrollmentStatus;
  readonly updatedAt?: string;
}

export interface LearnerUnitEvidenceRecord {
  readonly learningUnitId: LearningUnitId;
  readonly courseVersionId: CourseVersionId;
  readonly textOrUrl: string;
  readonly updatedAt: string;
}

export type LearnerAssessmentStatus =
  | "draft"
  | "submitted"
  | "evaluated";
export type LearnerEvaluationMethod =
  | "self"
  | "automatic"
  | "peer"
  | "instructor";

export interface LearnerAssessmentResult {
  readonly score: number;
  readonly maximumScore?: number;
  readonly passed: boolean;
  readonly evaluationMethod: LearnerEvaluationMethod;
  readonly feedback?: string;
  readonly evaluatedAt: string;
}

export interface LearnerAssessmentAttemptRecord {
  readonly id: string;
  readonly assessmentVersionId: AssessmentVersionId;
  readonly courseVersionId: CourseVersionId;
  readonly attemptNumber: number;
  readonly status: LearnerAssessmentStatus;
  readonly startedAt: string;
  readonly submittedAt?: string;
  readonly submissionEvidence: readonly string[];
  readonly result?: LearnerAssessmentResult;
  readonly updatedAt: string;
}

export type LearnerScheduleSubject =
  | { readonly kind: "courseVersion"; readonly id: CourseVersionId }
  | { readonly kind: "learningUnit"; readonly id: LearningUnitId }
  | { readonly kind: "assessmentVersion"; readonly id: AssessmentVersionId };

export type LearnerScheduleStatus =
  | "planned"
  | "completed"
  | "skipped"
  | "carried"
  | "cancelled";

export interface LearnerScheduleEntryRecord {
  readonly id: string;
  readonly subject: LearnerScheduleSubject;
  readonly scheduledDate: string;
  readonly startTime?: string;
  readonly plannedMinutes: number;
  readonly position: number;
  readonly source: "manual" | "generated" | "carry-forward";
  readonly status: LearnerScheduleStatus;
  readonly sourcePlacementId?: string;
  readonly originEntryId?: string;
  readonly completedAt?: string;
  readonly updatedAt: string;
}

export type LearnerWaiverBasis =
  | "placement"
  | "prior_learning"
  | "review"
  | "manual";

export interface LearnerPrerequisiteWaiverRecord {
  readonly id: string;
  readonly courseVersionId: CourseVersionId;
  readonly prerequisiteCourseVersionId: CourseVersionId;
  readonly basis: LearnerWaiverBasis;
  readonly reason: string;
  readonly evidence?: string;
  readonly grantedAt: string;
  readonly revokedAt?: string;
  readonly updatedAt: string;
}

export type LearnerHistoryEntityType =
  | "program"
  | "requirement"
  | "unit"
  | "evidence"
  | "assessment"
  | "schedule"
  | "waiver";

export interface LearnerProgressHistoryEntry {
  readonly id: string;
  readonly eventType: string;
  readonly entityType: LearnerHistoryEntityType;
  readonly entityId: string;
  readonly occurredAt: string;
  readonly clientMutationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface LearnerProgressSnapshot {
  readonly learnerId: string;
  readonly bundleId: string;
  readonly programVersionId: ProgramVersionId;
  readonly selectedConcentrationId?: ConcentrationId;
  readonly courses: Readonly<
    Record<CourseVersionId, LearnerCourseProgress>
  >;
  readonly revision: number;
  readonly enrollment: LearnerEnrollmentState | null;
  readonly requirementSelections: Readonly<
    Record<RequirementGroupId, readonly CourseVersionId[]>
  >;
  readonly unitEvidences: Readonly<
    Record<LearningUnitId, LearnerUnitEvidenceRecord>
  >;
  readonly assessmentAttempts: Readonly<
    Record<string, LearnerAssessmentAttemptRecord>
  >;
  readonly scheduleEntries: Readonly<
    Record<string, LearnerScheduleEntryRecord>
  >;
  readonly prerequisiteWaivers: Readonly<
    Record<string, LearnerPrerequisiteWaiverRecord>
  >;
  readonly history: readonly LearnerProgressHistoryEntry[];
  readonly startedAt?: string;
  readonly updatedAt?: string;
}

export interface LearnerEnrollmentUpdate {
  readonly startDate: string;
  readonly paceHoursPerWeek: number;
  readonly preferredStudyDays: readonly StudyDay[];
  readonly timezone: string;
  readonly status: LearnerEnrollmentStatus | "not_enrolled";
  readonly enrolledAt?: string;
}

export type LearnerProgressOperation = ProgressMutationOperation;

export interface ApplyLearnerProgressMutationInput {
  readonly learnerId: string;
  readonly programVersionId: ProgramVersionId;
  readonly deviceId: string;
  readonly clientMutationId: string;
  readonly baseRevision: number;
  readonly operations: readonly LearnerProgressOperation[];
}

export interface AppliedLearnerProgressMutation {
  readonly mutationId: string;
  readonly resultRevision: number;
  readonly alreadyApplied: boolean;
  readonly progress: LearnerProgressSnapshot;
}

export interface LocalCourseProgressImport {
  readonly courseVersionId: CourseVersionId;
  readonly completedUnitIds: readonly LearningUnitId[];
  readonly updatedAt?: string;
}

export interface CourseCompletionReplacement {
  readonly courseVersionId: CourseVersionId;
  readonly completedUnitIds: readonly LearningUnitId[];
}

export interface LocalProgramProgressImport {
  readonly programVersionId: ProgramVersionId;
  readonly selectedConcentrationId?: ConcentrationId;
  readonly courses: readonly LocalCourseProgressImport[];
  readonly enrollment?: LearnerEnrollment | null;
  readonly requirementSelections?: Readonly<
    Record<string, readonly CourseVersionId[]>
  >;
  readonly unitEvidences?: readonly UnitEvidence[];
  readonly assessmentAttempts?: readonly AssessmentAttempt[];
  readonly scheduleEntries?: readonly ScheduleEntry[];
  readonly prerequisiteWaivers?: readonly PrerequisiteWaiver[];
}

export type ProgressImportDisposition = "merged" | "cloud";

export interface ImportLocalProgressInput {
  readonly learnerId: string;
  readonly clientImportId: string;
  readonly storageNamespace: string;
  readonly disposition: ProgressImportDisposition;
  readonly deviceId?: string;
  readonly programs: readonly LocalProgramProgressImport[];
}

export interface ProgressImportReceipt {
  readonly learnerId: string;
  readonly clientImportId: string;
  readonly storageNamespace: string;
  readonly disposition: ProgressImportDisposition;
  readonly payloadHash: string;
  readonly importedUnitCount: number;
  readonly confirmedAt: string;
}

interface AccountRow {
  readonly account_id: string;
  readonly learner_id: string;
  readonly provider: string;
  readonly provider_subject: string;
  readonly email: string | null;
  readonly display_name: string | null;
}

interface ProgramProgressRow {
  readonly bundle_id: string;
  readonly selected_concentration_id: string | null;
  readonly started_at: string;
  readonly updated_at: string;
}

interface UnitCompletionRow {
  readonly course_version_id: string;
  readonly learning_unit_id: string;
  readonly completed_at: string;
}

interface ProgressImportRow {
  readonly learner_id: string;
  readonly client_import_id: string;
  readonly storage_namespace: string;
  readonly disposition: string;
  readonly payload_hash: string;
  readonly imported_unit_count: number;
  readonly confirmed_at: string;
}

interface ProgramStateRow {
  readonly revision: number;
  readonly last_mutation_id: string | null;
  readonly enrollment_status: string;
  readonly start_date: string | null;
  readonly pace_hours_per_week: number | null;
  readonly study_days_json: string;
  readonly timezone: string | null;
  readonly enrolled_at: string | null;
  readonly updated_at: string;
}

interface RequirementSelectionRow {
  readonly requirement_group_id: string;
  readonly requirement_option_id: string;
  readonly course_version_id: string;
  readonly selection_source: string;
  readonly selected_at: string;
  readonly updated_at: string;
}

interface UnitStateRow {
  readonly course_version_id: string;
  readonly learning_unit_id: string;
  readonly status: string;
  readonly completed_at: string | null;
  readonly tombstoned_at: string | null;
  readonly updated_at: string;
}

interface UnitEvidenceRow {
  readonly course_version_id: string;
  readonly learning_unit_id: string;
  readonly status: string;
  readonly text_or_url: string | null;
  readonly submitted_at: string | null;
  readonly tombstoned_at: string | null;
  readonly updated_at: string;
}

interface AssessmentAttemptRow {
  readonly id: string;
  readonly learner_id: string;
  readonly program_version_id: string;
  readonly course_version_id: string;
  readonly assessment_version_id: string;
  readonly attempt_number: number;
  readonly status: string;
  readonly submission_text: string | null;
  readonly submission_url: string | null;
  readonly submission_evidence_json: string;
  readonly score: number | null;
  readonly maximum_score: number | null;
  readonly passed: number | boolean | null;
  readonly evaluation_method: string | null;
  readonly feedback: string | null;
  readonly started_at: string;
  readonly submitted_at: string | null;
  readonly evaluated_at: string | null;
  readonly updated_at: string;
}

interface AssessmentAttemptLifecycleRow {
  readonly id: string;
  readonly course_version_id: string;
  readonly assessment_version_id: string;
  readonly attempt_number: number;
  readonly status: string;
  readonly started_at: string;
}

interface ScheduleEntryRow {
  readonly id: string;
  readonly learner_id: string;
  readonly program_version_id: string;
  readonly course_version_id: string;
  readonly learning_unit_id: string | null;
  readonly assessment_version_id: string | null;
  readonly scheduled_date: string;
  readonly start_time: string | null;
  readonly planned_minutes: number;
  readonly position: number;
  readonly status: string;
  readonly source_placement_id: string | null;
  readonly origin_entry_id: string | null;
  readonly completed_at: string | null;
  readonly updated_at: string;
}

interface PrerequisiteWaiverRow {
  readonly id: string;
  readonly learner_id: string;
  readonly program_version_id: string;
  readonly course_version_id: string;
  readonly prerequisite_course_version_id: string;
  readonly basis: string;
  readonly reason: string;
  readonly evidence_text_or_url: string | null;
  readonly granted_at: string;
  readonly revoked_at: string | null;
  readonly updated_at: string;
}

interface ProgressEventRow {
  readonly id: string;
  readonly mutation_id: string | null;
  readonly entity_type: string;
  readonly entity_id: string;
  readonly event_type: string;
  readonly payload_json: string;
  readonly occurred_at: string;
}

interface ProgressMutationRow {
  readonly mutation_id: string;
  readonly device_id: string;
  readonly base_revision: number;
  readonly result_revision: number;
  readonly payload_hash: string;
  readonly applied_at: string;
}

interface NormalizedImportCourse {
  readonly courseVersionId: CourseVersionId;
  readonly completedUnitIds: readonly LearningUnitId[];
  readonly updatedAt?: string;
}

interface NormalizedImportProgram {
  readonly programVersionId: ProgramVersionId;
  readonly selectedConcentrationId?: ConcentrationId;
  readonly courses: readonly NormalizedImportCourse[];
  readonly enrollment?: LearnerEnrollment | null;
  readonly requirementSelections: Readonly<
    Record<string, readonly CourseVersionId[]>
  >;
  readonly unitEvidences: readonly UnitEvidence[];
  readonly assessmentAttempts: readonly AssessmentAttempt[];
  readonly scheduleEntries: readonly ScheduleEntry[];
  readonly prerequisiteWaivers: readonly PrerequisiteWaiver[];
}

export class LearnerProgressValidationError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(
      `Learner progress input is invalid:\n${problems
        .map((problem) => `- ${problem}`)
        .join("\n")}`,
    );
    this.name = "LearnerProgressValidationError";
  }
}

export class LearnerProgressDataError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(
      `Learner progress in D1 is invalid:\n${problems
        .map((problem) => `- ${problem}`)
        .join("\n")}`,
    );
    this.name = "LearnerProgressDataError";
  }
}

export class ProgressImportConflictError extends Error {
  constructor(
    readonly learnerId: string,
    readonly clientImportId: string,
  ) {
    super(
      `Progress import ${clientImportId} for ${learnerId} was already confirmed with different content or consent.`,
    );
    this.name = "ProgressImportConflictError";
  }
}

export class LearnerProgressRevisionConflictError extends Error {
  constructor(
    readonly learnerId: string,
    readonly programVersionId: ProgramVersionId,
    readonly expectedRevision: number,
    readonly actualRevision: number,
  ) {
    super(
      `Learner progress revision conflict for ${learnerId}/${programVersionId}: expected ${expectedRevision}, found ${actualRevision}.`,
    );
    this.name = "LearnerProgressRevisionConflictError";
  }
}

export class LearnerProgressMutationConflictError extends Error {
  constructor(
    readonly learnerId: string,
    readonly programVersionId: ProgramVersionId,
    readonly mutationId: string,
  ) {
    super(
      `Learner progress mutation ${mutationId} for ${learnerId}/${programVersionId} was already used for a different payload.`,
    );
    this.name = "LearnerProgressMutationConflictError";
  }
}

function nonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new LearnerProgressValidationError([`${label} is empty.`]);
  return normalized;
}

function normalizedOptional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function requireFiniteNumber(
  value: number,
  label: string,
  options: { readonly minimum?: number; readonly maximum?: number } = {},
) {
  if (
    !Number.isFinite(value) ||
    (options.minimum !== undefined && value < options.minimum) ||
    (options.maximum !== undefined && value > options.maximum)
  ) {
    throw new LearnerProgressValidationError([
      `${label} is outside its allowed range.`,
    ]);
  }
  return value;
}

function requireIsoDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new LearnerProgressValidationError([`${label} is not an ISO date.`]);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.valueOf()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new LearnerProgressValidationError([`${label} is not a valid date.`]);
  }
  return value;
}

function requireIsoDateTime(value: string, label: string) {
  if (Number.isNaN(new Date(value).valueOf())) {
    throw new LearnerProgressValidationError([
      `${label} is not a valid ISO date-time.`,
    ]);
  }
  return value;
}

function requireClockTime(value: string | undefined, label: string) {
  if (value && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new LearnerProgressValidationError([
      `${label} must use 24-hour HH:MM format.`,
    ]);
  }
  return value;
}

function parseJsonValue(value: string, label: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new LearnerProgressDataError([`${label} is not valid JSON.`]);
  }
}

function parseStringArray(value: string, label: string) {
  const parsed = parseJsonValue(value, label);
  if (
    !Array.isArray(parsed) ||
    parsed.some((entry) => typeof entry !== "string")
  ) {
    throw new LearnerProgressDataError([`${label} is not a string array.`]);
  }
  return parsed as string[];
}

function parseStudyDays(value: string, label: string) {
  const parsed = parseJsonValue(value, label);
  if (
    !Array.isArray(parsed) ||
    parsed.some(
      (entry) =>
        !Number.isInteger(entry) ||
        (entry as number) < 0 ||
        (entry as number) > 6,
    ) ||
    new Set(parsed).size !== parsed.length
  ) {
    throw new LearnerProgressDataError([
      `${label} must contain unique weekday numbers from 0 through 6.`,
    ]);
  }
  return parsed as StudyDay[];
}

function parseObject(value: string, label: string) {
  const parsed = parseJsonValue(value, label);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new LearnerProgressDataError([`${label} is not an object.`]);
  }
  return parsed as Record<string, unknown>;
}

function cleanStudyDays(days: readonly StudyDay[]) {
  const unique = [...new Set(days)];
  if (
    unique.length !== days.length ||
    unique.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
  ) {
    throw new LearnerProgressValidationError([
      "preferredStudyDays must contain unique weekday numbers from 0 through 6.",
    ]);
  }
  return unique.sort((left, right) => left - right);
}

function currentIsoDateTime() {
  return new Date().toISOString();
}

const TERMINAL_SCHEDULE_STATUSES = new Set<LearnerScheduleStatus>([
  "completed",
  "skipped",
  "carried",
  "cancelled",
]);

function scheduleSubjectsEqual(
  left: LearnerScheduleSubject,
  right: LearnerScheduleSubject,
) {
  return left.kind === right.kind && left.id === right.id;
}

function rowsFromBatchResult<Row>(
  result: D1ResultLike,
): readonly Row[] {
  return (result.results ?? []) as readonly Row[];
}

function accountFromRow(row: AccountRow): ResolvedLearner {
  return {
    learnerId: row.learner_id,
    accountId: row.account_id,
    provider: row.provider,
    subject: row.provider_subject,
    ...(row.email ? { email: row.email } : {}),
    ...(row.display_name ? { displayName: row.display_name } : {}),
  };
}

function receiptFromRow(row: ProgressImportRow): ProgressImportReceipt {
  if (row.disposition !== "merged" && row.disposition !== "cloud") {
    throw new LearnerProgressDataError([
      `Import ${row.client_import_id} has unsupported disposition ${JSON.stringify(row.disposition)}.`,
    ]);
  }
  return {
    learnerId: row.learner_id,
    clientImportId: row.client_import_id,
    storageNamespace: row.storage_namespace,
    disposition: row.disposition,
    payloadHash: row.payload_hash,
    importedUnitCount: row.imported_unit_count,
    confirmedAt: row.confirmed_at,
  };
}

function requireCourse(
  bundle: PublishedProgramBundle,
  courseVersionId: CourseVersionId,
) {
  const course = bundle.courseVersions.find(
    (candidate) => candidate.id === courseVersionId,
  );
  if (!course) {
    throw new LearnerProgressValidationError([
      `Course version ${courseVersionId} is not in program version ${bundle.programVersion.id}.`,
    ]);
  }
  return course;
}

function requireUnitIds(
  bundle: PublishedProgramBundle,
  courseVersionId: CourseVersionId,
  unitIds: readonly LearningUnitId[],
) {
  requireCourse(bundle, courseVersionId);
  const allowed = new Set(
    bundle.learningUnits
      .filter((unit) => unit.courseVersionId === courseVersionId)
      .map((unit) => unit.id),
  );
  const unknown = unitIds.filter((unitId) => !allowed.has(unitId));
  if (unknown.length > 0) {
    throw new LearnerProgressValidationError([
      `Course ${courseVersionId} does not contain unit(s): ${unknown.join(", ")}.`,
    ]);
  }
}

function requireConcentration(
  bundle: PublishedProgramBundle,
  concentrationId: ConcentrationId | null | undefined,
) {
  if (
    concentrationId &&
    !bundle.concentrations.some(
      (concentration) => concentration.id === concentrationId,
    )
  ) {
    throw new LearnerProgressValidationError([
      `Concentration ${concentrationId} is not in program version ${bundle.programVersion.id}.`,
    ]);
  }
}

function normalizeImportPrograms(
  programs: readonly LocalProgramProgressImport[],
): readonly NormalizedImportProgram[] {
  const problems: string[] = [];
  const seenPrograms = new Set<string>();
  const normalized = programs.map((program, programIndex) => {
    if (seenPrograms.has(program.programVersionId)) {
      problems.push(
        `programs[${programIndex}] duplicates ${program.programVersionId}.`,
      );
    }
    seenPrograms.add(program.programVersionId);
    const seenCourses = new Set<string>();
    const courses = program.courses.map((course, courseIndex) => {
      if (seenCourses.has(course.courseVersionId)) {
        problems.push(
          `programs[${programIndex}].courses[${courseIndex}] duplicates ${course.courseVersionId}.`,
        );
      }
      seenCourses.add(course.courseVersionId);
      return {
        courseVersionId: course.courseVersionId,
        completedUnitIds: [
          ...new Set(course.completedUnitIds),
        ].sort() as LearningUnitId[],
        ...(course.updatedAt ? { updatedAt: course.updatedAt } : {}),
      };
    });
    courses.sort((left, right) =>
      left.courseVersionId.localeCompare(right.courseVersionId),
    );
    const requirementSelections = Object.fromEntries(
      Object.entries(program.requirementSelections ?? {})
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([groupId, courseVersionIds]) => [
          groupId,
          [...new Set(courseVersionIds)].sort(),
        ]),
    );
    const uniqueById = <RecordType extends { readonly id: string }>(
      values: readonly RecordType[],
      label: string,
    ) => {
      const seen = new Set<string>();
      return [...values]
        .map((value, index) => {
          if (seen.has(value.id)) {
            problems.push(
              `programs[${programIndex}].${label}[${index}] duplicates ${value.id}.`,
            );
          }
          seen.add(value.id);
          return value;
        })
        .sort((left, right) => left.id.localeCompare(right.id));
    };
    const unitEvidenceKeys = new Set<string>();
    const unitEvidences = [...(program.unitEvidences ?? [])]
      .map((evidence, index) => {
        const key = `${evidence.courseVersionId}\u0000${evidence.learningUnitId}`;
        if (unitEvidenceKeys.has(key)) {
          problems.push(
            `programs[${programIndex}].unitEvidences[${index}] duplicates ${evidence.learningUnitId}.`,
          );
        }
        unitEvidenceKeys.add(key);
        return evidence;
      })
      .sort((left, right) =>
        left.learningUnitId.localeCompare(right.learningUnitId),
      );
    return {
      programVersionId: program.programVersionId,
      ...(program.selectedConcentrationId
        ? { selectedConcentrationId: program.selectedConcentrationId }
        : {}),
      courses,
      ...(program.enrollment !== undefined
        ? { enrollment: program.enrollment }
        : {}),
      requirementSelections,
      unitEvidences,
      assessmentAttempts: uniqueById(
        program.assessmentAttempts ?? [],
        "assessmentAttempts",
      ),
      scheduleEntries: uniqueById(
        program.scheduleEntries ?? [],
        "scheduleEntries",
      ),
      prerequisiteWaivers: uniqueById(
        program.prerequisiteWaivers ?? [],
        "prerequisiteWaivers",
      ),
    };
  });
  normalized.sort((left, right) =>
    left.programVersionId.localeCompare(right.programVersionId),
  );
  if (problems.length > 0) throw new LearnerProgressValidationError(problems);
  return normalized;
}

export class D1LearnerProgressRepository {
  readonly catalog: D1CatalogRepository;

  constructor(readonly database: D1DatabaseLike) {
    this.catalog = new D1CatalogRepository(database);
  }

  async resolveLearner(
    identity: LearnerIdentityInput,
  ): Promise<ResolvedLearner> {
    const provider = nonEmpty(identity.provider, "provider").toLowerCase();
    const subject = nonEmpty(identity.subject, "subject");
    const email = normalizedOptional(identity.email)?.toLowerCase();
    const displayName = normalizedOptional(identity.displayName);
    const existing = await this.findAccount(provider, subject);

    if (existing) {
      await d1Batch(
        this.database,
        [
          this.database
            .prepare(
              `UPDATE learners
               SET display_name = COALESCE(?, display_name),
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
            )
            .bind(displayName ?? null, existing.learner_id),
          this.database
            .prepare(
              `UPDATE learner_accounts
               SET email = COALESCE(?, email),
                   updated_at = CURRENT_TIMESTAMP,
                   last_seen_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
            )
            .bind(email ?? null, existing.account_id),
        ],
        "refresh learner account",
      );
      return {
        ...accountFromRow(existing),
        ...(email ? { email } : {}),
        ...(displayName ? { displayName } : {}),
      };
    }

    const identityHash = await sha256Hex(
      canonicalJson({ provider, subject }),
    );
    const learnerId = `lrn_${identityHash.slice(0, 32)}`;
    const accountId = `lac_${identityHash.slice(0, 32)}`;
    await d1Batch(
      this.database,
      [
        this.database
          .prepare(
            `INSERT INTO learners (id, display_name)
             VALUES (?, ?)
             ON CONFLICT(id) DO UPDATE SET
               display_name = COALESCE(excluded.display_name, learners.display_name),
               updated_at = CURRENT_TIMESTAMP`,
          )
          .bind(learnerId, displayName ?? null),
        this.database
          .prepare(
            `INSERT INTO learner_accounts (
               id,
               learner_id,
               provider,
               provider_subject,
               email
             )
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(provider, provider_subject) DO UPDATE SET
               email = COALESCE(excluded.email, learner_accounts.email),
               updated_at = CURRENT_TIMESTAMP,
               last_seen_at = CURRENT_TIMESTAMP`,
          )
          .bind(accountId, learnerId, provider, subject, email ?? null),
      ],
      "create learner account",
    );
    const resolved = await this.findAccount(provider, subject);
    if (!resolved) {
      throw new LearnerProgressDataError([
        `Account ${provider}:${subject} was not readable after creation.`,
      ]);
    }
    return accountFromRow(resolved);
  }

  async loadProgress(
    learnerId: string,
    programVersionId: ProgramVersionId,
  ): Promise<LearnerProgressSnapshot> {
    const bundle = await this.requireBundle(programVersionId);
    const results = await d1Batch(
      this.database,
      [
        this.database
          .prepare(
            `SELECT bundle_id, selected_concentration_id, started_at, updated_at
             FROM learner_program_progress
             WHERE learner_id = ? AND program_version_id = ?`,
          )
          .bind(learnerId, programVersionId),
        this.database
          .prepare(
            `SELECT course_version_id, learning_unit_id, completed_at
             FROM learner_unit_completions
             WHERE learner_id = ? AND program_version_id = ?
             ORDER BY completed_at, course_version_id, learning_unit_id`,
          )
          .bind(learnerId, programVersionId),
        this.database
          .prepare(
            `SELECT
               revision,
               last_mutation_id,
               enrollment_status,
               start_date,
               pace_hours_per_week,
               study_days_json,
               timezone,
               enrolled_at,
               updated_at
             FROM learner_program_states
             WHERE learner_id = ? AND program_version_id = ?`,
          )
          .bind(learnerId, programVersionId),
        this.database
          .prepare(
            `SELECT
               requirement_group_id,
               requirement_option_id,
               course_version_id,
               selection_source,
               selected_at,
               updated_at
             FROM learner_requirement_selections
             WHERE learner_id = ? AND program_version_id = ?
             ORDER BY requirement_group_id, selected_at, requirement_option_id`,
          )
          .bind(learnerId, programVersionId),
        this.database
          .prepare(
            `SELECT
               course_version_id,
               learning_unit_id,
               status,
               completed_at,
               tombstoned_at,
               updated_at
             FROM learner_unit_states
             WHERE learner_id = ? AND program_version_id = ?
             ORDER BY updated_at, course_version_id, learning_unit_id`,
          )
          .bind(learnerId, programVersionId),
        this.database
          .prepare(
            `SELECT
               course_version_id,
               learning_unit_id,
               status,
               text_or_url,
               submitted_at,
               tombstoned_at,
               updated_at
             FROM learner_unit_evidence
             WHERE learner_id = ? AND program_version_id = ?
             ORDER BY updated_at, course_version_id, learning_unit_id`,
          )
          .bind(learnerId, programVersionId),
        this.database
          .prepare(
            `SELECT
               id,
               learner_id,
               program_version_id,
               course_version_id,
               assessment_version_id,
               attempt_number,
               status,
               submission_text,
               submission_url,
               submission_evidence_json,
               score,
               maximum_score,
               passed,
               evaluation_method,
               feedback,
               started_at,
               submitted_at,
               evaluated_at,
               updated_at
             FROM learner_assessment_attempts
             WHERE learner_id = ? AND program_version_id = ?
             ORDER BY started_at, assessment_version_id, attempt_number`,
          )
          .bind(learnerId, programVersionId),
        this.database
          .prepare(
            `SELECT
               id,
               learner_id,
               program_version_id,
               course_version_id,
               learning_unit_id,
               assessment_version_id,
               scheduled_date,
               start_time,
               planned_minutes,
               position,
               status,
               source_placement_id,
               origin_entry_id,
               completed_at,
               updated_at
             FROM learner_schedule_entries
             WHERE learner_id = ? AND program_version_id = ?
             ORDER BY scheduled_date, position, id`,
          )
          .bind(learnerId, programVersionId),
        this.database
          .prepare(
            `SELECT
               id,
               learner_id,
               program_version_id,
               course_version_id,
               prerequisite_course_version_id,
               basis,
               reason,
               evidence_text_or_url,
               granted_at,
               revoked_at,
               updated_at
             FROM learner_prerequisite_waivers
             WHERE learner_id = ? AND program_version_id = ?
             ORDER BY granted_at, id`,
          )
          .bind(learnerId, programVersionId),
        this.database
          .prepare(
            `SELECT
               event.id,
               event.mutation_id,
               event.entity_type,
               event.entity_id,
               event.event_type,
               event.payload_json,
               event.occurred_at
             FROM learner_progress_events AS event
             LEFT JOIN learner_progress_mutations AS mutation
               ON mutation.learner_id = event.learner_id
              AND mutation.program_version_id = event.program_version_id
              AND mutation.mutation_id = event.mutation_id
             WHERE event.learner_id = ? AND event.program_version_id = ?
             ORDER BY
               COALESCE(mutation.result_revision, 0),
               event.occurred_at,
               event.id`,
          )
          .bind(learnerId, programVersionId),
      ],
      "load learner progress",
    );
    const progressRows =
      rowsFromBatchResult<ProgramProgressRow>(results[0]);
    const completionRows =
      rowsFromBatchResult<UnitCompletionRow>(results[1]);
    const stateRows = rowsFromBatchResult<ProgramStateRow>(results[2]);
    const selectionRows =
      rowsFromBatchResult<RequirementSelectionRow>(results[3]);
    const unitStateRows = rowsFromBatchResult<UnitStateRow>(results[4]);
    const evidenceRows = rowsFromBatchResult<UnitEvidenceRow>(results[5]);
    const attemptRows = rowsFromBatchResult<AssessmentAttemptRow>(results[6]);
    const scheduleRows = rowsFromBatchResult<ScheduleEntryRow>(results[7]);
    const waiverRows =
      rowsFromBatchResult<PrerequisiteWaiverRow>(results[8]);
    const eventRows = rowsFromBatchResult<ProgressEventRow>(results[9]);
    if (progressRows.length > 1) {
      throw new LearnerProgressDataError([
        `Multiple progress rows exist for ${learnerId}/${programVersionId}.`,
      ]);
    }
    if (stateRows.length > 1) {
      throw new LearnerProgressDataError([
        `Multiple program state rows exist for ${learnerId}/${programVersionId}.`,
      ]);
    }
    const progress = progressRows[0];
    if (progress && progress.bundle_id !== bundle.id) {
      throw new LearnerProgressDataError([
        `Progress is pinned to ${progress.bundle_id}, but catalog program version ${programVersionId} resolves to ${bundle.id}.`,
      ]);
    }
    requireConcentration(
      bundle,
      progress?.selected_concentration_id as ConcentrationId | null | undefined,
    );

    const unitOrder = new Map(
      bundle.learningUnits.map((unit, index) => [unit.id, index]),
    );
    const unitStateByKey = new Map<
      string,
      {
        courseVersionId: CourseVersionId;
        learningUnitId: LearningUnitId;
        completed: boolean;
        updatedAt: string;
      }
    >();
    const dataProblems: string[] = [];
    for (const row of completionRows) {
      const courseVersionId = row.course_version_id as CourseVersionId;
      const learningUnitId = row.learning_unit_id as LearningUnitId;
      try {
        requireUnitIds(bundle, courseVersionId, [learningUnitId]);
      } catch (error) {
        dataProblems.push(
          error instanceof Error ? error.message : String(error),
        );
        continue;
      }
      unitStateByKey.set(`${courseVersionId}\u0000${learningUnitId}`, {
        courseVersionId,
        learningUnitId,
        completed: true,
        updatedAt: row.completed_at,
      });
    }
    for (const row of unitStateRows) {
      const courseVersionId = row.course_version_id as CourseVersionId;
      const learningUnitId = row.learning_unit_id as LearningUnitId;
      try {
        requireUnitIds(bundle, courseVersionId, [learningUnitId]);
      } catch (error) {
        dataProblems.push(error instanceof Error ? error.message : String(error));
        continue;
      }
      if (row.status !== "completed" && row.status !== "tombstoned") {
        dataProblems.push(
          `Unit ${learningUnitId} has unsupported state ${JSON.stringify(row.status)}.`,
        );
        continue;
      }
      unitStateByKey.set(`${courseVersionId}\u0000${learningUnitId}`, {
        courseVersionId,
        learningUnitId,
        completed: row.status === "completed",
        updatedAt: row.updated_at,
      });
    }
    if (dataProblems.length > 0) {
      throw new LearnerProgressDataError(dataProblems);
    }

    const completedByCourse = new Map<
      CourseVersionId,
      { ids: LearningUnitId[]; updatedAt?: string }
    >();
    for (const state of unitStateByKey.values()) {
      if (!state.completed) continue;
      const record = completedByCourse.get(state.courseVersionId) ?? { ids: [] };
      record.ids.push(state.learningUnitId);
      if (!record.updatedAt || state.updatedAt > record.updatedAt) {
        record.updatedAt = state.updatedAt;
      }
      completedByCourse.set(state.courseVersionId, record);
    }
    const courses = Object.fromEntries(
      bundle.courseVersions.map((course) => {
        const record = completedByCourse.get(course.id);
        const completedUnitIds = [...new Set(record?.ids ?? [])].sort(
          (left, right) =>
            (unitOrder.get(left) ?? Number.MAX_SAFE_INTEGER) -
            (unitOrder.get(right) ?? Number.MAX_SAFE_INTEGER),
        );
        return [
          course.id,
          {
            completedUnitIds,
            ...(record?.updatedAt ? { updatedAt: record.updatedAt } : {}),
          },
        ];
      }),
    ) as Record<CourseVersionId, LearnerCourseProgress>;

    const requirementGroups = new Map(
      bundle.programVersion.requirements.map((group) => [group.id, group]),
    );
    const requirementSelections = {} as Record<
      RequirementGroupId,
      CourseVersionId[]
    >;
    for (const row of selectionRows) {
      const group = requirementGroups.get(
        row.requirement_group_id as RequirementGroupId,
      );
      const option = group?.options.find(
        (candidate) => candidate.id === row.requirement_option_id,
      );
      if (!group || !option || option.courseVersionId !== row.course_version_id) {
        dataProblems.push(
          `Requirement selection ${row.requirement_group_id}/${row.requirement_option_id} is not in ${programVersionId}.`,
        );
        continue;
      }
      const groupId = group.id;
      const selected = requirementSelections[groupId] ?? [];
      selected.push(option.courseVersionId);
      requirementSelections[groupId] = selected;
    }

    const unitEvidences = {} as Record<
      LearningUnitId,
      LearnerUnitEvidenceRecord
    >;
    for (const row of evidenceRows) {
      const courseVersionId = row.course_version_id as CourseVersionId;
      const learningUnitId = row.learning_unit_id as LearningUnitId;
      try {
        requireUnitIds(bundle, courseVersionId, [learningUnitId]);
      } catch (error) {
        dataProblems.push(error instanceof Error ? error.message : String(error));
        continue;
      }
      if (row.status !== "active" && row.status !== "tombstoned") {
        dataProblems.push(
          `Evidence for ${learningUnitId} has unsupported state ${JSON.stringify(row.status)}.`,
        );
        continue;
      }
      if (row.status === "active" && row.text_or_url) {
        unitEvidences[learningUnitId] = {
          learningUnitId,
          courseVersionId,
          textOrUrl: row.text_or_url,
          updatedAt: row.updated_at,
        };
      }
    }

    const assessmentById = new Map(
      bundle.assessmentVersions.map((assessment) => [assessment.id, assessment]),
    );
    const assessmentAttempts: Record<string, LearnerAssessmentAttemptRecord> = {};
    for (const row of attemptRows) {
      const assessment = assessmentById.get(
        row.assessment_version_id as AssessmentVersionId,
      );
      if (!assessment || assessment.courseVersionId !== row.course_version_id) {
        dataProblems.push(
          `Assessment attempt ${row.id} does not match this publication.`,
        );
        continue;
      }
      if (!["draft", "submitted", "evaluated", "void"].includes(row.status)) {
        dataProblems.push(`Assessment attempt ${row.id} has invalid status.`);
        continue;
      }
      if (row.status === "void") continue;
      const evidence = parseStringArray(
        row.submission_evidence_json,
        `Assessment attempt ${row.id} evidence`,
      );
      let result: LearnerAssessmentResult | undefined;
      if (row.status === "evaluated") {
        if (
          row.score === null ||
          row.maximum_score === null ||
          row.passed === null ||
          !row.evaluation_method ||
          !row.evaluated_at ||
          !["self", "automatic", "peer", "instructor"].includes(
            row.evaluation_method,
          )
        ) {
          dataProblems.push(`Assessment attempt ${row.id} lacks its result.`);
          continue;
        }
        result = {
          score: row.score,
          maximumScore: row.maximum_score,
          passed: Boolean(row.passed),
          evaluationMethod: row.evaluation_method as LearnerEvaluationMethod,
          ...(row.feedback ? { feedback: row.feedback } : {}),
          evaluatedAt: row.evaluated_at,
        };
      }
      assessmentAttempts[row.id] = {
        id: row.id,
        assessmentVersionId: assessment.id,
        courseVersionId: assessment.courseVersionId,
        attemptNumber: row.attempt_number,
        status: row.status as LearnerAssessmentStatus,
        startedAt: row.started_at,
        ...(row.submitted_at ? { submittedAt: row.submitted_at } : {}),
        submissionEvidence: evidence,
        ...(result ? { result } : {}),
        updatedAt: row.updated_at,
      };
    }

    const courseVersionIds = new Set(
      bundle.courseVersions.map((course) => course.id),
    );
    const unitCourseById = new Map(
      bundle.learningUnits.map((unit) => [unit.id, unit.courseVersionId]),
    );
    const scheduleEntries: Record<string, LearnerScheduleEntryRecord> = {};
    for (const row of scheduleRows) {
      const courseVersionId = row.course_version_id as CourseVersionId;
      if (!courseVersionIds.has(courseVersionId)) {
        dataProblems.push(`Schedule entry ${row.id} has an unknown course.`);
        continue;
      }
      let subject: LearnerScheduleSubject;
      if (row.learning_unit_id) {
        const unitId = row.learning_unit_id as LearningUnitId;
        if (unitCourseById.get(unitId) !== courseVersionId) {
          dataProblems.push(`Schedule entry ${row.id} has an invalid unit.`);
          continue;
        }
        subject = { kind: "learningUnit", id: unitId };
      } else if (row.assessment_version_id) {
        const assessment = assessmentById.get(
          row.assessment_version_id as AssessmentVersionId,
        );
        if (assessment?.courseVersionId !== courseVersionId) {
          dataProblems.push(`Schedule entry ${row.id} has an invalid assessment.`);
          continue;
        }
        subject = { kind: "assessmentVersion", id: assessment.id };
      } else {
        subject = { kind: "courseVersion", id: courseVersionId };
      }
      if (
        !["planned", "completed", "skipped", "carried", "cancelled"].includes(
          row.status,
        )
      ) {
        dataProblems.push(`Schedule entry ${row.id} has invalid status.`);
        continue;
      }
      scheduleEntries[row.id] = {
        id: row.id,
        subject,
        scheduledDate: row.scheduled_date,
        ...(row.start_time ? { startTime: row.start_time } : {}),
        plannedMinutes: row.planned_minutes,
        position: row.position,
        source: row.origin_entry_id
          ? "carry-forward"
          : row.source_placement_id
            ? "generated"
            : "manual",
        status: row.status as LearnerScheduleStatus,
        ...(row.source_placement_id
          ? { sourcePlacementId: row.source_placement_id }
          : {}),
        ...(row.origin_entry_id ? { originEntryId: row.origin_entry_id } : {}),
        ...(row.completed_at ? { completedAt: row.completed_at } : {}),
        updatedAt: row.updated_at,
      };
    }

    const prerequisiteWaivers: Record<
      string,
      LearnerPrerequisiteWaiverRecord
    > = {};
    for (const row of waiverRows) {
      const course = bundle.courseVersions.find(
        (candidate) => candidate.id === row.course_version_id,
      );
      const isDeclared = course?.prerequisites.some(
        (prerequisite) =>
          prerequisite.courseVersionId === row.prerequisite_course_version_id,
      );
      if (!course || !isDeclared) {
        dataProblems.push(`Prerequisite waiver ${row.id} is not valid here.`);
        continue;
      }
      if (!["placement", "prior_learning", "review", "manual"].includes(row.basis)) {
        dataProblems.push(`Prerequisite waiver ${row.id} has invalid basis.`);
        continue;
      }
      prerequisiteWaivers[row.id] = {
        id: row.id,
        courseVersionId: course.id,
        prerequisiteCourseVersionId:
          row.prerequisite_course_version_id as CourseVersionId,
        basis: row.basis as LearnerWaiverBasis,
        reason: row.reason,
        ...(row.evidence_text_or_url
          ? { evidence: row.evidence_text_or_url }
          : {}),
        grantedAt: row.granted_at,
        ...(row.revoked_at ? { revokedAt: row.revoked_at } : {}),
        updatedAt: row.updated_at,
      };
    }

    const history: LearnerProgressHistoryEntry[] = [];
    for (const row of eventRows) {
      if (
        ![
          "program",
          "requirement",
          "unit",
          "evidence",
          "assessment",
          "schedule",
          "waiver",
        ].includes(row.entity_type)
      ) {
        dataProblems.push(`Progress event ${row.id} has invalid entity type.`);
        continue;
      }
      history.push({
        id: row.id,
        eventType: row.event_type,
        entityType: row.entity_type as LearnerHistoryEntityType,
        entityId: row.entity_id,
        occurredAt: row.occurred_at,
        ...(row.mutation_id
          ? { clientMutationId: row.mutation_id }
          : {}),
        metadata: parseObject(
          row.payload_json,
          `Progress event ${row.id} payload`,
        ),
      });
    }
    if (dataProblems.length > 0) {
      throw new LearnerProgressDataError(dataProblems);
    }

    const state = stateRows[0];
    let enrollment: LearnerEnrollmentState | null = null;
    if (state && state.enrollment_status !== "not_enrolled") {
      if (
        !["enrolled", "paused", "completed"].includes(
          state.enrollment_status,
        ) ||
        !state.start_date ||
        state.pace_hours_per_week === null ||
        !state.timezone ||
        !state.enrolled_at
      ) {
        throw new LearnerProgressDataError([
          `Enrollment state for ${learnerId}/${programVersionId} is incomplete.`,
        ]);
      }
      enrollment = {
        startDate: state.start_date,
        paceHoursPerWeek: state.pace_hours_per_week,
        preferredStudyDays: parseStudyDays(
          state.study_days_json,
          `Enrollment ${programVersionId} study days`,
        ),
        timezone: state.timezone,
        enrolledAt: state.enrolled_at,
        status: state.enrollment_status as LearnerEnrollmentStatus,
        updatedAt: state.updated_at,
      };
    }

    return {
      learnerId,
      bundleId: bundle.id,
      programVersionId,
      ...(progress?.selected_concentration_id
        ? {
            selectedConcentrationId:
              progress.selected_concentration_id as ConcentrationId,
          }
        : {}),
      courses,
      revision: state?.revision ?? 0,
      enrollment,
      requirementSelections,
      unitEvidences,
      assessmentAttempts,
      scheduleEntries,
      prerequisiteWaivers,
      history,
      ...(progress
        ? {
            startedAt: progress.started_at,
            updatedAt: state?.updated_at ?? progress.updated_at,
          }
        : {}),
    };
  }

  /**
   * Applies one optimistic, idempotent learner mutation. Every state write is
   * guarded by both the accepted mutation row and the caller's base revision,
   * so a stale device cannot partially overwrite newer account data.
   */
  async applyMutation(
    input: ApplyLearnerProgressMutationInput,
  ): Promise<AppliedLearnerProgressMutation> {
    const learnerId = nonEmpty(input.learnerId, "learnerId");
    const deviceId = nonEmpty(input.deviceId, "deviceId");
    const mutationId = nonEmpty(input.clientMutationId, "clientMutationId");
    if (!Number.isInteger(input.baseRevision) || input.baseRevision < 0) {
      throw new LearnerProgressValidationError([
        "baseRevision must be a nonnegative integer.",
      ]);
    }
    if (input.operations.length === 0 || input.operations.length > 20) {
      throw new LearnerProgressValidationError([
        "A mutation must contain between 1 and 20 operations.",
      ]);
    }

    const bundle = await this.requireBundle(input.programVersionId);
    await d1Batch(
      this.database,
      [
        this.database
          .prepare(
            `INSERT INTO learner_program_progress (
               learner_id,
               program_version_id,
               bundle_id
             )
             VALUES (?, ?, ?)
             ON CONFLICT(learner_id, program_version_id) DO NOTHING`,
          )
          .bind(learnerId, input.programVersionId, bundle.id),
        this.database
          .prepare(
            `INSERT INTO learner_program_states (
               learner_id,
               program_version_id
             )
             VALUES (?, ?)
             ON CONFLICT(learner_id, program_version_id) DO NOTHING`,
          )
          .bind(learnerId, input.programVersionId),
      ],
      "ensure learner program state",
    );

    const payloadHash = await sha256Hex(
      canonicalJson({
        baseRevision: input.baseRevision,
        deviceId,
        operations: input.operations,
        programVersionId: input.programVersionId,
      }),
    );
    const existingMutation = await this.getAppliedMutation(
      learnerId,
      input.programVersionId,
      mutationId,
    );
    if (existingMutation) {
      if (
        existingMutation.payload_hash !== payloadHash ||
        existingMutation.device_id !== deviceId ||
        existingMutation.base_revision !== input.baseRevision
      ) {
        throw new LearnerProgressMutationConflictError(
          learnerId,
          input.programVersionId,
          mutationId,
        );
      }
      return {
        mutationId,
        resultRevision: existingMutation.result_revision,
        alreadyApplied: true,
        progress: await this.loadProgress(learnerId, input.programVersionId),
      };
    }

    const current = await this.loadProgress(learnerId, input.programVersionId);
    if (current.revision !== input.baseRevision) {
      throw new LearnerProgressRevisionConflictError(
        learnerId,
        input.programVersionId,
        input.baseRevision,
        current.revision,
      );
    }

    const assessmentLifecycleRows = input.operations.some(
      (operation) =>
        operation.type === "upsert-assessment-attempt" ||
        operation.type === "set-assessment-result",
    )
      ? await this.loadAssessmentAttemptLifecycleRows(
          learnerId,
          input.programVersionId,
        )
      : [];
    const assessmentLifecycleById = new Map(
      assessmentLifecycleRows.map((row) => [row.id, row]),
    );

    const resultRevision = input.baseRevision + 1;
    const courseById = new Map(
      bundle.courseVersions.map((course) => [course.id, course]),
    );
    const assessmentById = new Map(
      bundle.assessmentVersions.map((assessment) => [assessment.id, assessment]),
    );
    const groupById = new Map(
      bundle.programVersion.requirements.map((group) => [group.id, group]),
    );
    const projectedRequirementSelections = Object.fromEntries(
      Object.entries(current.requirementSelections).map(([groupId, ids]) => [
        groupId,
        [...ids],
      ]),
    ) as Record<string, CourseVersionId[]>;
    let projectedConcentrationId = current.selectedConcentrationId;
    const upsertedScheduleIds = new Set(
      input.operations.flatMap((operation) =>
        operation.type === "upsert-schedule-entry"
          ? [operation.entry.id]
          : [],
      ),
    );
    const seenAssessmentLifecycleIds = new Set<string>();
    const seenScheduleLifecycleIds = new Set<string>();
    const seenWaiverLifecycleIds = new Set<string>();

    const validationProblems: string[] = [];
    for (const [index, operation] of input.operations.entries()) {
      const label = `operations[${index}]`;
      switch (operation.type) {
        case "set-enrollment": {
          const enrollment = operation.enrollment;
          if (!enrollment) break;
          try {
            requireIsoDate(enrollment.startDate, `${label}.startDate`);
            requireIsoDateTime(enrollment.enrolledAt, `${label}.enrolledAt`);
            requireFiniteNumber(
              enrollment.paceHoursPerWeek,
              `${label}.paceHoursPerWeek`,
              { minimum: Number.MIN_VALUE, maximum: 168 },
            );
            cleanStudyDays(enrollment.preferredStudyDays);
            nonEmpty(enrollment.timezone, `${label}.timezone`);
          } catch (error) {
            validationProblems.push(
              ...(error instanceof LearnerProgressValidationError
                ? error.problems
                : [String(error)]),
            );
          }
          break;
        }
        case "set-concentration":
          try {
            requireConcentration(bundle, operation.selectedConcentrationId);
            projectedConcentrationId =
              operation.selectedConcentrationId ?? undefined;
          } catch (error) {
            validationProblems.push(
              ...(error instanceof LearnerProgressValidationError
                ? error.problems
                : [String(error)]),
            );
          }
          break;
        case "set-requirement-selection": {
          const group = groupById.get(operation.requirementGroupId);
          if (!group) {
            validationProblems.push(
              `${label}.requirementGroupId is not in this publication.`,
            );
            break;
          }
          const uniqueIds = [...new Set(operation.courseVersionIds)];
          if (uniqueIds.length !== operation.courseVersionIds.length) {
            validationProblems.push(`${label}.courseVersionIds has duplicates.`);
          }
          const options = uniqueIds.map((courseVersionId) =>
            group.options.find(
              (option) => option.courseVersionId === courseVersionId,
            ),
          );
          if (options.some((option) => !option)) {
            validationProblems.push(
              `${label} selects a course outside ${group.title}.`,
            );
          }
          if (
            group.rule.maxSelections !== undefined &&
            uniqueIds.length > group.rule.maxSelections
          ) {
            validationProblems.push(
              `${label} exceeds ${group.title}'s selection limit.`,
            );
          }
          if (
            uniqueIds.length > 0 &&
            uniqueIds.length < group.rule.minSelections
          ) {
            validationProblems.push(
              `${label} does not satisfy ${group.title}'s minimum selection count.`,
            );
          }
          projectedRequirementSelections[group.id] = uniqueIds;
          break;
        }
        case "set-unit-completion":
          try {
            requireUnitIds(bundle, operation.courseVersionId, [
              operation.learningUnitId,
            ]);
          } catch (error) {
            validationProblems.push(
              ...(error instanceof LearnerProgressValidationError
                ? error.problems
                : [String(error)]),
            );
          }
          break;
        case "upsert-unit-evidence":
          try {
            requireUnitIds(bundle, operation.evidence.courseVersionId, [
              operation.evidence.learningUnitId,
            ]);
            nonEmpty(operation.evidence.textOrUrl, `${label}.evidence.textOrUrl`);
          } catch (error) {
            validationProblems.push(
              ...(error instanceof LearnerProgressValidationError
                ? error.problems
                : [String(error)]),
            );
          }
          break;
        case "delete-unit-evidence":
          try {
            requireUnitIds(bundle, operation.courseVersionId, [
              operation.learningUnitId,
            ]);
          } catch (error) {
            validationProblems.push(
              ...(error instanceof LearnerProgressValidationError
                ? error.problems
                : [String(error)]),
            );
          }
          break;
        case "upsert-assessment-attempt": {
          const attempt = operation.attempt;
          if (seenAssessmentLifecycleIds.has(attempt.id)) {
            validationProblems.push(
              `${label}.attempt repeats a lifecycle change for ${attempt.id}.`,
            );
          }
          seenAssessmentLifecycleIds.add(attempt.id);
          const assessment = assessmentById.get(attempt.assessmentVersionId);
          if (
            !assessment ||
            assessment.courseVersionId !== attempt.courseVersionId
          ) {
            validationProblems.push(
              `${label}.attempt does not match an assessment in this publication.`,
            );
            break;
          }
          if (!Number.isInteger(attempt.attemptNumber) || attempt.attemptNumber <= 0) {
            validationProblems.push(`${label}.attemptNumber must be positive.`);
          }
          this.validateAssessmentAttemptShape(
            assessment.maximumScore,
            attempt,
            `${label}.attempt`,
            validationProblems,
          );
          const existing = assessmentLifecycleById.get(attempt.id);
          if (existing) {
            if (
              existing.course_version_id !== attempt.courseVersionId ||
              existing.assessment_version_id !== attempt.assessmentVersionId ||
              existing.attempt_number !== attempt.attemptNumber ||
              existing.started_at !== attempt.startedAt
            ) {
              validationProblems.push(
                `${label}.attempt cannot change its course, assessment, attempt number, or start time.`,
              );
            }
            if (existing.status === "evaluated" || existing.status === "void") {
              validationProblems.push(
                `${label}.attempt cannot rewrite terminal ${existing.status} attempt ${attempt.id}.`,
              );
            } else if (
              existing.status === "submitted" &&
              attempt.status === "draft"
            ) {
              validationProblems.push(
                `${label}.attempt cannot regress submitted attempt ${attempt.id} to draft.`,
              );
            }
          }
          break;
        }
        case "set-assessment-result": {
          const attemptId = operation.assessmentAttemptId;
          if (seenAssessmentLifecycleIds.has(attemptId)) {
            validationProblems.push(
              `${label} repeats a lifecycle change for ${attemptId}.`,
            );
          }
          seenAssessmentLifecycleIds.add(attemptId);
          const lifecycle = assessmentLifecycleById.get(attemptId);
          const assessment = lifecycle
            ? assessmentById.get(
                lifecycle.assessment_version_id as AssessmentVersionId,
              )
            : undefined;
          if (!lifecycle || !assessment) {
            validationProblems.push(
              `${label}.assessmentAttemptId is not an existing attempt.`,
            );
            break;
          }
          if (lifecycle.status === "evaluated" || lifecycle.status === "void") {
            validationProblems.push(
              `${label} cannot rewrite terminal ${lifecycle.status} attempt ${attemptId}.`,
            );
          }
          this.validateAssessmentResult(
            assessment.maximumScore,
            operation.result,
            `${label}.result`,
            validationProblems,
          );
          break;
        }
        case "upsert-schedule-entry": {
          const entry = operation.entry;
          if (seenScheduleLifecycleIds.has(entry.id)) {
            validationProblems.push(
              `${label}.entry repeats a lifecycle change for ${entry.id}.`,
            );
          }
          seenScheduleLifecycleIds.add(entry.id);
          const courseVersionId = this.courseVersionForScheduleSubject(
            bundle,
            entry.subject,
          );
          if (!courseVersionId) {
            validationProblems.push(
              `${label}.entry.subject is not in this publication.`,
            );
          }
          if (
            !["planned", "completed", "skipped", "carried", "cancelled"].includes(
              entry.status,
            )
          ) {
            validationProblems.push(`${label}.entry.status is unsupported.`);
          }
          if (!["manual", "generated", "carry-forward"].includes(entry.source)) {
            validationProblems.push(`${label}.entry.source is unsupported.`);
          }
          try {
            requireIsoDate(entry.scheduledDate, `${label}.entry.scheduledDate`);
            requireClockTime(entry.startTime, `${label}.entry.startTime`);
            requireFiniteNumber(
              entry.plannedMinutes,
              `${label}.entry.plannedMinutes`,
              { minimum: 1 },
            );
            if (entry.completedAt) {
              requireIsoDateTime(entry.completedAt, `${label}.entry.completedAt`);
            }
            if (entry.updatedAt) {
              requireIsoDateTime(entry.updatedAt, `${label}.entry.updatedAt`);
            }
          } catch (error) {
            validationProblems.push(
              ...(error instanceof LearnerProgressValidationError
                ? error.problems
                : [String(error)]),
            );
          }
          if (!Number.isInteger(entry.position) || entry.position < 0) {
            validationProblems.push(`${label}.entry.position must be nonnegative.`);
          }
          if (entry.status === "completed" && !entry.completedAt) {
            validationProblems.push(`${label}.entry.completedAt is required.`);
          }
          if (entry.status !== "completed" && entry.completedAt) {
            validationProblems.push(
              `${label}.entry.completedAt is only valid for completed entries.`,
            );
          }
          if (
            entry.originEntryId &&
            !current.scheduleEntries[entry.originEntryId] &&
            !upsertedScheduleIds.has(entry.originEntryId)
          ) {
            validationProblems.push(
              `${label}.entry.originEntryId is not in this learner program.`,
            );
          }
          const existing = current.scheduleEntries[entry.id];
          if (
            existing &&
            !scheduleSubjectsEqual(existing.subject, entry.subject)
          ) {
            validationProblems.push(
              `${label}.entry cannot change the subject of existing schedule entry ${entry.id}.`,
            );
          }
          if (
            existing &&
            TERMINAL_SCHEDULE_STATUSES.has(existing.status)
          ) {
            validationProblems.push(
              `${label}.entry cannot rewrite terminal ${existing.status} schedule entry ${entry.id}.`,
            );
          }
          break;
        }
        case "delete-schedule-entry": {
          const entryId = operation.scheduleEntryId;
          if (seenScheduleLifecycleIds.has(entryId)) {
            validationProblems.push(
              `${label} repeats a lifecycle change for ${entryId}.`,
            );
          }
          seenScheduleLifecycleIds.add(entryId);
          const existing = current.scheduleEntries[entryId];
          if (!existing) {
            validationProblems.push(
              `${label}.scheduleEntryId is not an existing entry.`,
            );
          } else if (TERMINAL_SCHEDULE_STATUSES.has(existing.status)) {
            validationProblems.push(
              `${label} cannot cancel terminal ${existing.status} schedule entry ${entryId}.`,
            );
          }
          break;
        }
        case "grant-prerequisite-waiver": {
          const waiver = operation.waiver;
          if (seenWaiverLifecycleIds.has(waiver.id)) {
            validationProblems.push(
              `${label}.waiver repeats a lifecycle change for ${waiver.id}.`,
            );
          }
          seenWaiverLifecycleIds.add(waiver.id);
          const course = courseById.get(waiver.courseVersionId);
          if (
            !course?.prerequisites.some(
              (prerequisite) =>
                prerequisite.courseVersionId ===
                waiver.prerequisiteCourseVersionId,
            )
          ) {
            validationProblems.push(
              `${label}.waiver does not target a declared prerequisite.`,
            );
          }
          if (!waiver.reason.trim()) {
            validationProblems.push(`${label}.waiver.reason is empty.`);
          }
          if (
            !["placement", "prior_learning", "review", "manual"].includes(
              waiver.basis,
            )
          ) {
            validationProblems.push(`${label}.waiver.basis is unsupported.`);
          }
          try {
            requireIsoDateTime(waiver.grantedAt, `${label}.waiver.grantedAt`);
            if (waiver.updatedAt) {
              requireIsoDateTime(waiver.updatedAt, `${label}.waiver.updatedAt`);
            }
          } catch (error) {
            validationProblems.push(
              ...(error instanceof LearnerProgressValidationError
                ? error.problems
                : [String(error)]),
            );
          }
          if (waiver.revokedAt) {
            validationProblems.push(
              `${label}.waiver cannot be granted with revokedAt.`,
            );
          }
          const existing = current.prerequisiteWaivers[waiver.id];
          if (
            existing &&
            (existing.courseVersionId !== waiver.courseVersionId ||
              existing.prerequisiteCourseVersionId !==
                waiver.prerequisiteCourseVersionId ||
              existing.grantedAt !== waiver.grantedAt)
          ) {
            validationProblems.push(
              `${label}.waiver cannot change its course pair or grant time.`,
            );
          }
          if (existing?.revokedAt) {
            validationProblems.push(
              `${label}.waiver cannot resurrect revoked waiver ${waiver.id}.`,
            );
          }
          break;
        }
        case "revoke-prerequisite-waiver": {
          const waiverId = operation.prerequisiteWaiverId;
          if (seenWaiverLifecycleIds.has(waiverId)) {
            validationProblems.push(
              `${label} repeats a lifecycle change for ${waiverId}.`,
            );
          }
          seenWaiverLifecycleIds.add(waiverId);
          const existing = current.prerequisiteWaivers[waiverId];
          if (!existing) {
            validationProblems.push(
              `${label}.prerequisiteWaiverId is not an existing waiver.`,
            );
          } else if (existing.revokedAt) {
            validationProblems.push(
              `${label} cannot revoke already revoked waiver ${waiverId}.`,
            );
          }
          try {
            requireIsoDateTime(operation.revokedAt, `${label}.revokedAt`);
          } catch (error) {
            validationProblems.push(
              ...(error instanceof LearnerProgressValidationError
                ? error.problems
                : [String(error)]),
            );
          }
          break;
        }
      }
    }

    for (const [groupId, selectedIds] of Object.entries(
      projectedRequirementSelections,
    )) {
      const group = groupById.get(groupId as RequirementGroupId);
      if (
        group?.rule.selectionConstraint === "same concentration" &&
        selectedIds.some(
          (courseVersionId) =>
            group.options.find(
              (option) => option.courseVersionId === courseVersionId,
            )?.concentrationId !== projectedConcentrationId,
        )
      ) {
        validationProblems.push(
          `Requirement ${group.title} does not match the selected concentration.`,
        );
      }
    }
    const path = resolveLearnerPath(bundle, {
      selectedConcentrationId: projectedConcentrationId,
      selectedCourseVersionIds: Object.values(
        projectedRequirementSelections,
      ).flat(),
    });
    if (!path.isResolved) {
      validationProblems.push(
        "The resulting concentration and elective choices do not resolve to a complete pathway.",
      );
    }
    if (validationProblems.length > 0) {
      throw new LearnerProgressValidationError(validationProblems);
    }

    const guardSql = `EXISTS (
      SELECT 1
      FROM learner_program_states AS state
      JOIN learner_progress_mutations AS mutation
        ON mutation.learner_id = state.learner_id
       AND mutation.program_version_id = state.program_version_id
      WHERE state.learner_id = ?
        AND state.program_version_id = ?
        AND state.revision = ?
        AND mutation.mutation_id = ?
        AND mutation.payload_hash = ?
    )`;
    const guardValues = () => [
      learnerId,
      input.programVersionId,
      input.baseRevision,
      mutationId,
      payloadHash,
    ] as const;
    const statements = [
      this.database
        .prepare(
          `INSERT INTO learner_progress_mutations (
             learner_id,
             program_version_id,
             mutation_id,
             device_id,
             base_revision,
             result_revision,
             payload_hash
           )
           SELECT ?, ?, ?, ?, ?, ?, ?
           WHERE EXISTS (
             SELECT 1
             FROM learner_program_states
             WHERE learner_id = ?
               AND program_version_id = ?
               AND revision = ?
           )
           ON CONFLICT DO NOTHING`,
        )
        .bind(
          learnerId,
          input.programVersionId,
          mutationId,
          deviceId,
          input.baseRevision,
          resultRevision,
          payloadHash,
          learnerId,
          input.programVersionId,
          input.baseRevision,
        ),
    ];
    const events: Array<{
      id: string;
      entityType: LearnerHistoryEntityType;
      entityId: string;
      eventType: string;
      payload: Record<string, unknown>;
    }> = [];

    const eventBatchHash = await sha256Hex(
      canonicalJson({ learnerId, mutationId, programVersionId: input.programVersionId }),
    );
    for (const [index, operation] of input.operations.entries()) {
      const event = (
        entityType: LearnerHistoryEntityType,
        entityId: string,
        eventType: string,
        payload: Record<string, unknown>,
      ) =>
        events.push({
          id: `evt_${eventBatchHash.slice(0, 28)}_${String(index).padStart(3, "0")}`,
          entityType,
          entityId,
          eventType,
          payload,
        });

      switch (operation.type) {
        case "set-enrollment": {
          const enrollment = operation.enrollment;
          statements.push(
            this.database
              .prepare(
                `UPDATE learner_program_states
                 SET enrollment_status = ?,
                     start_date = ?,
                     pace_hours_per_week = ?,
                     study_days_json = ?,
                     timezone = ?,
                     enrolled_at = ?,
                     last_mutation_id = ?,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE learner_id = ?
                   AND program_version_id = ?
                   AND ${guardSql}`,
              )
              .bind(
                enrollment?.status ?? "not_enrolled",
                enrollment?.startDate ?? null,
                enrollment?.paceHoursPerWeek ?? null,
                canonicalJson(
                  enrollment
                    ? cleanStudyDays(enrollment.preferredStudyDays)
                    : [],
                ),
                enrollment?.timezone ?? null,
                enrollment?.enrolledAt ?? null,
                mutationId,
                learnerId,
                input.programVersionId,
                ...guardValues(),
              ),
          );
          event(
            "program",
            input.programVersionId,
            enrollment ? "enrollment-set" : "enrollment-cleared",
            enrollment ? { ...enrollment } : {},
          );
          break;
        }
        case "set-concentration":
          statements.push(
            this.database
              .prepare(
                `UPDATE learner_program_progress
                 SET selected_concentration_id = ?,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE learner_id = ?
                   AND program_version_id = ?
                   AND ${guardSql}`,
              )
              .bind(
                operation.selectedConcentrationId,
                learnerId,
                input.programVersionId,
                ...guardValues(),
              ),
          );
          event(
            "program",
            input.programVersionId,
            "concentration-set",
            {
              selectedConcentrationId: operation.selectedConcentrationId,
            },
          );
          break;
        case "set-requirement-selection": {
          const group = groupById.get(operation.requirementGroupId)!;
          const selectedOptions = operation.courseVersionIds.map(
            (courseVersionId) =>
              group.options.find(
                (option) => option.courseVersionId === courseVersionId,
              )!,
          );
          statements.push(
            this.database
              .prepare(
                `DELETE FROM learner_requirement_selections
                 WHERE learner_id = ?
                   AND program_version_id = ?
                   AND requirement_group_id = ?
                   AND ${guardSql}`,
              )
              .bind(
                learnerId,
                input.programVersionId,
                group.id,
                ...guardValues(),
              ),
          );
          if (selectedOptions.length > 0) {
            statements.push(
              this.database
                .prepare(
                  `INSERT INTO learner_requirement_selections (
                     learner_id,
                     program_version_id,
                     requirement_group_id,
                     requirement_option_id,
                     course_version_id,
                     selection_source
                   )
                   SELECT
                     ?,
                     ?,
                     ?,
                     CAST(json_extract(value, '$.optionId') AS TEXT),
                     CAST(json_extract(value, '$.courseVersionId') AS TEXT),
                     'learner'
                   FROM json_each(?)
                   WHERE ${guardSql}
                   ON CONFLICT DO UPDATE SET
                     course_version_id = excluded.course_version_id,
                     selection_source = excluded.selection_source,
                     updated_at = CURRENT_TIMESTAMP`,
                )
                .bind(
                  learnerId,
                  input.programVersionId,
                  group.id,
                  canonicalJson(
                    selectedOptions.map((option) => ({
                      optionId: option.id,
                      courseVersionId: option.courseVersionId,
                    })),
                  ),
                  ...guardValues(),
                ),
            );
          }
          event("requirement", group.id, "requirement-selection-set", {
            courseVersionIds: [...operation.courseVersionIds],
          });
          break;
        }
        case "set-unit-completion": {
          const timestamp = currentIsoDateTime();
          statements.push(
            this.database
              .prepare(
                `INSERT INTO learner_unit_states (
                   learner_id,
                   program_version_id,
                   course_version_id,
                   learning_unit_id,
                   status,
                   completed_at,
                   tombstoned_at,
                   last_mutation_id
                 )
                 SELECT ?, ?, ?, ?, ?, ?, ?, ?
                 WHERE ${guardSql}
                 ON CONFLICT(
                   learner_id,
                   program_version_id,
                   course_version_id,
                   learning_unit_id
                 ) DO UPDATE SET
                   status = excluded.status,
                   completed_at = excluded.completed_at,
                   tombstoned_at = excluded.tombstoned_at,
                   last_mutation_id = excluded.last_mutation_id,
                   updated_at = CURRENT_TIMESTAMP`,
              )
              .bind(
                learnerId,
                input.programVersionId,
                operation.courseVersionId,
                operation.learningUnitId,
                operation.completed ? "completed" : "tombstoned",
                operation.completed ? timestamp : null,
                operation.completed ? null : timestamp,
                mutationId,
                ...guardValues(),
              ),
          );
          event(
            "unit",
            operation.learningUnitId,
            operation.completed ? "unit-completed" : "unit-reopened",
            { courseVersionId: operation.courseVersionId },
          );
          break;
        }
        case "upsert-unit-evidence": {
          const evidence = operation.evidence;
          statements.push(
            this.database
              .prepare(
                `INSERT INTO learner_unit_evidence (
                   learner_id,
                   program_version_id,
                   course_version_id,
                   learning_unit_id,
                   status,
                   text_or_url,
                   submitted_at,
                   tombstoned_at,
                   last_mutation_id
                 )
                 SELECT ?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP, NULL, ?
                 WHERE ${guardSql}
                 ON CONFLICT(
                   learner_id,
                   program_version_id,
                   course_version_id,
                   learning_unit_id
                 ) DO UPDATE SET
                   status = 'active',
                   text_or_url = excluded.text_or_url,
                   submitted_at = excluded.submitted_at,
                   tombstoned_at = NULL,
                   last_mutation_id = excluded.last_mutation_id,
                   updated_at = CURRENT_TIMESTAMP`,
              )
              .bind(
                learnerId,
                input.programVersionId,
                evidence.courseVersionId,
                evidence.learningUnitId,
                evidence.textOrUrl.trim(),
                mutationId,
                ...guardValues(),
              ),
          );
          event("evidence", evidence.learningUnitId, "evidence-upserted", {
            courseVersionId: evidence.courseVersionId,
          });
          break;
        }
        case "delete-unit-evidence": {
          statements.push(
            this.database
              .prepare(
                `INSERT INTO learner_unit_evidence (
                   learner_id,
                   program_version_id,
                   course_version_id,
                   learning_unit_id,
                   status,
                   text_or_url,
                   submitted_at,
                   tombstoned_at,
                   last_mutation_id
                 )
                 SELECT ?, ?, ?, ?, 'tombstoned', NULL, NULL, CURRENT_TIMESTAMP, ?
                 WHERE ${guardSql}
                 ON CONFLICT(
                   learner_id,
                   program_version_id,
                   course_version_id,
                   learning_unit_id
                 ) DO UPDATE SET
                   status = 'tombstoned',
                   text_or_url = NULL,
                   submitted_at = NULL,
                   tombstoned_at = excluded.tombstoned_at,
                   last_mutation_id = excluded.last_mutation_id,
                   updated_at = CURRENT_TIMESTAMP`,
              )
              .bind(
                learnerId,
                input.programVersionId,
                operation.courseVersionId,
                operation.learningUnitId,
                mutationId,
                ...guardValues(),
              ),
          );
          event("evidence", operation.learningUnitId, "evidence-deleted", {
            courseVersionId: operation.courseVersionId,
          });
          break;
        }
        case "upsert-assessment-attempt": {
          const attempt = operation.attempt;
          const assessment = assessmentById.get(attempt.assessmentVersionId)!;
          const result = attempt.result;
          statements.push(
            this.database
              .prepare(
                `INSERT INTO learner_assessment_attempts (
                   id,
                   learner_id,
                   program_version_id,
                   course_version_id,
                   assessment_version_id,
                   attempt_number,
                   status,
                   submission_evidence_json,
                   score,
                   maximum_score,
                   passed,
                   evaluation_method,
                   feedback,
                   started_at,
                   submitted_at,
                   evaluated_at,
                   last_mutation_id
                 )
                 SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                 WHERE ${guardSql}
                 ON CONFLICT(learner_id, program_version_id, id) DO UPDATE SET
                   status = excluded.status,
                   submission_evidence_json = excluded.submission_evidence_json,
                   score = excluded.score,
                   maximum_score = excluded.maximum_score,
                   passed = excluded.passed,
                   evaluation_method = excluded.evaluation_method,
                   feedback = excluded.feedback,
                   submitted_at = excluded.submitted_at,
                   evaluated_at = excluded.evaluated_at,
                   last_mutation_id = excluded.last_mutation_id,
                   updated_at = CURRENT_TIMESTAMP
                 WHERE learner_assessment_attempts.course_version_id =
                         excluded.course_version_id
                   AND learner_assessment_attempts.assessment_version_id =
                         excluded.assessment_version_id
                   AND learner_assessment_attempts.attempt_number =
                         excluded.attempt_number
                   AND learner_assessment_attempts.started_at = excluded.started_at
                   AND (
                     learner_assessment_attempts.status = 'draft'
                     OR (
                       learner_assessment_attempts.status = 'submitted'
                       AND excluded.status IN ('submitted', 'evaluated', 'void')
                     )
                   )`,
              )
              .bind(
                attempt.id,
                learnerId,
                input.programVersionId,
                attempt.courseVersionId,
                attempt.assessmentVersionId,
                attempt.attemptNumber,
                attempt.status,
                canonicalJson(attempt.submissionEvidence),
                result?.score ?? null,
                result ? assessment.maximumScore : null,
                result ? Number(result.passed) : null,
                result?.evaluationMethod ?? null,
                result?.feedback ?? null,
                attempt.startedAt,
                attempt.submittedAt ?? null,
                result?.evaluatedAt ?? null,
                mutationId,
                ...guardValues(),
              ),
          );
          event("assessment", attempt.id, "assessment-attempt-upserted", {
            assessmentVersionId: attempt.assessmentVersionId,
            status: attempt.status,
          });
          break;
        }
        case "set-assessment-result": {
          const attempt = current.assessmentAttempts[operation.assessmentAttemptId];
          const assessment = assessmentById.get(attempt.assessmentVersionId)!;
          statements.push(
            this.database
              .prepare(
                `UPDATE learner_assessment_attempts
                 SET status = 'evaluated',
                     score = ?,
                     maximum_score = ?,
                     passed = ?,
                     evaluation_method = ?,
                     feedback = ?,
                     submitted_at = COALESCE(submitted_at, CURRENT_TIMESTAMP),
                     evaluated_at = ?,
                     last_mutation_id = ?,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE learner_id = ?
                   AND program_version_id = ?
                   AND id = ?
                   AND status IN ('draft', 'submitted')
                   AND ${guardSql}`,
              )
              .bind(
                operation.result.score,
                assessment.maximumScore,
                Number(operation.result.passed),
                operation.result.evaluationMethod,
                operation.result.feedback ?? null,
                operation.result.evaluatedAt,
                mutationId,
                learnerId,
                input.programVersionId,
                operation.assessmentAttemptId,
                ...guardValues(),
              ),
          );
          event(
            "assessment",
            operation.assessmentAttemptId,
            "assessment-evaluated",
            { ...operation.result },
          );
          break;
        }
        case "upsert-schedule-entry": {
          const entry = operation.entry;
          const courseVersionId = this.courseVersionForScheduleSubject(
            bundle,
            entry.subject,
          )!;
          const learningUnitId =
            entry.subject.kind === "learningUnit" ? entry.subject.id : null;
          const assessmentVersionId =
            entry.subject.kind === "assessmentVersion"
              ? entry.subject.id
              : null;
          statements.push(
            this.database
              .prepare(
                `INSERT INTO learner_schedule_entries (
                   id,
                   learner_id,
                   program_version_id,
                   course_version_id,
                   learning_unit_id,
                   assessment_version_id,
                   scheduled_date,
                   start_time,
                   planned_minutes,
                   position,
                   status,
                   source_placement_id,
                   origin_entry_id,
                   completed_at,
                   last_mutation_id
                 )
                 SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                 WHERE ${guardSql}
                 ON CONFLICT(learner_id, program_version_id, id) DO UPDATE SET
                   scheduled_date = excluded.scheduled_date,
                   start_time = excluded.start_time,
                   planned_minutes = excluded.planned_minutes,
                   position = excluded.position,
                   status = excluded.status,
                   source_placement_id = excluded.source_placement_id,
                   origin_entry_id = excluded.origin_entry_id,
                   completed_at = excluded.completed_at,
                   last_mutation_id = excluded.last_mutation_id,
                   updated_at = CURRENT_TIMESTAMP
                 WHERE learner_schedule_entries.course_version_id =
                         excluded.course_version_id
                   AND learner_schedule_entries.learning_unit_id IS
                         excluded.learning_unit_id
                   AND learner_schedule_entries.assessment_version_id IS
                         excluded.assessment_version_id
                   AND learner_schedule_entries.status = 'planned'`,
              )
              .bind(
                entry.id,
                learnerId,
                input.programVersionId,
                courseVersionId,
                learningUnitId,
                assessmentVersionId,
                entry.scheduledDate,
                entry.startTime ?? null,
                entry.plannedMinutes,
                entry.position,
                entry.status,
                entry.source === "generated" ? "generated" : null,
                entry.originEntryId ?? null,
                entry.completedAt ?? null,
                mutationId,
                ...guardValues(),
              ),
          );
          event("schedule", entry.id, "schedule-entry-upserted", {
            scheduledDate: entry.scheduledDate,
            status: entry.status,
          });
          break;
        }
        case "delete-schedule-entry":
          statements.push(
            this.database
              .prepare(
                `UPDATE learner_schedule_entries
                 SET status = 'cancelled',
                     completed_at = NULL,
                     last_mutation_id = ?,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE learner_id = ?
                   AND program_version_id = ?
                   AND id = ?
                   AND status = 'planned'
                   AND ${guardSql}`,
              )
              .bind(
                mutationId,
                learnerId,
                input.programVersionId,
                operation.scheduleEntryId,
                ...guardValues(),
              ),
          );
          event(
            "schedule",
            operation.scheduleEntryId,
            "schedule-entry-cancelled",
            {},
          );
          break;
        case "grant-prerequisite-waiver": {
          const waiver = operation.waiver;
          statements.push(
            this.database
              .prepare(
                `INSERT INTO learner_prerequisite_waivers (
                   id,
                   learner_id,
                   program_version_id,
                   course_version_id,
                   prerequisite_course_version_id,
                   basis,
                   reason,
                   evidence_text_or_url,
                   granted_at,
                   revoked_at,
                   last_mutation_id
                 )
                 SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?
                 WHERE ${guardSql}
                 ON CONFLICT(learner_id, program_version_id, id) DO UPDATE SET
                   basis = excluded.basis,
                   reason = excluded.reason,
                   evidence_text_or_url = excluded.evidence_text_or_url,
                   last_mutation_id = excluded.last_mutation_id,
                   updated_at = CURRENT_TIMESTAMP
                 WHERE learner_prerequisite_waivers.course_version_id =
                         excluded.course_version_id
                   AND learner_prerequisite_waivers.prerequisite_course_version_id =
                         excluded.prerequisite_course_version_id
                   AND learner_prerequisite_waivers.granted_at = excluded.granted_at
                   AND learner_prerequisite_waivers.revoked_at IS NULL`,
              )
              .bind(
                waiver.id,
                learnerId,
                input.programVersionId,
                waiver.courseVersionId,
                waiver.prerequisiteCourseVersionId,
                waiver.basis,
                waiver.reason.trim(),
                waiver.evidence ?? null,
                waiver.grantedAt,
                mutationId,
                ...guardValues(),
              ),
          );
          event("waiver", waiver.id, "prerequisite-waiver-granted", {
            courseVersionId: waiver.courseVersionId,
            prerequisiteCourseVersionId: waiver.prerequisiteCourseVersionId,
          });
          break;
        }
        case "revoke-prerequisite-waiver":
          statements.push(
            this.database
              .prepare(
                `UPDATE learner_prerequisite_waivers
                 SET revoked_at = ?,
                     last_mutation_id = ?,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE learner_id = ?
                   AND program_version_id = ?
                   AND id = ?
                   AND revoked_at IS NULL
                   AND ${guardSql}`,
              )
              .bind(
                operation.revokedAt,
                mutationId,
                learnerId,
                input.programVersionId,
                operation.prerequisiteWaiverId,
                ...guardValues(),
              ),
          );
          event(
            "waiver",
            operation.prerequisiteWaiverId,
            "prerequisite-waiver-revoked",
            { revokedAt: operation.revokedAt },
          );
          break;
      }
    }

    statements.push(
      this.database
        .prepare(
          `INSERT INTO learner_progress_events (
             id,
             learner_id,
             program_version_id,
             mutation_id,
             entity_type,
             entity_id,
             event_type,
             payload_json
           )
           SELECT
             CAST(json_extract(value, '$.id') AS TEXT),
             ?,
             ?,
             ?,
             CAST(json_extract(value, '$.entityType') AS TEXT),
             CAST(json_extract(value, '$.entityId') AS TEXT),
             CAST(json_extract(value, '$.eventType') AS TEXT),
             json_extract(value, '$.payload')
           FROM json_each(?)
           WHERE ${guardSql}
           ON CONFLICT(id) DO NOTHING`,
        )
        .bind(
          learnerId,
          input.programVersionId,
          mutationId,
          canonicalJson(events),
          ...guardValues(),
        ),
      this.database
        .prepare(
          `UPDATE learner_program_states
           SET revision = ?,
               last_mutation_id = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE learner_id = ?
             AND program_version_id = ?
             AND revision = ?
             AND ${guardSql}`,
        )
        .bind(
          resultRevision,
          mutationId,
          learnerId,
          input.programVersionId,
          input.baseRevision,
          ...guardValues(),
        ),
    );
    if (statements.length > 50) {
      throw new LearnerProgressValidationError([
        "The mutation expands beyond the atomic D1 statement limit.",
      ]);
    }
    await d1Batch(this.database, statements, "apply learner progress mutation");

    const applied = await this.getAppliedMutation(
      learnerId,
      input.programVersionId,
      mutationId,
    );
    if (!applied) {
      const latest = await this.loadProgress(learnerId, input.programVersionId);
      throw new LearnerProgressRevisionConflictError(
        learnerId,
        input.programVersionId,
        input.baseRevision,
        latest.revision,
      );
    }
    if (applied.payload_hash !== payloadHash) {
      throw new LearnerProgressMutationConflictError(
        learnerId,
        input.programVersionId,
        mutationId,
      );
    }
    return {
      mutationId,
      resultRevision: applied.result_revision,
      alreadyApplied: false,
      progress: await this.loadProgress(learnerId, input.programVersionId),
    };
  }

  async setSelectedConcentration(
    learnerId: string,
    programVersionId: ProgramVersionId,
    concentrationId: ConcentrationId | null,
  ): Promise<void> {
    const progress = await this.loadProgress(learnerId, programVersionId);
    if (progress.selectedConcentrationId === concentrationId) return;
    await this.applyMutation({
      learnerId,
      programVersionId,
      deviceId: "legacy-repository-adapter",
      clientMutationId: `mut_${crypto.randomUUID()}`,
      baseRevision: progress.revision,
      operations: [
        { type: "set-concentration", selectedConcentrationId: concentrationId },
      ],
    });
  }

  async setUnitCompletion(
    learnerId: string,
    programVersionId: ProgramVersionId,
    courseVersionId: CourseVersionId,
    learningUnitId: LearningUnitId,
    completed: boolean,
  ): Promise<void> {
    const progress = await this.loadProgress(learnerId, programVersionId);
    const isCompleted =
      progress.courses[courseVersionId]?.completedUnitIds.includes(
        learningUnitId,
      ) ?? false;
    if (isCompleted === completed) return;
    await this.applyMutation({
      learnerId,
      programVersionId,
      deviceId: "legacy-repository-adapter",
      clientMutationId: `mut_${crypto.randomUUID()}`,
      baseRevision: progress.revision,
      operations: [
        {
          type: "set-unit-completion",
          courseVersionId,
          learningUnitId,
          completed,
        },
      ],
    });
  }

  async replaceCourseCompletions(
    learnerId: string,
    programVersionId: ProgramVersionId,
    courseVersionId: CourseVersionId,
    completedUnitIds: readonly LearningUnitId[],
  ): Promise<void> {
    return this.replaceProgramCompletions(learnerId, programVersionId, [
      { courseVersionId, completedUnitIds },
    ]);
  }

  async replaceProgramCompletions(
    learnerId: string,
    programVersionId: ProgramVersionId,
    replacements: readonly CourseCompletionReplacement[],
  ): Promise<void> {
    const bundle = await this.requireBundle(programVersionId);
    const seenCourses = new Set<string>();
    const normalized = replacements.map((replacement) => {
      if (seenCourses.has(replacement.courseVersionId)) {
        throw new LearnerProgressValidationError([
          `Course ${replacement.courseVersionId} is replaced more than once.`,
        ]);
      }
      seenCourses.add(replacement.courseVersionId);
      const completedUnitIds = [...new Set(replacement.completedUnitIds)];
      requireUnitIds(
        bundle,
        replacement.courseVersionId,
        completedUnitIds,
      );
      return {
        courseVersionId: replacement.courseVersionId,
        completedUnitIds,
      };
    });
    if (normalized.length === 0) return;
    const progress = await this.loadProgress(learnerId, programVersionId);
    const operations: LearnerProgressOperation[] = [];
    for (const replacement of normalized) {
      const desired = new Set(replacement.completedUnitIds);
      const current = new Set(
        progress.courses[replacement.courseVersionId]?.completedUnitIds ?? [],
      );
      for (const unit of bundle.learningUnits.filter(
        (candidate) =>
          candidate.courseVersionId === replacement.courseVersionId,
      )) {
        if (desired.has(unit.id) !== current.has(unit.id)) {
          operations.push({
            type: "set-unit-completion",
            courseVersionId: replacement.courseVersionId,
            learningUnitId: unit.id,
            completed: desired.has(unit.id),
          });
        }
      }
    }
    if (operations.length === 0) return;
    await this.applyMutation({
      learnerId,
      programVersionId,
      deviceId: "legacy-repository-adapter",
      clientMutationId: `mut_${crypto.randomUUID()}`,
      baseRevision: progress.revision,
      operations,
    });
  }

  async getProgressImport(
    learnerId: string,
    clientImportId: string,
  ): Promise<ProgressImportReceipt | undefined> {
    const rows = await d1All<ProgressImportRow>(
      this.database
        .prepare(
          `SELECT
             learner_id,
             client_import_id,
             storage_namespace,
             disposition,
             payload_hash,
             imported_unit_count,
             confirmed_at
           FROM learner_progress_imports
           WHERE learner_id = ? AND client_import_id = ?`,
        )
        .bind(learnerId, clientImportId),
      "get progress import",
    );
    if (rows.length > 1) {
      throw new LearnerProgressDataError([
        `Multiple import receipts exist for ${learnerId}/${clientImportId}.`,
      ]);
    }
    return rows[0] ? receiptFromRow(rows[0]) : undefined;
  }

  async importLocalProgress(
    input: ImportLocalProgressInput,
  ): Promise<ProgressImportReceipt> {
    const learnerId = nonEmpty(input.learnerId, "learnerId");
    const clientImportId = nonEmpty(input.clientImportId, "clientImportId");
    const storageNamespace = nonEmpty(
      input.storageNamespace,
      "storageNamespace",
    );
    if (input.disposition !== "merged" && input.disposition !== "cloud") {
      throw new LearnerProgressValidationError([
        `disposition must be "merged" or "cloud".`,
      ]);
    }
    const programs = normalizeImportPrograms(input.programs);
    // Preserve the exact v2 canonical payload shape so a receipt written by an
    // earlier release remains idempotent after the v3 repository is deployed.
    const programsForHash =
      storageNamespace === "course-atlas-progress-v2"
        ? programs.map((program) => ({
            programVersionId: program.programVersionId,
            ...(program.selectedConcentrationId
              ? { selectedConcentrationId: program.selectedConcentrationId }
              : {}),
            courses: program.courses.map((course) => ({
              courseVersionId: course.courseVersionId,
              completedUnitIds: course.completedUnitIds,
            })),
          }))
        : programs;
    const payloadHash = await sha256Hex(
      canonicalJson({
        disposition: input.disposition,
        programs: programsForHash,
        storageNamespace,
      }),
    );
    const existing = await this.getProgressImport(
      learnerId,
      clientImportId,
    );
    if (existing) {
      if (
        existing.payloadHash !== payloadHash ||
        existing.disposition !== input.disposition ||
        existing.storageNamespace !== storageNamespace
      ) {
        throw new ProgressImportConflictError(learnerId, clientImportId);
      }
      return existing;
    }

    const validated: Array<{
      bundle: PublishedProgramBundle;
      program: NormalizedImportProgram;
    }> = [];
    if (input.disposition === "merged") {
      for (const program of programs) {
        const bundle = await this.requireBundle(program.programVersionId);
        requireConcentration(bundle, program.selectedConcentrationId);
        for (const course of program.courses) {
          requireUnitIds(
            bundle,
            course.courseVersionId,
            course.completedUnitIds,
          );
          if (course.updatedAt) {
            requireIsoDateTime(course.updatedAt, "Imported course updatedAt");
          }
        }
        if (program.enrollment) {
          requireIsoDate(program.enrollment.startDate, "Imported startDate");
          requireIsoDateTime(
            program.enrollment.enrolledAt,
            "Imported enrolledAt",
          );
          requireFiniteNumber(
            program.enrollment.paceHoursPerWeek,
            "Imported paceHoursPerWeek",
            { minimum: Number.MIN_VALUE, maximum: 168 },
          );
          cleanStudyDays(program.enrollment.preferredStudyDays);
          nonEmpty(program.enrollment.timezone, "Imported timezone");
        }
        for (const [groupId, courseVersionIds] of Object.entries(
          program.requirementSelections,
        )) {
          const group = bundle.programVersion.requirements.find(
            (candidate) => candidate.id === groupId,
          );
          if (!group) {
            throw new LearnerProgressValidationError([
              `Requirement group ${groupId} is not in ${program.programVersionId}.`,
            ]);
          }
          for (const courseVersionId of courseVersionIds) {
            const option = group.options.find(
              (candidate) =>
                candidate.courseVersionId === courseVersionId,
            );
            if (!option) {
              throw new LearnerProgressValidationError([
                `Course ${courseVersionId} is not an option in ${groupId}.`,
              ]);
            }
            if (
              group.rule.selectionConstraint === "same concentration" &&
              option.concentrationId !== program.selectedConcentrationId
            ) {
              throw new LearnerProgressValidationError([
                `Course ${courseVersionId} does not match the imported concentration.`,
              ]);
            }
          }
        }
        for (const evidence of program.unitEvidences) {
          requireUnitIds(bundle, evidence.courseVersionId, [
            evidence.learningUnitId,
          ]);
          nonEmpty(evidence.textOrUrl, "Imported unit evidence");
          if (evidence.updatedAt) {
            requireIsoDateTime(evidence.updatedAt, "Imported evidence updatedAt");
          }
        }
        for (const attempt of program.assessmentAttempts) {
          const assessment = bundle.assessmentVersions.find(
            (candidate) => candidate.id === attempt.assessmentVersionId,
          );
          if (
            !assessment ||
            assessment.courseVersionId !== attempt.courseVersionId
          ) {
            throw new LearnerProgressValidationError([
              `Assessment attempt ${attempt.id} does not match this publication.`,
            ]);
          }
          const attemptProblems: string[] = [];
          this.validateAssessmentAttemptShape(
            assessment.maximumScore,
            attempt,
            `Attempt ${attempt.id}`,
            attemptProblems,
          );
          if (attemptProblems.length > 0) {
            throw new LearnerProgressValidationError(attemptProblems);
          }
        }
        const importedScheduleIds = new Set(
          program.scheduleEntries.map((entry) => entry.id),
        );
        for (const entry of program.scheduleEntries) {
          if (!this.courseVersionForScheduleSubject(bundle, entry.subject)) {
            throw new LearnerProgressValidationError([
              `Schedule entry ${entry.id} has an unknown subject.`,
            ]);
          }
          requireIsoDate(entry.scheduledDate, `Schedule ${entry.id} date`);
          if (
            !["planned", "completed", "skipped", "carried", "cancelled"].includes(
              entry.status,
            )
          ) {
            throw new LearnerProgressValidationError([
              `Schedule ${entry.id} status is unsupported.`,
            ]);
          }
          if (!["manual", "generated", "carry-forward"].includes(entry.source)) {
            throw new LearnerProgressValidationError([
              `Schedule ${entry.id} source is unsupported.`,
            ]);
          }
          requireClockTime(entry.startTime, `Schedule ${entry.id} startTime`);
          requireFiniteNumber(
            entry.plannedMinutes,
            `Schedule ${entry.id} plannedMinutes`,
            { minimum: 1 },
          );
          if (!Number.isInteger(entry.position) || entry.position < 0) {
            throw new LearnerProgressValidationError([
              `Schedule ${entry.id} position must be nonnegative.`,
            ]);
          }
          if (entry.status === "completed" && !entry.completedAt) {
            throw new LearnerProgressValidationError([
              `Schedule ${entry.id} requires completedAt in completed state.`,
            ]);
          }
          if (entry.status !== "completed" && entry.completedAt) {
            throw new LearnerProgressValidationError([
              `Schedule ${entry.id} only permits completedAt in completed state.`,
            ]);
          }
          if (entry.completedAt) {
            requireIsoDateTime(
              entry.completedAt,
              `Schedule ${entry.id} completedAt`,
            );
          }
          if (entry.updatedAt) {
            requireIsoDateTime(entry.updatedAt, `Schedule ${entry.id} updatedAt`);
          }
          if (
            entry.originEntryId &&
            !importedScheduleIds.has(entry.originEntryId)
          ) {
            throw new LearnerProgressValidationError([
              `Schedule entry ${entry.id} has an unknown origin entry.`,
            ]);
          }
        }
        for (const waiver of program.prerequisiteWaivers) {
          const course = bundle.courseVersions.find(
            (candidate) => candidate.id === waiver.courseVersionId,
          );
          if (
            !course?.prerequisites.some(
              (prerequisite) =>
                prerequisite.courseVersionId ===
                waiver.prerequisiteCourseVersionId,
            )
          ) {
            throw new LearnerProgressValidationError([
              `Waiver ${waiver.id} does not target a declared prerequisite.`,
            ]);
          }
          nonEmpty(waiver.reason, `Waiver ${waiver.id} reason`);
          if (
            !["placement", "prior_learning", "review", "manual"].includes(
              waiver.basis,
            )
          ) {
            throw new LearnerProgressValidationError([
              `Waiver ${waiver.id} basis is unsupported.`,
            ]);
          }
          requireIsoDateTime(waiver.grantedAt, `Waiver ${waiver.id} grantedAt`);
          if (waiver.revokedAt) {
            requireIsoDateTime(
              waiver.revokedAt,
              `Waiver ${waiver.id} revokedAt`,
            );
          }
          if (waiver.updatedAt) {
            requireIsoDateTime(
              waiver.updatedAt,
              `Waiver ${waiver.id} updatedAt`,
            );
          }
        }
        validated.push({ bundle, program });
      }
    }

    const importedUnitCount =
      input.disposition === "merged"
        ? validated.reduce(
            (programTotal, { program }) =>
              programTotal +
              program.courses.reduce(
                (courseTotal, course) =>
                  courseTotal + course.completedUnitIds.length,
                0,
              ),
            0,
          )
        : 0;
    const receiptExistsSql = `
      EXISTS (
        SELECT 1
        FROM learner_progress_imports
        WHERE learner_id = ?
          AND client_import_id = ?
          AND payload_hash = ?
      )
    `;
    const statements = [
      this.database
        .prepare(
          `INSERT INTO learner_progress_imports (
             learner_id,
             client_import_id,
             storage_namespace,
             disposition,
             payload_hash,
             imported_unit_count
           )
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT DO NOTHING`,
        )
        .bind(
          learnerId,
          clientImportId,
          storageNamespace,
          input.disposition,
          payloadHash,
          importedUnitCount,
        ),
    ];

    if (validated.length > 0) {
      const importMutationId = `import:${clientImportId}`;
      const anchors = validated.map(({ bundle, program }) => ({
        bundleId: bundle.id,
        programVersionId: program.programVersionId,
        selectedConcentrationId: program.selectedConcentrationId ?? null,
      }));
      const programStates = validated.map(({ program }) => ({
        programVersionId: program.programVersionId,
        enrollmentStatus: program.enrollment?.status ?? "not_enrolled",
        startDate: program.enrollment?.startDate ?? null,
        paceHoursPerWeek: program.enrollment?.paceHoursPerWeek ?? null,
        studyDaysJson: canonicalJson(
          program.enrollment
            ? cleanStudyDays(program.enrollment.preferredStudyDays)
            : [],
        ),
        timezone: program.enrollment?.timezone ?? null,
        enrolledAt: program.enrollment?.enrolledAt ?? null,
      }));
      const completions = validated.flatMap(({ program }) =>
        program.courses.flatMap((course) =>
          course.completedUnitIds.map((learningUnitId) => ({
            programVersionId: program.programVersionId,
            courseVersionId: course.courseVersionId,
            learningUnitId,
            updatedAt: course.updatedAt ?? null,
          })),
        ),
      );
      const requirementSelections = validated.flatMap(({ bundle, program }) =>
        Object.entries(program.requirementSelections).flatMap(
          ([requirementGroupId, courseVersionIds]) => {
            const group = bundle.programVersion.requirements.find(
              (candidate) => candidate.id === requirementGroupId,
            )!;
            return courseVersionIds.map((courseVersionId) => ({
              programVersionId: program.programVersionId,
              requirementGroupId,
              requirementOptionId: group.options.find(
                (option) => option.courseVersionId === courseVersionId,
              )!.id,
              courseVersionId,
            }));
          },
        ),
      );
      const unitEvidences = validated.flatMap(({ program }) =>
        program.unitEvidences.map((evidence) => ({
          programVersionId: program.programVersionId,
          courseVersionId: evidence.courseVersionId,
          learningUnitId: evidence.learningUnitId,
          textOrUrl: evidence.textOrUrl.trim(),
          updatedAt: evidence.updatedAt ?? null,
        })),
      );
      const assessmentAttempts = validated.flatMap(({ bundle, program }) => {
        const assessments = new Map(
          bundle.assessmentVersions.map((assessment) => [
            assessment.id,
            assessment,
          ]),
        );
        return program.assessmentAttempts.map((attempt) => ({
          programVersionId: program.programVersionId,
          id: attempt.id,
          courseVersionId: attempt.courseVersionId,
          assessmentVersionId: attempt.assessmentVersionId,
          attemptNumber: attempt.attemptNumber,
          status: attempt.status,
          submissionEvidenceJson: canonicalJson(attempt.submissionEvidence),
          score: attempt.result?.score ?? null,
          maximumScore: attempt.result
            ? assessments.get(attempt.assessmentVersionId)!.maximumScore
            : null,
          passed:
            attempt.result === undefined ? null : Number(attempt.result.passed),
          evaluationMethod: attempt.result?.evaluationMethod ?? null,
          feedback: attempt.result?.feedback ?? null,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt ?? null,
          evaluatedAt: attempt.result?.evaluatedAt ?? null,
          updatedAt: attempt.updatedAt ?? null,
        }));
      });
      const scheduleEntries = validated.flatMap(({ bundle, program }) =>
        program.scheduleEntries.map((entry) => ({
          programVersionId: program.programVersionId,
          id: entry.id,
          courseVersionId: this.courseVersionForScheduleSubject(
            bundle,
            entry.subject,
          )!,
          learningUnitId:
            entry.subject.kind === "learningUnit" ? entry.subject.id : null,
          assessmentVersionId:
            entry.subject.kind === "assessmentVersion"
              ? entry.subject.id
              : null,
          scheduledDate: entry.scheduledDate,
          startTime: entry.startTime ?? null,
          plannedMinutes: entry.plannedMinutes,
          position: entry.position,
          status: entry.status,
          sourcePlacementId:
            entry.source === "generated" ? "generated" : null,
          originEntryId: entry.originEntryId ?? null,
          completedAt: entry.completedAt ?? null,
          updatedAt: entry.updatedAt ?? null,
        })),
      );
      const prerequisiteWaivers = validated.flatMap(({ program }) =>
        program.prerequisiteWaivers.map((waiver) => ({
          programVersionId: program.programVersionId,
          id: waiver.id,
          courseVersionId: waiver.courseVersionId,
          prerequisiteCourseVersionId: waiver.prerequisiteCourseVersionId,
          basis: waiver.basis,
          reason: waiver.reason.trim(),
          evidence: waiver.evidence ?? null,
          grantedAt: waiver.grantedAt,
          revokedAt: waiver.revokedAt ?? null,
          updatedAt: waiver.updatedAt ?? null,
        })),
      );
      const importEvents = await Promise.all(
        validated.map(async ({ program }) => ({
          id: `evt_${(
            await sha256Hex(
              canonicalJson({
                clientImportId,
                learnerId,
                programVersionId: program.programVersionId,
              }),
            )
          ).slice(0, 32)}`,
          programVersionId: program.programVersionId,
          payloadJson: canonicalJson({
            clientImportId,
            storageNamespace,
            importedCourseCount: program.courses.length,
            importedUnitCount: program.courses.reduce(
              (total, course) => total + course.completedUnitIds.length,
              0,
            ),
          }),
        })),
      );

      // One JSON-fed statement per entity type keeps the complete import in a
      // single D1 transaction even when a local snapshot contains many rows.
      statements.push(
        this.database
          .prepare(
            `INSERT INTO learner_program_progress (
               learner_id,
               program_version_id,
               bundle_id,
               selected_concentration_id
             )
             SELECT
               ?,
               CAST(json_extract(value, '$.programVersionId') AS TEXT),
               CAST(json_extract(value, '$.bundleId') AS TEXT),
               CAST(json_extract(value, '$.selectedConcentrationId') AS TEXT)
             FROM json_each(?)
             WHERE ${receiptExistsSql}
             ON CONFLICT(learner_id, program_version_id) DO UPDATE SET
               selected_concentration_id = COALESCE(
                 learner_program_progress.selected_concentration_id,
                 excluded.selected_concentration_id
               )`,
          )
          .bind(
            learnerId,
            canonicalJson(anchors),
            learnerId,
            clientImportId,
            payloadHash,
          ),
        this.database
          .prepare(
            `INSERT INTO learner_program_states (
               learner_id,
               program_version_id,
               enrollment_status,
               start_date,
               pace_hours_per_week,
               study_days_json,
               timezone,
               enrolled_at
             )
             SELECT
               ?,
               CAST(json_extract(value, '$.programVersionId') AS TEXT),
               CAST(json_extract(value, '$.enrollmentStatus') AS TEXT),
               CAST(json_extract(value, '$.startDate') AS TEXT),
               CAST(json_extract(value, '$.paceHoursPerWeek') AS REAL),
               CAST(json_extract(value, '$.studyDaysJson') AS TEXT),
               CAST(json_extract(value, '$.timezone') AS TEXT),
               CAST(json_extract(value, '$.enrolledAt') AS TEXT)
             FROM json_each(?)
             WHERE ${receiptExistsSql}
             ON CONFLICT(learner_id, program_version_id) DO UPDATE SET
               enrollment_status = CASE
                 WHEN learner_program_states.enrollment_status = 'not_enrolled'
                   AND excluded.enrollment_status <> 'not_enrolled'
                 THEN excluded.enrollment_status
                 ELSE learner_program_states.enrollment_status
               END,
               start_date = CASE
                 WHEN learner_program_states.enrollment_status = 'not_enrolled'
                   AND excluded.enrollment_status <> 'not_enrolled'
                 THEN excluded.start_date
                 ELSE learner_program_states.start_date
               END,
               pace_hours_per_week = CASE
                 WHEN learner_program_states.enrollment_status = 'not_enrolled'
                   AND excluded.enrollment_status <> 'not_enrolled'
                 THEN excluded.pace_hours_per_week
                 ELSE learner_program_states.pace_hours_per_week
               END,
               study_days_json = CASE
                 WHEN learner_program_states.enrollment_status = 'not_enrolled'
                   AND excluded.enrollment_status <> 'not_enrolled'
                 THEN excluded.study_days_json
                 ELSE learner_program_states.study_days_json
               END,
               timezone = CASE
                 WHEN learner_program_states.enrollment_status = 'not_enrolled'
                   AND excluded.enrollment_status <> 'not_enrolled'
                 THEN excluded.timezone
                 ELSE learner_program_states.timezone
               END,
               enrolled_at = CASE
                 WHEN learner_program_states.enrollment_status = 'not_enrolled'
                   AND excluded.enrollment_status <> 'not_enrolled'
                 THEN excluded.enrolled_at
                 ELSE learner_program_states.enrolled_at
               END`,
          )
          .bind(
            learnerId,
            canonicalJson(programStates),
            learnerId,
            clientImportId,
            payloadHash,
          ),
      );

      if (completions.length > 0) {
        const completionJson = canonicalJson(completions);
        statements.push(
          this.database
            .prepare(
              `INSERT INTO learner_unit_completions (
                 learner_id,
                 program_version_id,
                 course_version_id,
                 learning_unit_id,
                 completed_at
               )
               SELECT
                 ?,
                 CAST(json_extract(value, '$.programVersionId') AS TEXT),
                 CAST(json_extract(value, '$.courseVersionId') AS TEXT),
                 CAST(json_extract(value, '$.learningUnitId') AS TEXT),
                 COALESCE(
                   CAST(json_extract(value, '$.updatedAt') AS TEXT),
                   CURRENT_TIMESTAMP
                 )
               FROM json_each(?)
               WHERE ${receiptExistsSql}
               ON CONFLICT DO NOTHING`,
            )
            .bind(
              learnerId,
              completionJson,
              learnerId,
              clientImportId,
              payloadHash,
            ),
          this.database
            .prepare(
              `INSERT INTO learner_unit_states (
                 learner_id,
                 program_version_id,
                 course_version_id,
                 learning_unit_id,
                 status,
                 completed_at,
                 tombstoned_at,
                 last_mutation_id,
                 updated_at
               )
               SELECT
                 ?,
                 CAST(json_extract(value, '$.programVersionId') AS TEXT),
                 CAST(json_extract(value, '$.courseVersionId') AS TEXT),
                 CAST(json_extract(value, '$.learningUnitId') AS TEXT),
                 'completed',
                 COALESCE(
                   CAST(json_extract(value, '$.updatedAt') AS TEXT),
                   CURRENT_TIMESTAMP
                 ),
                 NULL,
                 ?,
                 COALESCE(
                   CAST(json_extract(value, '$.updatedAt') AS TEXT),
                   CURRENT_TIMESTAMP
                 )
               FROM json_each(?)
               WHERE ${receiptExistsSql}
               ON CONFLICT DO NOTHING`,
            )
            .bind(
              learnerId,
              importMutationId,
              completionJson,
              learnerId,
              clientImportId,
              payloadHash,
            ),
        );
      }

      if (requirementSelections.length > 0) {
        statements.push(
          this.database
            .prepare(
              `WITH incoming AS MATERIALIZED (
                 SELECT
                   CAST(json_extract(value, '$.programVersionId') AS TEXT)
                     AS program_version_id,
                   CAST(json_extract(value, '$.requirementGroupId') AS TEXT)
                     AS requirement_group_id,
                   CAST(json_extract(value, '$.requirementOptionId') AS TEXT)
                     AS requirement_option_id,
                   CAST(json_extract(value, '$.courseVersionId') AS TEXT)
                     AS course_version_id
                 FROM json_each(?)
               ), eligible_groups AS MATERIALIZED (
                 SELECT DISTINCT
                   incoming.program_version_id,
                   incoming.requirement_group_id
                 FROM incoming
                 WHERE NOT EXISTS (
                   SELECT 1
                   FROM learner_requirement_selections AS current_selection
                   WHERE current_selection.learner_id = ?
                     AND current_selection.program_version_id =
                       incoming.program_version_id
                     AND current_selection.requirement_group_id =
                       incoming.requirement_group_id
                 )
               )
               INSERT INTO learner_requirement_selections (
                 learner_id,
                 program_version_id,
                 requirement_group_id,
                 requirement_option_id,
                 course_version_id,
                 selection_source
               )
               SELECT
                 ?,
                 incoming.program_version_id,
                 incoming.requirement_group_id,
                 incoming.requirement_option_id,
                 incoming.course_version_id,
                 'import'
               FROM incoming
               INNER JOIN eligible_groups
                 ON eligible_groups.program_version_id =
                      incoming.program_version_id
                AND eligible_groups.requirement_group_id =
                      incoming.requirement_group_id
               WHERE ${receiptExistsSql}
               ON CONFLICT DO NOTHING`,
            )
            .bind(
              canonicalJson(requirementSelections),
              learnerId,
              learnerId,
              learnerId,
              clientImportId,
              payloadHash,
            ),
        );
      }

      if (unitEvidences.length > 0) {
        statements.push(
          this.database
            .prepare(
              `INSERT INTO learner_unit_evidence (
                 learner_id,
                 program_version_id,
                 course_version_id,
                 learning_unit_id,
                 status,
                 text_or_url,
                 submitted_at,
                 tombstoned_at,
                 last_mutation_id,
                 updated_at
               )
               SELECT
                 ?,
                 CAST(json_extract(value, '$.programVersionId') AS TEXT),
                 CAST(json_extract(value, '$.courseVersionId') AS TEXT),
                 CAST(json_extract(value, '$.learningUnitId') AS TEXT),
                 'active',
                 CAST(json_extract(value, '$.textOrUrl') AS TEXT),
                 COALESCE(
                   CAST(json_extract(value, '$.updatedAt') AS TEXT),
                   CURRENT_TIMESTAMP
                 ),
                 NULL,
                 CASE
                   WHEN json_type(value, '$.updatedAt') IS NULL THEN NULL
                   ELSE ?
                 END,
                 COALESCE(
                   CAST(json_extract(value, '$.updatedAt') AS TEXT),
                   CURRENT_TIMESTAMP
                 )
               FROM json_each(?)
               WHERE ${receiptExistsSql}
               ON CONFLICT(
                 learner_id,
                 program_version_id,
                 course_version_id,
                 learning_unit_id
               ) DO NOTHING`,
            )
            .bind(
              learnerId,
              importMutationId,
              canonicalJson(unitEvidences),
              learnerId,
              clientImportId,
              payloadHash,
            ),
        );
      }

      if (assessmentAttempts.length > 0) {
        statements.push(
          this.database
            .prepare(
              `INSERT INTO learner_assessment_attempts (
                 id,
                 learner_id,
                 program_version_id,
                 course_version_id,
                 assessment_version_id,
                 attempt_number,
                 status,
                 submission_evidence_json,
                 score,
                 maximum_score,
                 passed,
                 evaluation_method,
                 feedback,
                 started_at,
                 submitted_at,
                 evaluated_at,
                 last_mutation_id,
                 updated_at
               )
               SELECT
                 CAST(json_extract(value, '$.id') AS TEXT),
                 ?,
                 CAST(json_extract(value, '$.programVersionId') AS TEXT),
                 CAST(json_extract(value, '$.courseVersionId') AS TEXT),
                 CAST(json_extract(value, '$.assessmentVersionId') AS TEXT),
                 CAST(json_extract(value, '$.attemptNumber') AS INTEGER),
                 CAST(json_extract(value, '$.status') AS TEXT),
                 CAST(json_extract(value, '$.submissionEvidenceJson') AS TEXT),
                 CAST(json_extract(value, '$.score') AS REAL),
                 CAST(json_extract(value, '$.maximumScore') AS REAL),
                 CAST(json_extract(value, '$.passed') AS INTEGER),
                 CAST(json_extract(value, '$.evaluationMethod') AS TEXT),
                 CAST(json_extract(value, '$.feedback') AS TEXT),
                 CAST(json_extract(value, '$.startedAt') AS TEXT),
                 CAST(json_extract(value, '$.submittedAt') AS TEXT),
                 CAST(json_extract(value, '$.evaluatedAt') AS TEXT),
                 CASE
                   WHEN json_type(value, '$.updatedAt') IS NULL THEN NULL
                   ELSE ?
                 END,
                 COALESCE(
                   CAST(json_extract(value, '$.updatedAt') AS TEXT),
                   CURRENT_TIMESTAMP
                 )
               FROM json_each(?)
               WHERE ${receiptExistsSql}
               ON CONFLICT(learner_id, program_version_id, id) DO NOTHING`,
            )
            .bind(
              learnerId,
              importMutationId,
              canonicalJson(assessmentAttempts),
              learnerId,
              clientImportId,
              payloadHash,
            ),
        );
      }

      if (scheduleEntries.length > 0) {
        statements.push(
          this.database
            .prepare(
              `INSERT INTO learner_schedule_entries (
                 id,
                 learner_id,
                 program_version_id,
                 course_version_id,
                 learning_unit_id,
                 assessment_version_id,
                 scheduled_date,
                 start_time,
                 planned_minutes,
                 position,
                 status,
                 source_placement_id,
                 origin_entry_id,
                 completed_at,
                 last_mutation_id,
                 updated_at
               )
               SELECT
                 CAST(json_extract(value, '$.id') AS TEXT),
                 ?,
                 CAST(json_extract(value, '$.programVersionId') AS TEXT),
                 CAST(json_extract(value, '$.courseVersionId') AS TEXT),
                 CAST(json_extract(value, '$.learningUnitId') AS TEXT),
                 CAST(json_extract(value, '$.assessmentVersionId') AS TEXT),
                 CAST(json_extract(value, '$.scheduledDate') AS TEXT),
                 CAST(json_extract(value, '$.startTime') AS TEXT),
                 CAST(json_extract(value, '$.plannedMinutes') AS INTEGER),
                 CAST(json_extract(value, '$.position') AS INTEGER),
                 CAST(json_extract(value, '$.status') AS TEXT),
                 CAST(json_extract(value, '$.sourcePlacementId') AS TEXT),
                 CAST(json_extract(value, '$.originEntryId') AS TEXT),
                 CAST(json_extract(value, '$.completedAt') AS TEXT),
                 CASE
                   WHEN json_type(value, '$.updatedAt') IS NULL THEN NULL
                   ELSE ?
                 END,
                 COALESCE(
                   CAST(json_extract(value, '$.updatedAt') AS TEXT),
                   CURRENT_TIMESTAMP
                 )
               FROM json_each(?)
               WHERE ${receiptExistsSql}
               ON CONFLICT(learner_id, program_version_id, id) DO NOTHING`,
            )
            .bind(
              learnerId,
              importMutationId,
              canonicalJson(scheduleEntries),
              learnerId,
              clientImportId,
              payloadHash,
            ),
        );
      }

      if (prerequisiteWaivers.length > 0) {
        statements.push(
          this.database
            .prepare(
              `INSERT INTO learner_prerequisite_waivers (
                 id,
                 learner_id,
                 program_version_id,
                 course_version_id,
                 prerequisite_course_version_id,
                 basis,
                 reason,
                 evidence_text_or_url,
                 granted_at,
                 revoked_at,
                 last_mutation_id,
                 updated_at
               )
               SELECT
                 CAST(json_extract(value, '$.id') AS TEXT),
                 ?,
                 CAST(json_extract(value, '$.programVersionId') AS TEXT),
                 CAST(json_extract(value, '$.courseVersionId') AS TEXT),
                 CAST(
                   json_extract(value, '$.prerequisiteCourseVersionId')
                   AS TEXT
                 ),
                 CAST(json_extract(value, '$.basis') AS TEXT),
                 CAST(json_extract(value, '$.reason') AS TEXT),
                 CAST(json_extract(value, '$.evidence') AS TEXT),
                 CAST(json_extract(value, '$.grantedAt') AS TEXT),
                 CAST(json_extract(value, '$.revokedAt') AS TEXT),
                 CASE
                   WHEN json_type(value, '$.updatedAt') IS NULL THEN NULL
                   ELSE ?
                 END,
                 COALESCE(
                   CAST(json_extract(value, '$.updatedAt') AS TEXT),
                   CURRENT_TIMESTAMP
                 )
               FROM json_each(?)
               WHERE ${receiptExistsSql}
               ON CONFLICT(learner_id, program_version_id, id) DO NOTHING`,
            )
            .bind(
              learnerId,
              importMutationId,
              canonicalJson(prerequisiteWaivers),
              learnerId,
              clientImportId,
              payloadHash,
            ),
        );
      }

      statements.push(
        this.database
          .prepare(
            `INSERT INTO learner_progress_events (
               id,
               learner_id,
               program_version_id,
               mutation_id,
               entity_type,
               entity_id,
               event_type,
               payload_json
             )
             SELECT
               CAST(json_extract(value, '$.id') AS TEXT),
               ?,
               CAST(json_extract(value, '$.programVersionId') AS TEXT),
               NULL,
               'program',
               CAST(json_extract(value, '$.programVersionId') AS TEXT),
               'local-progress-imported',
               CAST(json_extract(value, '$.payloadJson') AS TEXT)
             FROM json_each(?)
             WHERE ${receiptExistsSql}
             ON CONFLICT(id) DO NOTHING`,
          )
          .bind(
            learnerId,
            canonicalJson(importEvents),
            learnerId,
            clientImportId,
            payloadHash,
          ),
        this.database
          .prepare(
            `UPDATE learner_program_states
             SET revision = revision + 1,
                 last_mutation_id = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE learner_id = ?
               AND program_version_id IN (
                 SELECT CAST(json_extract(value, '$.programVersionId') AS TEXT)
                 FROM json_each(?)
               )
               AND COALESCE(last_mutation_id, '') <> ?
               AND ${receiptExistsSql}`,
          )
          .bind(
            importMutationId,
            learnerId,
            canonicalJson(anchors),
            importMutationId,
            learnerId,
            clientImportId,
            payloadHash,
          ),
      );
    }

    await d1Batch(this.database, statements, "import local progress");
    const receipt = await this.getProgressImport(learnerId, clientImportId);
    if (!receipt) {
      throw new LearnerProgressDataError([
        `Import ${clientImportId} was not readable after confirmation.`,
      ]);
    }
    if (
      receipt.payloadHash !== payloadHash ||
      receipt.disposition !== input.disposition ||
      receipt.storageNamespace !== storageNamespace
    ) {
      throw new ProgressImportConflictError(learnerId, clientImportId);
    }
    return receipt;
  }

  private validateAssessmentAttemptShape(
    publishedMaximumScore: number,
    attempt: AssessmentAttempt,
    label: string,
    problems: string[],
  ) {
    try {
      requireIsoDateTime(attempt.startedAt, `${label}.startedAt`);
      if (attempt.submittedAt) {
        requireIsoDateTime(attempt.submittedAt, `${label}.submittedAt`);
      }
      if (attempt.updatedAt) {
        requireIsoDateTime(attempt.updatedAt, `${label}.updatedAt`);
      }
    } catch (error) {
      problems.push(
        ...(error instanceof LearnerProgressValidationError
          ? error.problems
          : [String(error)]),
      );
    }
    switch (attempt.status) {
      case "draft":
        if (attempt.submittedAt) {
          problems.push(`${label}.submittedAt is not valid in draft state.`);
        }
        if (attempt.result) {
          problems.push(`${label}.result is not valid in draft state.`);
        }
        break;
      case "submitted":
        if (!attempt.submittedAt) {
          problems.push(`${label}.submittedAt is required in submitted state.`);
        }
        if (attempt.result) {
          problems.push(`${label}.result is not valid in submitted state.`);
        }
        break;
      case "evaluated":
        if (!attempt.submittedAt) {
          problems.push(`${label}.submittedAt is required in evaluated state.`);
        }
        if (!attempt.result) {
          problems.push(`${label}.result is required in evaluated state.`);
        }
        break;
      case "void":
        if (attempt.result) {
          problems.push(`${label}.result is not valid in void state.`);
        }
        break;
      default:
        problems.push(`${label}.status is unsupported.`);
    }
    if (attempt.result) {
      this.validateAssessmentResult(
        publishedMaximumScore,
        attempt.result,
        `${label}.result`,
        problems,
      );
    }
  }

  private validateAssessmentResult(
    publishedMaximumScore: number,
    result: LearnerAssessmentResult,
    label: string,
    problems: string[],
  ) {
    if (
      !Number.isFinite(result.score) ||
      result.score < 0 ||
      result.score > publishedMaximumScore
    ) {
      problems.push(
        `${label}.score must be between 0 and ${publishedMaximumScore}.`,
      );
    }
    if (
      result.maximumScore !== undefined &&
      result.maximumScore !== publishedMaximumScore
    ) {
      problems.push(
        `${label}.maximumScore must match the published maximum score ${publishedMaximumScore}.`,
      );
    }
    if (
      !["self", "automatic", "peer", "instructor"].includes(
        result.evaluationMethod,
      )
    ) {
      problems.push(`${label}.evaluationMethod is unsupported.`);
    }
    try {
      requireIsoDateTime(result.evaluatedAt, `${label}.evaluatedAt`);
    } catch (error) {
      problems.push(
        ...(error instanceof LearnerProgressValidationError
          ? error.problems
          : [String(error)]),
      );
    }
  }

  private courseVersionForScheduleSubject(
    bundle: PublishedProgramBundle,
    subject: LearnerScheduleSubject,
  ): CourseVersionId | undefined {
    if (subject.kind === "courseVersion") {
      return bundle.courseVersions.some((course) => course.id === subject.id)
        ? subject.id
        : undefined;
    }
    if (subject.kind === "learningUnit") {
      return bundle.learningUnits.find((unit) => unit.id === subject.id)
        ?.courseVersionId;
    }
    return bundle.assessmentVersions.find(
      (assessment) => assessment.id === subject.id,
    )?.courseVersionId;
  }

  private async loadAssessmentAttemptLifecycleRows(
    learnerId: string,
    programVersionId: ProgramVersionId,
  ): Promise<readonly AssessmentAttemptLifecycleRow[]> {
    return d1All<AssessmentAttemptLifecycleRow>(
      this.database
        .prepare(
          `SELECT
             id,
             course_version_id,
             assessment_version_id,
             attempt_number,
             status,
             started_at
           FROM learner_assessment_attempts
           WHERE learner_id = ? AND program_version_id = ?`,
        )
        .bind(learnerId, programVersionId),
      "load assessment attempt lifecycle rows",
    );
  }

  private async getAppliedMutation(
    learnerId: string,
    programVersionId: ProgramVersionId,
    mutationId: string,
  ): Promise<ProgressMutationRow | undefined> {
    const rows = await d1All<ProgressMutationRow>(
      this.database
        .prepare(
          `SELECT
             mutation_id,
             device_id,
             base_revision,
             result_revision,
             payload_hash,
             applied_at
           FROM learner_progress_mutations
           WHERE learner_id = ?
             AND program_version_id = ?
             AND mutation_id = ?`,
        )
        .bind(learnerId, programVersionId, mutationId),
      "load learner progress mutation",
    );
    if (rows.length > 1) {
      throw new LearnerProgressDataError([
        `Multiple mutation rows exist for ${learnerId}/${programVersionId}/${mutationId}.`,
      ]);
    }
    return rows[0];
  }

  private async findAccount(
    provider: string,
    subject: string,
  ): Promise<AccountRow | undefined> {
    const rows = await d1All<AccountRow>(
      this.database
        .prepare(
          `SELECT
             learner_accounts.id AS account_id,
             learner_accounts.learner_id,
             learner_accounts.provider,
             learner_accounts.provider_subject,
             learner_accounts.email,
             learners.display_name
           FROM learner_accounts
           JOIN learners ON learners.id = learner_accounts.learner_id
           WHERE learner_accounts.provider = ?
             AND learner_accounts.provider_subject = ?`,
        )
        .bind(provider, subject),
      "resolve learner account",
    );
    if (rows.length > 1) {
      throw new LearnerProgressDataError([
        `Multiple learner accounts exist for ${provider}:${subject}.`,
      ]);
    }
    return rows[0];
  }

  private async requireBundle(
    programVersionId: ProgramVersionId,
  ): Promise<PublishedProgramBundle> {
    const bundle =
      await this.catalog.loadByProgramVersionId(programVersionId);
    if (!bundle) {
      throw new LearnerProgressValidationError([
        `Program version ${programVersionId} is not published in D1.`,
      ]);
    }
    return bundle;
  }

  private ensureEnrollment(
    learnerId: string,
    bundle: PublishedProgramBundle,
  ) {
    return this.database
      .prepare(
        `INSERT INTO learner_program_progress (
           learner_id,
           program_version_id,
           bundle_id
         )
         VALUES (?, ?, ?)
         ON CONFLICT(learner_id, program_version_id) DO UPDATE SET
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(learnerId, bundle.programVersion.id, bundle.id);
  }
}
