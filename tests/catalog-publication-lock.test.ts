import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalJson,
  sha256Hex,
} from "../app/catalog/canonical-json";
import { collectStaticCatalogBundles } from "../app/catalog/d1-repository";
import { catalogRepository } from "../content/catalog";
import {
  catalogPublicationLock,
  type CatalogPublicationLockRecord,
} from "../content/manifests/catalog-publication-lock";

test("checked-in publications match the append-only publication lock", async () => {
  const bundles = collectStaticCatalogBundles(catalogRepository);
  const lockByBundleId = new Map<string, CatalogPublicationLockRecord>(
    catalogPublicationLock.map((record) => [record.bundleId, record]),
  );

  assert.equal(
    lockByBundleId.size,
    catalogPublicationLock.length,
    "The publication lock must not contain duplicate bundle IDs.",
  );
  assert.deepEqual(
    [...bundles.map((bundle) => bundle.id)].sort(),
    [...lockByBundleId.keys()].sort(),
    "Every registered historical publication must have exactly one lock record.",
  );

  for (const bundle of bundles) {
    const record = lockByBundleId.get(bundle.id);
    assert.ok(record, `Missing publication lock for ${bundle.id}.`);

    const canonicalPayload = canonicalJson(bundle);
    assert.deepEqual(
      {
        bundleId: bundle.id,
        programId: bundle.program.id,
        programVersionId: bundle.programVersion.id,
        version: bundle.programVersion.version,
        publishedAt: bundle.publishedAt,
        canonicalBytes: new TextEncoder().encode(canonicalPayload).byteLength,
        canonicalSha256: await sha256Hex(canonicalPayload),
      },
      record,
      `Publication ${bundle.id} changed after release. Publish a new version instead.`,
    );
  }
});
