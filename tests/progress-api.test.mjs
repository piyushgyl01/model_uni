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

test("progress reads require ChatGPT identity and return a safe sign-in route", async () => {
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
    signInPath:
      "/signin-with-chatgpt?return_to=%2Fprograms%2Felectrical-engineering",
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
