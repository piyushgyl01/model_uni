import type {
  AssessmentVersionId,
  ConcentrationId,
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
  RequirementGroupId,
} from "./domain/catalog";

export const PROGRESS_SCHEMA_VERSION = 3 as const;
export const PROGRESS_STORAGE_NAMESPACE = "course-atlas-progress-v3";
export const LEGACY_PROGRESS_STORAGE_NAMESPACE = "course-atlas-progress-v2";

/** JavaScript weekday number: Sunday = 0 through Saturday = 6. */
export type StudyDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type EnrollmentStatus = "enrolled" | "paused" | "completed";

export interface LearnerEnrollment {
  readonly startDate: string;
  readonly paceHoursPerWeek: number;
  readonly preferredStudyDays: readonly StudyDay[];
  readonly timezone: string;
  readonly enrolledAt: string;
  readonly status: EnrollmentStatus;
  readonly updatedAt?: string;
}

export interface CloudCourseProgress {
  readonly completedUnitIds: readonly LearningUnitId[];
  readonly updatedAt?: string;
}

export interface UnitEvidence {
  readonly learningUnitId: LearningUnitId;
  readonly courseVersionId: CourseVersionId;
  readonly textOrUrl: string;
  readonly updatedAt?: string;
}

export type AssessmentAttemptStatus =
  | "draft"
  | "submitted"
  | "evaluated"
  | "void";

export type AssessmentEvaluationMethod =
  | "self"
  | "automatic"
  | "peer"
  | "instructor";

export interface AssessmentResult {
  readonly score: number;
  readonly maximumScore?: number;
  readonly passed: boolean;
  readonly evaluationMethod: AssessmentEvaluationMethod;
  readonly feedback?: string;
  readonly evaluatedAt: string;
}

export interface AssessmentAttempt {
  readonly id: string;
  readonly assessmentVersionId: AssessmentVersionId;
  readonly courseVersionId: CourseVersionId;
  readonly attemptNumber: number;
  readonly status: AssessmentAttemptStatus;
  readonly startedAt: string;
  readonly submittedAt?: string;
  readonly submissionEvidence: readonly string[];
  readonly result?: AssessmentResult;
  readonly updatedAt?: string;
}

export type ScheduleEntryStatus =
  | "planned"
  | "completed"
  | "skipped"
  | "carried"
  | "cancelled";

export type ScheduleEntrySource = "manual" | "generated" | "carry-forward";

export type ScheduleEntrySubject =
  | { readonly kind: "courseVersion"; readonly id: CourseVersionId }
  | { readonly kind: "learningUnit"; readonly id: LearningUnitId }
  | {
      readonly kind: "assessmentVersion";
      readonly id: AssessmentVersionId;
    };

export interface ScheduleEntry {
  readonly id: string;
  readonly subject: ScheduleEntrySubject;
  readonly scheduledDate: string;
  readonly startTime?: string;
  readonly plannedMinutes: number;
  readonly position: number;
  readonly source: ScheduleEntrySource;
  readonly originEntryId?: string;
  readonly status: ScheduleEntryStatus;
  readonly completedAt?: string;
  readonly updatedAt?: string;
}

export type PrerequisiteWaiverBasis =
  | "placement"
  | "prior_learning"
  | "review"
  | "manual";

export interface PrerequisiteWaiver {
  readonly id: string;
  readonly courseVersionId: CourseVersionId;
  readonly prerequisiteCourseVersionId: CourseVersionId;
  readonly basis: PrerequisiteWaiverBasis;
  readonly reason: string;
  readonly evidence?: string;
  readonly grantedAt: string;
  readonly revokedAt?: string;
  readonly updatedAt?: string;
}

export interface ProgressHistoryEntry {
  readonly id: string;
  readonly eventType: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly occurredAt: string;
  readonly clientMutationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CloudProgramProgress {
  readonly programVersionId: ProgramVersionId;
  readonly revision: number;
  readonly enrollment: LearnerEnrollment | null;
  readonly selectedConcentrationId?: ConcentrationId;
  readonly requirementSelections: Readonly<
    Record<string, readonly CourseVersionId[]>
  >;
  readonly courses: Readonly<Record<string, CloudCourseProgress>>;
  readonly unitEvidences: Readonly<Record<string, UnitEvidence>>;
  readonly assessmentAttempts: Readonly<Record<string, AssessmentAttempt>>;
  readonly scheduleEntries: Readonly<Record<string, ScheduleEntry>>;
  readonly prerequisiteWaivers: Readonly<Record<string, PrerequisiteWaiver>>;
  readonly history: readonly ProgressHistoryEntry[];
  readonly updatedAt?: string;
}

export interface SetEnrollmentOperation {
  readonly type: "set-enrollment";
  readonly enrollment: LearnerEnrollment | null;
}

export interface SetConcentrationOperation {
  readonly type: "set-concentration";
  readonly selectedConcentrationId: ConcentrationId | null;
}

export interface SetRequirementSelectionOperation {
  readonly type: "set-requirement-selection";
  readonly requirementGroupId: RequirementGroupId;
  readonly courseVersionIds: readonly CourseVersionId[];
}

export interface SetUnitCompletionOperation {
  readonly type: "set-unit-completion";
  readonly courseVersionId: CourseVersionId;
  readonly learningUnitId: LearningUnitId;
  readonly completed: boolean;
}

export interface UpsertUnitEvidenceOperation {
  readonly type: "upsert-unit-evidence";
  readonly evidence: UnitEvidence;
}

export interface DeleteUnitEvidenceOperation {
  readonly type: "delete-unit-evidence";
  readonly courseVersionId: CourseVersionId;
  readonly learningUnitId: LearningUnitId;
}

export interface UpsertAssessmentAttemptOperation {
  readonly type: "upsert-assessment-attempt";
  readonly attempt: AssessmentAttempt;
}

export interface SetAssessmentResultOperation {
  readonly type: "set-assessment-result";
  readonly assessmentAttemptId: string;
  readonly result: AssessmentResult;
}

export interface UpsertScheduleEntryOperation {
  readonly type: "upsert-schedule-entry";
  readonly entry: ScheduleEntry;
}

export interface DeleteScheduleEntryOperation {
  readonly type: "delete-schedule-entry";
  readonly scheduleEntryId: string;
}

export interface GrantPrerequisiteWaiverOperation {
  readonly type: "grant-prerequisite-waiver";
  readonly waiver: PrerequisiteWaiver;
}

export interface RevokePrerequisiteWaiverOperation {
  readonly type: "revoke-prerequisite-waiver";
  readonly prerequisiteWaiverId: string;
  readonly revokedAt: string;
}

export type ProgressMutationOperation =
  | SetEnrollmentOperation
  | SetConcentrationOperation
  | SetRequirementSelectionOperation
  | SetUnitCompletionOperation
  | UpsertUnitEvidenceOperation
  | DeleteUnitEvidenceOperation
  | UpsertAssessmentAttemptOperation
  | SetAssessmentResultOperation
  | UpsertScheduleEntryOperation
  | DeleteScheduleEntryOperation
  | GrantPrerequisiteWaiverOperation
  | RevokePrerequisiteWaiverOperation;

export interface ProgressPatchRequest {
  readonly schemaVersion: typeof PROGRESS_SCHEMA_VERSION;
  readonly programVersionId: ProgramVersionId;
  readonly clientImportId: string;
  readonly deviceId: string;
  readonly clientMutationId: string;
  readonly baseRevision: number;
  readonly operations: readonly ProgressMutationOperation[];
}

export interface ProgressImportReceipt {
  readonly clientImportId: string;
  readonly disposition: "merged" | "cloud";
  readonly importedUnitCount: number;
  readonly importedEntityCount?: number;
  readonly confirmedAt: string;
}

export interface AuthenticatedProgressResponse {
  readonly authenticated: true;
  /** Stable, opaque key used only to isolate this account's browser cache. */
  readonly ownerKey: string;
  readonly user: {
    readonly displayName: string;
  };
  readonly signOutPath: string;
  readonly progress: CloudProgramProgress;
  readonly importReceipt: ProgressImportReceipt | null;
  readonly acknowledgedMutationId?: string;
}

export interface AnonymousProgressResponse {
  readonly authenticated: false;
  /**
   * Absent when the deployment has no durable store behind it. The sign-in
   * route is provided by the hosting platform, not this app, so advertising it
   * elsewhere sends visitors to a 404 for an account that could not hold
   * anything anyway.
   */
  readonly signInPath?: string;
  readonly cloudSyncAvailable: boolean;
}

export type ProgressResponse =
  | AuthenticatedProgressResponse
  | AnonymousProgressResponse;

export interface ProgressConflictResponse {
  readonly conflict: true;
  readonly reason: "revision";
  readonly progress: CloudProgramProgress;
}

export interface LocalImportCourse {
  readonly completedUnitIds: readonly LearningUnitId[];
  readonly updatedAt?: string;
}

export interface LocalImportProgram {
  readonly enrollment: LearnerEnrollment | null;
  readonly selectedConcentrationId?: ConcentrationId;
  readonly requirementSelections: Readonly<
    Record<string, readonly CourseVersionId[]>
  >;
  readonly courses: Readonly<Record<string, LocalImportCourse>>;
  readonly unitEvidences: Readonly<Record<string, UnitEvidence>>;
  readonly assessmentAttempts: Readonly<Record<string, AssessmentAttempt>>;
  readonly scheduleEntries: Readonly<Record<string, ScheduleEntry>>;
  readonly prerequisiteWaivers: Readonly<Record<string, PrerequisiteWaiver>>;
}

export interface ProgressImportRequest {
  readonly schemaVersion: typeof PROGRESS_SCHEMA_VERSION;
  readonly storageNamespace: typeof PROGRESS_STORAGE_NAMESPACE;
  readonly clientImportId: string;
  readonly deviceId: string;
  readonly expectedOwnerKey: string;
  readonly disposition: "merged" | "cloud";
  readonly activeProgramVersionId: ProgramVersionId;
  readonly programs: Readonly<Record<string, LocalImportProgram>>;
}

export interface ProgressImportResponse {
  readonly confirmed: true;
  readonly alreadyConfirmed: boolean;
  readonly ownerKey: string;
  readonly receipt: ProgressImportReceipt;
}

/** @deprecated Mutations now target individual units with `set-unit-completion`. */
export interface CourseProgressUpdate {
  readonly courseVersionId: CourseVersionId;
  readonly completedUnitIds: readonly LearningUnitId[];
}
