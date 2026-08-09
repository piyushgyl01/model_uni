"use client";

import type {
  AssessmentAttempt,
  AssessmentResult,
  CloudProgramProgress,
  LearnerEnrollment,
  LocalImportProgram,
  PrerequisiteWaiver,
  ProgressImportReceipt,
  ProgressImportRequest,
  ProgressMutationOperation,
  ProgressPatchRequest,
  ScheduleEntry,
  StudyDay,
  UnitEvidence,
} from "./learner-progress-contract";
import {
  LEGACY_PROGRESS_STORAGE_NAMESPACE,
  PROGRESS_SCHEMA_VERSION,
  PROGRESS_STORAGE_NAMESPACE,
} from "./learner-progress-contract";
import type {
  ConcentrationId,
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
  RequirementGroupId,
} from "./domain/catalog";

export const PROGRESS_EVENT = "course-atlas-progress-v3:changed";
export const LEGACY_PROGRESS_EVENT = "course-atlas-progress-v2:changed";

const DEFAULT_STUDY_DAYS: readonly StudyDay[] = [1, 2, 3, 4, 5];

export interface StoredUnitEvidence {
  readonly unitId: string;
  readonly textOrUrl: string;
  readonly updatedAt: string;
}

export interface StoredCourseProgress {
  readonly completedUnitIds?: readonly string[];
  /** Compatibility view for existing transcript and course components. */
  readonly unitEvidences?: Readonly<Record<string, StoredUnitEvidence>>;
  readonly updatedAt?: string;
  readonly pendingSync?: boolean;
}

export interface EnrollmentConfig {
  readonly startDate: string;
  readonly paceHoursPerWeek: number;
  readonly preferredStudyDays?: readonly StudyDay[];
  readonly timezone?: string;
  readonly enrolledAt: string;
  readonly status: LearnerEnrollment["status"];
  readonly updatedAt?: string;
}

export interface QueuedProgressMutation extends ProgressPatchRequest {
  readonly createdAt: string;
}

export interface StoredProgramProgress {
  readonly serverRevision?: number;
  readonly courses?: Readonly<Record<string, StoredCourseProgress>>;
  readonly selectedConcentrationId?: string;
  readonly concentrationPendingSync?: boolean;
  readonly requirementSelections?: Readonly<
    Record<string, readonly CourseVersionId[]>
  >;
  readonly enrollment?: EnrollmentConfig;
  readonly enrollmentPendingSync?: boolean;
  readonly unitEvidences?: Readonly<Record<string, UnitEvidence>>;
  readonly assessmentAttempts?: Readonly<Record<string, AssessmentAttempt>>;
  readonly scheduleEntries?: Readonly<Record<string, ScheduleEntry>>;
  readonly prerequisiteWaivers?: Readonly<Record<string, PrerequisiteWaiver>>;
  readonly history?: CloudProgramProgress["history"];
  readonly updatedAt?: string;
  readonly pendingMutations?: readonly QueuedProgressMutation[];
}

export interface ProgressStore {
  readonly schemaVersion?: number;
  /** Present only after this cache has been bound to an authenticated owner. */
  readonly ownerKey?: string;
  readonly clientImportId?: string;
  readonly deviceId?: string;
  readonly importResolutions?: Readonly<
    Record<string, StoredImportResolution>
  >;
  readonly importWatermarks?: Readonly<
    Record<string, StoredImportWatermark>
  >;
  readonly programs?: Readonly<Record<string, StoredProgramProgress>>;
}

export interface StoredImportWatermark {
  readonly clientImportId: string;
  readonly disposition: ProgressImportReceipt["disposition"];
  readonly expectedOwnerKey: string;
  readonly mutationIds: readonly string[];
  readonly preparedAt: string;
}

export interface StoredImportResolution {
  readonly clientImportId: string;
  readonly disposition: ProgressImportReceipt["disposition"];
  readonly confirmedAt: string;
  readonly resolvedAt: string;
  /** Mutations represented by the import and therefore no longer patchable. */
  readonly resolvedMutationIds?: readonly string[];
}

export interface ImportResolutionResult {
  readonly firstObserved: boolean;
  readonly clearedPreConsentData: boolean;
  readonly persisted: boolean;
}

interface LegacyProgressStore {
  readonly schemaVersion?: number;
  readonly clientImportId?: string;
  readonly programs?: Readonly<Record<string, StoredProgramProgress>>;
}

interface ProgressStorageEnvelope {
  readonly schemaVersion: number;
  readonly storageFormat: "owner-scoped-v1";
  readonly activeOwnerKey?: string;
  /** The guest cache may be offered only to this owner until consent resolves. */
  readonly pendingOwnerKey?: string;
  readonly guest: ProgressStore;
  readonly owners: Readonly<Record<string, ProgressStore>>;
}

export interface AuthenticatedOwnerSelection {
  readonly clientImportId: string;
  readonly changedScope: boolean;
  readonly persisted: boolean;
}

const STORAGE_FORMAT = "owner-scoped-v1" as const;
const OUTBOX_STORAGE_PREFIX = `${PROGRESS_STORAGE_NAMESPACE}:mutation:`;
const ACK_STORAGE_PREFIX = `${PROGRESS_STORAGE_NAMESPACE}:ack:`;

let volatileClientImportId: string | undefined;
let volatileDeviceId: string | undefined;
let volatileStore: ProgressStore | undefined;
let volatileEnvelope: ProgressStorageEnvelope | undefined;
let preferVolatileEnvelope = false;
const requestMutationWatermarks = new WeakMap<object, readonly string[]>();

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseStoredValue(value: string | null): Record<string, unknown> | undefined {
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return isObject(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function createClientId(prefix: "device" | "import" | "mutation") {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function currentTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function normalizedEnrollment(
  enrollment: EnrollmentConfig | LearnerEnrollment,
): LearnerEnrollment {
  const preferredStudyDays = [
    ...new Set(enrollment.preferredStudyDays ?? DEFAULT_STUDY_DAYS),
  ].filter((day): day is StudyDay => Number.isInteger(day) && day >= 0 && day <= 6);
  return {
    startDate: enrollment.startDate,
    paceHoursPerWeek: enrollment.paceHoursPerWeek,
    preferredStudyDays:
      preferredStudyDays.length > 0 ? preferredStudyDays : DEFAULT_STUDY_DAYS,
    timezone: enrollment.timezone || currentTimezone(),
    enrolledAt: enrollment.enrolledAt,
    status: enrollment.status,
    ...(enrollment.updatedAt ? { updatedAt: enrollment.updatedAt } : {}),
  };
}

function normalizeStoredProgram(
  program: StoredProgramProgress,
): StoredProgramProgress {
  const unitEvidences = { ...(program.unitEvidences ?? {}) };
  const courses = Object.fromEntries(
    Object.entries(program.courses ?? {}).map(([courseVersionId, course]) => {
      for (const [unitId, evidence] of Object.entries(
        course.unitEvidences ?? {},
      )) {
        if (!unitEvidences[unitId]) {
          unitEvidences[unitId] = {
            learningUnitId: unitId as LearningUnitId,
            courseVersionId: courseVersionId as CourseVersionId,
            textOrUrl: evidence.textOrUrl,
            updatedAt: evidence.updatedAt,
          };
        }
      }
      return [
        courseVersionId,
        {
          ...course,
          completedUnitIds: [...new Set(course.completedUnitIds ?? [])],
        },
      ];
    }),
  );
  return {
    ...program,
    serverRevision:
      Number.isInteger(program.serverRevision) && (program.serverRevision ?? 0) >= 0
        ? program.serverRevision
        : 0,
    courses,
    unitEvidences,
    requirementSelections: { ...(program.requirementSelections ?? {}) },
    assessmentAttempts: { ...(program.assessmentAttempts ?? {}) },
    scheduleEntries: { ...(program.scheduleEntries ?? {}) },
    prerequisiteWaivers: { ...(program.prerequisiteWaivers ?? {}) },
    history: [...(program.history ?? [])],
    pendingMutations: [...(program.pendingMutations ?? [])],
    ...(program.enrollment
      ? { enrollment: normalizedEnrollment(program.enrollment) }
      : {}),
  };
}

/** Pure, lossless conversion used by first-read migration and tests. */
export function migrateLegacyProgressStore(
  legacy: LegacyProgressStore,
  ids: { readonly deviceId: string; readonly clientImportId: string },
): ProgressStore {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    deviceId: ids.deviceId,
    // Deliberately do not reuse v2's receipt key. The v3 payload contains
    // records v2 never transmitted, so it needs a fresh consent receipt.
    clientImportId: ids.clientImportId,
    importResolutions: {},
    programs: Object.fromEntries(
      Object.entries(legacy.programs ?? {}).map(([programVersionId, program]) => [
        programVersionId,
        normalizeStoredProgram({
          ...program,
          serverRevision: 0,
          pendingMutations: [],
        }),
      ]),
    ),
  };
}

function normalizeV3Store(
  store: ProgressStore,
  ownerKey = store.ownerKey,
): ProgressStore {
  const deviceId =
    typeof store.deviceId === "string" && store.deviceId.length >= 8
      ? store.deviceId
      : volatileDeviceId ?? createClientId("device");
  const clientImportId =
    typeof store.clientImportId === "string" && store.clientImportId.length >= 8
      ? store.clientImportId
      : volatileClientImportId ?? createClientId("import");
  volatileDeviceId = deviceId;
  volatileClientImportId = clientImportId;
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    ...(ownerKey ? { ownerKey } : {}),
    deviceId,
    clientImportId,
    importResolutions: { ...(store.importResolutions ?? {}) },
    importWatermarks: { ...(store.importWatermarks ?? {}) },
    programs: Object.fromEntries(
      Object.entries(store.programs ?? {}).map(([programVersionId, program]) => [
        programVersionId,
        normalizeStoredProgram(program),
      ]),
    ),
  };
}

function emptyProgressStore(ownerKey?: string) {
  return normalizeV3Store(
    {
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      ...(ownerKey ? { ownerKey } : {}),
      deviceId: createClientId("device"),
      clientImportId: createClientId("import"),
      importResolutions: {},
      programs: {},
    },
    ownerKey,
  );
}

function isProgressStorageEnvelope(
  value: Record<string, unknown>,
): value is Record<string, unknown> & ProgressStorageEnvelope {
  return (
    value.storageFormat === STORAGE_FORMAT &&
    isObject(value.guest) &&
    isObject(value.owners)
  );
}

function normalizeEnvelope(
  envelope: ProgressStorageEnvelope,
): ProgressStorageEnvelope {
  const owners = Object.fromEntries(
    Object.entries(envelope.owners ?? {}).map(([ownerKey, store]) => [
      ownerKey,
      normalizeV3Store(store, ownerKey),
    ]),
  );
  const activeOwnerKey =
    envelope.activeOwnerKey && owners[envelope.activeOwnerKey]
      ? envelope.activeOwnerKey
      : undefined;
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    storageFormat: STORAGE_FORMAT,
    ...(activeOwnerKey ? { activeOwnerKey } : {}),
    ...(!activeOwnerKey && envelope.pendingOwnerKey
      ? { pendingOwnerKey: envelope.pendingOwnerKey }
      : {}),
    guest: normalizeV3Store(envelope.guest),
    owners,
  };
}

function activeStoreFromEnvelope(envelope: ProgressStorageEnvelope) {
  return envelope.activeOwnerKey
    ? envelope.owners[envelope.activeOwnerKey]
    : envelope.guest;
}

function replaceActiveStore(
  envelope: ProgressStorageEnvelope,
  store: ProgressStore,
): ProgressStorageEnvelope {
  if (envelope.activeOwnerKey) {
    return {
      ...envelope,
      owners: {
        ...envelope.owners,
        [envelope.activeOwnerKey]: normalizeV3Store(
          store,
          envelope.activeOwnerKey,
        ),
      },
    };
  }
  return { ...envelope, guest: normalizeV3Store(store) };
}

function dispatchProgressChanged() {
  window.dispatchEvent(new Event(PROGRESS_EVENT));
  window.dispatchEvent(new Event(LEGACY_PROGRESS_EVENT));
}

function persistEnvelope(next: ProgressStorageEnvelope, dispatch = true) {
  const normalized = normalizeEnvelope(next);
  volatileEnvelope = normalized;
  volatileStore = activeStoreFromEnvelope(normalized);
  try {
    window.localStorage.setItem(
      PROGRESS_STORAGE_NAMESPACE,
      JSON.stringify(normalized),
    );
    preferVolatileEnvelope = false;
    if (dispatch) dispatchProgressChanged();
    return true;
  } catch {
    preferVolatileEnvelope = true;
    return false;
  }
}

function readProgressEnvelope(): ProgressStorageEnvelope {
  if (preferVolatileEnvelope && volatileEnvelope) return volatileEnvelope;
  try {
    const current = parseStoredValue(
      window.localStorage.getItem(PROGRESS_STORAGE_NAMESPACE),
    );
    if (current && isProgressStorageEnvelope(current)) {
      const normalized = normalizeEnvelope(current);
      volatileEnvelope = normalized;
      volatileStore = activeStoreFromEnvelope(normalized);
      return normalized;
    }
    if (current?.schemaVersion === PROGRESS_SCHEMA_VERSION) {
      // A flat v3 cache predates account isolation. It is intentionally
      // treated as guest data until an authenticated owner resolves consent.
      const envelope = normalizeEnvelope({
        schemaVersion: PROGRESS_SCHEMA_VERSION,
        storageFormat: STORAGE_FORMAT,
        guest: normalizeV3Store(current as ProgressStore),
        owners: {},
      });
      persistEnvelope(envelope, false);
      return envelope;
    }

    const legacy = parseStoredValue(
      window.localStorage.getItem(LEGACY_PROGRESS_STORAGE_NAMESPACE),
    );
    if (legacy) {
      const migrated = migrateLegacyProgressStore(legacy as LegacyProgressStore, {
        deviceId: createClientId("device"),
        clientImportId: createClientId("import"),
      });
      const envelope = normalizeEnvelope({
        schemaVersion: PROGRESS_SCHEMA_VERSION,
        storageFormat: STORAGE_FORMAT,
        guest: migrated,
        owners: {},
      });
      persistEnvelope(envelope, false);
      return envelope;
    }

    const empty = normalizeEnvelope({
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      storageFormat: STORAGE_FORMAT,
      guest: emptyProgressStore(),
      owners: {},
    });
    persistEnvelope(empty, false);
    return empty;
  } catch {
    if (volatileEnvelope) return volatileEnvelope;
    return normalizeEnvelope({
      schemaVersion: PROGRESS_SCHEMA_VERSION,
      storageFormat: STORAGE_FORMAT,
      guest: volatileStore ?? emptyProgressStore(),
      owners: {},
    });
  }
}

function resolvedMutationIds(store: ProgressStore) {
  return new Set(
    Object.values(store.importResolutions ?? {}).flatMap(
      (resolution) => resolution.resolvedMutationIds ?? [],
    ),
  );
}

function outboxKey(mutation: QueuedProgressMutation) {
  return `${OUTBOX_STORAGE_PREFIX}${encodeURIComponent(
    mutation.clientImportId,
  )}:${encodeURIComponent(mutation.programVersionId)}:${encodeURIComponent(
    mutation.clientMutationId,
  )}`;
}

function acknowledgementKey(clientImportId: string, clientMutationId: string) {
  return `${ACK_STORAGE_PREFIX}${encodeURIComponent(
    clientImportId,
  )}:${encodeURIComponent(clientMutationId)}`;
}

function readJournalAcknowledgements(store: ProgressStore) {
  const clientImportId = store.clientImportId;
  const acknowledged = new Set<string>();
  if (!clientImportId) return acknowledged;
  const prefix = `${ACK_STORAGE_PREFIX}${encodeURIComponent(clientImportId)}:`;
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(prefix)) continue;
      acknowledged.add(decodeURIComponent(key.slice(prefix.length)));
    }
  } catch {
    // The envelope remains a usable fallback when enumeration is unavailable.
  }
  return acknowledged;
}

function journalAcknowledgement(
  clientImportId: string,
  clientMutationId: string,
) {
  try {
    window.localStorage.setItem(
      acknowledgementKey(clientImportId, clientMutationId),
      "1",
    );
    return true;
  } catch {
    return false;
  }
}

function readJournaledMutations(store: ProgressStore) {
  const clientImportId = store.clientImportId;
  if (!clientImportId) return [];
  const prefix = `${OUTBOX_STORAGE_PREFIX}${encodeURIComponent(clientImportId)}:`;
  const mutations: QueuedProgressMutation[] = [];
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(prefix)) continue;
      const value = window.localStorage.getItem(key);
      if (!value) continue;
      const parsed: unknown = JSON.parse(value);
      if (
        isObject(parsed) &&
        parsed.clientImportId === clientImportId &&
        typeof parsed.clientMutationId === "string" &&
        typeof parsed.programVersionId === "string" &&
        Array.isArray(parsed.operations) &&
        typeof parsed.createdAt === "string"
      ) {
        mutations.push(parsed as unknown as QueuedProgressMutation);
      }
    }
  } catch {
    return [];
  }
  return mutations;
}

function hydrateJournaledMutations(input: ProgressStore) {
  const store = normalizeV3Store(input, input.ownerKey);
  const resolved = resolvedMutationIds(store);
  const acknowledged = readJournalAcknowledgements(store);
  const programs = Object.fromEntries(
    Object.entries(store.programs ?? {}).map(([programVersionId, program]) => {
      const pendingMutations = (program.pendingMutations ?? []).filter(
        (mutation) =>
          !resolved.has(mutation.clientMutationId) &&
          !acknowledged.has(mutation.clientMutationId),
      );
      for (const mutation of pendingMutations) journalMutation(mutation);
      return [
        programVersionId,
        withPendingMarkers({ ...program, pendingMutations }),
      ];
    }),
  );
  const journaled = readJournaledMutations(store)
    .filter(
      (mutation) =>
        !resolved.has(mutation.clientMutationId) &&
        !acknowledged.has(mutation.clientMutationId),
    )
    .sort(
      (left, right) =>
        left.createdAt.localeCompare(right.createdAt) ||
        left.clientMutationId.localeCompare(right.clientMutationId),
    );
  for (const mutation of journaled) {
    const current = normalizeStoredProgram(
      programs[mutation.programVersionId] ?? {},
    );
    if (
      current.pendingMutations?.some(
        (candidate) => candidate.clientMutationId === mutation.clientMutationId,
      )
    ) {
      continue;
    }
    programs[mutation.programVersionId] = withPendingMarkers({
      ...applyProgressOperations(current, mutation.operations, mutation.createdAt),
      pendingMutations: [...(current.pendingMutations ?? []), mutation],
    });
  }
  return { ...store, programs };
}

function journalMutation(mutation: QueuedProgressMutation) {
  try {
    window.localStorage.setItem(outboxKey(mutation), JSON.stringify(mutation));
    return true;
  } catch {
    return false;
  }
}

function removeJournaledMutation(mutation: QueuedProgressMutation) {
  try {
    window.localStorage.removeItem(outboxKey(mutation));
  } catch {
    // The persisted resolution/ack marker prevents replay even if cleanup is
    // delayed until storage becomes writable again.
  }
}

export function readProgressStore(): ProgressStore {
  const store = hydrateJournaledMutations(
    activeStoreFromEnvelope(readProgressEnvelope()),
  );
  volatileStore = store;
  return store;
}

/** Every write is recomputed from the latest persisted owner scope. */
function updateProgressStore(
  updater: (latest: ProgressStore) => ProgressStore,
) {
  const envelope = readProgressEnvelope();
  const latest = hydrateJournaledMutations(activeStoreFromEnvelope(envelope));
  return persistEnvelope(replaceActiveStore(envelope, updater(latest)));
}

export function ensureClientImportId() {
  const current = readProgressStore();
  return current.clientImportId as string;
}

export function ensureDeviceId() {
  const current = readProgressStore();
  return current.deviceId as string;
}

export function rotateClientImportId() {
  const clientImportId = createClientId("import");
  volatileClientImportId = clientImportId;
  updateProgressStore((current) => ({ ...current, clientImportId }));
  return clientImportId;
}

/**
 * Selects the cache that belongs to an authenticated response. A cache for a
 * different owner is archived untouched. A never-bound guest cache remains a
 * consent candidate until the server returns an import receipt.
 */
export function selectAuthenticatedProgressOwner(
  ownerKey: string,
): AuthenticatedOwnerSelection {
  if (!ownerKey) throw new Error("Authenticated progress is missing an owner key.");
  const envelope = readProgressEnvelope();
  const previous = activeStoreFromEnvelope(envelope);
  let next: ProgressStorageEnvelope;
  if (envelope.activeOwnerKey === ownerKey) {
    next = { ...envelope, pendingOwnerKey: undefined };
  } else if (envelope.owners[ownerKey]) {
    next = {
      ...envelope,
      activeOwnerKey: ownerKey,
      pendingOwnerKey: undefined,
    };
  } else {
    next = {
      ...envelope,
      activeOwnerKey: undefined,
      pendingOwnerKey: ownerKey,
    };
  }
  const selected = activeStoreFromEnvelope(next);
  const changedScope =
    previous.clientImportId !== selected.clientImportId ||
    previous.ownerKey !== selected.ownerKey;
  const persisted = persistEnvelope(next, changedScope);
  return {
    clientImportId: selected.clientImportId as string,
    changedScope,
    persisted,
  };
}

export function selectGuestProgressScope() {
  const envelope = readProgressEnvelope();
  const changedScope = Boolean(
    envelope.activeOwnerKey || envelope.pendingOwnerKey,
  );
  const persisted = persistEnvelope(
    {
      ...envelope,
      activeOwnerKey: undefined,
      pendingOwnerKey: undefined,
    },
    changedScope,
  );
  return { changedScope, persisted };
}

/** Owner precondition for authenticated import requests. */
export function getExpectedProgressOwnerKey() {
  const envelope = readProgressEnvelope();
  return envelope.activeOwnerKey ?? envelope.pendingOwnerKey;
}

/** Saves the exact local mutation boundary before an import request is sent. */
export function prepareImportWatermark(request: ProgressImportRequest) {
  const mutationIds = requestMutationWatermarks.get(request as object);
  if (!mutationIds) {
    throw new Error("The import request has no local mutation watermark.");
  }
  const expectedOwnerKey = getExpectedProgressOwnerKey();
  if (!expectedOwnerKey) {
    throw new Error("The import request has no authenticated owner precondition.");
  }
  let matchedScope = false;
  const persisted = updateProgressStore((store) => {
    if (store.clientImportId !== request.clientImportId) return store;
    matchedScope = true;
    const watermark: StoredImportWatermark = {
      clientImportId: request.clientImportId,
      disposition: request.disposition,
      expectedOwnerKey,
      mutationIds: [...mutationIds],
      preparedAt: new Date().toISOString(),
    };
    return {
      ...store,
      importWatermarks: {
        ...(store.importWatermarks ?? {}),
        [request.clientImportId]: watermark,
      },
    };
  });
  return matchedScope && persisted;
}

export function getStoredImportResolution(clientImportId?: string) {
  const store = readProgressStore();
  const resolvedId = clientImportId ?? store.clientImportId;
  return resolvedId ? store.importResolutions?.[resolvedId] : undefined;
}

/**
 * Applies the one-time consent boundary for an import receipt. A cloud-only
 * decision intentionally discards the pre-consent guest snapshot and outbox
 * exactly once. The persisted marker prevents later account-cache mutations
 * from being mistaken for guest data when the same receipt is observed again.
 */
export function recordImportResolution(
  receipt: ProgressImportReceipt,
): ImportResolutionResult {
  const envelope = readProgressEnvelope();
  const store = hydrateJournaledMutations(activeStoreFromEnvelope(envelope));
  if (receipt.clientImportId !== store.clientImportId) {
    throw new Error("The import receipt does not match this browser import ID.");
  }
  const existing = store.importResolutions?.[receipt.clientImportId];
  if (existing) {
    if (existing.disposition !== receipt.disposition) {
      throw new Error("The saved import decision conflicts with the server receipt.");
    }
    if (
      envelope.activeOwnerKey &&
      store.ownerKey === envelope.activeOwnerKey
    ) {
      const persisted = preferVolatileEnvelope
        ? persistEnvelope(envelope, false)
        : true;
      return {
        firstObserved: false,
        clearedPreConsentData: false,
        persisted,
      };
    }
    const recoveredOwnerKey = envelope.pendingOwnerKey;
    if (recoveredOwnerKey) {
      // The marker proves this import decision was already applied in an
      // earlier release. Mutations created afterwards are account work, not
      // pre-consent guest data, so bind the whole cache without clearing it.
      const persisted = persistEnvelope({
        ...envelope,
        activeOwnerKey: recoveredOwnerKey,
        pendingOwnerKey: undefined,
        guest: emptyProgressStore(),
        owners: {
          ...envelope.owners,
          [recoveredOwnerKey]: normalizeV3Store(
            { ...store, ownerKey: recoveredOwnerKey },
            recoveredOwnerKey,
          ),
        },
      });
      return {
        firstObserved: false,
        clearedPreConsentData: false,
        persisted,
      };
    }
  }

  const watermark = store.importWatermarks?.[receipt.clientImportId];
  if (!watermark) {
    throw new Error(
      "The import receipt has no durable local mutation watermark.",
    );
  }
  if (watermark.disposition !== receipt.disposition) {
    throw new Error("The import receipt conflicts with its local watermark.");
  }
  const ownerKey = envelope.activeOwnerKey ?? envelope.pendingOwnerKey;
  if (!ownerKey || ownerKey !== watermark.expectedOwnerKey) {
    throw new Error("The import receipt belongs to a different cache owner.");
  }
  const representedIds = new Set(watermark.mutationIds);
  const mutations = Object.values(store.programs ?? {}).flatMap(
    (program) => program.pendingMutations ?? [],
  );
  const representedMutations = mutations.filter((mutation) =>
    representedIds.has(mutation.clientMutationId),
  );
  const resolution: StoredImportResolution = existing ?? {
      clientImportId: receipt.clientImportId,
      disposition: receipt.disposition,
      confirmedAt: receipt.confirmedAt,
      resolvedAt: new Date().toISOString(),
      resolvedMutationIds: [...watermark.mutationIds],
    };
  const clearPreConsentData = receipt.disposition === "cloud";
  const programs = clearPreConsentData
    ? Object.fromEntries(
        Object.entries(store.programs ?? {}).flatMap(
          ([programVersionId, program]) => {
            const pendingMutations = (program.pendingMutations ?? []).filter(
              (mutation) => !representedIds.has(mutation.clientMutationId),
            );
            if (pendingMutations.length === 0) return [];
            let replayed: StoredProgramProgress = normalizeStoredProgram({});
            for (const mutation of pendingMutations) {
              replayed = applyProgressOperations(
                replayed,
                mutation.operations,
                mutation.createdAt,
              );
            }
            return [
              [
                programVersionId,
                withPendingMarkers({ ...replayed, pendingMutations }),
              ],
            ];
          },
        ),
      )
    : Object.fromEntries(
        Object.entries(store.programs ?? {}).map(([programVersionId, program]) => [
          programVersionId,
          withPendingMarkers({
            ...program,
            pendingMutations: (program.pendingMutations ?? []).filter(
              (mutation) => !representedIds.has(mutation.clientMutationId),
            ),
          }),
        ]),
      );
  const importWatermarks = { ...(store.importWatermarks ?? {}) };
  delete importWatermarks[receipt.clientImportId];
  const bound: ProgressStore = normalizeV3Store({
    ...store,
    ownerKey,
    importResolutions: {
      ...(store.importResolutions ?? {}),
      [receipt.clientImportId]: resolution,
    },
    importWatermarks,
    programs,
  }, ownerKey);
  const wasGuest = !envelope.activeOwnerKey;
  const persisted = persistEnvelope({
    ...envelope,
    activeOwnerKey: ownerKey,
    pendingOwnerKey: undefined,
    guest: wasGuest ? emptyProgressStore() : envelope.guest,
    owners: { ...envelope.owners, [ownerKey]: bound },
  });
  if (persisted) {
    for (const mutation of representedMutations) {
      removeJournaledMutation(mutation);
    }
  }
  return {
    firstObserved: !existing,
    clearedPreConsentData: clearPreConsentData,
    persisted,
  };
}

export function getStoredProgram(programVersionId: ProgramVersionId) {
  return readProgressStore().programs?.[programVersionId];
}

function hasProgramRecords(program: StoredProgramProgress) {
  return Boolean(
    program.enrollment ||
      program.selectedConcentrationId ||
      Object.values(program.requirementSelections ?? {}).some(
        (selections) => selections.length > 0,
      ) ||
      Object.values(program.courses ?? {}).some(
        (course) => (course.completedUnitIds?.length ?? 0) > 0,
      ) ||
      Object.keys(program.unitEvidences ?? {}).length > 0 ||
      Object.keys(program.assessmentAttempts ?? {}).length > 0 ||
      Object.keys(program.scheduleEntries ?? {}).length > 0 ||
      Object.keys(program.prerequisiteWaivers ?? {}).length > 0 ||
      (program.history?.length ?? 0) > 0 ||
      (program.pendingMutations?.length ?? 0) > 0
  );
}

export function hasMeaningfulLocalProgress(store: ProgressStore) {
  return Object.values(store.programs ?? {}).some(hasProgramRecords);
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
  return [...new Set(stored)].filter(
    (unitId): unitId is LearningUnitId =>
      typeof unitId === "string" && allowedUnitIds.has(unitId),
  );
}

function compatibilityEvidence(
  evidence: UnitEvidence,
  fallbackTime: string,
): StoredUnitEvidence {
  return {
    unitId: evidence.learningUnitId,
    textOrUrl: evidence.textOrUrl,
    updatedAt: evidence.updatedAt ?? fallbackTime,
  };
}

/** Pure optimistic reducer. Server fields are applied first, then queued ops. */
export function applyProgressOperations(
  input: StoredProgramProgress,
  operations: readonly ProgressMutationOperation[],
  optimisticAt = new Date().toISOString(),
): StoredProgramProgress {
  let program = normalizeStoredProgram(input);

  for (const operation of operations) {
    switch (operation.type) {
      case "set-enrollment": {
        if (operation.enrollment) {
          program = {
            ...program,
            enrollment: normalizedEnrollment(operation.enrollment),
            updatedAt: optimisticAt,
          };
        } else {
          const { enrollment: _enrollment, ...withoutEnrollment } = program;
          void _enrollment;
          program = { ...withoutEnrollment, updatedAt: optimisticAt };
        }
        break;
      }
      case "set-concentration": {
        if (operation.selectedConcentrationId) {
          program = {
            ...program,
            selectedConcentrationId: operation.selectedConcentrationId,
            updatedAt: optimisticAt,
          };
        } else {
          const {
            selectedConcentrationId: _selectedConcentrationId,
            ...withoutConcentration
          } = program;
          void _selectedConcentrationId;
          program = { ...withoutConcentration, updatedAt: optimisticAt };
        }
        break;
      }
      case "set-requirement-selection": {
        program = {
          ...program,
          requirementSelections: {
            ...(program.requirementSelections ?? {}),
            [operation.requirementGroupId]: [
              ...new Set(operation.courseVersionIds),
            ],
          },
          updatedAt: optimisticAt,
        };
        break;
      }
      case "set-unit-completion": {
        const courses = { ...(program.courses ?? {}) };
        const course = { ...(courses[operation.courseVersionId] ?? {}) };
        const completed = new Set(course.completedUnitIds ?? []);
        if (operation.completed) completed.add(operation.learningUnitId);
        else completed.delete(operation.learningUnitId);
        courses[operation.courseVersionId] = {
          ...course,
          completedUnitIds: [...completed],
          updatedAt: optimisticAt,
        };
        program = { ...program, courses, updatedAt: optimisticAt };
        break;
      }
      case "upsert-unit-evidence": {
        const evidence: UnitEvidence = {
          ...operation.evidence,
          updatedAt: operation.evidence.updatedAt ?? optimisticAt,
        };
        const courses = { ...(program.courses ?? {}) };
        const course = { ...(courses[evidence.courseVersionId] ?? {}) };
        courses[evidence.courseVersionId] = {
          ...course,
          unitEvidences: {
            ...(course.unitEvidences ?? {}),
            [evidence.learningUnitId]: compatibilityEvidence(
              evidence,
              optimisticAt,
            ),
          },
          updatedAt: evidence.updatedAt,
        };
        program = {
          ...program,
          courses,
          unitEvidences: {
            ...(program.unitEvidences ?? {}),
            [evidence.learningUnitId]: evidence,
          },
          updatedAt: evidence.updatedAt,
        };
        break;
      }
      case "delete-unit-evidence": {
        const unitEvidences = { ...(program.unitEvidences ?? {}) };
        delete unitEvidences[operation.learningUnitId];
        const courses = { ...(program.courses ?? {}) };
        const course = courses[operation.courseVersionId];
        if (course) {
          const courseEvidences = { ...(course.unitEvidences ?? {}) };
          delete courseEvidences[operation.learningUnitId];
          courses[operation.courseVersionId] = {
            ...course,
            unitEvidences: courseEvidences,
            updatedAt: optimisticAt,
          };
        }
        program = { ...program, courses, unitEvidences, updatedAt: optimisticAt };
        break;
      }
      case "upsert-assessment-attempt": {
        program = {
          ...program,
          assessmentAttempts: {
            ...(program.assessmentAttempts ?? {}),
            [operation.attempt.id]: {
              ...operation.attempt,
              updatedAt: operation.attempt.updatedAt ?? optimisticAt,
            },
          },
          updatedAt: optimisticAt,
        };
        break;
      }
      case "set-assessment-result": {
        const attempt = program.assessmentAttempts?.[operation.assessmentAttemptId];
        if (attempt) {
          program = {
            ...program,
            assessmentAttempts: {
              ...(program.assessmentAttempts ?? {}),
              [operation.assessmentAttemptId]: {
                ...attempt,
                status: "evaluated",
                result: operation.result,
                updatedAt: optimisticAt,
              },
            },
            updatedAt: optimisticAt,
          };
        }
        break;
      }
      case "upsert-schedule-entry": {
        program = {
          ...program,
          scheduleEntries: {
            ...(program.scheduleEntries ?? {}),
            [operation.entry.id]: {
              ...operation.entry,
              updatedAt: operation.entry.updatedAt ?? optimisticAt,
            },
          },
          updatedAt: optimisticAt,
        };
        break;
      }
      case "delete-schedule-entry": {
        const scheduleEntries = { ...(program.scheduleEntries ?? {}) };
        delete scheduleEntries[operation.scheduleEntryId];
        program = { ...program, scheduleEntries, updatedAt: optimisticAt };
        break;
      }
      case "grant-prerequisite-waiver": {
        program = {
          ...program,
          prerequisiteWaivers: {
            ...(program.prerequisiteWaivers ?? {}),
            [operation.waiver.id]: {
              ...operation.waiver,
              updatedAt: operation.waiver.updatedAt ?? optimisticAt,
            },
          },
          updatedAt: optimisticAt,
        };
        break;
      }
      case "revoke-prerequisite-waiver": {
        const waiver =
          program.prerequisiteWaivers?.[operation.prerequisiteWaiverId];
        if (waiver) {
          program = {
            ...program,
            prerequisiteWaivers: {
              ...(program.prerequisiteWaivers ?? {}),
              [operation.prerequisiteWaiverId]: {
                ...waiver,
                revokedAt: operation.revokedAt,
                updatedAt: optimisticAt,
              },
            },
            updatedAt: optimisticAt,
          };
        }
        break;
      }
    }
  }
  return program;
}

function withPendingMarkers(program: StoredProgramProgress) {
  const mutations = program.pendingMutations ?? [];
  const pendingCourses = new Set<string>();
  let concentrationPendingSync = false;
  let enrollmentPendingSync = false;
  for (const mutation of mutations) {
    for (const operation of mutation.operations) {
      if (
        operation.type === "set-unit-completion" ||
        operation.type === "delete-unit-evidence"
      ) {
        pendingCourses.add(operation.courseVersionId);
      } else if (operation.type === "upsert-unit-evidence") {
        pendingCourses.add(operation.evidence.courseVersionId);
      } else if (operation.type === "set-concentration") {
        concentrationPendingSync = true;
      } else if (operation.type === "set-enrollment") {
        enrollmentPendingSync = true;
      }
    }
  }
  const courses = Object.fromEntries(
    Object.entries(program.courses ?? {}).map(([courseVersionId, course]) => [
      courseVersionId,
      { ...course, pendingSync: pendingCourses.has(courseVersionId) },
    ]),
  );
  return {
    ...program,
    courses,
    concentrationPendingSync,
    enrollmentPendingSync,
  };
}

function enqueueOperations(
  store: ProgressStore,
  programVersionId: ProgramVersionId,
  operations: readonly ProgressMutationOperation[],
  now = new Date().toISOString(),
) {
  if (operations.length === 0) return store;
  const normalized = normalizeV3Store(store);
  const programs = { ...(normalized.programs ?? {}) };
  const current = normalizeStoredProgram(programs[programVersionId] ?? {});
  const mutation: QueuedProgressMutation = {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    programVersionId,
    clientImportId: normalized.clientImportId as string,
    deviceId: normalized.deviceId as string,
    clientMutationId: createClientId("mutation"),
    baseRevision: current.serverRevision ?? 0,
    operations: [...operations],
    createdAt: now,
  };
  const optimistic = applyProgressOperations(current, operations, now);
  programs[programVersionId] = withPendingMarkers({
    ...optimistic,
    pendingMutations: [...(current.pendingMutations ?? []), mutation],
  });
  return { ...normalized, programs };
}

export function enqueueProgressOperations(
  programVersionId: ProgramVersionId,
  operations: readonly ProgressMutationOperation[],
) {
  if (operations.length === 0) return true;
  let journaled = false;
  const persisted = updateProgressStore((latest) => {
    const next = enqueueOperations(latest, programVersionId, operations);
    const mutation = next.programs?.[programVersionId]?.pendingMutations?.at(-1);
    if (!mutation || !journalMutation(mutation)) return latest;
    journaled = true;
    return next;
  });
  return journaled && persisted;
}

function applyWithoutEnqueue(
  programVersionId: ProgramVersionId,
  operations: readonly ProgressMutationOperation[],
) {
  return updateProgressStore((store) => {
    const programs = { ...(store.programs ?? {}) };
    programs[programVersionId] = applyProgressOperations(
      programs[programVersionId] ?? {},
      operations,
    );
    return { ...store, programs };
  });
}

export function writeLocalCourseUnits(
  programVersionId: ProgramVersionId,
  courseVersionId: CourseVersionId,
  completedUnitIds: readonly LearningUnitId[],
  pendingSync: boolean,
) {
  const current = new Set(
    getStoredProgram(programVersionId)?.courses?.[courseVersionId]
      ?.completedUnitIds ?? [],
  );
  const next = new Set<string>(completedUnitIds);
  const operations: ProgressMutationOperation[] = [];
  for (const learningUnitId of current) {
    if (!next.has(learningUnitId)) {
      operations.push({
        type: "set-unit-completion",
        courseVersionId,
        learningUnitId: learningUnitId as LearningUnitId,
        completed: false,
      });
    }
  }
  for (const learningUnitId of next) {
    if (!current.has(learningUnitId)) {
      operations.push({
        type: "set-unit-completion",
        courseVersionId,
        learningUnitId: learningUnitId as LearningUnitId,
        completed: true,
      });
    }
  }
  if (operations.length === 0) return true;
  return pendingSync
    ? enqueueProgressOperations(programVersionId, operations)
    : applyWithoutEnqueue(programVersionId, operations);
}

export function readLocalUnitEvidence(
  programVersionId: ProgramVersionId,
  courseVersionId: CourseVersionId,
  unitId: string,
): StoredUnitEvidence | undefined {
  const program = getStoredProgram(programVersionId);
  const evidence = program?.unitEvidences?.[unitId];
  if (evidence && evidence.courseVersionId === courseVersionId) {
    return compatibilityEvidence(evidence, evidence.updatedAt ?? "");
  }
  return program?.courses?.[courseVersionId]?.unitEvidences?.[unitId];
}

export function writeLocalUnitEvidence(
  programVersionId: ProgramVersionId,
  courseVersionId: CourseVersionId,
  unitId: string,
  textOrUrl: string,
  pendingSync: boolean,
) {
  const operation: ProgressMutationOperation = {
    type: "upsert-unit-evidence",
    evidence: {
      learningUnitId: unitId as LearningUnitId,
      courseVersionId,
      textOrUrl,
      updatedAt: new Date().toISOString(),
    },
  };
  return pendingSync
    ? enqueueProgressOperations(programVersionId, [operation])
    : applyWithoutEnqueue(programVersionId, [operation]);
}

export function deleteLocalUnitEvidence(
  programVersionId: ProgramVersionId,
  courseVersionId: CourseVersionId,
  learningUnitId: LearningUnitId,
) {
  return enqueueProgressOperations(programVersionId, [
    { type: "delete-unit-evidence", courseVersionId, learningUnitId },
  ]);
}

export function writeLocalConcentration(
  programVersionId: ProgramVersionId,
  selectedConcentrationId: string,
  pendingSync: boolean,
) {
  const operation: ProgressMutationOperation = {
    type: "set-concentration",
    selectedConcentrationId: selectedConcentrationId as ConcentrationId,
  };
  return pendingSync
    ? enqueueProgressOperations(programVersionId, [operation])
    : applyWithoutEnqueue(programVersionId, [operation]);
}

export function writeLocalRequirementSelection(
  programVersionId: ProgramVersionId,
  requirementGroupId: RequirementGroupId,
  courseVersionIds: readonly CourseVersionId[],
) {
  return enqueueProgressOperations(programVersionId, [
    {
      type: "set-requirement-selection",
      requirementGroupId,
      courseVersionIds,
    },
  ]);
}

export function getStoredEnrollment(programVersionId: ProgramVersionId) {
  return getStoredProgram(programVersionId)?.enrollment;
}

export function writeLocalEnrollment(
  programVersionId: ProgramVersionId,
  enrollment: EnrollmentConfig,
) {
  return enqueueProgressOperations(programVersionId, [
    { type: "set-enrollment", enrollment: normalizedEnrollment(enrollment) },
  ]);
}

export function cancelLocalEnrollment(programVersionId: ProgramVersionId) {
  return enqueueProgressOperations(programVersionId, [
    { type: "set-enrollment", enrollment: null },
  ]);
}

export function writeLocalAssessmentAttempt(
  programVersionId: ProgramVersionId,
  attempt: AssessmentAttempt,
) {
  return enqueueProgressOperations(programVersionId, [
    { type: "upsert-assessment-attempt", attempt },
  ]);
}

export function writeLocalAssessmentResult(
  programVersionId: ProgramVersionId,
  assessmentAttemptId: string,
  result: AssessmentResult,
) {
  return enqueueProgressOperations(programVersionId, [
    { type: "set-assessment-result", assessmentAttemptId, result },
  ]);
}

export function writeLocalScheduleEntry(
  programVersionId: ProgramVersionId,
  entry: ScheduleEntry,
) {
  return enqueueProgressOperations(programVersionId, [
    { type: "upsert-schedule-entry", entry },
  ]);
}

export function deleteLocalScheduleEntry(
  programVersionId: ProgramVersionId,
  scheduleEntryId: string,
) {
  return enqueueProgressOperations(programVersionId, [
    { type: "delete-schedule-entry", scheduleEntryId },
  ]);
}

export function writeLocalPrerequisiteWaiver(
  programVersionId: ProgramVersionId,
  waiver: PrerequisiteWaiver,
) {
  return enqueueProgressOperations(programVersionId, [
    { type: "grant-prerequisite-waiver", waiver },
  ]);
}

export function revokeLocalPrerequisiteWaiver(
  programVersionId: ProgramVersionId,
  prerequisiteWaiverId: string,
  revokedAt = new Date().toISOString(),
) {
  return enqueueProgressOperations(programVersionId, [
    { type: "revoke-prerequisite-waiver", prerequisiteWaiverId, revokedAt },
  ]);
}

function storedProgramFromCloud(
  progress: CloudProgramProgress,
): StoredProgramProgress {
  const courseEvidences = new Map<string, Record<string, StoredUnitEvidence>>();
  for (const evidence of Object.values(progress.unitEvidences)) {
    const entries = courseEvidences.get(evidence.courseVersionId) ?? {};
    entries[evidence.learningUnitId] = compatibilityEvidence(
      evidence,
      progress.updatedAt ?? "",
    );
    courseEvidences.set(evidence.courseVersionId, entries);
  }
  return normalizeStoredProgram({
    serverRevision: progress.revision,
    ...(progress.selectedConcentrationId
      ? { selectedConcentrationId: progress.selectedConcentrationId }
      : {}),
    ...(progress.enrollment
      ? { enrollment: normalizedEnrollment(progress.enrollment) }
      : {}),
    requirementSelections: progress.requirementSelections,
    courses: Object.fromEntries(
      Object.entries(progress.courses).map(([courseVersionId, course]) => [
        courseVersionId,
        {
          completedUnitIds: [...course.completedUnitIds],
          unitEvidences: courseEvidences.get(courseVersionId) ?? {},
          updatedAt: course.updatedAt,
          pendingSync: false,
        },
      ]),
    ),
    unitEvidences: progress.unitEvidences,
    assessmentAttempts: progress.assessmentAttempts,
    scheduleEntries: progress.scheduleEntries,
    prerequisiteWaivers: progress.prerequisiteWaivers,
    history: progress.history,
    updatedAt: progress.updatedAt,
    pendingMutations: [],
  });
}

/** Pure cloud-underlay merge. Pending operations are replayed in queue order. */
export function mergeCloudSnapshotWithPending(
  current: StoredProgramProgress | undefined,
  progress: CloudProgramProgress,
): StoredProgramProgress {
  const pendingMutations = [...(current?.pendingMutations ?? [])];
  let merged = storedProgramFromCloud(progress);
  for (const mutation of pendingMutations) {
    merged = applyProgressOperations(merged, mutation.operations, mutation.createdAt);
  }
  return withPendingMarkers({
    ...merged,
    serverRevision: progress.revision,
    pendingMutations,
  });
}

export function applyCloudSnapshot(progress: CloudProgramProgress) {
  return updateProgressStore((current) => {
    const programs = { ...(current.programs ?? {}) };
    programs[progress.programVersionId] = mergeCloudSnapshotWithPending(
      programs[progress.programVersionId],
      progress,
    );
    return { ...current, programs };
  });
}

/** Backward-compatible name; unlike v2 this is a non-destructive merge. */
export function replaceLocalProgramFromCloud(progress: CloudProgramProgress) {
  return applyCloudSnapshot(progress);
}

export function pendingMutationsForProgram(
  programVersionId: ProgramVersionId,
) {
  return [...(getStoredProgram(programVersionId)?.pendingMutations ?? [])];
}

export function acknowledgePendingMutation(
  programVersionId: ProgramVersionId,
  clientMutationId: string,
  progress?: CloudProgramProgress,
) {
  const mutation = pendingMutationsForProgram(programVersionId).find(
    (candidate) => candidate.clientMutationId === clientMutationId,
  );
  // Removing only this immutable journal record cannot clobber a concurrent
  // writer's separately keyed mutation. The following updater re-reads all
  // other journal records before materializing the snapshot.
  if (
    mutation &&
    !journalAcknowledgement(mutation.clientImportId, clientMutationId)
  ) {
    return false;
  }
  if (mutation) removeJournaledMutation(mutation);
  return updateProgressStore((store) => {
    const programs = { ...(store.programs ?? {}) };
    const current = programs[programVersionId] ?? {};
    const pendingMutations = (current.pendingMutations ?? []).filter(
      (candidate) => candidate.clientMutationId !== clientMutationId,
    );
    const base = progress
      ? storedProgramFromCloud(progress)
      : normalizeStoredProgram(current);
    let merged = base;
    for (const candidate of pendingMutations) {
      merged = applyProgressOperations(
        merged,
        candidate.operations,
        candidate.createdAt,
      );
    }
    programs[programVersionId] = withPendingMarkers({
      ...merged,
      serverRevision: progress?.revision ?? current.serverRevision ?? 0,
      pendingMutations,
    });
    return { ...store, programs };
  });
}

export function rebasePendingMutation(
  programVersionId: ProgramVersionId,
  clientMutationId: string,
  baseRevision: number,
) {
  const original = pendingMutationsForProgram(programVersionId).find(
    (mutation) => mutation.clientMutationId === clientMutationId,
  );
  if (!original) return undefined;
  const replacement: QueuedProgressMutation = {
    ...original,
    clientMutationId: createClientId("mutation"),
    baseRevision,
    createdAt: new Date().toISOString(),
  };
  if (!journalMutation(replacement)) return undefined;
  if (!journalAcknowledgement(original.clientImportId, clientMutationId)) {
    removeJournaledMutation(replacement);
    return undefined;
  }
  removeJournaledMutation(original);
  const persisted = updateProgressStore((store) => {
    const programs = { ...(store.programs ?? {}) };
    const current = normalizeStoredProgram(programs[programVersionId] ?? {});
    const pendingMutations = (current.pendingMutations ?? []).map((mutation) =>
      mutation.clientMutationId === clientMutationId ? replacement : mutation,
    );
    programs[programVersionId] = { ...current, pendingMutations };
    return { ...store, programs };
  });
  if (!persisted) {
    // The replacement journal is authoritative even if the materialized
    // envelope could not be refreshed. A later read reconstructs it.
    return replacement.clientMutationId;
  }
  return replacement.clientMutationId;
}

/**
 * Compatibility projection for callers that have not moved to the outbox yet.
 * New synchronization code should use `pendingMutationsForProgram`.
 */
export function pendingUpdatesForProgram(programVersionId: ProgramVersionId) {
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
          selectedConcentrationId: program.selectedConcentrationId ?? null,
        }
      : undefined,
    pendingMutations: [...(program?.pendingMutations ?? [])],
  };
}

function sanitizedImportPrograms(store: ProgressStore) {
  return Object.fromEntries(
    Object.entries(store.programs ?? {}).flatMap(([programVersionId, program]) => {
      if (!hasProgramRecords(program)) return [];
      const courses = Object.fromEntries(
        Object.entries(program.courses ?? {}).map(([courseVersionId, course]) => [
          courseVersionId,
          {
            completedUnitIds: (course.completedUnitIds ?? []).filter(
              (unitId): unitId is LearningUnitId => typeof unitId === "string",
            ),
            ...(course.updatedAt ? { updatedAt: course.updatedAt } : {}),
          },
        ]),
      );
      const value: LocalImportProgram = {
        enrollment: program.enrollment
          ? normalizedEnrollment(program.enrollment)
          : null,
        ...(program.selectedConcentrationId
          ? {
              selectedConcentrationId:
                program.selectedConcentrationId as ConcentrationId,
            }
          : {}),
        requirementSelections: program.requirementSelections ?? {},
        courses,
        unitEvidences: program.unitEvidences ?? {},
        assessmentAttempts: program.assessmentAttempts ?? {},
        scheduleEntries: program.scheduleEntries ?? {},
        prerequisiteWaivers: program.prerequisiteWaivers ?? {},
      };
      return [[programVersionId, value]];
    }),
  );
}

export function makeImportRequest(
  activeProgramVersionId: ProgramVersionId,
  disposition: "merged" | "cloud",
): ProgressImportRequest {
  const store = readProgressStore();
  const expectedOwnerKey = getExpectedProgressOwnerKey();
  if (!expectedOwnerKey) {
    throw new Error("An authenticated owner is required before importing progress.");
  }
  const request: ProgressImportRequest = {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    storageNamespace: PROGRESS_STORAGE_NAMESPACE,
    clientImportId: store.clientImportId as string,
    deviceId: store.deviceId as string,
    expectedOwnerKey,
    disposition,
    activeProgramVersionId,
    programs: disposition === "merged" ? sanitizedImportPrograms(store) : {},
  };
  requestMutationWatermarks.set(
    request as object,
    Object.values(store.programs ?? {}).flatMap((program) =>
      (program.pendingMutations ?? []).map(
        (mutation) => mutation.clientMutationId,
      ),
    ),
  );
  return request;
}

/** Test-only reset of volatile fallbacks; it does not touch browser storage. */
export function resetProgressStorageVolatileStateForTests() {
  volatileClientImportId = undefined;
  volatileDeviceId = undefined;
  volatileStore = undefined;
  volatileEnvelope = undefined;
  preferVolatileEnvelope = false;
}
