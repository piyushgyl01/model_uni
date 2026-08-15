import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { Miniflare } from "miniflare";
import type { D1DatabaseLike } from "../app/catalog/d1-contract";
import {
  LearnerReadModelRepository,
} from "../app/catalog/learner-read-model-repository";
import { seedPublishedProgramBundles } from "../app/catalog/d1-repository";
import { D1LearnerProgressRepository } from "../app/catalog/learner-progress-repository";
import { practicalSpreadsheetsProgram } from "../content/programs/practical-spreadsheets";

const migrationDirectoryUrl = new URL("../drizzle/", import.meta.url);

async function createDatabase() {
  const miniflare = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('ok'); } }",
    d1Databases: ["DB"],
  });
  const database = (await miniflare.getD1Database(
    "DB",
  )) as unknown as D1DatabaseLike;
  await database.prepare("PRAGMA foreign_keys = ON").run();
  const migrationFiles = (await readdir(migrationDirectoryUrl))
    .filter((file) => /^\d{4}_.+\.sql$/.test(file))
    .sort();
  for (const file of migrationFiles) {
    const migration = await readFile(new URL(file, migrationDirectoryUrl), "utf8");
    for (const statement of migration
      .split("--> statement-breakpoint")
      .map((value) => value.trim())
      .filter(Boolean)) {
      const result = await database.prepare(statement).run();
      assert.notEqual(result.success, false, result.error ?? statement);
    }
  }
  return { database, miniflare };
}

function withQuerySpy(database: D1DatabaseLike) {
  const queries: string[] = [];
  const spyingDatabase: D1DatabaseLike = {
    prepare(query) {
      queries.push(query);
      return database.prepare(query);
    },
    batch(statements) {
      return database.batch(statements);
    },
  };
  return { database: spyingDatabase, queries };
}

async function insertProgramSummary(database: D1DatabaseLike) {
  const bundle = practicalSpreadsheetsProgram;
  const payload = await database
    .prepare("SELECT payload_hash FROM catalog_bundles WHERE id = ?")
    .bind(bundle.id)
    .first<{ payload_hash: string }>();
  assert.ok(payload);
  const result = await database
    .prepare(
      `INSERT INTO catalog_program_summaries (
         program_version_id, bundle_id, program_id, canonical_slug,
         semantic_version, title, short_title, school, discipline, kind,
         credential_label, lifecycle, summary, nominal_duration,
         nominal_hours, course_count, available_course_count,
         learning_unit_count, assessment_count, resource_count,
         concentration_count, published_at, is_active, title_sort_key,
         search_text, source_payload_hash, projection_version
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 1)`,
    )
    .bind(
      bundle.programVersion.id,
      bundle.id,
      bundle.program.id,
      bundle.program.canonicalSlug,
      bundle.programVersion.version,
      bundle.programVersion.title,
      bundle.program.shortTitle ?? null,
      bundle.program.school,
      bundle.program.discipline,
      bundle.program.kind,
      bundle.programVersion.credentialLabel,
      bundle.programVersion.summary,
      bundle.programVersion.nominalDuration,
      bundle.courseVersions.reduce(
        (total, course) => total + course.nominalHours,
        0,
      ),
      1,
      1,
      bundle.learningUnits.length,
      bundle.assessmentVersions.length,
      bundle.resourceVersions.length,
      bundle.concentrations.length,
      bundle.programVersion.publishedAt,
      bundle.programVersion.title.toLowerCase(),
      `${bundle.programVersion.title} ${bundle.program.discipline}`.toLowerCase(),
      payload.payload_hash,
    )
    .run();
  assert.notEqual(result.success, false, result.error);
}

async function insertUnrelatedCatalogRows(database: D1DatabaseLike) {
  const hash = "0".repeat(64);
  const bundles = await database
    .prepare(
      `WITH RECURSIVE sequence(value) AS (
         SELECT 1
         UNION ALL
         SELECT value + 1 FROM sequence WHERE value < 994
       )
       INSERT INTO catalog_bundles (
         id, schema_version, program_id, program_version_id, canonical_slug,
         semantic_version, published_at, payload_hash, summary_json
       )
       SELECT
         'bnd_scale_' || value, 1, 'prg_scale_' || value,
         'prv_scale_' || value, 'scale-program-' || value, '1.0.0',
         '2026-01-01T00:00:00.000Z', ?, '{}'
       FROM sequence`,
    )
    .bind(hash)
    .run();
  assert.notEqual(bundles.success, false, bundles.error);
  const summaries = await database
    .prepare(
      `WITH RECURSIVE sequence(value) AS (
         SELECT 1
         UNION ALL
         SELECT value + 1 FROM sequence WHERE value < 994
       )
       INSERT INTO catalog_program_summaries (
         program_version_id, bundle_id, program_id, canonical_slug,
         semantic_version, title, school, discipline, kind,
         credential_label, lifecycle, summary, nominal_duration,
         nominal_hours, course_count, available_course_count,
         learning_unit_count, assessment_count, resource_count,
         concentration_count, published_at, is_active, title_sort_key,
         search_text, source_payload_hash, projection_version
       )
       SELECT
         'prv_scale_' || value, 'bnd_scale_' || value,
         'prg_scale_' || value, 'scale-program-' || value, '1.0.0',
         'Scale program ' || value, 'Scale school', 'Scale discipline',
         'degree_pathway', 'Independent pathway', 'active',
         'Synthetic scale fixture', '1 year', 100, 1, 1, 1, 0, 0, 0,
         '2026-01-01T00:00:00.000Z', 1,
         printf('scale program %04d', value),
         printf('scale program %04d scale discipline', value), ?, 1
       FROM sequence`,
    )
    .bind(hash)
    .run();
  assert.notEqual(summaries.success, false, summaries.error);
}

test("learner view routes derive ownership from authentication", async () => {
  const routeSources = await Promise.all(
    [
      "../app/api/learner-views/route.ts",
      "../app/api/learner-views/today/route.ts",
      "../app/api/learner-views/record/route.ts",
    ].map((path) => readFile(new URL(path, import.meta.url), "utf8")),
  );
  for (const source of routeSources) {
    assert.match(source, /getAuthenticatedLearner/);
    assert.doesNotMatch(source, /searchParams\.get\(["']learnerId["']\)/);
  }
});

test("learner views rebuild one pinned pathway and hit bounded D1 projections", async (t) => {
  const { database: rawDatabase, miniflare } = await createDatabase();
  t.after(() => miniflare.dispose());
  await seedPublishedProgramBundles(rawDatabase, [practicalSpreadsheetsProgram]);
  await insertProgramSummary(rawDatabase);

  const spy = withQuerySpy(rawDatabase);
  const progress = new D1LearnerProgressRepository(spy.database);
  const learner = await progress.resolveLearner({
    provider: "test",
    subject: "phase-7-read-model",
  });
  const programVersionId = practicalSpreadsheetsProgram.programVersion.id;
  await progress.applyMutation({
    learnerId: learner.learnerId,
    programVersionId,
    deviceId: "phase-7-test-device",
    clientMutationId: "phase-7-enroll",
    baseRevision: 0,
    operations: [
      {
        type: "set-enrollment",
        enrollment: {
          startDate: "2026-08-10",
          paceHoursPerWeek: 10,
          preferredStudyDays: [1, 2, 3, 4, 5],
          timezone: "UTC",
          enrolledAt: "2026-08-09T00:00:00.000Z",
          status: "enrolled",
        },
      },
    ],
  });

  const readModels = new LearnerReadModelRepository(progress);
  const [firstToday, firstRecord] = await Promise.all([
    readModels.getTodayView(
      learner.learnerId,
      programVersionId,
      "2026-08-10",
    ),
    readModels.getRecordView(
      learner.learnerId,
      programVersionId,
      "2026-08-10",
    ),
  ]);
  assert.equal(firstToday.program.programVersionId, programVersionId);
  assert.ok(firstToday.queue.blocks.length > 0);
  assert.equal(firstRecord.record.courses.length, 1);
  assert.equal(firstRecord.record.pathwayRequirementsCompleted, false);
  assert.ok(
    firstRecord.record.courses[0]?.canonicalPath.startsWith(
      "/programs/practical-spreadsheets/courses/",
    ),
  );
  assert.deepEqual(
    (await readModels.listLearnerPrograms(learner.learnerId)).map(
      (program) => program.programVersionId,
    ),
    [programVersionId],
  );

  spy.queries.length = 0;
  const baselineToday = await readModels.getTodayView(
    learner.learnerId,
    programVersionId,
    "2026-08-10",
  );
  const todayQueries = [...spy.queries];
  assert.equal(todayQueries.length, 5);
  assert.ok(
    todayQueries.every(
      (query) => !query.includes("catalog_bundle_payload_chunks"),
    ),
  );

  spy.queries.length = 0;
  const baselineRecord = await readModels.getRecordView(
    learner.learnerId,
    programVersionId,
    "2026-08-10",
  );
  const recordQueries = [...spy.queries];
  assert.equal(recordQueries.length, 4);
  assert.ok(
    recordQueries.every(
      (query) => !query.includes("catalog_bundle_payload_chunks"),
    ),
  );
  const todayBytes = new TextEncoder().encode(JSON.stringify(baselineToday)).byteLength;
  const recordBytes = new TextEncoder().encode(JSON.stringify(baselineRecord)).byteLength;
  assert.ok(todayBytes < 128_000, `Today payload is ${todayBytes} bytes.`);
  assert.ok(recordBytes < 256_000, `Record payload is ${recordBytes} bytes.`);

  await insertUnrelatedCatalogRows(rawDatabase);

  spy.queries.length = 0;
  const scaledToday = await readModels.getTodayView(
    learner.learnerId,
    programVersionId,
    "2026-08-10",
  );
  assert.equal(spy.queries.length, todayQueries.length);
  assert.deepEqual(scaledToday, baselineToday);
  assert.equal(
    new TextEncoder().encode(JSON.stringify(scaledToday)).byteLength,
    todayBytes,
  );
  assert.ok(
    spy.queries.every(
      (query) => !query.includes("catalog_bundle_payload_chunks"),
    ),
  );

  spy.queries.length = 0;
  const scaledRecord = await readModels.getRecordView(
    learner.learnerId,
    programVersionId,
    "2026-08-10",
  );
  assert.equal(spy.queries.length, recordQueries.length);
  assert.deepEqual(scaledRecord, baselineRecord);
  assert.equal(
    new TextEncoder().encode(JSON.stringify(scaledRecord)).byteLength,
    recordBytes,
  );
  assert.ok(
    spy.queries.every(
      (query) => !query.includes("catalog_bundle_payload_chunks"),
    ),
  );
});
