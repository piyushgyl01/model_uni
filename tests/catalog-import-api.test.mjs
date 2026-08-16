import assert from "node:assert/strict";
import test from "node:test";
import { Miniflare } from "miniflare";
import {
  CatalogResourceUrlConflictError,
  catalogImportSuccessResponse,
  importPublishedCatalogBundles,
  readCatalogImportBundles,
} from "../app/catalog/catalog-import.ts";
import { D1CatalogRepository } from "../app/catalog/d1-repository.ts";
import { createRuntimeCatalogRepository } from "../app/catalog/runtime-repository.ts";
import { catalogRepository } from "../content/catalog.ts";
import { practicalSpreadsheetsProgram } from "./fixtures/practical-spreadsheets.ts";

const ownerId = "acct_course_atlas_catalog_publisher";
const authenticatedHeaders = {
  accept: "application/json",
  "content-type": "application/json",
  "oai-authenticated-user-id": ownerId,
  "oai-authenticated-user-email": "publisher@example.test",
};
const baseEnvironment = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};
const context = {
  waitUntil() {},
  passThroughOnException() {},
};
const catalogId = /^(?:bnd|prg|prv|req|opt|con|crs|crv|unt|asm|asv|cmp|cpm|res|rsv|acc|rgt|frs|prvdc|cal|per|mil|sch|plc)_[A-Za-z0-9_-]+$/;

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("catalog-import-test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

function makeImportedBundle(suffix, slug) {
  const bundle = JSON.parse(
    JSON.stringify(practicalSpreadsheetsProgram, (_key, value) =>
      typeof value === "string" && catalogId.test(value)
        ? `${value}_${suffix}`
        : value,
    ),
  );
  bundle.program.canonicalSlug = slug;
  bundle.program.title = `Imported program ${suffix}`;
  bundle.programVersion.title = `Imported program ${suffix}`;
  bundle.resourceVersions.forEach((resourceVersion, index) => {
    resourceVersion.canonicalUrl =
      `https://catalog-import-${suffix}.example.test/resource/${index + 1}`;
  });
  return bundle;
}

function importRequest(body, headers = authenticatedHeaders) {
  return new Request("http://localhost/api/catalog/import", {
    method: "POST",
    headers: { ...headers, origin: "http://localhost" },
    body: JSON.stringify(body),
  });
}

test("publisher-gated catalog imports are durable, idempotent, and immediately visible", async (t) => {
  const previousPublisherIds = process.env.CATALOG_PUBLISHER_IDS;
  delete process.env.CATALOG_PUBLISHER_IDS;
  t.after(() => {
    if (previousPublisherIds === undefined) {
      delete process.env.CATALOG_PUBLISHER_IDS;
    } else {
      process.env.CATALOG_PUBLISHER_IDS = previousPublisherIds;
    }
  });
  const app = await worker();
  const configuredEnvironment = {
    ...baseEnvironment,
    CATALOG_PUBLISHER_IDS: `another_owner, ${ownerId}`,
  };

  const crossOrigin = await app.fetch(
    new Request("http://localhost/api/catalog/import", {
      method: "POST",
      headers: {
        ...authenticatedHeaders,
        origin: "https://attacker.example",
      },
      body: "{}",
    }),
    configuredEnvironment,
    context,
  );
  assert.equal(crossOrigin.status, 403);
  assert.match((await crossOrigin.json()).error, /cross-origin/i);

  const unauthenticated = await app.fetch(
    importRequest({}, {
      accept: "application/json",
      "content-type": "application/json",
    }),
    configuredEnvironment,
    context,
  );
  assert.equal(unauthenticated.status, 401);
  assert.equal(unauthenticated.headers.get("cache-control"), "no-store");

  const unconfigured = await app.fetch(
    importRequest({}),
    baseEnvironment,
    context,
  );
  assert.equal(unconfigured.status, 403);

  const unauthorized = await app.fetch(
    importRequest({}),
    {
      ...baseEnvironment,
      CATALOG_PUBLISHER_IDS: "some_other_account",
    },
    context,
  );
  assert.equal(unauthorized.status, 403);

  process.env.CATALOG_PUBLISHER_IDS = `another_owner, ${ownerId}`;

  const authorized = await app.fetch(
    importRequest({}),
    configuredEnvironment,
    context,
  );
  assert.equal(authorized.status, 400);

  const miniflare = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('ok'); } }",
    d1Databases: ["DB"],
  });
  t.after(() => miniflare.dispose());
  const database = await miniflare.getD1Database("DB");
  const storage = {
    database,
    initialize: () =>
      createRuntimeCatalogRepository({
        database,
        staticRepository: catalogRepository,
      }),
  };

  const importedBundle = makeImportedBundle(
    "d1_only",
    "imported-practical-spreadsheets",
  );
  const [parsedImportedBundle] = await readCatalogImportBundles(
    importRequest(importedBundle),
  );
  const imported = catalogImportSuccessResponse(
    await importPublishedCatalogBundles([parsedImportedBundle], storage),
  );
  const importedPayload = await imported.json();
  assert.equal(imported.status, 201, JSON.stringify(importedPayload));
  assert.equal(imported.headers.get("cache-control"), "no-store");
  assert.deepEqual(importedPayload, {
    inserted: 1,
    unchanged: 0,
    insertedBundleIds: [importedBundle.id],
    unchangedBundleIds: [],
  });

  const repeated = catalogImportSuccessResponse(
    await importPublishedCatalogBundles([importedBundle], storage),
  );
  const repeatedPayload = await repeated.json();
  assert.equal(repeated.status, 200, JSON.stringify(repeatedPayload));
  assert.deepEqual(repeatedPayload, {
    inserted: 0,
    unchanged: 1,
    insertedBundleIds: [],
    unchangedBundleIds: [importedBundle.id],
  });

  const stored = await database
    .prepare("SELECT COUNT(*) AS count FROM catalog_bundles WHERE id = ?")
    .bind(importedBundle.id)
    .first();
  assert.equal(stored.count, 1);

  const repository = new D1CatalogRepository(database);
  const visible = await repository.loadBySlug(
    "imported-practical-spreadsheets",
  );
  assert.equal(visible.programVersion.title, "Imported program d1_only");
  assert.ok(
    (await repository.listPrograms()).some(
      (program) => program.slug === "imported-practical-spreadsheets",
    ),
  );

  // This publication is no longer checked in, so importing it is a genuine
  // insert; importing it a second time must still be a no-op.
  const firstImport = await importPublishedCatalogBundles(
    [practicalSpreadsheetsProgram],
    storage,
  );
  assert.deepEqual(firstImport, {
    insertedBundleIds: [practicalSpreadsheetsProgram.id],
    unchangedBundleIds: [],
  });
  const checkedInReimport = await importPublishedCatalogBundles(
    [practicalSpreadsheetsProgram],
    storage,
  );
  assert.deepEqual(checkedInReimport, {
    insertedBundleIds: [],
    unchangedBundleIds: [practicalSpreadsheetsProgram.id],
  });

  const duplicateResource = makeImportedBundle(
    "duplicate_resource",
    "duplicate-resource-program",
  );
  duplicateResource.resourceVersions[0].canonicalUrl =
    practicalSpreadsheetsProgram.resourceVersions[0].canonicalUrl;
  await assert.rejects(
    importPublishedCatalogBundles([duplicateResource], storage),
    (error) =>
      error instanceof CatalogResourceUrlConflictError &&
      error.conflicts.some(
        (conflict) =>
          conflict.publishedResourceVersionId ===
            practicalSpreadsheetsProgram.resourceVersions[0].id &&
          conflict.incomingResourceVersionId ===
            duplicateResource.resourceVersions[0].id,
      ),
  );
});
