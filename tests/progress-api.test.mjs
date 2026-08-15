import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Miniflare } from "miniflare";

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("progress-test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

const environment = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};
const context = {
  waitUntil() {},
  passThroughOnException() {},
};

async function progressEnvironment() {
  const modulesRoot = fileURLToPath(
    new URL("../dist/server/", import.meta.url),
  );
  const moduleFiles = (await readdir(modulesRoot, {
    recursive: true,
    withFileTypes: true,
  }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => resolve(entry.parentPath, entry.name))
    .sort();
  const entryPoint = resolve(modulesRoot, "index.js");
  const workerModules = [
    entryPoint,
    ...moduleFiles.filter((file) => file !== entryPoint),
  ].map((path) => ({ type: "ESModule", path }));

  const miniflare = new Miniflare({
    workers: [
      {
        name: "course-atlas",
        modules: workerModules,
        modulesRoot,
        compatibilityDate: "2026-05-15",
        compatibilityFlags: ["nodejs_compat"],
        d1Databases: ["DB"],
        serviceBindings: { ASSETS: "test-assets" },
      },
      {
        name: "test-assets",
        modules: true,
        compatibilityDate: "2026-05-15",
        script:
          "export default { fetch() { return new Response('Not found', { status: 404 }); } }",
      },
    ],
  });
  return {
    miniflare,
    database: await miniflare.getD1Database("DB", "course-atlas"),
  };
}

const authenticatedHeaders = {
  accept: "application/json",
  "content-type": "application/json",
  "oai-authenticated-user-id": "acct_course_atlas_test_owner",
  "oai-authenticated-user-email": "owner@example.test",
};

const practicalProgramVersionId = "prv_practical_spreadsheets_2026_1";
const practicalCourseVersionId = "crv_practical_spreadsheets_2026_1";
const practicalRequirementGroupId = "req_spreadsheets_complete_course";

function progressQuery(clientImportId) {
  const query = new URL("http://localhost/api/learner-progress");
  query.searchParams.set("programVersionId", practicalProgramVersionId);
  query.searchParams.set("clientImportId", clientImportId);
  query.searchParams.set("returnTo", "/programs/practical-spreadsheets");
  return query;
}

function richV3Import(
  clientImportId = "integration-v3-rich-20260808",
  expectedOwnerKey = "owner-not-yet-loaded",
) {
  const updatedAt = "2026-08-08T06:30:00.000Z";
  return {
    schemaVersion: 3,
    storageNamespace: "course-atlas-progress-v3",
    clientImportId,
    deviceId: "device-v3-rich-20260808",
    expectedOwnerKey,
    disposition: "merged",
    activeProgramVersionId: practicalProgramVersionId,
    programs: {
      [practicalProgramVersionId]: {
        enrollment: {
          startDate: "2026-08-08",
          paceHoursPerWeek: 20,
          preferredStudyDays: [1, 3, 5],
          timezone: "Asia/Kolkata",
          enrolledAt: "2026-08-08T06:00:00.000Z",
          status: "enrolled",
          updatedAt,
        },
        requirementSelections: {
          [practicalRequirementGroupId]: [practicalCourseVersionId],
        },
        courses: {
          [practicalCourseVersionId]: {
            completedUnitIds: ["unt_spreadsheets_01"],
            updatedAt,
          },
        },
        unitEvidences: {
          unt_spreadsheets_01: {
            learningUnitId: "unt_spreadsheets_01",
            courseVersionId: practicalCourseVersionId,
            textOrUrl: "https://example.test/workbook-evidence",
            updatedAt,
          },
        },
        assessmentAttempts: {
          "attempt-v3-rich-0001": {
            id: "attempt-v3-rich-0001",
            assessmentVersionId:
              "asv_spreadsheets_reconciliation_2026_1",
            courseVersionId: practicalCourseVersionId,
            attemptNumber: 1,
            status: "evaluated",
            startedAt: "2026-08-08T06:05:00.000Z",
            submittedAt: "2026-08-08T06:20:00.000Z",
            submissionEvidence: [
              "https://example.test/reconciliation-submission",
            ],
            result: {
              score: 82,
              maximumScore: 100,
              passed: true,
              evaluationMethod: "self",
              feedback: "Reconciled totals and documented the remaining risk.",
              evaluatedAt: "2026-08-08T06:25:00.000Z",
            },
            updatedAt,
          },
        },
        scheduleEntries: {
          "schedule-v3-rich-0001": {
            id: "schedule-v3-rich-0001",
            subject: {
              kind: "learningUnit",
              id: "unt_spreadsheets_02",
            },
            scheduledDate: "2026-08-10",
            startTime: "18:30",
            plannedMinutes: 90,
            position: 1,
            source: "manual",
            status: "planned",
            updatedAt,
          },
        },
        prerequisiteWaivers: {},
      },
    },
  };
}

test("progress reads require ChatGPT identity and offer sign-in only where accounts exist", async () => {
  const app = await worker();
  const response = await app.fetch(
    new Request(
      "http://localhost/api/learner-progress?programVersionId=prv_course_atlas_ee_2026_1&clientImportId=test-device-1234&returnTo=%2Fprograms%2Felectrical-engineering",
      { headers: { accept: "application/json" } },
    ),
    environment,
    context,
  );

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    authenticated: false,
    // This worker has no D1 binding, so there is nothing an account could
    // hold — and the platform sign-in route does not exist either. Offering
    // it here would send visitors to a 404.
    cloudSyncAvailable: false,
  });
});

test("progress writes reject cross-origin requests before processing data", async () => {
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/api/learner-progress", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "https://attacker.example",
      },
      body: "{}",
    }),
    environment,
    context,
  );

  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /cross-origin/i);
});

test("local progress cannot be imported without a signed-in owner", async () => {
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/api/learner-progress/import", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
      },
      body: "{}",
    }),
    environment,
    context,
  );

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("authenticated progress merges once, saves to D1, and reloads across requests", async (t) => {
  const { miniflare, database } = await progressEnvironment();
  t.after(() => miniflare.dispose());
  const programVersionId = "prv_practical_spreadsheets_2026_1";
  const courseVersionId = "crv_practical_spreadsheets_2026_1";
  const clientImportId = "integration-device-20260801";
  const query = new URL("http://localhost/api/learner-progress");
  query.searchParams.set("programVersionId", programVersionId);
  query.searchParams.set("clientImportId", clientImportId);
  query.searchParams.set("returnTo", "/programs/practical-spreadsheets");

  const initial = await miniflare.dispatchFetch(
    query,
    { headers: authenticatedHeaders },
  );
  assert.equal(initial.status, 200);
  const initialPayload = await initial.json();
  assert.equal(initialPayload.authenticated, true);
  assert.deepEqual(initialPayload.progress.courses, {
    [courseVersionId]: { completedUnitIds: [] },
  });
  assert.equal(initialPayload.importReceipt, null);

  const imported = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress/import",
    {
      method: "POST",
      headers: {
        ...authenticatedHeaders,
        origin: "http://localhost",
      },
      body: JSON.stringify({
        schemaVersion: 2,
        storageNamespace: "course-atlas-progress-v2",
        clientImportId,
        disposition: "merged",
        activeProgramVersionId: programVersionId,
        programs: {
          [programVersionId]: {
            courses: {
              [courseVersionId]: {
                completedUnitIds: ["unt_spreadsheets_01"],
              },
            },
          },
        },
      }),
    },
  );
  assert.equal(imported.status, 200);
  const importPayload = await imported.json();
  assert.equal(importPayload.receipt.importedUnitCount, 1);
  assert.equal(importPayload.receipt.disposition, "merged");

  const patched = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress",
    {
      method: "PATCH",
      headers: {
        ...authenticatedHeaders,
        origin: "http://localhost",
      },
      body: JSON.stringify({
        programVersionId,
        clientImportId,
        courseUpdates: [
          {
            courseVersionId,
            completedUnitIds: [
              "unt_spreadsheets_01",
              "unt_spreadsheets_02",
            ],
          },
        ],
      }),
    },
  );
  assert.equal(patched.status, 200);

  const staleLegacySnapshot = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress",
    {
      method: "PATCH",
      headers: {
        ...authenticatedHeaders,
        origin: "http://localhost",
      },
      body: JSON.stringify({
        programVersionId,
        clientImportId,
        courseUpdates: [
          {
            courseVersionId,
            completedUnitIds: ["unt_spreadsheets_01"],
          },
        ],
      }),
    },
  );
  assert.equal(staleLegacySnapshot.status, 200);

  const reloaded = await miniflare.dispatchFetch(
    query,
    { headers: authenticatedHeaders },
  );
  assert.equal(reloaded.status, 200);
  const reloadedPayload = await reloaded.json();
  assert.deepEqual(
    reloadedPayload.progress.courses[courseVersionId].completedUnitIds,
    ["unt_spreadsheets_01", "unt_spreadsheets_02"],
  );
  assert.equal(reloadedPayload.importReceipt.disposition, "merged");

  const account = await database.prepare(
    `SELECT provider, provider_subject
     FROM learner_accounts`,
  ).first();
  assert.deepEqual(account, {
    provider: "openai-sites",
    provider_subject: "acct_course_atlas_test_owner",
  });

  const d1BackedProgram = await miniflare.dispatchFetch(
    "http://localhost/programs/practical-spreadsheets",
    {
      headers: { accept: "text/html" },
    },
  );
  assert.equal(d1BackedProgram.status, 200);
  assert.match(
    await d1BackedProgram.text(),
    /Practical Spreadsheets &amp; Decision Modeling/,
  );
});

test("v3 rich progress imports round-trip and granular mutations are conflict-safe", async (t) => {
  const { miniflare } = await progressEnvironment();
  t.after(() => miniflare.dispose());
  const clientImportId = "integration-v3-rich-20260808";
  const ownerResponse = await miniflare.dispatchFetch(
    progressQuery(clientImportId),
    { headers: authenticatedHeaders },
  );
  const expectedOwnerKey = (await ownerResponse.json()).ownerKey;
  assert.equal(ownerResponse.status, 200);

  const imported = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress/import",
    {
      method: "POST",
      headers: {
        ...authenticatedHeaders,
        origin: "http://localhost",
      },
      body: JSON.stringify(richV3Import(clientImportId, expectedOwnerKey)),
    },
  );
  const importPayload = await imported.json();
  assert.equal(imported.status, 200, JSON.stringify(importPayload));
  assert.equal(importPayload.confirmed, true);
  assert.equal(importPayload.alreadyConfirmed, false);
  assert.equal(importPayload.receipt.clientImportId, clientImportId);
  assert.equal(importPayload.receipt.disposition, "merged");
  assert.equal(importPayload.receipt.importedUnitCount, 1);

  const loaded = await miniflare.dispatchFetch(progressQuery(clientImportId), {
    headers: authenticatedHeaders,
  });
  const loadedPayload = await loaded.json();
  assert.equal(loaded.status, 200, JSON.stringify(loadedPayload));
  assert.equal(loadedPayload.progress.revision, 1);
  assert.deepEqual(loadedPayload.progress.enrollment.preferredStudyDays, [1, 3, 5]);
  assert.equal(loadedPayload.progress.enrollment.paceHoursPerWeek, 20);
  assert.equal(loadedPayload.progress.enrollment.timezone, "Asia/Kolkata");
  assert.equal(loadedPayload.progress.enrollment.status, "enrolled");
  assert.deepEqual(
    loadedPayload.progress.requirementSelections[practicalRequirementGroupId],
    [practicalCourseVersionId],
  );
  assert.deepEqual(
    loadedPayload.progress.courses[practicalCourseVersionId].completedUnitIds,
    ["unt_spreadsheets_01"],
  );
  assert.equal(
    loadedPayload.progress.unitEvidences.unt_spreadsheets_01.textOrUrl,
    "https://example.test/workbook-evidence",
  );
  assert.deepEqual(
    loadedPayload.progress.assessmentAttempts["attempt-v3-rich-0001"].result,
    {
      score: 82,
      maximumScore: 100,
      passed: true,
      evaluationMethod: "self",
      feedback: "Reconciled totals and documented the remaining risk.",
      evaluatedAt: "2026-08-08T06:25:00.000Z",
    },
  );
  assert.deepEqual(
    loadedPayload.progress.scheduleEntries["schedule-v3-rich-0001"].subject,
    { kind: "learningUnit", id: "unt_spreadsheets_02" },
  );
  assert.equal(
    loadedPayload.progress.scheduleEntries["schedule-v3-rich-0001"].startTime,
    "18:30",
  );
  assert.ok(
    loadedPayload.progress.history.some(
      (entry) => entry.eventType === "local-progress-imported",
    ),
  );

  const mutation = {
    schemaVersion: 3,
    programVersionId: practicalProgramVersionId,
    clientImportId,
    deviceId: "device-v3-rich-20260808",
    clientMutationId: "mutation-v3-unit-0001",
    baseRevision: loadedPayload.progress.revision,
    operations: [
      {
        type: "set-unit-completion",
        courseVersionId: practicalCourseVersionId,
        learningUnitId: "unt_spreadsheets_02",
        completed: true,
      },
    ],
  };
  const mutationResponse = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress",
    {
      method: "PATCH",
      headers: {
        ...authenticatedHeaders,
        origin: "http://localhost",
      },
      body: JSON.stringify(mutation),
    },
  );
  const mutationPayload = await mutationResponse.json();
  assert.equal(
    mutationResponse.status,
    200,
    JSON.stringify(mutationPayload),
  );
  assert.equal(
    mutationPayload.acknowledgedMutationId,
    mutation.clientMutationId,
  );
  assert.equal(mutationPayload.progress.revision, 2);
  assert.deepEqual(
    mutationPayload.progress.courses[practicalCourseVersionId].completedUnitIds,
    ["unt_spreadsheets_01", "unt_spreadsheets_02"],
  );

  const replayed = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress",
    {
      method: "PATCH",
      headers: {
        ...authenticatedHeaders,
        origin: "http://localhost",
      },
      body: JSON.stringify(mutation),
    },
  );
  const replayedPayload = await replayed.json();
  assert.equal(replayed.status, 200, JSON.stringify(replayedPayload));
  assert.equal(replayedPayload.progress.revision, 2);
  assert.equal(
    replayedPayload.acknowledgedMutationId,
    mutation.clientMutationId,
  );

  const reusedId = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress",
    {
      method: "PATCH",
      headers: {
        ...authenticatedHeaders,
        origin: "http://localhost",
      },
      body: JSON.stringify({
        ...mutation,
        operations: [
          {
            type: "set-unit-completion",
            courseVersionId: practicalCourseVersionId,
            learningUnitId: "unt_spreadsheets_03",
            completed: true,
          },
        ],
      }),
    },
  );
  assert.equal(reusedId.status, 409);
  assert.match((await reusedId.json()).error, /mutation ID/i);

  const staleRevision = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress",
    {
      method: "PATCH",
      headers: {
        ...authenticatedHeaders,
        origin: "http://localhost",
      },
      body: JSON.stringify({
        ...mutation,
        clientMutationId: "mutation-v3-stale-0001",
        operations: [
          {
            type: "set-unit-completion",
            courseVersionId: practicalCourseVersionId,
            learningUnitId: "unt_spreadsheets_03",
            completed: true,
          },
        ],
      }),
    },
  );
  const conflictPayload = await staleRevision.json();
  assert.equal(staleRevision.status, 409, JSON.stringify(conflictPayload));
  assert.equal(conflictPayload.conflict, true);
  assert.equal(conflictPayload.reason, "revision");
  assert.equal(conflictPayload.progress.revision, 2);

  const reloaded = await miniflare.dispatchFetch(progressQuery(clientImportId), {
    headers: authenticatedHeaders,
  });
  assert.equal(reloaded.status, 200);
  assert.deepEqual(
    (await reloaded.json()).progress.courses[practicalCourseVersionId]
      .completedUnitIds,
    ["unt_spreadsheets_01", "unt_spreadsheets_02"],
  );
});

test("v3 import rejects unsafe input and cloud-only consent persists no local records", async (t) => {
  const { miniflare, database } = await progressEnvironment();
  t.after(() => miniflare.dispose());
  const ownerResponse = await miniflare.dispatchFetch(
    progressQuery("integration-v3-owner-preflight"),
    { headers: authenticatedHeaders },
  );
  const expectedOwnerKey = (await ownerResponse.json()).ownerKey;
  assert.equal(ownerResponse.status, 200);

  const unknownField = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress/import",
    {
      method: "POST",
      headers: {
        ...authenticatedHeaders,
        origin: "http://localhost",
      },
      body: JSON.stringify({
        schemaVersion: 3,
        storageNamespace: "course-atlas-progress-v3",
        clientImportId: "integration-v3-unknown-field",
        deviceId: "device-v3-validation-0001",
        expectedOwnerKey,
        disposition: "cloud",
        activeProgramVersionId: practicalProgramVersionId,
        programs: {},
        unexpected: true,
      }),
    },
  );
  assert.equal(unknownField.status, 400);
  assert.match((await unknownField.json()).error, /unsupported field/i);

  const unknownOriginImport = richV3Import(
    "integration-v3-unknown-origin",
    expectedOwnerKey,
  );
  unknownOriginImport.programs[
    practicalProgramVersionId
  ].scheduleEntries["schedule-v3-rich-0001"].originEntryId =
    "schedule-v3-missing-origin";
  const unknownOrigin = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress/import",
    {
      method: "POST",
      headers: {
        ...authenticatedHeaders,
        origin: "http://localhost",
      },
      body: JSON.stringify(unknownOriginImport),
    },
  );
  assert.equal(unknownOrigin.status, 400);

  const crossOrigin = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress/import",
    {
      method: "POST",
      headers: {
        ...authenticatedHeaders,
        origin: "https://attacker.example",
      },
      body: JSON.stringify({
        schemaVersion: 3,
        storageNamespace: "course-atlas-progress-v3",
        clientImportId: "integration-v3-cross-origin",
        deviceId: "device-v3-validation-0001",
        expectedOwnerKey,
        disposition: "cloud",
        activeProgramVersionId: practicalProgramVersionId,
        programs: {},
      }),
    },
  );
  assert.equal(crossOrigin.status, 403);
  assert.match((await crossOrigin.json()).error, /cross-origin/i);

  const cloudWithLocalRecords = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress/import",
    {
      method: "POST",
      headers: {
        ...authenticatedHeaders,
        origin: "http://localhost",
      },
      body: JSON.stringify({
        schemaVersion: 3,
        storageNamespace: "course-atlas-progress-v3",
        clientImportId: "integration-v3-cloud-with-data",
        deviceId: "device-v3-validation-0001",
        expectedOwnerKey,
        disposition: "cloud",
        activeProgramVersionId: practicalProgramVersionId,
        programs: { [practicalProgramVersionId]: {} },
      }),
    },
  );
  assert.equal(cloudWithLocalRecords.status, 400);
  assert.match((await cloudWithLocalRecords.json()).error, /must not transmit/i);

  const cloudClientImportId = "integration-v3-cloud-only";
  const cloudOnly = await miniflare.dispatchFetch(
    "http://localhost/api/learner-progress/import",
    {
      method: "POST",
      headers: {
        ...authenticatedHeaders,
        origin: "http://localhost",
      },
      body: JSON.stringify({
        schemaVersion: 3,
        storageNamespace: "course-atlas-progress-v3",
        clientImportId: cloudClientImportId,
        deviceId: "device-v3-validation-0001",
        expectedOwnerKey,
        disposition: "cloud",
        activeProgramVersionId: practicalProgramVersionId,
        programs: {},
      }),
    },
  );
  const cloudPayload = await cloudOnly.json();
  assert.equal(cloudOnly.status, 200, JSON.stringify(cloudPayload));
  assert.equal(cloudPayload.receipt.disposition, "cloud");
  assert.equal(cloudPayload.receipt.importedUnitCount, 0);

  const cloudReloaded = await miniflare.dispatchFetch(
    progressQuery(cloudClientImportId),
    { headers: authenticatedHeaders },
  );
  const cloudReloadedPayload = await cloudReloaded.json();
  assert.equal(cloudReloaded.status, 200, JSON.stringify(cloudReloadedPayload));
  assert.equal(cloudReloadedPayload.progress.revision, 0);
  assert.equal(cloudReloadedPayload.progress.enrollment, null);
  assert.deepEqual(cloudReloadedPayload.progress.unitEvidences, {});
  assert.deepEqual(cloudReloadedPayload.progress.assessmentAttempts, {});
  assert.deepEqual(cloudReloadedPayload.progress.scheduleEntries, {});
  assert.equal(cloudReloadedPayload.importReceipt.disposition, "cloud");

  const learnerStateCount = await database
    .prepare("SELECT COUNT(*) AS count FROM learner_program_states")
    .first();
  assert.equal(Number(learnerStateCount.count), 0);
});
