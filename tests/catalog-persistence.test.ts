import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Miniflare } from "miniflare";
import { canonicalJson } from "../app/catalog/canonical-json";
import { compareCatalogBundleShadows } from "../app/catalog/catalog-shadow";
import type { D1DatabaseLike } from "../app/catalog/d1-contract";
import {
  CatalogDataError,
  CatalogSeedConflictError,
  D1CatalogRepository,
  seedPublishedProgramBundles,
} from "../app/catalog/d1-repository";
import {
  D1LearnerProgressRepository,
  LearnerProgressValidationError,
  ProgressImportConflictError,
} from "../app/catalog/learner-progress-repository";
import { createRuntimeCatalogRepository } from "../app/catalog/runtime-repository";
import { StaticCatalogRepository } from "../app/catalog/static-repository";
import type {
  CourseVersionId,
  LearningUnitId,
  PublishedProgramBundle,
} from "../app/domain/catalog";
import { practicalSpreadsheetsProgram } from "../content/programs/practical-spreadsheets";
import { electricalEngineeringProgram } from "../content/programs/electrical-engineering";

const migrationUrls = [
  new URL("../drizzle/0000_supreme_bloodscream.sql", import.meta.url),
  new URL("../drizzle/0001_big_infant_terrible.sql", import.meta.url),
];

async function createTestDatabase() {
  const miniflare = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('ok'); } }",
    d1Databases: ["DB"],
  });
  const database = (await miniflare.getD1Database(
    "DB",
  )) as unknown as D1DatabaseLike;

  for (const migrationUrl of migrationUrls) {
    const migration = await readFile(migrationUrl, "utf8");
    const statements = migration
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);
    for (const statement of statements) {
      const result = await database.prepare(statement).run();
      assert.notEqual(
        result.success,
        false,
        `Migration failed: ${result.error ?? statement}`,
      );
    }
  }
  await database.prepare("PRAGMA foreign_keys = ON").run();
  return { database, miniflare };
}

test("D1 seed is idempotent and reconstructs a complete validated bundle", async (t) => {
  const { database, miniflare } = await createTestDatabase();
  t.after(() => miniflare.dispose());

  const first = await seedPublishedProgramBundles(database, [
    practicalSpreadsheetsProgram,
  ]);
  assert.deepEqual(first, {
    inserted: 1,
    unchanged: 0,
    bundleIds: [practicalSpreadsheetsProgram.id],
  });
  const second = await seedPublishedProgramBundles(database, [
    practicalSpreadsheetsProgram,
  ]);
  assert.deepEqual(second, {
    inserted: 0,
    unchanged: 1,
    bundleIds: [practicalSpreadsheetsProgram.id],
  });

  const repository = new D1CatalogRepository(database);
  const reconstructed = await repository.loadBySlug(
    practicalSpreadsheetsProgram.program.canonicalSlug,
  );
  assert.deepEqual(reconstructed, practicalSpreadsheetsProgram);
  assert.deepEqual(await repository.listVersions("practical-spreadsheets"), [
    practicalSpreadsheetsProgram.programVersion.version,
  ]);
  assert.equal((await repository.listPrograms())[0].learningUnitCount, 8);

  const count = await database
    .prepare("SELECT COUNT(*) AS count FROM catalog_bundles")
    .first<{ count: number }>();
  assert.equal(count?.count, 1);
});

test("changed content cannot reuse an immutable publication identity", async (t) => {
  const { database, miniflare } = await createTestDatabase();
  t.after(() => miniflare.dispose());
  await seedPublishedProgramBundles(database, [practicalSpreadsheetsProgram]);

  const changed = structuredClone(
    practicalSpreadsheetsProgram,
  ) as PublishedProgramBundle;
  (changed.programVersion as { title: string }).title =
    "Changed after publication";

  await assert.rejects(
    seedPublishedProgramBundles(database, [changed]),
    (error: unknown) =>
      error instanceof CatalogSeedConflictError &&
      error.differences.some(
        (difference) =>
          difference.includes("payload_hash") ||
          difference.includes("payload_json"),
      ),
  );
});

test("a conflicting concurrent seed cannot append chunks to the winner", async (t) => {
  const { database, miniflare } = await createTestDatabase();
  t.after(() => miniflare.dispose());
  const losingBundle = structuredClone(
    practicalSpreadsheetsProgram,
  ) as PublishedProgramBundle;
  (
    losingBundle.programVersion as {
      changelog?: string;
    }
  ).changelog = "conflicting publication ".repeat(20_000);
  let batchNumber = 0;
  const racingDatabase: D1DatabaseLike = {
    prepare(query) {
      return database.prepare(query);
    },
    async batch(statements) {
      const result = await database.batch(statements);
      if (batchNumber === 0) {
        await seedPublishedProgramBundles(database, [
          practicalSpreadsheetsProgram,
        ]);
      }
      batchNumber += 1;
      return result;
    },
  };

  await assert.rejects(
    seedPublishedProgramBundles(racingDatabase, [losingBundle]),
    CatalogSeedConflictError,
  );
  const reconstructed = await new D1CatalogRepository(
    database,
  ).loadBySlug("practical-spreadsheets");
  assert.deepEqual(reconstructed, practicalSpreadsheetsProgram);
  const chunks = await database
    .prepare(
      `SELECT COUNT(*) AS count
       FROM catalog_bundle_payload_chunks
       WHERE bundle_id = ?`,
    )
    .bind(practicalSpreadsheetsProgram.id)
    .first<{ count: number }>();
  assert.equal(chunks?.count, 1);
});

test("large degree bundles are reconstructed from bounded UTF-8 chunks", async (t) => {
  const { database, miniflare } = await createTestDatabase();
  t.after(() => miniflare.dispose());
  await seedPublishedProgramBundles(database, [electricalEngineeringProgram]);

  const chunkCount = await database
    .prepare(
      `SELECT COUNT(*) AS count
       FROM catalog_bundle_payload_chunks
       WHERE bundle_id = ?`,
    )
    .bind(electricalEngineeringProgram.id)
    .first<{ count: number }>();
  assert.ok((chunkCount?.count ?? 0) > 1);

  const reconstructed = await new D1CatalogRepository(
    database,
  ).loadByProgramId(electricalEngineeringProgram.program.id);
  assert.ok(reconstructed);
  assert.equal(
    canonicalJson(reconstructed),
    canonicalJson(electricalEngineeringProgram),
  );
  assert.equal(reconstructed.learningUnits.length, 592);
});

test("shadow comparison reports exact field paths and missing publications", () => {
  const changed = structuredClone(
    practicalSpreadsheetsProgram,
  ) as PublishedProgramBundle;
  (changed.resourceVersions[0] as { title: string }).title =
    "Unexpected D1 title";

  const changedReport = compareCatalogBundleShadows(
    [practicalSpreadsheetsProgram],
    [changed],
  );
  assert.equal(changedReport.matches, false);
  assert.ok(
    changedReport.mismatches.some(
      (mismatch) =>
        mismatch.path === "$.resourceVersions[0].title" &&
        mismatch.staticValue?.includes(
          practicalSpreadsheetsProgram.resourceVersions[0].title,
        ) &&
        mismatch.d1Value?.includes("Unexpected D1 title"),
    ),
  );

  const missingReport = compareCatalogBundleShadows(
    [practicalSpreadsheetsProgram],
    [],
  );
  assert.deepEqual(
    missingReport.mismatches.map((mismatch) => mismatch.kind),
    ["missing_in_d1"],
  );
});

test("runtime catalog falls back only when the D1 binding is absent", async (t) => {
  const staticRepository = new StaticCatalogRepository([
    practicalSpreadsheetsProgram,
  ]);
  const fallback = await createRuntimeCatalogRepository({
    database: null,
    staticRepository,
  });
  assert.equal(
    (await fallback.loadBySlug("practical-spreadsheets"))?.id,
    practicalSpreadsheetsProgram.id,
  );

  const { database, miniflare } = await createTestDatabase();
  t.after(() => miniflare.dispose());
  await seedPublishedProgramBundles(database, [practicalSpreadsheetsProgram]);
  await database
    .prepare(
      `UPDATE catalog_bundle_payload_chunks
       SET payload_chunk = ?
       WHERE bundle_id = ? AND chunk_index = 0`,
    )
    .bind('{"corrupt":true}', practicalSpreadsheetsProgram.id)
    .run();

  await assert.rejects(
    createRuntimeCatalogRepository({
      database,
      staticRepository,
    }),
    CatalogDataError,
  );
});

test("runtime shadow keeps older D1 publications for pinned learner progress", async (t) => {
  const { database, miniflare } = await createTestDatabase();
  t.after(() => miniflare.dispose());
  const currentProgramVersionId =
    practicalSpreadsheetsProgram.programVersion.id;
  const historicalProgramVersionId =
    "prv_practical_spreadsheets_2025_1";
  const historical = JSON.parse(
    canonicalJson(practicalSpreadsheetsProgram).replaceAll(
      currentProgramVersionId,
      historicalProgramVersionId,
    ),
  ) as PublishedProgramBundle;
  (historical as { id: string }).id =
    "bnd_practical_spreadsheets_2025_1";
  (
    historical.programVersion as {
      version: string;
      publishedAt: string;
    }
  ).version = "0.9.0";
  (
    historical.programVersion as {
      version: string;
      publishedAt: string;
    }
  ).publishedAt = "2025-07-01T00:00:00Z";
  (historical as { publishedAt: string }).publishedAt =
    "2025-07-01T00:00:00Z";
  await seedPublishedProgramBundles(database, [historical]);

  const repository = await createRuntimeCatalogRepository({
    database,
    staticRepository: new StaticCatalogRepository([
      practicalSpreadsheetsProgram,
    ]),
  });
  assert.deepEqual(await repository.listVersions("practical-spreadsheets"), [
    "1.0.0",
    "0.9.0",
  ]);
});

test("learner progress is version-pinned, validated, and idempotent", async (t) => {
  const { database, miniflare } = await createTestDatabase();
  t.after(() => miniflare.dispose());
  await seedPublishedProgramBundles(database, [practicalSpreadsheetsProgram]);
  const progress = new D1LearnerProgressRepository(database);
  const learner = await progress.resolveLearner({
    provider: "chatgpt",
    subject: "student@example.com",
    email: "STUDENT@example.com",
    displayName: "Student",
  });
  const sameLearner = await progress.resolveLearner({
    provider: "chatgpt",
    subject: "student@example.com",
    email: "student@example.com",
  });
  assert.equal(sameLearner.learnerId, learner.learnerId);

  const programVersionId =
    practicalSpreadsheetsProgram.programVersion.id;
  const courseVersionId =
    practicalSpreadsheetsProgram.courseVersions[0].id;
  const [firstUnit, secondUnit] =
    practicalSpreadsheetsProgram.learningUnits;

  await progress.setUnitCompletion(
    learner.learnerId,
    programVersionId,
    courseVersionId,
    firstUnit.id,
    true,
  );
  await progress.setUnitCompletion(
    learner.learnerId,
    programVersionId,
    courseVersionId,
    firstUnit.id,
    true,
  );
  let snapshot = await progress.loadProgress(
    learner.learnerId,
    programVersionId,
  );
  assert.deepEqual(snapshot.courses[courseVersionId].completedUnitIds, [
    firstUnit.id,
  ]);

  await progress.replaceCourseCompletions(
    learner.learnerId,
    programVersionId,
    courseVersionId,
    [secondUnit.id, firstUnit.id, secondUnit.id],
  );
  snapshot = await progress.loadProgress(
    learner.learnerId,
    programVersionId,
  );
  assert.deepEqual(snapshot.courses[courseVersionId].completedUnitIds, [
    firstUnit.id,
    secondUnit.id,
  ]);

  await progress.setUnitCompletion(
    learner.learnerId,
    programVersionId,
    courseVersionId,
    firstUnit.id,
    false,
  );
  snapshot = await progress.loadProgress(
    learner.learnerId,
    programVersionId,
  );
  assert.deepEqual(snapshot.courses[courseVersionId].completedUnitIds, [
    secondUnit.id,
  ]);

  await assert.rejects(
    progress.setUnitCompletion(
      learner.learnerId,
      programVersionId,
      courseVersionId,
      "unt_not_in_bundle" as LearningUnitId,
      true,
    ),
    LearnerProgressValidationError,
  );

  const otherLearner = await progress.resolveLearner({
    provider: "chatgpt",
    subject: "other-student@example.com",
  });
  const otherSnapshot = await progress.loadProgress(
    otherLearner.learnerId,
    programVersionId,
  );
  assert.deepEqual(
    otherSnapshot.courses[courseVersionId].completedUnitIds,
    [],
  );
  await progress.setUnitCompletion(
    otherLearner.learnerId,
    programVersionId,
    courseVersionId,
    firstUnit.id,
    true,
  );
  assert.deepEqual(
    (
      await progress.loadProgress(learner.learnerId, programVersionId)
    ).courses[courseVersionId].completedUnitIds,
    [secondUnit.id],
  );
});

test("local progress import records consent and prevents conflicting retries", async (t) => {
  const { database, miniflare } = await createTestDatabase();
  t.after(() => miniflare.dispose());
  await seedPublishedProgramBundles(database, [practicalSpreadsheetsProgram]);
  const progress = new D1LearnerProgressRepository(database);
  const learner = await progress.resolveLearner({
    provider: "chatgpt",
    subject: "importer@example.com",
  });
  const programVersionId =
    practicalSpreadsheetsProgram.programVersion.id;
  const courseVersionId =
    practicalSpreadsheetsProgram.courseVersions[0].id;
  const unitIds = practicalSpreadsheetsProgram.learningUnits
    .slice(0, 2)
    .map((unit) => unit.id);
  const input = {
    learnerId: learner.learnerId,
    clientImportId: "local-v2-2026-07-29",
    storageNamespace: "course-atlas-progress-v2",
    disposition: "merged" as const,
    programs: [
      {
        programVersionId,
        courses: [{ courseVersionId, completedUnitIds: unitIds }],
      },
    ],
  };

  const receipt = await progress.importLocalProgress(input);
  assert.equal(receipt.importedUnitCount, 2);
  assert.deepEqual(await progress.importLocalProgress(input), receipt);
  assert.deepEqual(
    (
      await progress.loadProgress(learner.learnerId, programVersionId)
    ).courses[courseVersionId].completedUnitIds,
    unitIds,
  );

  await assert.rejects(
    progress.importLocalProgress({
      ...input,
      programs: [
        {
          programVersionId,
          courses: [
            {
              courseVersionId,
              completedUnitIds: [
                ...unitIds,
                practicalSpreadsheetsProgram.learningUnits[2].id,
              ],
            },
          ],
        },
      ],
    }),
    ProgressImportConflictError,
  );

  const cloudReceipt = await progress.importLocalProgress({
    learnerId: learner.learnerId,
    clientImportId: "keep-cloud",
    storageNamespace: "course-atlas-progress-v2",
    disposition: "cloud",
    programs: [
      {
        programVersionId,
        courses: [
          {
            courseVersionId:
              "crv_stale_local_course" as CourseVersionId,
            completedUnitIds: [
              "unt_stale_local_unit" as LearningUnitId,
            ],
          },
        ],
      },
    ],
  });
  assert.equal(cloudReceipt.importedUnitCount, 0);
  assert.equal(cloudReceipt.disposition, "cloud");
});
