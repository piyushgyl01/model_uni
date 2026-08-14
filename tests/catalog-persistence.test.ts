import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { Miniflare } from "miniflare";
import { canonicalJson } from "../app/catalog/canonical-json";
import { compareCatalogBundleShadows } from "../app/catalog/catalog-shadow";
import {
  d1All,
  d1Batch,
  type D1DatabaseLike,
} from "../app/catalog/d1-contract";
import { initializeCatalogRuntimeSchema } from "../app/catalog/d1-runtime-schema";
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
import {
  catalogProgramSupersessions,
  catalogRepository,
} from "../content/catalog";
import { catalogPublicationLock } from "../content/manifests/catalog-publication-lock";
import { practicalSpreadsheetsProgram } from "../content/programs/practical-spreadsheets";
import { electricalEngineeringProgram } from "../content/programs/electrical-engineering";
import { computerScienceBundle } from "../content/programs/computer-science-v1-1";
import { computerScienceBundleV12 } from "../content/programs/computer-science-v1-2";
import { mechanicalEngineeringBundle } from "../content/programs/mechanical-engineering";
import { physicsBundle } from "../content/programs/physics";
import { mathematicsBundle } from "../content/programs/mathematics";

const migrationDirectoryUrl = new URL("../drizzle/", import.meta.url);
let migrationUrlsPromise: Promise<readonly URL[]> | undefined;

function loadMigrationUrls() {
  migrationUrlsPromise ??= readdir(migrationDirectoryUrl).then((files) => {
    const migrationFiles = files
      .filter((file) => /^\d{4}_.+\.sql$/.test(file))
      .sort();
    assert.ok(migrationFiles.length > 0, "No Drizzle migrations were found.");
    return migrationFiles.map(
      (file) => new URL(file, migrationDirectoryUrl),
    );
  });
  return migrationUrlsPromise;
}

function migrationFileName(url: URL) {
  return decodeURIComponent(url.pathname.split("/").at(-1) ?? "");
}

const phase3RuntimeTables = [
  "learner_program_states",
  "learner_requirement_selections",
  "learner_unit_states",
  "learner_unit_evidence",
  "learner_assessment_attempts",
  "learner_schedule_entries",
  "learner_prerequisite_waivers",
  "learner_progress_mutations",
  "learner_progress_events",
] as const;

const phase7ReadModelTables = [
  "catalog_projection_state",
  "catalog_program_summaries",
  "catalog_course_search_rows",
  "catalog_course_search_terms",
  "learner_pathway_snapshots",
  "learner_pathway_course_rows",
  "learner_term_schedule_rows",
  "learner_today_assignment_rows",
  "learner_transcript_rows",
] as const;

const runtimeShapeTables = [
  ...phase3RuntimeTables,
  ...phase7ReadModelTables,
] as const;

interface TableInfoRow {
  readonly cid: number;
  readonly name: string;
  readonly type: string;
  readonly notnull: number;
  readonly dflt_value: string | null;
  readonly pk: number;
}

interface ForeignKeyInfoRow {
  readonly id: number;
  readonly seq: number;
  readonly table: string;
  readonly from: string;
  readonly to: string;
  readonly on_update: string;
  readonly on_delete: string;
  readonly match: string;
}

interface IndexListRow {
  readonly name: string;
  readonly unique: number;
  readonly origin: string;
  readonly partial: number;
}

interface IndexInfoRow {
  readonly seqno: number;
  readonly name: string | null;
}

function pragmaIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function readRuntimeTableShape(
  database: D1DatabaseLike,
  tableName: (typeof runtimeShapeTables)[number],
) {
  const columns = await d1All<TableInfoRow>(
    database.prepare(`PRAGMA table_info(${pragmaIdentifier(tableName)})`),
    `inspect ${tableName} columns`,
  );
  const foreignKeyRows = await d1All<ForeignKeyInfoRow>(
    database.prepare(
      `PRAGMA foreign_key_list(${pragmaIdentifier(tableName)})`,
    ),
    `inspect ${tableName} foreign keys`,
  );
  const foreignKeyGroups = new Map<
    number,
    {
      table: string;
      onUpdate: string;
      onDelete: string;
      match: string;
      columns: Array<{ from: string; to: string }>;
    }
  >();
  for (const row of foreignKeyRows) {
    const group = foreignKeyGroups.get(row.id) ?? {
      table: row.table,
      onUpdate: row.on_update,
      onDelete: row.on_delete,
      match: row.match,
      columns: [],
    };
    group.columns[row.seq] = { from: row.from, to: row.to };
    foreignKeyGroups.set(row.id, group);
  }
  const foreignKeys = [...foreignKeyGroups.values()].sort((left, right) =>
    canonicalJson(left).localeCompare(canonicalJson(right)),
  );

  const indexRows = await d1All<IndexListRow>(
    database.prepare(`PRAGMA index_list(${pragmaIdentifier(tableName)})`),
    `inspect ${tableName} indexes`,
  );
  const indexes = await Promise.all(
    indexRows.map(async (index) => {
      const indexColumns = await d1All<IndexInfoRow>(
        database.prepare(
          `PRAGMA index_info(${pragmaIdentifier(index.name)})`,
        ),
        `inspect ${index.name} columns`,
      );
      return {
        name: index.name,
        unique: Boolean(index.unique),
        origin: index.origin,
        partial: Boolean(index.partial),
        columns: [...indexColumns]
          .sort((left, right) => left.seqno - right.seqno)
          .map((column) => column.name),
      };
    }),
  );
  indexes.sort((left, right) => left.name.localeCompare(right.name));

  return {
    columns: [...columns]
      .sort((left, right) => left.cid - right.cid)
      .map(({ name, type, notnull, dflt_value, pk }) => ({
        name,
        type: type.toLowerCase(),
        notNull: Boolean(notnull),
        defaultValue: dflt_value,
        primaryKeyPosition: pk,
      })),
    foreignKeys,
    indexes,
  };
}

async function createEmptyDatabase() {
  const miniflare = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('ok'); } }",
    d1Databases: ["DB"],
  });
  const database = (await miniflare.getD1Database(
    "DB",
  )) as unknown as D1DatabaseLike;

  await database.prepare("PRAGMA foreign_keys = ON").run();
  return { database, miniflare };
}

async function createTestDatabase() {
  const { database, miniflare } = await createEmptyDatabase();

  await applyMigrations(database, await loadMigrationUrls());
  return { database, miniflare };
}

async function applyMigrations(
  database: D1DatabaseLike,
  urls: readonly URL[],
) {
  for (const migrationUrl of urls) {
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
}

test("a fresh local D1 binding bootstraps the narrow runtime schema", async (t) => {
  const { database, miniflare } = await createEmptyDatabase();
  t.after(() => miniflare.dispose());

  const repository = await createRuntimeCatalogRepository({
    database,
    staticRepository: new StaticCatalogRepository([
      practicalSpreadsheetsProgram,
    ]),
  });
  assert.equal(
    (await repository.loadBySlug("practical-spreadsheets"))?.id,
    practicalSpreadsheetsProgram.id,
  );

  const requiredObjects = await database
    .prepare(
      `SELECT name
       FROM sqlite_schema
       WHERE name IN (
         'catalog_bundles',
         'catalog_bundle_payload_chunks',
         'catalog_program_supersessions',
         'learners',
         'learner_accounts',
         'learner_program_progress',
         'learner_unit_completions',
         'learner_progress_imports',
         'learner_program_states',
         'learner_requirement_selections',
         'learner_unit_states',
         'learner_unit_evidence',
         'learner_assessment_attempts',
         'learner_schedule_entries',
         'learner_prerequisite_waivers',
         'learner_progress_mutations',
         'learner_progress_events'
       )
       ORDER BY name`,
    )
    .all<{ name: string }>();
  assert.equal(requiredObjects.results?.length, 17);
  const foreignKeyProblems = await database
    .prepare("PRAGMA foreign_key_check")
    .all();
  assert.deepEqual(foreignKeyProblems.results ?? [], []);
});

test("the runtime bootstrap matches the migrated state and read-model shapes", async (t) => {
  const migrated = await createTestDatabase();
  const runtime = await createEmptyDatabase();
  t.after(() => Promise.all([migrated.miniflare.dispose(), runtime.miniflare.dispose()]));
  await initializeCatalogRuntimeSchema(runtime.database);

  for (const tableName of runtimeShapeTables) {
    assert.deepEqual(
      await readRuntimeTableShape(runtime.database, tableName),
      await readRuntimeTableShape(migrated.database, tableName),
      `${tableName} differs between runtime bootstrap and Drizzle migrations`,
    );
  }
});

test("the Phase 7 release marker supports one-point projection freshness checks", async (t) => {
  const { database, miniflare } = await createTestDatabase();
  t.after(() => miniflare.dispose());

  const manifestHash = "a".repeat(64);
  await database
    .prepare(
      `INSERT INTO catalog_projection_state (
         release_key,
         manifest_hash,
         bundle_count,
         active_program_count,
         minimum_path_course_count,
         learning_unit_count,
         nominal_hours,
         school_count,
         projection_version
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      "catalog-publication-lock-v1",
      manifestHash,
      7,
      9,
      152,
      1_464,
      28_000,
      3,
      1,
    )
    .run();

  assert.deepEqual(
    await database
      .prepare(
        `SELECT
           manifest_hash,
           bundle_count,
           active_program_count,
           minimum_path_course_count,
           learning_unit_count,
           nominal_hours,
           school_count,
           projection_version
         FROM catalog_projection_state
         WHERE release_key = ?`,
      )
      .bind("catalog-publication-lock-v1")
      .first(),
    {
      manifest_hash: manifestHash,
      bundle_count: 7,
      active_program_count: 9,
      minimum_path_course_count: 152,
      learning_unit_count: 1_464,
      nominal_hours: 28_000,
      school_count: 3,
      projection_version: 1,
    },
  );
});

test("the Phase 7 migration is additive and preserves publication and progress rows", async (t) => {
  const { database, miniflare } = await createEmptyDatabase();
  t.after(() => miniflare.dispose());
  const migrationUrls = await loadMigrationUrls();
  const phase7MigrationIndex = migrationUrls.findIndex((url) =>
    migrationFileName(url).startsWith("0005_"),
  );
  assert.notEqual(
    phase7MigrationIndex,
    -1,
    "The Phase 7 migration (0005_*.sql) is missing.",
  );
  await applyMigrations(database, migrationUrls.slice(0, phase7MigrationIndex));
  await seedPublishedProgramBundles(database, [practicalSpreadsheetsProgram]);

  const learnerId = "lrn_phase7_preservation_fixture";
  await d1Batch(
    database,
    [
      database.prepare("INSERT INTO learners (id) VALUES (?)").bind(learnerId),
      database
        .prepare(
          `INSERT INTO learner_program_progress (
             learner_id,
             program_version_id,
             bundle_id
           ) VALUES (?, ?, ?)`,
        )
        .bind(
          learnerId,
          practicalSpreadsheetsProgram.programVersion.id,
          practicalSpreadsheetsProgram.id,
        ),
    ],
    "create Phase 7 preservation fixture",
  );

  await applyMigrations(database, migrationUrls.slice(phase7MigrationIndex));
  assert.equal(
    (
      await database
        .prepare("SELECT COUNT(*) AS count FROM catalog_bundles")
        .first<{ count: number }>()
    )?.count,
    1,
  );
  assert.equal(
    (
      await database
        .prepare("SELECT COUNT(*) AS count FROM learner_program_progress")
        .first<{ count: number }>()
    )?.count,
    1,
  );
  const readModelTables = await database
    .prepare(
      `SELECT COUNT(*) AS count
       FROM sqlite_schema
       WHERE type = 'table'
         AND name IN (${phase7ReadModelTables.map(() => "?").join(", ")})`,
    )
    .bind(...phase7ReadModelTables)
    .first<{ count: number }>();
  assert.equal(readModelTables?.count, phase7ReadModelTables.length);
  assert.deepEqual(
    (
      await database.prepare("PRAGMA foreign_key_check").all()
    ).results ?? [],
    [],
  );
});

test("the Phase 3 migration preserves legacy enrollment anchors and unit completions", async (t) => {
  const { database, miniflare } = await createEmptyDatabase();
  t.after(() => miniflare.dispose());
  const migrationUrls = await loadMigrationUrls();
  const phase3MigrationIndex = migrationUrls.findIndex((url) =>
    migrationFileName(url).startsWith("0004_"),
  );
  assert.notEqual(
    phase3MigrationIndex,
    -1,
    "The Phase 3 migration (0004_*.sql) is missing.",
  );
  await applyMigrations(database, migrationUrls.slice(0, phase3MigrationIndex));
  await seedPublishedProgramBundles(database, [practicalSpreadsheetsProgram]);

  const learnerId = "lrn_phase3_legacy_fixture";
  const programVersionId = practicalSpreadsheetsProgram.programVersion.id;
  const bundleId = practicalSpreadsheetsProgram.id;
  const unit = practicalSpreadsheetsProgram.learningUnits[0];
  assert.ok(unit);
  await d1Batch(
    database,
    [
      database
        .prepare("INSERT INTO learners (id) VALUES (?)")
        .bind(learnerId),
      database
        .prepare(
          `INSERT INTO learner_program_progress (
             learner_id,
             program_version_id,
             bundle_id
           ) VALUES (?, ?, ?)`,
        )
        .bind(learnerId, programVersionId, bundleId),
      database
        .prepare(
          `INSERT INTO learner_unit_completions (
             learner_id,
             program_version_id,
             course_version_id,
             learning_unit_id,
             completed_at
           ) VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          learnerId,
          programVersionId,
          unit.courseVersionId,
          unit.id,
          "2026-08-01 09:30:00",
        ),
    ],
    "create Phase 3 legacy fixture",
  );

  await applyMigrations(database, migrationUrls.slice(phase3MigrationIndex));
  assert.deepEqual(
    await database
      .prepare(
        `SELECT revision, enrollment_status
         FROM learner_program_states
         WHERE learner_id = ? AND program_version_id = ?`,
      )
      .bind(learnerId, programVersionId)
      .first(),
    { revision: 0, enrollment_status: "not_enrolled" },
  );
  assert.deepEqual(
    await database
      .prepare(
        `SELECT status, completed_at, tombstoned_at
         FROM learner_unit_states
         WHERE learner_id = ?
           AND program_version_id = ?
           AND course_version_id = ?
           AND learning_unit_id = ?`,
      )
      .bind(learnerId, programVersionId, unit.courseVersionId, unit.id)
      .first(),
    {
      status: "completed",
      completed_at: "2026-08-01 09:30:00",
      tombstoned_at: null,
    },
  );
  const foreignKeyProblems = await database
    .prepare("PRAGMA foreign_key_check")
    .all();
  assert.deepEqual(foreignKeyProblems.results ?? [], []);
});

test("an explicit program supersession retires a draft slug without deleting its history", async (t) => {
  const { database, miniflare } = await createEmptyDatabase();
  t.after(() => miniflare.dispose());
  await createRuntimeCatalogRepository({
    database,
    staticRepository: new StaticCatalogRepository([]),
  });

  const legacyProgramId = "prg_computer_science";
  const legacyProgramVersionId = "prv_computer_science_1";
  const legacyBundleId = "bnd_computer_science_1";
  const legacy = JSON.parse(
    canonicalJson(computerScienceBundle)
      .replaceAll(computerScienceBundle.program.id, legacyProgramId)
      .replaceAll(
        computerScienceBundle.programVersion.id,
        legacyProgramVersionId,
      )
      .replaceAll(computerScienceBundle.id, legacyBundleId),
  ) as PublishedProgramBundle;
  await seedPublishedProgramBundles(database, [legacy]);

  const repository = await createRuntimeCatalogRepository({
    database,
    staticRepository: new StaticCatalogRepository([computerScienceBundle]),
    programSupersessions: [
      {
        retiredProgramId: legacyProgramId,
        successorProgramId: computerScienceBundle.program.id,
        reason: "Replace a pre-release derived identity.",
      },
    ],
  });
  const programs = await repository.listPrograms();
  assert.deepEqual(
    programs.map((program) => program.programId),
    [computerScienceBundle.program.id],
  );
  assert.equal(
    (await repository.loadBySlug("computer-science"))?.program.id,
    computerScienceBundle.program.id,
  );
  assert.equal(
    (
      await new D1CatalogRepository(database).loadByProgramVersionId(
        legacyProgramVersionId,
      )
    )?.program.id,
    legacyProgramId,
  );
});

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

test("an existing EE deployment upgrades without rewriting its publication or learner progress", async (t) => {
  const { database, miniflare } = await createTestDatabase();
  t.after(() => miniflare.dispose());

  await seedPublishedProgramBundles(database, [electricalEngineeringProgram]);
  const eeLock = catalogPublicationLock.find(
    (record) => record.bundleId === electricalEngineeringProgram.id,
  );
  assert.ok(eeLock);

  const publicationBefore = await database
    .prepare(
      `SELECT *
       FROM catalog_bundles
       WHERE id = ?`,
    )
    .bind(electricalEngineeringProgram.id)
    .first<Record<string, unknown>>();
  assert.equal(publicationBefore?.payload_hash, eeLock.canonicalSha256);

  const chunksBefore = await database
    .prepare(
      `SELECT chunk_index, payload_chunk
       FROM catalog_bundle_payload_chunks
       WHERE bundle_id = ?
       ORDER BY chunk_index`,
    )
    .bind(electricalEngineeringProgram.id)
    .all<{ chunk_index: number; payload_chunk: string }>();
  assert.ok((chunksBefore.results?.length ?? 0) > 1);

  const progress = new D1LearnerProgressRepository(database);
  const learner = await progress.resolveLearner({
    provider: "chatgpt",
    subject: "ee-upgrade-test@example.com",
    email: "ee-upgrade-test@example.com",
    displayName: "EE Upgrade Learner",
  });
  const firstUnit = electricalEngineeringProgram.learningUnits[0];
  const secondCourseUnit = electricalEngineeringProgram.learningUnits.find(
    (unit) => unit.courseVersionId !== firstUnit?.courseVersionId,
  );
  const selectedConcentrationId =
    electricalEngineeringProgram.concentrations[0]?.id;
  assert.ok(firstUnit);
  assert.ok(secondCourseUnit);
  assert.ok(selectedConcentrationId);
  await progress.importLocalProgress({
    learnerId: learner.learnerId,
    clientImportId: "ee-release-upgrade-fixture",
    storageNamespace: "course-atlas-progress-v2",
    disposition: "merged",
    programs: [
      {
        programVersionId: electricalEngineeringProgram.programVersion.id,
        selectedConcentrationId,
        courses: [
          {
            courseVersionId: firstUnit.courseVersionId,
            completedUnitIds: [firstUnit.id],
          },
          {
            courseVersionId: secondCourseUnit.courseVersionId,
            completedUnitIds: [secondCourseUnit.id],
          },
        ],
      },
    ],
  });

  async function snapshotLearnerState() {
    const rows = async (table: string, orderBy: string) =>
      (
        await database
          .prepare(
            `SELECT * FROM ${table}
             WHERE learner_id = ?
             ORDER BY ${orderBy}`,
          )
          .bind(learner.learnerId)
          .all<Record<string, unknown>>()
      ).results ?? [];
    return {
      learners:
        (
          await database
            .prepare("SELECT * FROM learners WHERE id = ?")
            .bind(learner.learnerId)
            .all<Record<string, unknown>>()
        ).results ?? [],
      accounts: await rows("learner_accounts", "id"),
      programs: await rows(
        "learner_program_progress",
        "program_version_id",
      ),
      units: await rows(
        "learner_unit_completions",
        "program_version_id, course_version_id, learning_unit_id",
      ),
      imports: await rows("learner_progress_imports", "client_import_id"),
    };
  }
  const learnerStateBefore = await snapshotLearnerState();

  const runtimeRepository = await createRuntimeCatalogRepository({
    database,
    staticRepository: catalogRepository,
    programSupersessions: catalogProgramSupersessions,
  });
  const programSummaries = await runtimeRepository.listPrograms();
  assert.equal(programSummaries.length, 6);
  let publicationCount = 0;
  for (const program of programSummaries) {
    publicationCount += (
      await runtimeRepository.listVersions(program.slug)
    ).length;
  }
  assert.equal(publicationCount, catalogPublicationLock.length);

  const publicationAfter = await database
    .prepare(
      `SELECT *
       FROM catalog_bundles
       WHERE id = ?`,
    )
    .bind(electricalEngineeringProgram.id)
    .first<Record<string, unknown>>();
  const chunksAfter = await database
    .prepare(
      `SELECT chunk_index, payload_chunk
       FROM catalog_bundle_payload_chunks
       WHERE bundle_id = ?
       ORDER BY chunk_index`,
    )
    .bind(electricalEngineeringProgram.id)
    .all<{ chunk_index: number; payload_chunk: string }>();
  assert.deepEqual(publicationAfter, publicationBefore);
  assert.deepEqual(chunksAfter.results, chunksBefore.results);
  assert.deepEqual(await snapshotLearnerState(), learnerStateBefore);

  const reconstructed = await runtimeRepository.loadByProgramId(
    electricalEngineeringProgram.program.id,
    electricalEngineeringProgram.programVersion.version,
  );
  assert.ok(reconstructed);
  assert.equal(
    canonicalJson(reconstructed),
    canonicalJson(electricalEngineeringProgram),
  );
  const learnerProgress = await progress.loadProgress(
    learner.learnerId,
    electricalEngineeringProgram.programVersion.id,
  );
  assert.equal(
    learnerProgress.selectedConcentrationId,
    selectedConcentrationId,
  );
  assert.deepEqual(
    learnerProgress.courses[firstUnit.courseVersionId].completedUnitIds,
    [firstUnit.id],
  );
  assert.deepEqual(
    learnerProgress.courses[secondCourseUnit.courseVersionId]
      .completedUnitIds,
    [secondCourseUnit.id],
  );

  const bundleCount = await database
    .prepare("SELECT COUNT(*) AS count FROM catalog_bundles")
    .first<{ count: number }>();
  assert.equal(bundleCount?.count, catalogPublicationLock.length);
  const foreignKeyProblems = await database
    .prepare("PRAGMA foreign_key_check")
    .all();
  assert.deepEqual(foreignKeyProblems.results ?? [], []);
});

test("Mechanical Engineering survives a complete D1 seed and reconstruction", async (t) => {
  const { database, miniflare } = await createTestDatabase();
  t.after(() => miniflare.dispose());

  await seedPublishedProgramBundles(database, [mechanicalEngineeringBundle]);

  const repository = new D1CatalogRepository(database);
  const reconstructed = await repository.loadByProgramId(
    mechanicalEngineeringBundle.program.id,
  );
  assert.ok(reconstructed);
  assert.equal(
    canonicalJson(reconstructed),
    canonicalJson(mechanicalEngineeringBundle),
  );

  const summary = (await repository.listPrograms()).find(
    (program) => program.programId === mechanicalEngineeringBundle.program.id,
  );
  assert.ok(summary);
  assert.equal(summary.courseCount, 30);
  assert.equal(summary.availableCourseCount, 34);
  assert.equal(summary.learningUnitCount, 240);
  assert.equal(summary.resourceCount, 34);
  assert.equal(summary.nominalHours, 4_800);
});

test("runnable Computer Science 1.2 survives D1 without losing weekly instruction", async (t) => {
  const { database, miniflare } = await createTestDatabase();
  t.after(() => miniflare.dispose());

  await seedPublishedProgramBundles(database, [computerScienceBundleV12]);

  const repository = new D1CatalogRepository(database);
  const reconstructed = await repository.loadByProgramId(
    computerScienceBundleV12.program.id,
  );
  assert.ok(reconstructed);
  assert.equal(canonicalJson(reconstructed), canonicalJson(computerScienceBundleV12));
  assert.equal(reconstructed.programVersion.qualityStandard, "runnable-pathway-v1");
  assert.equal(
    reconstructed.learningUnits.flatMap((unit) => unit.weeklyAssignments ?? [])
      .length,
    544,
  );
  assert.equal(
    reconstructed.assessmentVersions.filter(
      (assessment) => assessment.stage === "midterm",
    ).length,
    34,
  );
  assert.ok(
    reconstructed.assessmentVersions.every(
      (assessment) =>
        assessment.passingScore === 70 && assessment.rubric?.length === 4,
    ),
  );
});

test("Physics survives a complete D1 seed and reconstruction", async (t) => {
  const { database, miniflare } = await createTestDatabase();
  t.after(() => miniflare.dispose());

  await seedPublishedProgramBundles(database, [physicsBundle]);

  const repository = new D1CatalogRepository(database);
  const reconstructed = await repository.loadByProgramId(
    physicsBundle.program.id,
  );
  assert.ok(reconstructed);
  assert.equal(canonicalJson(reconstructed), canonicalJson(physicsBundle));

  const summary = (await repository.listPrograms()).find(
    (program) => program.programId === physicsBundle.program.id,
  );
  assert.ok(summary);
  assert.equal(summary.courseCount, 30);
  assert.equal(summary.availableCourseCount, 34);
  assert.equal(summary.learningUnitCount, 240);
  assert.equal(summary.resourceCount, 34);
  assert.equal(summary.nominalHours, 4_800);
});

test("Mathematics survives a complete D1 seed and reconstruction", async (t) => {
  const { database, miniflare } = await createTestDatabase();
  t.after(() => miniflare.dispose());

  await seedPublishedProgramBundles(database, [mathematicsBundle]);

  const repository = new D1CatalogRepository(database);
  const reconstructed = await repository.loadByProgramId(
    mathematicsBundle.program.id,
  );
  assert.ok(reconstructed);
  assert.equal(canonicalJson(reconstructed), canonicalJson(mathematicsBundle));

  const summary = (await repository.listPrograms()).find(
    (program) => program.programId === mathematicsBundle.program.id,
  );
  assert.ok(summary);
  assert.equal(summary.courseCount, 30);
  assert.equal(summary.availableCourseCount, 34);
  assert.equal(summary.learningUnitCount, 240);
  assert.equal(summary.resourceCount, 34);
  assert.equal(summary.nominalHours, 4_800);
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
