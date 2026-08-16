import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { Miniflare } from "miniflare";
import {
  CatalogQueryError,
  listD1ProgramPage,
  parseCourseSearchParams,
  parseProgramPageSearchParams,
  projectCatalogReadModels,
  searchD1Courses,
} from "../app/catalog/catalog-read-model";
import { d1Batch, type D1DatabaseLike } from "../app/catalog/d1-contract";
import { seedPublishedProgramBundles } from "../app/catalog/d1-repository";
import type { PublishedProgramBundle } from "../app/domain/catalog";
import { catalogRepository } from "../content/catalog";
import { practicalSpreadsheetsProgram } from "./fixtures/practical-spreadsheets";

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
  const migrations = (await readdir(new URL("../drizzle/", import.meta.url)))
    .filter((file) => /^\d{4}_.+\.sql$/u.test(file))
    .sort();
  for (const file of migrations) {
    const migration = await readFile(
      new URL(`../drizzle/${file}`, import.meta.url),
      "utf8",
    );
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

function currentProgramBundles() {
  return catalogRepository.listPrograms().map((program) => {
    const bundle = catalogRepository.loadBySlug(program.slug);
    assert.ok(bundle);
    return bundle;
  });
}

function countingDatabase(database: D1DatabaseLike) {
  let prepared = 0;
  return {
    database: {
      prepare(query: string) {
        prepared += 1;
        return database.prepare(query);
      },
      batch(statements: Parameters<D1DatabaseLike["batch"]>[0]) {
        return database.batch(statements);
      },
    } satisfies D1DatabaseLike,
    prepared: () => prepared,
  };
}

function syntheticStatements(database: D1DatabaseLike, count: number) {
  const hash = "f".repeat(64);
  const statements = [];
  for (let index = 0; index < count; index += 1) {
    const suffix = String(index).padStart(4, "0");
    const bundleId = `bnd_scale_${suffix}`;
    const programId = `prg_scale_${suffix}`;
    const programVersionId = `prv_scale_${suffix}`;
    const courseId = `crs_scale_${suffix}`;
    const courseVersionId = `crv_scale_${suffix}`;
    const slug = `zz-synthetic-${suffix}`;
    const title = `ZZ Synthetic Program ${suffix}`;
    const courseTitle = `ZZ Synthetic Course ${suffix}`;
    statements.push(
      database
        .prepare(
          `INSERT INTO catalog_bundles (
             id, schema_version, program_id, program_version_id,
             canonical_slug, semantic_version, published_at, payload_hash,
             summary_json
           ) VALUES (?, 1, ?, ?, ?, '1.0.0', '2026-08-12T00:00:00Z', ?, '{}')`,
        )
        .bind(bundleId, programId, programVersionId, slug, hash),
      database
        .prepare(
          `INSERT INTO catalog_program_summaries (
             program_version_id, bundle_id, program_id, canonical_slug,
             semantic_version, title, school, discipline, kind,
             credential_label, lifecycle, summary, nominal_duration,
             nominal_hours, course_count, available_course_count,
             learning_unit_count, assessment_count, resource_count,
             concentration_count, published_at, is_active, title_sort_key,
             search_text, source_payload_hash, projection_version
           ) VALUES (?, ?, ?, ?, '1.0.0', ?, 'Scale School', 'Scale',
             'independent study', 'Independent study', 'active',
             'Synthetic scale fixture.', '1 term', 10, 1, 1, 1, 1, 1, 0,
             '2026-08-12T00:00:00Z', 1, ?, ?, ?, 1)`,
        )
        .bind(
          programVersionId,
          bundleId,
          programId,
          slug,
          title,
          title.toLocaleLowerCase("en-US"),
          title.toLocaleLowerCase("en-US"),
          hash,
        ),
      database
        .prepare(
          `INSERT INTO catalog_course_search_rows (
             program_version_id, course_version_id, bundle_id, program_id,
             program_canonical_slug, program_title, course_id, canonical_slug,
             semantic_version, primary_code, codes_json, title, summary,
             discipline, format, nominal_hours, position, is_active,
             title_sort_key, code_sort_key, search_text, source_payload_hash,
             projection_version
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '1.0.0', ?, '[]', ?,
             'Synthetic scale fixture.', 'Scale', 'theory', 10, 0, 1, ?, ?, ?, ?, 1)`,
        )
        .bind(
          programVersionId,
          courseVersionId,
          bundleId,
          programId,
          slug,
          title,
          courseId,
          `zz-synthetic-course-${suffix}`,
          `SC-${suffix}`,
          courseTitle,
          courseTitle.toLocaleLowerCase("en-US"),
          `sc ${suffix}`,
          `${courseTitle.toLocaleLowerCase("en-US")} scale`,
          hash,
        ),
      database
        .prepare(
          `INSERT INTO catalog_course_search_terms (
             program_version_id, course_version_id, term, field, weight
           ) VALUES (?, ?, 'synthetic', 'title', 10)`,
        )
        .bind(programVersionId, courseVersionId),
    );
  }
  return statements;
}

test("catalog query parameters and cursors fail closed", async () => {
  assert.throws(
    () => parseProgramPageSearchParams(new URLSearchParams("limit=101")),
    CatalogQueryError,
  );
  assert.throws(
    () => parseProgramPageSearchParams(new URLSearchParams("limit=2&limit=3")),
    CatalogQueryError,
  );
  assert.throws(
    () => parseCourseSearchParams(new URLSearchParams("unknown=value")),
    CatalogQueryError,
  );
  assert.throws(
    () =>
      parseCourseSearchParams(
        new URLSearchParams("programVersionId=not-a-program-version"),
      ),
    CatalogQueryError,
  );
});

test("catalog projections rebuild idempotently from the exact immutable hash", async (t) => {
  const { database, miniflare } = await createDatabase();
  t.after(() => miniflare.dispose());
  await seedPublishedProgramBundles(database, [practicalSpreadsheetsProgram]);
  await projectCatalogReadModels(database, [practicalSpreadsheetsProgram]);
  await projectCatalogReadModels(database, [practicalSpreadsheetsProgram]);

  const summary = await database
    .prepare(
      `SELECT COUNT(*) AS count,
              MIN(source_payload_hash) AS projected_hash,
              (SELECT payload_hash FROM catalog_bundles WHERE id = ?) AS bundle_hash
       FROM catalog_program_summaries
       WHERE program_version_id = ?`,
    )
    .bind(
      practicalSpreadsheetsProgram.id,
      practicalSpreadsheetsProgram.programVersion.id,
    )
    .first<{ count: number; projected_hash: string; bundle_hash: string }>();
  assert.equal(summary?.count, 1);
  assert.equal(summary?.projected_hash, summary?.bundle_hash);
  const courseCount = await database
    .prepare(
      `SELECT COUNT(*) AS count
       FROM catalog_course_search_rows
       WHERE program_version_id = ?`,
    )
    .bind(practicalSpreadsheetsProgram.programVersion.id)
    .first<{ count: number }>();
  assert.equal(courseCount?.count, practicalSpreadsheetsProgram.courseVersions.length);
});

test("indexed catalog reads stay fixed at 1,000 programs and keyset-page near row 900", async (t) => {
  const { database, miniflare } = await createDatabase();
  t.after(() => miniflare.dispose());
  const published = currentProgramBundles() as readonly PublishedProgramBundle[];
  assert.equal(published.length, 5);
  // The distinctive small publication this search targets is a fixture rather
  // than a checked-in degree, so it is seeded alongside them here.
  const bundles = [...published, practicalSpreadsheetsProgram];
  await seedPublishedProgramBundles(database, bundles);
  await projectCatalogReadModels(database, bundles);

  const practical = practicalSpreadsheetsProgram;
  const beforeCounter = countingDatabase(database);
  const beforeProgram = await listD1ProgramPage(beforeCounter.database, {
    q: "Practical",
    limit: 10,
  });
  const beforeCourse = await searchD1Courses(beforeCounter.database, {
    programVersionId: practical.programVersion.id,
    limit: 10,
  });
  assert.equal(beforeProgram.items.length, 1);
  assert.ok(beforeCourse.items.length > 0);
  const beforeQueryCount = beforeCounter.prepared();
  const beforePayloadBytes = new TextEncoder().encode(
    JSON.stringify({ beforeProgram, beforeCourse }),
  ).byteLength;

  await d1Batch(
    database,
    syntheticStatements(database, 994),
    "insert 1,000-program scale fixtures",
  );
  const total = await database
    .prepare("SELECT COUNT(*) AS count FROM catalog_program_summaries WHERE is_active = 1")
    .first<{ count: number }>();
  assert.equal(total?.count, 1_000);

  const afterCounter = countingDatabase(database);
  const afterProgram = await listD1ProgramPage(afterCounter.database, {
    q: "Practical",
    limit: 10,
  });
  const afterCourse = await searchD1Courses(afterCounter.database, {
    programVersionId: practical.programVersion.id,
    limit: 10,
  });
  assert.deepEqual(afterProgram, beforeProgram);
  assert.deepEqual(afterCourse, beforeCourse);
  assert.equal(afterCounter.prepared(), beforeQueryCount);
  assert.equal(
    new TextEncoder().encode(JSON.stringify({ beforeProgram: afterProgram, beforeCourse: afterCourse })).byteLength,
    beforePayloadBytes,
  );

  const seen = new Set<string>();
  let cursor: string | undefined;
  let tenthPageFirstTitle = "";
  for (let pageNumber = 1; pageNumber <= 10; pageNumber += 1) {
    const page = await listD1ProgramPage(database, {
      limit: 100,
      ...(cursor ? { cursor } : {}),
    });
    assert.equal(page.items.length, 100);
    for (const item of page.items) {
      assert.equal(seen.has(item.programId), false);
      seen.add(item.programId);
    }
    if (pageNumber === 10) tenthPageFirstTitle = page.items[0].title;
    cursor = page.nextCursor;
  }
  assert.equal(seen.size, 1_000);
  assert.match(tenthPageFirstTitle, /^ZZ Synthetic Program/u);
  assert.equal(cursor, undefined);

  const programPlan = await database
    .prepare(
      `EXPLAIN QUERY PLAN
       SELECT program_version_id
       FROM catalog_program_summaries
       WHERE is_active = 1
       ORDER BY title_sort_key, program_version_id
       LIMIT 101`,
    )
    .all<{ detail: string }>();
  assert.match(
    (programPlan.results ?? []).map((row) => row.detail).join("\n"),
    /catalog_program_summaries_active_title_idx/u,
  );
  const coursePlan = await database
    .prepare(
      `EXPLAIN QUERY PLAN
       SELECT course_version_id
       FROM catalog_course_search_rows
       WHERE is_active = 1
       ORDER BY title_sort_key, program_version_id, course_version_id
       LIMIT 26`,
    )
    .all<{ detail: string }>();
  assert.match(
    (coursePlan.results ?? []).map((row) => row.detail).join("\n"),
    /catalog_course_search_rows_active_title_idx/u,
  );

  const source = await readFile(
    new URL("../app/catalog/catalog-read-model.ts", import.meta.url),
    "utf8",
  );
  const boundedReadSql = source.slice(source.indexOf("export async function listD1ProgramPage"));
  assert.doesNotMatch(boundedReadSql, /\bOFFSET\b/u);
  assert.doesNotMatch(boundedReadSql, /catalog_bundle_payload_chunks/u);
});
