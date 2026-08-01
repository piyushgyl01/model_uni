import {
  d1All,
  d1Batch,
  type D1DatabaseLike,
} from "./d1-contract";

const RUNTIME_SCHEMA_OBJECTS = [
  "catalog_bundles",
  "catalog_bundle_payload_chunks",
  "catalog_program_supersessions",
  "learners",
  "learner_accounts",
  "learner_program_progress",
  "learner_unit_completions",
  "learner_progress_imports",
  "catalog_bundles_program_version_id_unique",
  "catalog_bundles_program_semver_unique",
  "catalog_bundles_id_program_version_unique",
  "catalog_bundles_slug_idx",
  "catalog_program_supersessions_successor_idx",
  "learner_accounts_provider_subject_unique",
  "learner_accounts_learner_idx",
  "learner_program_progress_bundle_idx",
  "learner_program_progress_updated_idx",
  "learner_unit_completions_program_idx",
  "learner_unit_completions_course_idx",
  "learner_progress_imports_confirmed_idx",
] as const;

const RUNTIME_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS catalog_bundles (
    id text PRIMARY KEY NOT NULL,
    schema_version integer NOT NULL,
    program_id text NOT NULL,
    program_version_id text NOT NULL,
    canonical_slug text NOT NULL,
    semantic_version text NOT NULL,
    published_at text NOT NULL,
    payload_hash text NOT NULL,
    summary_json text NOT NULL,
    seeded_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT catalog_bundles_schema_version_check
      CHECK(schema_version > 0),
    CONSTRAINT catalog_bundles_payload_hash_check
      CHECK(length(payload_hash) = 64)
  )`,
  `CREATE TABLE IF NOT EXISTS catalog_bundle_payload_chunks (
    bundle_id text NOT NULL,
    chunk_index integer NOT NULL,
    payload_chunk text NOT NULL,
    PRIMARY KEY(bundle_id, chunk_index),
    FOREIGN KEY (bundle_id)
      REFERENCES catalog_bundles(id)
      ON UPDATE no action
      ON DELETE cascade,
    CONSTRAINT catalog_bundle_payload_chunks_index_check
      CHECK(chunk_index >= 0),
    CONSTRAINT catalog_bundle_payload_chunks_size_check
      CHECK(length(CAST(payload_chunk AS BLOB)) <= 250000)
  )`,
  `CREATE TABLE IF NOT EXISTS catalog_program_supersessions (
    retired_program_id text PRIMARY KEY NOT NULL,
    successor_program_id text NOT NULL,
    reason text NOT NULL,
    created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT catalog_program_supersessions_distinct_ids_check
      CHECK(retired_program_id <> successor_program_id)
  )`,
  `CREATE TABLE IF NOT EXISTS learners (
    id text PRIMARY KEY NOT NULL,
    display_name text,
    created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS learner_accounts (
    id text PRIMARY KEY NOT NULL,
    learner_id text NOT NULL,
    provider text NOT NULL,
    provider_subject text NOT NULL,
    email text,
    created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_seen_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (learner_id)
      REFERENCES learners(id)
      ON UPDATE no action
      ON DELETE cascade,
    CONSTRAINT learner_accounts_provider_check
      CHECK(length(trim(provider)) > 0),
    CONSTRAINT learner_accounts_subject_check
      CHECK(length(trim(provider_subject)) > 0)
  )`,
  `CREATE TABLE IF NOT EXISTS learner_program_progress (
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    bundle_id text NOT NULL,
    selected_concentration_id text,
    started_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(learner_id, program_version_id),
    FOREIGN KEY (learner_id)
      REFERENCES learners(id)
      ON UPDATE no action
      ON DELETE cascade,
    FOREIGN KEY (bundle_id, program_version_id)
      REFERENCES catalog_bundles(id, program_version_id)
      ON UPDATE cascade
      ON DELETE restrict
  )`,
  `CREATE TABLE IF NOT EXISTS learner_unit_completions (
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    course_version_id text NOT NULL,
    learning_unit_id text NOT NULL,
    completed_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(
      learner_id,
      program_version_id,
      course_version_id,
      learning_unit_id
    ),
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_program_progress(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade
  )`,
  `CREATE TABLE IF NOT EXISTS learner_progress_imports (
    learner_id text NOT NULL,
    client_import_id text NOT NULL,
    storage_namespace text NOT NULL,
    disposition text NOT NULL,
    payload_hash text NOT NULL,
    imported_unit_count integer DEFAULT 0 NOT NULL,
    confirmed_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(learner_id, client_import_id),
    FOREIGN KEY (learner_id)
      REFERENCES learners(id)
      ON UPDATE no action
      ON DELETE cascade,
    CONSTRAINT learner_progress_imports_namespace_check
      CHECK(length(trim(storage_namespace)) > 0),
    CONSTRAINT learner_progress_imports_hash_check
      CHECK(length(payload_hash) = 64),
    CONSTRAINT learner_progress_imports_count_check
      CHECK(imported_unit_count >= 0)
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS
    catalog_bundles_program_version_id_unique
    ON catalog_bundles(program_version_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS
    catalog_bundles_program_semver_unique
    ON catalog_bundles(program_id, semantic_version)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS
    catalog_bundles_id_program_version_unique
    ON catalog_bundles(id, program_version_id)`,
  `CREATE INDEX IF NOT EXISTS
    catalog_bundles_slug_idx
    ON catalog_bundles(canonical_slug, semantic_version)`,
  `CREATE INDEX IF NOT EXISTS
    catalog_program_supersessions_successor_idx
    ON catalog_program_supersessions(successor_program_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS
    learner_accounts_provider_subject_unique
    ON learner_accounts(provider, provider_subject)`,
  `CREATE INDEX IF NOT EXISTS
    learner_accounts_learner_idx
    ON learner_accounts(learner_id)`,
  `CREATE INDEX IF NOT EXISTS
    learner_program_progress_bundle_idx
    ON learner_program_progress(bundle_id)`,
  `CREATE INDEX IF NOT EXISTS
    learner_program_progress_updated_idx
    ON learner_program_progress(updated_at)`,
  `CREATE INDEX IF NOT EXISTS
    learner_unit_completions_program_idx
    ON learner_unit_completions(learner_id, program_version_id)`,
  `CREATE INDEX IF NOT EXISTS
    learner_unit_completions_course_idx
    ON learner_unit_completions(
      learner_id,
      program_version_id,
      course_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_progress_imports_confirmed_idx
    ON learner_progress_imports(learner_id, confirmed_at)`,
  "PRAGMA optimize",
] as const;

export interface CatalogRuntimeSchemaResult {
  readonly applied: boolean;
  readonly existingObjectCount: number;
}

/**
 * Fresh local Sites D1 bindings do not run deployment migrations. This
 * idempotent bootstrap mirrors only runtime-owned tables; Drizzle migrations
 * remain authoritative for production and all broader relational tables.
 */
export async function initializeCatalogRuntimeSchema(
  database: D1DatabaseLike,
): Promise<CatalogRuntimeSchemaResult> {
  const placeholders = RUNTIME_SCHEMA_OBJECTS.map(() => "?").join(", ");
  const existing = await d1All<{ name: string }>(
    database
      .prepare(
        `SELECT name
         FROM sqlite_schema
         WHERE name IN (${placeholders})`,
      )
      .bind(...RUNTIME_SCHEMA_OBJECTS),
    "inspect catalog runtime schema",
  );
  const existingNames = new Set(existing.map((row) => row.name));
  if (
    RUNTIME_SCHEMA_OBJECTS.every((objectName) =>
      existingNames.has(objectName),
    )
  ) {
    return {
      applied: false,
      existingObjectCount: existingNames.size,
    };
  }

  await d1Batch(
    database,
    RUNTIME_SCHEMA_STATEMENTS.map((statement) =>
      database.prepare(statement),
    ),
    "initialize catalog runtime schema",
  );
  return {
    applied: true,
    existingObjectCount: existingNames.size,
  };
}
