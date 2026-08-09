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
  "learner_program_states",
  "learner_requirement_selections",
  "learner_unit_states",
  "learner_unit_evidence",
  "learner_assessment_attempts",
  "learner_schedule_entries",
  "learner_prerequisite_waivers",
  "learner_progress_mutations",
  "learner_progress_events",
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
  "learner_program_states_status_idx",
  "learner_requirement_selections_group_course_unique",
  "learner_requirement_selections_course_idx",
  "learner_unit_states_program_status_idx",
  "learner_unit_states_course_idx",
  "learner_unit_evidence_program_updated_idx",
  "learner_assessment_attempts_number_unique",
  "learner_assessment_attempts_course_idx",
  "learner_assessment_attempts_status_idx",
  "learner_schedule_entries_day_idx",
  "learner_schedule_entries_status_day_idx",
  "learner_prerequisite_waivers_active_unique",
  "learner_prerequisite_waivers_course_idx",
  "learner_progress_mutations_revision_unique",
  "learner_progress_events_program_time_idx",
  "learner_progress_events_entity_time_idx",
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
  `CREATE TABLE IF NOT EXISTS learner_program_states (
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    revision integer DEFAULT 0 NOT NULL,
    last_mutation_id text,
    enrollment_status text DEFAULT 'not_enrolled' NOT NULL,
    start_date text,
    pace_hours_per_week real,
    study_days_json text DEFAULT '[]' NOT NULL,
    timezone text,
    enrolled_at text,
    updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(learner_id, program_version_id),
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_program_progress(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    CONSTRAINT learner_program_states_revision_check
      CHECK(revision >= 0),
    CONSTRAINT learner_program_states_enrollment_status_check
      CHECK(enrollment_status IN ('not_enrolled', 'enrolled', 'paused', 'completed')),
    CONSTRAINT learner_program_states_start_date_check
      CHECK(start_date IS NULL OR (length(start_date) = 10 AND date(start_date) = start_date)),
    CONSTRAINT learner_program_states_pace_check
      CHECK(pace_hours_per_week IS NULL OR (pace_hours_per_week > 0 AND pace_hours_per_week <= 168)),
    CONSTRAINT learner_program_states_study_days_check
      CHECK(json_valid(study_days_json) AND json_type(study_days_json) = 'array'),
    CONSTRAINT learner_program_states_timezone_check
      CHECK(timezone IS NULL OR length(trim(timezone)) > 0)
  )`,
  `CREATE TABLE IF NOT EXISTS learner_requirement_selections (
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    requirement_group_id text NOT NULL,
    requirement_option_id text NOT NULL,
    course_version_id text NOT NULL,
    selection_source text DEFAULT 'learner' NOT NULL,
    selected_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(
      learner_id,
      program_version_id,
      requirement_group_id,
      requirement_option_id
    ),
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_program_progress(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    CONSTRAINT learner_requirement_selections_source_check
      CHECK(selection_source IN ('learner', 'default', 'import'))
  )`,
  `CREATE TABLE IF NOT EXISTS learner_unit_states (
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    course_version_id text NOT NULL,
    learning_unit_id text NOT NULL,
    status text NOT NULL,
    completed_at text,
    tombstoned_at text,
    last_mutation_id text,
    updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(
      learner_id,
      program_version_id,
      course_version_id,
      learning_unit_id
    ),
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_program_progress(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    CONSTRAINT learner_unit_states_status_timestamps_check
      CHECK(
        (status = 'completed' AND completed_at IS NOT NULL AND tombstoned_at IS NULL)
        OR (status = 'tombstoned' AND completed_at IS NULL AND tombstoned_at IS NOT NULL)
      )
  )`,
  `CREATE TABLE IF NOT EXISTS learner_unit_evidence (
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    course_version_id text NOT NULL,
    learning_unit_id text NOT NULL,
    status text NOT NULL,
    text_or_url text,
    submitted_at text,
    tombstoned_at text,
    last_mutation_id text,
    updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(
      learner_id,
      program_version_id,
      course_version_id,
      learning_unit_id
    ),
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_program_progress(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    CONSTRAINT learner_unit_evidence_status_payload_check
      CHECK(
        (status = 'active' AND length(trim(text_or_url)) > 0 AND submitted_at IS NOT NULL AND tombstoned_at IS NULL)
        OR (status = 'tombstoned' AND text_or_url IS NULL AND submitted_at IS NULL AND tombstoned_at IS NOT NULL)
      )
  )`,
  `CREATE TABLE IF NOT EXISTS learner_assessment_attempts (
    id text NOT NULL,
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    course_version_id text NOT NULL,
    assessment_version_id text NOT NULL,
    attempt_number integer NOT NULL,
    status text DEFAULT 'draft' NOT NULL,
    submission_text text,
    submission_url text,
    submission_evidence_json text DEFAULT '[]' NOT NULL,
    score real,
    maximum_score real,
    passed integer,
    evaluation_method text,
    feedback text,
    started_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    submitted_at text,
    evaluated_at text,
    last_mutation_id text,
    updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(learner_id, program_version_id, id),
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_program_progress(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    CONSTRAINT learner_assessment_attempts_number_check
      CHECK(attempt_number > 0),
    CONSTRAINT learner_assessment_attempts_score_check
      CHECK(
        (score IS NULL AND maximum_score IS NULL)
        OR (score IS NOT NULL AND maximum_score IS NOT NULL AND score >= 0 AND maximum_score > 0 AND score <= maximum_score)
      ),
    CONSTRAINT learner_assessment_attempts_evidence_check
      CHECK(json_valid(submission_evidence_json) AND json_type(submission_evidence_json) = 'array'),
    CONSTRAINT learner_assessment_attempts_evaluation_method_check
      CHECK(evaluation_method IS NULL OR evaluation_method IN ('self', 'automatic', 'peer', 'instructor')),
    CONSTRAINT learner_assessment_attempts_passed_check
      CHECK(passed IS NULL OR passed IN (0, 1)),
    CONSTRAINT learner_assessment_attempts_lifecycle_check
      CHECK(
        (status = 'draft' AND submitted_at IS NULL AND evaluated_at IS NULL)
        OR (status = 'submitted' AND submitted_at IS NOT NULL AND evaluated_at IS NULL)
        OR (status = 'evaluated' AND submitted_at IS NOT NULL AND evaluated_at IS NOT NULL AND passed IS NOT NULL AND evaluation_method IS NOT NULL)
        OR status = 'void'
      )
  )`,
  `CREATE TABLE IF NOT EXISTS learner_schedule_entries (
    id text NOT NULL,
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    course_version_id text NOT NULL,
    learning_unit_id text,
    assessment_version_id text,
    scheduled_date text NOT NULL,
    start_time text,
    planned_minutes integer NOT NULL,
    position integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'planned' NOT NULL,
    source_placement_id text,
    origin_entry_id text,
    completed_at text,
    last_mutation_id text,
    created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(learner_id, program_version_id, id),
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_program_progress(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    FOREIGN KEY (learner_id, program_version_id, origin_entry_id)
      REFERENCES learner_schedule_entries(learner_id, program_version_id, id)
      ON UPDATE cascade
      ON DELETE restrict,
    CONSTRAINT learner_schedule_entries_subject_check
      CHECK(learning_unit_id IS NULL OR assessment_version_id IS NULL),
    CONSTRAINT learner_schedule_entries_date_check
      CHECK(length(scheduled_date) = 10 AND date(scheduled_date) = scheduled_date),
    CONSTRAINT learner_schedule_entries_start_time_check
      CHECK(start_time IS NULL OR (length(start_time) = 5 AND start_time GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(start_time, 1, 2) <= '23')),
    CONSTRAINT learner_schedule_entries_minutes_check
      CHECK(planned_minutes > 0),
    CONSTRAINT learner_schedule_entries_position_check
      CHECK(position >= 0),
    CONSTRAINT learner_schedule_entries_status_check
      CHECK(status IN ('planned', 'completed', 'skipped', 'carried', 'cancelled')),
    CONSTRAINT learner_schedule_entries_completion_check
      CHECK(
        (status = 'completed' AND completed_at IS NOT NULL)
        OR (status <> 'completed' AND completed_at IS NULL)
      )
  )`,
  `CREATE TABLE IF NOT EXISTS learner_prerequisite_waivers (
    id text NOT NULL,
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    course_version_id text NOT NULL,
    prerequisite_course_version_id text NOT NULL,
    basis text NOT NULL,
    reason text NOT NULL,
    evidence_text_or_url text,
    granted_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    revoked_at text,
    last_mutation_id text,
    updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(learner_id, program_version_id, id),
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_program_progress(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    CONSTRAINT learner_prerequisite_waivers_distinct_courses_check
      CHECK(course_version_id <> prerequisite_course_version_id),
    CONSTRAINT learner_prerequisite_waivers_reason_check
      CHECK(length(trim(reason)) > 0),
    CONSTRAINT learner_prerequisite_waivers_basis_check
      CHECK(basis IN ('placement', 'prior_learning', 'review', 'manual'))
  )`,
  `CREATE TABLE IF NOT EXISTS learner_progress_mutations (
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    mutation_id text NOT NULL,
    device_id text NOT NULL,
    base_revision integer NOT NULL,
    result_revision integer NOT NULL,
    payload_hash text NOT NULL,
    applied_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(learner_id, program_version_id, mutation_id),
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_program_progress(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    CONSTRAINT learner_progress_mutations_revision_check
      CHECK(base_revision >= 0 AND result_revision = base_revision + 1),
    CONSTRAINT learner_progress_mutations_hash_check
      CHECK(length(payload_hash) = 64),
    CONSTRAINT learner_progress_mutations_device_check
      CHECK(length(trim(device_id)) > 0)
  )`,
  `CREATE TABLE IF NOT EXISTS learner_progress_events (
    id text PRIMARY KEY NOT NULL,
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    mutation_id text,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    event_type text NOT NULL,
    payload_json text DEFAULT '{}' NOT NULL,
    occurred_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_program_progress(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    FOREIGN KEY (learner_id, program_version_id, mutation_id)
      REFERENCES learner_progress_mutations(learner_id, program_version_id, mutation_id)
      ON UPDATE cascade
      ON DELETE restrict,
    CONSTRAINT learner_progress_events_entity_check
      CHECK(length(trim(entity_id)) > 0 AND length(trim(event_type)) > 0),
    CONSTRAINT learner_progress_events_payload_check
      CHECK(json_valid(payload_json) AND json_type(payload_json) = 'object')
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
  `CREATE INDEX IF NOT EXISTS
    learner_program_states_status_idx
    ON learner_program_states(learner_id, enrollment_status, updated_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS
    learner_requirement_selections_group_course_unique
    ON learner_requirement_selections(
      learner_id,
      program_version_id,
      requirement_group_id,
      course_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_requirement_selections_course_idx
    ON learner_requirement_selections(
      learner_id,
      program_version_id,
      course_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_unit_states_program_status_idx
    ON learner_unit_states(
      learner_id,
      program_version_id,
      status,
      updated_at
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_unit_states_course_idx
    ON learner_unit_states(
      learner_id,
      program_version_id,
      course_version_id,
      status
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_unit_evidence_program_updated_idx
    ON learner_unit_evidence(learner_id, program_version_id, updated_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS
    learner_assessment_attempts_number_unique
    ON learner_assessment_attempts(
      learner_id,
      program_version_id,
      assessment_version_id,
      attempt_number
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_assessment_attempts_course_idx
    ON learner_assessment_attempts(
      learner_id,
      program_version_id,
      course_version_id,
      updated_at
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_assessment_attempts_status_idx
    ON learner_assessment_attempts(
      learner_id,
      program_version_id,
      status,
      updated_at
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_schedule_entries_day_idx
    ON learner_schedule_entries(
      learner_id,
      program_version_id,
      scheduled_date,
      position
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_schedule_entries_status_day_idx
    ON learner_schedule_entries(
      learner_id,
      program_version_id,
      status,
      scheduled_date
    )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS
    learner_prerequisite_waivers_active_unique
    ON learner_prerequisite_waivers(
      learner_id,
      program_version_id,
      course_version_id,
      prerequisite_course_version_id
    )
    WHERE revoked_at IS NULL`,
  `CREATE INDEX IF NOT EXISTS
    learner_prerequisite_waivers_course_idx
    ON learner_prerequisite_waivers(
      learner_id,
      program_version_id,
      course_version_id,
      revoked_at
    )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS
    learner_progress_mutations_revision_unique
    ON learner_progress_mutations(
      learner_id,
      program_version_id,
      result_revision
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_progress_events_program_time_idx
    ON learner_progress_events(learner_id, program_version_id, occurred_at)`,
  `CREATE INDEX IF NOT EXISTS
    learner_progress_events_entity_time_idx
    ON learner_progress_events(
      learner_id,
      program_version_id,
      entity_type,
      entity_id,
      occurred_at
    )`,
  `INSERT INTO learner_program_states (
     learner_id,
     program_version_id,
     enrollment_status,
     updated_at
   )
   SELECT
     learner_id,
     program_version_id,
     'not_enrolled',
     updated_at
   FROM learner_program_progress
   WHERE true
   ON CONFLICT(learner_id, program_version_id) DO NOTHING`,
  `INSERT INTO learner_unit_states (
     learner_id,
     program_version_id,
     course_version_id,
     learning_unit_id,
     status,
     completed_at,
     updated_at
   )
   SELECT
     learner_id,
     program_version_id,
     course_version_id,
     learning_unit_id,
     'completed',
     completed_at,
     completed_at
   FROM learner_unit_completions
   WHERE true
   ON CONFLICT(
     learner_id,
     program_version_id,
     course_version_id,
     learning_unit_id
   ) DO NOTHING`,
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
