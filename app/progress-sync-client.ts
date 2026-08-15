"use client";

import type {
  AnonymousProgressResponse,
  AuthenticatedProgressResponse,
  ProgressConflictResponse,
  ProgressImportRequest,
  ProgressImportResponse,
  ProgressPatchRequest,
  ProgressResponse,
} from "./learner-progress-contract";
import { PROGRESS_STORAGE_NAMESPACE } from "./learner-progress-contract";
import type { ProgramVersionId } from "./domain/catalog";
import {
  acknowledgePendingMutation,
  applyCloudSnapshot,
  hasMeaningfulLocalProgress,
  makeImportRequest,
  pendingMutationsForProgram,
  prepareImportWatermark,
  readProgressStore,
  recordImportResolution,
  rebasePendingMutation,
  selectAuthenticatedProgressOwner,
  selectGuestProgressScope,
} from "./progress-storage";

export type ProgressConnection =
  | { readonly kind: "checking" }
  | {
      readonly kind: "anonymous";
      /** Absent where the deployment offers no accounts at all. */
      readonly signInPath?: string;
    }
  | {
      readonly kind: "signed-in";
      readonly displayName: string;
      readonly signOutPath: string;
      readonly importResolved: boolean;
    }
  | { readonly kind: "offline" };

export type ProgressSaveState =
  | "idle"
  | "saving"
  | "saved"
  | "device-only"
  | "error";

export type StoredProgramSyncResult =
  | {
      readonly kind: "anonymous";
      readonly response: AnonymousProgressResponse;
    }
  | {
      readonly kind: "needs-import";
      readonly response: AuthenticatedProgressResponse;
    }
  | {
      readonly kind: "synced";
      readonly response: AuthenticatedProgressResponse;
      readonly drainedMutations: number;
    }
  | {
      readonly kind: "offline";
      readonly error: unknown;
    };

export class ProgressRevisionConflictError extends Error {
  constructor(readonly conflict: ProgressConflictResponse) {
    super("Cloud progress changed before this mutation could be saved.");
    this.name = "ProgressRevisionConflictError";
  }
}

function currentReturnTo() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

async function parseResponse<ResponseBody>(response: Response) {
  const body = (await response.json().catch(() => null)) as ResponseBody | null;
  if (!body) throw new Error("The progress service returned an invalid response.");
  return body;
}

function isProgressConflict(value: unknown): value is ProgressConflictResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    record.conflict === true &&
    record.reason === "revision" &&
    Boolean(record.progress) &&
    typeof record.progress === "object" &&
    !Array.isArray(record.progress)
  );
}

export async function loadCloudProgress(
  programVersionId: ProgramVersionId,
  clientImportId: string,
): Promise<ProgressResponse> {
  const query = new URLSearchParams({
    programVersionId,
    clientImportId,
    returnTo: currentReturnTo(),
  });
  const response = await fetch(`/api/learner-progress?${query}`, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 401) {
    return parseResponse<AnonymousProgressResponse>(response);
  }
  if (!response.ok) {
    throw new Error(`Progress load failed with status ${response.status}.`);
  }
  return parseResponse<AuthenticatedProgressResponse>(response);
}

export async function patchCloudProgress(
  request: ProgressPatchRequest,
): Promise<AuthenticatedProgressResponse> {
  // Stored outbox entries also carry local-only ordering metadata such as
  // `createdAt`. Serialize the public wire contract explicitly so strict API
  // parsing cannot be tripped by private browser bookkeeping fields.
  const payload: ProgressPatchRequest = {
    schemaVersion: request.schemaVersion,
    programVersionId: request.programVersionId,
    clientImportId: request.clientImportId,
    deviceId: request.deviceId,
    clientMutationId: request.clientMutationId,
    baseRevision: request.baseRevision,
    operations: request.operations,
  };
  const response = await fetch("/api/learner-progress", {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (response.status === 409) {
    const body = (await response.json().catch(() => null)) as unknown;
    if (isProgressConflict(body)) {
      throw new ProgressRevisionConflictError(body);
    }
    throw new Error("Progress save was rejected with status 409.");
  }
  if (!response.ok) {
    throw new Error(`Progress save failed with status ${response.status}.`);
  }
  return parseResponse<AuthenticatedProgressResponse>(response);
}

export async function importLocalProgress(
  request: ProgressImportRequest,
): Promise<ProgressImportResponse> {
  if (!prepareImportWatermark(request)) {
    throw new Error("The import mutation boundary could not be saved locally.");
  }
  const response = await fetch("/api/learner-progress/import", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Progress import failed with status ${response.status}.`);
  }
  const result = await parseResponse<ProgressImportResponse>(response);
  if (result.ownerKey !== request.expectedOwnerKey) {
    throw new Error("The progress import was confirmed for a different account.");
  }
  if (result.receipt.clientImportId !== request.clientImportId) {
    throw new Error("The progress service confirmed a different import ID.");
  }
  const resolution = recordImportResolution(result.receipt);
  if (!resolution.persisted) {
    throw new Error(
      "The import was confirmed, but its local consent marker could not be saved.",
    );
  }
  return result;
}

export function connectionFromResponse(
  response: ProgressResponse,
): ProgressConnection {
  if (!response.authenticated) {
    return {
      kind: "anonymous",
      ...(response.signInPath ? { signInPath: response.signInPath } : {}),
    };
  }
  return {
    kind: "signed-in",
    displayName: response.user.displayName,
    signOutPath: response.signOutPath,
    importResolved: Boolean(response.importReceipt),
  };
}

const syncLocks = new Map<
  ProgramVersionId,
  Promise<StoredProgramSyncResult>
>();
const MAX_REVISION_RETRIES = 12;

async function withBrowserSyncLock(
  programVersionId: ProgramVersionId,
  run: () => Promise<StoredProgramSyncResult>,
): Promise<StoredProgramSyncResult> {
  if (typeof navigator === "undefined" || !navigator.locks) return run();
  const lockName = `${PROGRESS_STORAGE_NAMESPACE}:sync:${programVersionId}`;
  return await navigator.locks.request(
    lockName,
    { mode: "exclusive" },
    run,
  );
}

function mutationAppearsInHistory(
  response: AuthenticatedProgressResponse,
  clientMutationId: string,
) {
  return response.progress.history.some(
    (entry) => entry.clientMutationId === clientMutationId,
  );
}

function responseWithProgress(
  response: AuthenticatedProgressResponse,
  progress: ProgressConflictResponse["progress"],
): AuthenticatedProgressResponse {
  return { ...response, progress };
}

async function performStoredProgramSync(
  programVersionId: ProgramVersionId,
): Promise<StoredProgramSyncResult> {
  try {
    const initialStore = readProgressStore();
    let clientImportId = initialStore.clientImportId;
    if (!clientImportId) {
      throw new Error("Local progress identity is unavailable.");
    }

    let response = await loadCloudProgress(programVersionId, clientImportId);
    if (!response.authenticated) {
      selectGuestProgressScope();
      return { kind: "anonymous", response };
    }

    // The first request may have been made with the cache of the account that
    // was previously active in this browser. Select the response owner, then
    // re-fetch under that owner's own import ID before making any decision or
    // sending any mutation.
    for (let ownerSwitches = 0; ownerSwitches < 4; ownerSwitches += 1) {
      const selection = selectAuthenticatedProgressOwner(response.ownerKey);
      if (!selection.persisted) {
        throw new Error("The authenticated cache owner could not be saved.");
      }
      if (
        selection.clientImportId === clientImportId &&
        !selection.changedScope
      ) {
        break;
      }
      clientImportId = selection.clientImportId;
      response = await loadCloudProgress(programVersionId, clientImportId);
      if (!response.authenticated) {
        selectGuestProgressScope();
        return { kind: "anonymous", response };
      }
      if (ownerSwitches === 3) {
        throw new Error("The authenticated progress owner kept changing.");
      }
    }

    if (!response.importReceipt) {
      // The GET must not become destructive: a migrated v2 record has no
      // outbox yet, so applying the empty cloud snapshot here would erase it.
      // This read deliberately occurs after GET and owner selection; edits
      // made while the request was in flight therefore require consent too.
      const localAfterGet = readProgressStore();
      if (hasMeaningfulLocalProgress(localAfterGet)) {
        return { kind: "needs-import", response };
      }

      const expectedOwnerKey = response.ownerKey;
      await importLocalProgress(makeImportRequest(programVersionId, "cloud"));
      const confirmed = await loadCloudProgress(
        programVersionId,
        clientImportId,
      );
      if (!confirmed.authenticated) {
        return { kind: "anonymous", response: confirmed };
      }
      if (!confirmed.importReceipt) {
        throw new Error("Cloud-only import confirmation was not persisted.");
      }
      if (confirmed.ownerKey !== expectedOwnerKey) {
        throw new Error("The authenticated progress owner changed during import.");
      }
      const confirmedSelection = selectAuthenticatedProgressOwner(
        confirmed.ownerKey,
      );
      if (!confirmedSelection.persisted) {
        throw new Error("The confirmed cache owner could not be saved.");
      }
      if (confirmedSelection.clientImportId !== clientImportId) {
        throw new Error("The confirmed import belongs to a different cache.");
      }
      response = confirmed;
    }

    // This also recovers the consent boundary after a successful server import
    // whose response was lost before the browser could persist its marker.
    // Cloud-only clears guest state once; an existing marker makes later calls
    // a no-op so legitimate account-cache mutations remain queued.
    const resolvedReceipt = response.importReceipt;
    if (!resolvedReceipt) {
      throw new Error("The progress import decision is still unresolved.");
    }
    const resolution = recordImportResolution(resolvedReceipt);
    if (!resolution.persisted) {
      throw new Error("The progress import decision could not be saved locally.");
    }
    if (!applyCloudSnapshot(response.progress)) {
      throw new Error("The cloud snapshot could not be saved locally.");
    }
    let drainedMutations = 0;
    let revisionRetries = 0;

    // If a PATCH committed but its response was lost, GET history acts as the
    // durable acknowledgement. This avoids replaying the same intent under a
    // new mutation ID merely because the browser missed one response.
    for (const mutation of pendingMutationsForProgram(programVersionId)) {
      if (!mutationAppearsInHistory(response, mutation.clientMutationId)) {
        continue;
      }
      if (!acknowledgePendingMutation(
        programVersionId,
        mutation.clientMutationId,
        response.progress,
      )) {
        throw new Error("The cloud acknowledgement could not be saved locally.");
      }
      drainedMutations += 1;
    }

    while (true) {
      let mutation = pendingMutationsForProgram(programVersionId)[0];
      if (!mutation) {
        return { kind: "synced", response, drainedMutations };
      }

      const latestRevision = response.progress.revision;
      if (mutation.baseRevision !== latestRevision) {
        const replacementId = rebasePendingMutation(
          programVersionId,
          mutation.clientMutationId,
          latestRevision,
        );
        if (!replacementId) {
          throw new Error("The pending progress mutation disappeared during rebase.");
        }
        mutation = pendingMutationsForProgram(programVersionId)[0];
        if (!mutation || mutation.clientMutationId !== replacementId) {
          throw new Error("The rebased progress mutation is not queue head.");
        }
      }

      try {
        const saved = await patchCloudProgress(mutation);
        if (saved.ownerKey !== response.ownerKey) {
          throw new Error("The authenticated progress owner changed during save.");
        }
        const acknowledgedId =
          saved.acknowledgedMutationId ?? mutation.clientMutationId;
        if (acknowledgedId !== mutation.clientMutationId) {
          throw new Error(
            "The progress service acknowledged a different mutation.",
          );
        }
        if (!acknowledgePendingMutation(
          programVersionId,
          mutation.clientMutationId,
          saved.progress,
        )) {
          throw new Error("The cloud acknowledgement could not be saved locally.");
        }
        response = saved;
        drainedMutations += 1;
        revisionRetries = 0;
      } catch (error) {
        if (!(error instanceof ProgressRevisionConflictError)) throw error;
        revisionRetries += 1;
        if (revisionRetries > MAX_REVISION_RETRIES) {
          throw new Error("Cloud progress kept changing during synchronization.");
        }

        const conflictProgress = error.conflict.progress;
        response = responseWithProgress(response, conflictProgress);
        if (!applyCloudSnapshot(conflictProgress)) {
          throw new Error("The conflicting cloud snapshot could not be saved locally.");
        }

        if (mutationAppearsInHistory(response, mutation.clientMutationId)) {
          if (!acknowledgePendingMutation(
            programVersionId,
            mutation.clientMutationId,
            conflictProgress,
          )) {
            throw new Error("The cloud acknowledgement could not be saved locally.");
          }
          drainedMutations += 1;
          continue;
        }

        const replacementId = rebasePendingMutation(
          programVersionId,
          mutation.clientMutationId,
          conflictProgress.revision,
        );
        if (!replacementId) {
          throw new Error("The conflicting progress mutation could not be rebased.");
        }
      }
    }
  } catch (error) {
    // The outbox is deliberately untouched on transport/service failure. A
    // later call can resume from the same ordered mutation.
    return { kind: "offline", error };
  }
}

/**
 * Best-effort, per-program synchronization. Concurrent callers share one
 * promise, which prevents duplicate imports and overlapping outbox drains.
 */
export function syncStoredProgram(
  programVersionId: ProgramVersionId,
): Promise<StoredProgramSyncResult> {
  const existing = syncLocks.get(programVersionId);
  if (existing) return existing;

  const run = async () => {
    let result = await performStoredProgramSync(programVersionId);
    // Close the join-at-finish race: a writer may have enqueued work after the
    // inner drain observed an empty queue but before this shared promise
    // settled. Keep ownership of the lock until a final stable queue check.
    while (
      result.kind === "synced" &&
      pendingMutationsForProgram(programVersionId).length > 0
    ) {
      result = await performStoredProgramSync(programVersionId);
    }
    syncLocks.delete(programVersionId);
    // No event can interleave between lock deletion and this synchronous
    // recheck. A later writer will see no lock and start its own pass.
    if (
      result.kind === "synced" &&
      pendingMutationsForProgram(programVersionId).length > 0
    ) {
      return syncStoredProgram(programVersionId);
    }
    return result;
  };
  const running = withBrowserSyncLock(programVersionId, run);
  syncLocks.set(programVersionId, running);
  return running;
}
