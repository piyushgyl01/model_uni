import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import type {
  CourseVersionId,
  LearningUnitId,
  ProgramVersionId,
} from "../app/domain/catalog";
import type {
  AuthenticatedProgressResponse,
  CloudProgramProgress,
  ProgressPatchRequest,
} from "../app/learner-progress-contract";
import {
  ProgressRevisionConflictError,
  importLocalProgress,
  patchCloudProgress,
  syncStoredProgram,
} from "../app/progress-sync-client";
import {
  makeImportRequest,
  pendingMutationsForProgram,
  prepareImportWatermark,
  readProgressStore,
  readLocalCourseUnits,
  recordImportResolution,
  resetProgressStorageVolatileStateForTests,
  selectAuthenticatedProgressOwner,
  writeLocalCourseUnits,
  writeLocalEnrollment,
  writeLocalUnitEvidence,
} from "../app/progress-storage";

const programVersionId = "prv_sync_client" as ProgramVersionId;
const conflictProgramVersionId = "prv_sync_conflict" as ProgramVersionId;
const cloudChoiceProgramVersionId = "prv_sync_cloud_choice" as ProgramVersionId;
const crashRecoveryProgramVersionId = "prv_sync_crash_recovery" as ProgramVersionId;
const courseVersionId = "crv_sync_client" as CourseVersionId;
const unitId = "unt_sync_client" as LearningUnitId;

class MemoryStorage {
  readonly values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}

let memory: MemoryStorage;
let originalFetch: typeof fetch;
let idCounter: number;
let dispatchHook: ((event: Event) => void) | undefined;

beforeEach(() => {
  memory = new MemoryStorage();
  idCounter = 0;
  dispatchHook = undefined;
  originalFetch = globalThis.fetch;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: memory,
      location: { pathname: "/today", search: "", hash: "" },
      crypto: {
        randomUUID: () => `10000000-0000-4000-8000-${String(++idCounter).padStart(12, "0")}`,
      },
      dispatchEvent(event: Event) {
        dispatchHook?.(event);
        return true;
      },
    },
  });
  resetProgressStorageVolatileStateForTests();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  resetProgressStorageVolatileStateForTests();
  Reflect.deleteProperty(globalThis, "window");
});

function cloud(
  id: ProgramVersionId,
  revision: number,
  completedUnitIds: readonly LearningUnitId[] = [],
): CloudProgramProgress {
  return {
    programVersionId: id,
    revision,
    enrollment: null,
    requirementSelections: {},
    courses: {
      [courseVersionId]: { completedUnitIds },
    },
    unitEvidences: {},
    assessmentAttempts: {},
    scheduleEntries: {},
    prerequisiteWaivers: {},
    history: [],
  };
}

function authenticated(
  progress: CloudProgramProgress,
  acknowledgedMutationId?: string,
): AuthenticatedProgressResponse {
  return {
    authenticated: true,
    ownerKey: "owner-sync-test",
    user: { displayName: "Learner" },
    signOutPath: "/signout-with-chatgpt",
    progress,
    importReceipt: {
      clientImportId: "import-sync-test",
      disposition: "cloud",
      importedUnitCount: 0,
      confirmedAt: "2026-08-08T00:00:00.000Z",
    },
    ...(acknowledgedMutationId ? { acknowledgedMutationId } : {}),
  };
}

test("PATCH exposes a typed revision conflict", async () => {
  const conflict = {
    conflict: true,
    reason: "revision",
    progress: cloud(programVersionId, 4),
  } as const;
  globalThis.fetch = async () =>
    new Response(JSON.stringify(conflict), {
      status: 409,
      headers: { "content-type": "application/json" },
    });

  await assert.rejects(
    patchCloudProgress({
      schemaVersion: 3,
      programVersionId,
      clientImportId: "import-sync-test",
      deviceId: "device-sync-test",
      clientMutationId: "mutation-sync-test",
      baseRevision: 3,
      operations: [],
    }),
    (error) =>
      error instanceof ProgressRevisionConflictError &&
      error.conflict.progress.revision === 4,
  );
});

test("meaningful local data requires an explicit import decision", async () => {
  memory.setItem(
    "course-atlas-progress-v3",
    JSON.stringify({
      schemaVersion: 3,
      clientImportId: "import-sync-test",
      deviceId: "device-sync-test",
      programs: {
        [programVersionId]: {
          enrollment: {
            startDate: "2026-08-08",
            paceHoursPerWeek: 20,
            preferredStudyDays: [1, 3, 5],
            timezone: "Asia/Kolkata",
            enrolledAt: "2026-08-08T00:00:00.000Z",
            status: "enrolled",
          },
        },
      },
    }),
  );
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({
      ...authenticated(cloud(programVersionId, 0)),
      importReceipt: null,
    });
  };

  const result = await syncStoredProgram(programVersionId);
  assert.equal(result.kind, "needs-import");
  assert.equal(calls, 1);
});

test("an edit made while GET is in flight prevents automatic cloud choice", async () => {
  memory.setItem(
    "course-atlas-progress-v3",
    JSON.stringify({
      schemaVersion: 3,
      clientImportId: "import-sync-test",
      deviceId: "device-sync-test",
      programs: {},
    }),
  );
  let postCount = 0;
  let patchCount = 0;
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "POST") postCount += 1;
    if (init?.method === "PATCH") patchCount += 1;
    if (!init || init.method === "GET") {
      writeLocalEnrollment(programVersionId, {
        startDate: "2026-08-08",
        paceHoursPerWeek: 15,
        preferredStudyDays: [2, 4, 6],
        timezone: "Asia/Kolkata",
        enrolledAt: "2026-08-08T00:00:00.000Z",
        status: "enrolled",
      });
      return Response.json({
        ...authenticated(cloud(programVersionId, 0)),
        importReceipt: null,
      });
    }
    throw new Error("unexpected request");
  };

  const result = await syncStoredProgram(programVersionId);
  assert.equal(result.kind, "needs-import");
  assert.equal(postCount, 0);
  assert.equal(patchCount, 0);
  assert.equal(pendingMutationsForProgram(programVersionId).length, 1);
});

test("switching accounts never offers or uploads the previous owner's outbox", async () => {
  memory.setItem(
    "course-atlas-progress-v3",
    JSON.stringify({
      schemaVersion: 3,
      clientImportId: "import-owner-a",
      deviceId: "device-owner-a",
      programs: {},
    }),
  );
  assert.equal(selectAuthenticatedProgressOwner("owner-a").persisted, true);
  const ownerACloudRequest = makeImportRequest(programVersionId, "cloud");
  assert.equal(prepareImportWatermark(ownerACloudRequest), true);
  assert.equal(
    recordImportResolution({
      clientImportId: "import-owner-a",
      disposition: "cloud",
      importedUnitCount: 0,
      confirmedAt: "2026-08-08T00:00:00.000Z",
    }).persisted,
    true,
  );
  writeLocalCourseUnits(
    programVersionId,
    courseVersionId,
    [unitId],
    true,
  );
  const ownerAMutationId =
    pendingMutationsForProgram(programVersionId)[0].clientMutationId;

  let ownerBReceipt:
    | AuthenticatedProgressResponse["importReceipt"]
    | null = null;
  const posts: unknown[] = [];
  const patches: ProgressPatchRequest[] = [];
  globalThis.fetch = async (input, init) => {
    if (init?.method === "POST") {
      const request = JSON.parse(String(init.body)) as {
        clientImportId: string;
        programs: unknown;
      };
      posts.push(request);
      ownerBReceipt = {
        clientImportId: request.clientImportId,
        disposition: "cloud",
        importedUnitCount: 0,
        confirmedAt: "2026-08-08T00:00:00.000Z",
      };
      return Response.json({
        confirmed: true,
        alreadyConfirmed: false,
        ownerKey: "owner-b",
        receipt: ownerBReceipt,
      });
    }
    if (init?.method === "PATCH") {
      patches.push(JSON.parse(String(init.body)) as ProgressPatchRequest);
      throw new Error("owner A mutation must not be patched as owner B");
    }
    const requestedImportId = new URL(String(input), "https://example.test")
      .searchParams.get("clientImportId");
    return Response.json({
      ...authenticated(cloud(programVersionId, 0)),
      ownerKey: "owner-b",
      importReceipt:
        ownerBReceipt?.clientImportId === requestedImportId
          ? ownerBReceipt
          : null,
    });
  };

  const result = await syncStoredProgram(programVersionId);
  assert.equal(result.kind, "synced");
  assert.equal(posts.length, 1);
  assert.deepEqual(
    (posts[0] as { programs: unknown }).programs,
    {},
  );
  assert.equal(patches.length, 0);

  assert.equal(selectAuthenticatedProgressOwner("owner-a").persisted, true);
  const ownerAPending = pendingMutationsForProgram(programVersionId);
  assert.equal(ownerAPending.length, 1);
  assert.equal(ownerAPending[0].clientMutationId, ownerAMutationId);
});

test("one program lock serially rebases a conflict and acknowledges one mutation", async () => {
  memory.setItem(
    "course-atlas-progress-v3",
    JSON.stringify({
      schemaVersion: 3,
      clientImportId: "import-sync-test",
      deviceId: "device-sync-test",
      importResolutions: {
        "import-sync-test": {
          clientImportId: "import-sync-test",
          disposition: "cloud",
          confirmedAt: "2026-08-08T00:00:00.000Z",
          resolvedAt: "2026-08-08T00:00:01.000Z",
        },
      },
      programs: {},
    }),
  );
  writeLocalCourseUnits(
    conflictProgramVersionId,
    courseVersionId,
    [unitId],
    true,
  );

  const patches: ProgressPatchRequest[] = [];
  globalThis.fetch = async (_input, init) => {
    if (!init || init.method === "GET") {
      return Response.json(authenticated(cloud(conflictProgramVersionId, 2)));
    }
    const request = JSON.parse(String(init.body)) as ProgressPatchRequest;
    patches.push(request);
    if (patches.length === 1) {
      return Response.json(
        {
          conflict: true,
          reason: "revision",
          progress: cloud(conflictProgramVersionId, 3),
        },
        { status: 409 },
      );
    }
    return Response.json(
      authenticated(
        cloud(conflictProgramVersionId, 4, [unitId]),
        request.clientMutationId,
      ),
    );
  };

  const first = syncStoredProgram(conflictProgramVersionId);
  const second = syncStoredProgram(conflictProgramVersionId);
  assert.equal(first, second);
  const result = await first;

  assert.equal(result.kind, "synced");
  assert.equal(patches.length, 2);
  assert.equal(patches[0].baseRevision, 2);
  assert.equal(patches[1].baseRevision, 3);
  assert.notEqual(patches[0].clientMutationId, patches[1].clientMutationId);
  assert.equal(pendingMutationsForProgram(conflictProgramVersionId).length, 0);
  assert.deepEqual(
    readLocalCourseUnits(
      conflictProgramVersionId,
      courseVersionId,
      new Set([unitId]),
    ),
    [unitId],
  );
});

test("cloud choice clears guest outbox once while later account edits still sync", async () => {
  memory.setItem(
    "course-atlas-progress-v3",
    JSON.stringify({
      schemaVersion: 3,
      clientImportId: "import-sync-test",
      deviceId: "device-sync-test",
      programs: {},
    }),
  );
  writeLocalEnrollment(cloudChoiceProgramVersionId, {
    startDate: "2026-08-08",
    paceHoursPerWeek: 20,
    preferredStudyDays: [1, 3, 5],
    timezone: "Asia/Kolkata",
    enrolledAt: "2026-08-08T00:00:00.000Z",
    status: "enrolled",
  });
  writeLocalUnitEvidence(
    cloudChoiceProgramVersionId,
    courseVersionId,
    unitId,
    "guest evidence",
    true,
  );
  writeLocalCourseUnits(
    cloudChoiceProgramVersionId,
    courseVersionId,
    [unitId],
    true,
  );
  assert.equal(
    pendingMutationsForProgram(cloudChoiceProgramVersionId).length,
    3,
  );

  const receipt = {
    clientImportId: "import-sync-test",
    disposition: "cloud" as const,
    importedUnitCount: 0,
    confirmedAt: "2026-08-08T00:00:00.000Z",
  };
  const patches: ProgressPatchRequest[] = [];
  let phase: "import" | "first-sync" | "later-sync" = "import";
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "POST") {
      return Response.json({
        confirmed: true,
        alreadyConfirmed: false,
        ownerKey: "owner-sync-test",
        receipt,
      });
    }
    if (!init || init.method === "GET") {
      return Response.json({
        ...authenticated(cloud(cloudChoiceProgramVersionId, phase === "later-sync" ? 1 : 0)),
        importReceipt: receipt,
      });
    }
    const request = JSON.parse(String(init.body)) as ProgressPatchRequest;
    patches.push(request);
    return Response.json({
      ...authenticated(cloud(cloudChoiceProgramVersionId, 2, [unitId])),
      importReceipt: receipt,
      acknowledgedMutationId: request.clientMutationId,
    });
  };

  assert.equal(
    selectAuthenticatedProgressOwner("owner-sync-test").persisted,
    true,
  );
  await importLocalProgress(
    makeImportRequest(cloudChoiceProgramVersionId, "cloud"),
  );
  assert.deepEqual(readProgressStore().programs, {});
  assert.equal(
    readProgressStore().importResolutions?.["import-sync-test"]?.disposition,
    "cloud",
  );

  phase = "first-sync";
  const firstSync = await syncStoredProgram(cloudChoiceProgramVersionId);
  assert.equal(firstSync.kind, "synced");
  assert.equal(patches.length, 0);
  assert.equal(
    pendingMutationsForProgram(cloudChoiceProgramVersionId).length,
    0,
  );

  writeLocalCourseUnits(
    cloudChoiceProgramVersionId,
    courseVersionId,
    [unitId],
    true,
  );
  phase = "later-sync";
  const laterSync = await syncStoredProgram(cloudChoiceProgramVersionId);
  assert.equal(laterSync.kind, "synced");
  assert.equal(patches.length, 1);
  assert.equal(
    patches[0].operations[0]?.type,
    "set-unit-completion",
  );
  assert.equal(
    pendingMutationsForProgram(cloudChoiceProgramVersionId).length,
    0,
  );
});

test("GET receipt recovers a cloud choice whose response marker was lost", async () => {
  memory.setItem(
    "course-atlas-progress-v3",
    JSON.stringify({
      schemaVersion: 3,
      clientImportId: "import-sync-test",
      deviceId: "device-sync-test",
      programs: {},
    }),
  );
  writeLocalUnitEvidence(
    crashRecoveryProgramVersionId,
    courseVersionId,
    unitId,
    "must be discarded",
    true,
  );
  assert.equal(
    selectAuthenticatedProgressOwner("owner-sync-test").persisted,
    true,
  );
  const lostResponseRequest = makeImportRequest(
    crashRecoveryProgramVersionId,
    "cloud",
  );
  assert.equal(prepareImportWatermark(lostResponseRequest), true);
  let patchCount = 0;
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "PATCH") patchCount += 1;
    return Response.json(
      authenticated(cloud(crashRecoveryProgramVersionId, 5)),
    );
  };

  const result = await syncStoredProgram(crashRecoveryProgramVersionId);
  assert.equal(result.kind, "synced");
  assert.equal(patchCount, 0);
  assert.equal(
    pendingMutationsForProgram(crashRecoveryProgramVersionId).length,
    0,
  );
  assert.equal(
    readProgressStore().importResolutions?.["import-sync-test"]?.disposition,
    "cloud",
  );
});

test("a writer joining after the inner empty check is drained before shared sync resolves", async () => {
  const raceProgramVersionId = "prv_sync_join_race" as ProgramVersionId;
  memory.setItem(
    "course-atlas-progress-v3",
    JSON.stringify({
      schemaVersion: 3,
      clientImportId: "import-sync-test",
      deviceId: "device-sync-test",
      importResolutions: {
        "import-sync-test": {
          clientImportId: "import-sync-test",
          disposition: "cloud",
          confirmedAt: "2026-08-08T00:00:00.000Z",
          resolvedAt: "2026-08-08T00:00:01.000Z",
        },
      },
      programs: {},
    }),
  );

  let revision = 0;
  let getCount = 0;
  let patchCount = 0;
  let queued = false;
  let joined: Promise<unknown> | undefined;
  globalThis.fetch = async (_input, init) => {
    if (!init || init.method === "GET") {
      getCount += 1;
      return Response.json(authenticated(cloud(raceProgramVersionId, revision)));
    }
    patchCount += 1;
    const request = JSON.parse(String(init.body)) as ProgressPatchRequest;
    revision += 1;
    return Response.json(
      authenticated(
        cloud(raceProgramVersionId, revision, [unitId]),
        request.clientMutationId,
      ),
    );
  };
  dispatchHook = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      writeLocalCourseUnits(
        raceProgramVersionId,
        courseVersionId,
        [unitId],
        true,
      );
      joined = syncStoredProgram(raceProgramVersionId);
    });
  };

  const first = syncStoredProgram(raceProgramVersionId);
  const result = await first;
  assert.equal(result.kind, "synced");
  assert.equal(joined, first);
  assert.equal(getCount, 2);
  assert.equal(patchCount, 1);
  assert.equal(pendingMutationsForProgram(raceProgramVersionId).length, 0);
});
