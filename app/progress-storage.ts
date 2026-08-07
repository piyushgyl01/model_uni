"use client";

import type {
  CloudProgramProgress,
  LocalImportProgram,
  ProgressImportRequest,
} from "./learner-progress-contract";
import { PROGRESS_STORAGE_NAMESPACE } from "./learner-progress-contract";
import type {
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
} from "./domain/catalog";

export const PROGRESS_EVENT = "course-atlas-progress-v2:changed";

export interface StoredUnitEvidence {
  readonly unitId: string;
  readonly textOrUrl: string;
  readonly updatedAt: string;
}

export interface StoredCourseProgress {
  readonly completedUnitIds?: readonly string[];
  readonly unitEvidences?: Readonly<Record<string, StoredUnitEvidence>>;
  readonly updatedAt?: string;
  readonly pendingSync?: boolean;
}

export interface EnrollmentConfig {
  readonly startDate: string;
  readonly paceHoursPerWeek: number;
  readonly enrolledAt: string;
  readonly status: "enrolled" | "paused";
}

export interface StoredProgramProgress {
  readonly courses?: Readonly<Record<string, StoredCourseProgress>>;
  readonly selectedConcentrationId?: string;
  readonly concentrationPendingSync?: boolean;
  readonly enrollment?: EnrollmentConfig;
}

export interface ProgressStore {
  readonly schemaVersion?: number;
  readonly clientImportId?: string;
  readonly programs?: Readonly<Record<string, StoredProgramProgress>>;
}

let volatileClientImportId: string | undefined;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function readProgressStore(): ProgressStore {
  try {
    const value = window.localStorage.getItem(PROGRESS_STORAGE_NAMESPACE);
    if (!value) return {};
    const parsed: unknown = JSON.parse(value);
    return isObject(parsed) ? (parsed as ProgressStore) : {};
  } catch {
    return {};
  }
}

function writeProgressStore(next: ProgressStore) {
  try {
    window.localStorage.setItem(
      PROGRESS_STORAGE_NAMESPACE,
      JSON.stringify({ ...next, schemaVersion: 2 }),
    );
    window.dispatchEvent(new Event(PROGRESS_EVENT));
    return true;
  } catch {
    return false;
  }
}

function createImportId() {
  if (typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ensureClientImportId() {
  const current = readProgressStore();
  if (
    typeof current.clientImportId === "string" &&
    current.clientImportId.length >= 8
  ) {
    volatileClientImportId = current.clientImportId;
    return current.clientImportId;
  }
  if (volatileClientImportId) return volatileClientImportId;
  const clientImportId = createImportId();
  volatileClientImportId = clientImportId;
  writeProgressStore({ ...current, clientImportId });
  return clientImportId;
}

export function getStoredProgram(programVersionId: ProgramVersionId) {
  return readProgressStore().programs?.[programVersionId];
}

export function hasMeaningfulLocalProgress(store: ProgressStore) {
  return Object.values(store.programs ?? {}).some((program) => {
    if (
      typeof program.selectedConcentrationId === "string" &&
      program.selectedConcentrationId.length > 0
    ) {
      return true;
    }
    return Object.values(program.courses ?? {}).some(
      (course) =>
        Array.isArray(course.completedUnitIds) &&
        course.completedUnitIds.length > 0,
    );
  });
}

export function readLocalCourseUnits(
  programVersionId: ProgramVersionId,
  courseVersionId: CourseVersionId,
  allowedUnitIds: ReadonlySet<string>,
) {
  const stored =
    getStoredProgram(programVersionId)?.courses?.[courseVersionId]
      ?.completedUnitIds;
  if (!Array.isArray(stored)) return [];
  return stored.filter(
    (unitId): unitId is LearningUnitId =>
      typeof unitId === "string" && allowedUnitIds.has(unitId),
  );
}

export function writeLocalCourseUnits(
  programVersionId: ProgramVersionId,
  courseVersionId: CourseVersionId,
  completedUnitIds: readonly LearningUnitId[],
  pendingSync: boolean,
) {
  const current = readProgressStore();
  const programs = { ...(current.programs ?? {}) };
  const program = { ...(programs[programVersionId] ?? {}) };
  const courses = { ...(program.courses ?? {}) };
  courses[courseVersionId] = {
    ...courses[courseVersionId],
    completedUnitIds: [...completedUnitIds],
    updatedAt: new Date().toISOString(),
    pendingSync,
  };
  programs[programVersionId] = { ...program, courses };
  return writeProgressStore({ ...current, programs });
}

export function readLocalUnitEvidence(
  programVersionId: ProgramVersionId,
  courseVersionId: CourseVersionId,
  unitId: string,
): StoredUnitEvidence | undefined {
  const course = getStoredProgram(programVersionId)?.courses?.[courseVersionId];
  return course?.unitEvidences?.[unitId];
}

export function writeLocalUnitEvidence(
  programVersionId: ProgramVersionId,
  courseVersionId: CourseVersionId,
  unitId: string,
  textOrUrl: string,
  pendingSync: boolean,
) {
  const current = readProgressStore();
  const programs = { ...(current.programs ?? {}) };
  const program = { ...(programs[programVersionId] ?? {}) };
  const courses = { ...(program.courses ?? {}) };
  const course = { ...(courses[courseVersionId] ?? {}) };
  const unitEvidences = { ...(course.unitEvidences ?? {}) };

  unitEvidences[unitId] = {
    unitId,
    textOrUrl,
    updatedAt: new Date().toISOString(),
  };

  courses[courseVersionId] = {
    ...course,
    unitEvidences,
    updatedAt: new Date().toISOString(),
    pendingSync,
  };

  programs[programVersionId] = { ...program, courses };
  return writeProgressStore({ ...current, programs });
}

export function writeLocalConcentration(
  programVersionId: ProgramVersionId,
  selectedConcentrationId: string,
  pendingSync: boolean,
) {
  const current = readProgressStore();
  const programs = { ...(current.programs ?? {}) };
  const program = { ...(programs[programVersionId] ?? {}) };
  programs[programVersionId] = {
    ...program,
    selectedConcentrationId,
    concentrationPendingSync: pendingSync,
  };
  return writeProgressStore({ ...current, programs });
}

export function getStoredEnrollment(programVersionId: ProgramVersionId) {
  return getStoredProgram(programVersionId)?.enrollment;
}

export function writeLocalEnrollment(
  programVersionId: ProgramVersionId,
  enrollment: EnrollmentConfig,
) {
  const current = readProgressStore();
  const programs = { ...(current.programs ?? {}) };
  const program = { ...(programs[programVersionId] ?? {}) };
  programs[programVersionId] = {
    ...program,
    enrollment,
  };
  return writeProgressStore({ ...current, programs });
}

export function cancelLocalEnrollment(programVersionId: ProgramVersionId) {
  const current = readProgressStore();
  const programs = { ...(current.programs ?? {}) };
  const program = { ...(programs[programVersionId] ?? {}) };
  const { enrollment, ...restProgram } = program;
  programs[programVersionId] = restProgram;
  return writeProgressStore({ ...current, programs });
}

export function replaceLocalProgramFromCloud(
  progress: CloudProgramProgress,
) {
  const current = readProgressStore();
  const programs = { ...(current.programs ?? {}) };
  programs[progress.programVersionId] = {
    selectedConcentrationId: progress.selectedConcentrationId,
    concentrationPendingSync: false,
    courses: Object.fromEntries(
      Object.entries(progress.courses).map(([courseVersionId, course]) => [
        courseVersionId,
        {
          completedUnitIds: [...course.completedUnitIds],
          updatedAt: course.updatedAt,
          pendingSync: false,
        },
      ]),
    ),
  };
  return writeProgressStore({ ...current, programs });
}

export function pendingUpdatesForProgram(
  programVersionId: ProgramVersionId,
) {
  const program = getStoredProgram(programVersionId);
  const courseUpdates = Object.entries(program?.courses ?? {})
    .filter(([, course]) => course.pendingSync)
    .map(([courseVersionId, course]) => ({
      courseVersionId: courseVersionId as CourseVersionId,
      completedUnitIds: (course.completedUnitIds ?? []).filter(
        (unitId): unitId is LearningUnitId => typeof unitId === "string",
      ),
    }));

  return {
    courseUpdates,
    concentrationUpdate: program?.concentrationPendingSync
      ? {
          selectedConcentrationId:
            program.selectedConcentrationId ?? null,
        }
      : undefined,
  };
}

function sanitizedImportPrograms(store: ProgressStore) {
  return Object.fromEntries(
    Object.entries(store.programs ?? {}).flatMap(
      ([programVersionId, program]) => {
        const courses = Object.fromEntries(
          Object.entries(program.courses ?? {}).flatMap(
            ([courseVersionId, course]) => {
              const completedUnitIds = (
                course.completedUnitIds ?? []
              ).filter(
                (unitId): unitId is string => typeof unitId === "string",
              );
              return completedUnitIds.length > 0
                ? [
                    [
                      courseVersionId,
                      {
                        completedUnitIds,
                        updatedAt: course.updatedAt,
                      },
                    ],
                  ]
                : [];
            },
          ),
        );
        if (
          !program.selectedConcentrationId &&
          Object.keys(courses).length === 0
        ) {
          return [];
        }
        return [
          [
            programVersionId,
            {
              selectedConcentrationId: program.selectedConcentrationId,
              courses,
            } satisfies LocalImportProgram,
          ],
        ];
      },
    ),
  );
}

export function makeImportRequest(
  activeProgramVersionId: ProgramVersionId,
  disposition: "merged" | "cloud",
): ProgressImportRequest {
  const clientImportId = ensureClientImportId();
  const store = readProgressStore();
  return {
    schemaVersion: 2,
    storageNamespace: PROGRESS_STORAGE_NAMESPACE,
    clientImportId,
    disposition,
    activeProgramVersionId,
    // Choosing cloud-only is itself a consent boundary: acknowledge the
    // decision without transmitting the browser's historical progress.
    programs:
      disposition === "merged" ? sanitizedImportPrograms(store) : {},
  };
}
