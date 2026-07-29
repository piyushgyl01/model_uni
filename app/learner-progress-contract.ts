import type {
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
} from "./domain/catalog";

export const PROGRESS_STORAGE_NAMESPACE = "course-atlas-progress-v2";

export interface CloudCourseProgress {
  readonly completedUnitIds: readonly LearningUnitId[];
  readonly updatedAt?: string;
}

export interface CloudProgramProgress {
  readonly programVersionId: ProgramVersionId;
  readonly selectedConcentrationId?: string;
  readonly courses: Readonly<Record<string, CloudCourseProgress>>;
}

export interface ProgressImportReceipt {
  readonly clientImportId: string;
  readonly disposition: "merged" | "cloud";
  readonly importedUnitCount: number;
  readonly confirmedAt: string;
}

export interface AuthenticatedProgressResponse {
  readonly authenticated: true;
  readonly user: {
    readonly displayName: string;
  };
  readonly signOutPath: string;
  readonly progress: CloudProgramProgress;
  readonly importReceipt: ProgressImportReceipt | null;
}

export interface AnonymousProgressResponse {
  readonly authenticated: false;
  readonly signInPath: string;
}

export type ProgressResponse =
  | AuthenticatedProgressResponse
  | AnonymousProgressResponse;

export interface CourseProgressUpdate {
  readonly courseVersionId: CourseVersionId;
  readonly completedUnitIds: readonly LearningUnitId[];
}

export interface ProgressPatchRequest {
  readonly programVersionId: ProgramVersionId;
  readonly clientImportId: string;
  readonly courseUpdates?: readonly CourseProgressUpdate[];
  readonly concentrationUpdate?: {
    readonly selectedConcentrationId: string | null;
  };
}

export interface LocalImportCourse {
  readonly completedUnitIds: readonly string[];
  readonly updatedAt?: string;
}

export interface LocalImportProgram {
  readonly selectedConcentrationId?: string;
  readonly courses: Readonly<Record<string, LocalImportCourse>>;
}

export interface ProgressImportRequest {
  readonly schemaVersion: 2;
  readonly storageNamespace: typeof PROGRESS_STORAGE_NAMESPACE;
  readonly clientImportId: string;
  readonly disposition: "merged" | "cloud";
  readonly activeProgramVersionId: ProgramVersionId;
  readonly programs: Readonly<Record<string, LocalImportProgram>>;
}

export interface ProgressImportResponse {
  readonly confirmed: true;
  readonly alreadyConfirmed: boolean;
  readonly receipt: ProgressImportReceipt;
}

