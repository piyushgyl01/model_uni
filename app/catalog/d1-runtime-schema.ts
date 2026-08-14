import {
  d1All,
  d1Batch,
  type D1DatabaseLike,
} from "./d1-contract";

const RUNTIME_SCHEMA_OBJECTS = [
  "catalog_bundles",
  "catalog_bundle_payload_chunks",
  "catalog_program_supersessions",
  "catalog_projection_state",
  "catalog_program_summaries",
  "catalog_course_search_rows",
  "catalog_course_search_terms",
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
  "learner_pathway_snapshots",
  "learner_pathway_course_rows",
  "learner_term_schedule_rows",
  "learner_today_assignment_rows",
  "learner_transcript_rows",
  "catalog_bundles_program_version_id_unique",
  "catalog_bundles_program_semver_unique",
  "catalog_bundles_id_program_version_unique",
  "catalog_bundles_slug_idx",
  "catalog_program_supersessions_successor_idx",
  "catalog_program_summaries_bundle_unique",
  "catalog_program_summaries_slug_version_unique",
  "catalog_program_summaries_active_title_idx",
  "catalog_program_summaries_discipline_title_idx",
  "catalog_program_summaries_kind_title_idx",
  "catalog_program_summaries_published_idx",
  "catalog_course_search_rows_program_position_idx",
  "catalog_course_search_rows_active_title_idx",
  "catalog_course_search_rows_active_code_idx",
  "catalog_course_search_rows_active_slug_idx",
  "catalog_course_search_rows_discipline_title_idx",
  "catalog_course_search_rows_format_title_idx",
  "catalog_course_search_terms_lookup_idx",
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
  "learner_pathway_snapshots_revision_idx",
  "learner_pathway_course_rows_order_idx",
  "learner_pathway_course_rows_period_idx",
  "learner_term_schedule_rows_order_idx",
  "learner_term_schedule_rows_date_idx",
  "learner_term_schedule_rows_status_idx",
  "learner_today_assignment_rows_schedule_entry_unique",
  "learner_today_assignment_rows_day_idx",
  "learner_today_assignment_rows_day_status_idx",
  "learner_today_assignment_rows_course_day_idx",
  "learner_transcript_rows_order_idx",
  "learner_transcript_rows_passed_idx",
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
  `CREATE TABLE IF NOT EXISTS catalog_projection_state (
    release_key text PRIMARY KEY NOT NULL,
    manifest_hash text NOT NULL,
    bundle_count integer NOT NULL,
    active_program_count integer DEFAULT 0 NOT NULL,
    minimum_path_course_count integer DEFAULT 0 NOT NULL,
    learning_unit_count integer DEFAULT 0 NOT NULL,
    nominal_hours integer DEFAULT 0 NOT NULL,
    school_count integer DEFAULT 0 NOT NULL,
    projection_version integer NOT NULL,
    projected_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT catalog_projection_state_release_key_check
      CHECK(length(trim(release_key)) > 0),
    CONSTRAINT catalog_projection_state_manifest_hash_check
      CHECK(length(manifest_hash) = 64),
    CONSTRAINT catalog_projection_state_bundle_count_check
      CHECK(bundle_count >= 0),
    CONSTRAINT catalog_projection_state_aggregate_counts_check
      CHECK(active_program_count >= 0 AND minimum_path_course_count >= 0 AND learning_unit_count >= 0 AND nominal_hours >= 0 AND school_count >= 0 AND school_count <= active_program_count),
    CONSTRAINT catalog_projection_state_projection_version_check
      CHECK(projection_version > 0)
  )`,
  `CREATE TABLE IF NOT EXISTS catalog_program_summaries (
    program_version_id text PRIMARY KEY NOT NULL,
    bundle_id text NOT NULL,
    program_id text NOT NULL,
    canonical_slug text NOT NULL,
    semantic_version text NOT NULL,
    title text NOT NULL,
    short_title text,
    school text NOT NULL,
    discipline text NOT NULL,
    kind text NOT NULL,
    credential_label text NOT NULL,
    lifecycle text DEFAULT 'active' NOT NULL,
    summary text NOT NULL,
    nominal_duration text NOT NULL,
    nominal_hours integer NOT NULL,
    course_count integer NOT NULL,
    available_course_count integer NOT NULL,
    learning_unit_count integer NOT NULL,
    assessment_count integer NOT NULL,
    resource_count integer NOT NULL,
    concentration_count integer NOT NULL,
    published_at text NOT NULL,
    is_active integer DEFAULT true NOT NULL,
    title_sort_key text NOT NULL,
    search_text text NOT NULL,
    source_payload_hash text NOT NULL,
    projection_version integer DEFAULT 1 NOT NULL,
    rebuilt_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (bundle_id, program_version_id)
      REFERENCES catalog_bundles(id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    CONSTRAINT catalog_program_summaries_counts_check
      CHECK(nominal_hours >= 0 AND course_count >= 0 AND available_course_count >= course_count AND learning_unit_count >= 0 AND assessment_count >= 0 AND resource_count >= 0 AND concentration_count >= 0),
    CONSTRAINT catalog_program_summaries_lifecycle_check
      CHECK(lifecycle IN ('active', 'retired')),
    CONSTRAINT catalog_program_summaries_source_hash_check
      CHECK(length(source_payload_hash) = 64),
    CONSTRAINT catalog_program_summaries_projection_version_check
      CHECK(projection_version > 0),
    CONSTRAINT catalog_program_summaries_search_keys_check
      CHECK(length(trim(title_sort_key)) > 0 AND length(trim(search_text)) > 0)
  )`,
  `CREATE TABLE IF NOT EXISTS catalog_course_search_rows (
    program_version_id text NOT NULL,
    course_version_id text NOT NULL,
    bundle_id text NOT NULL,
    program_id text NOT NULL,
    program_canonical_slug text NOT NULL,
    program_title text NOT NULL,
    course_id text NOT NULL,
    canonical_slug text NOT NULL,
    semantic_version text NOT NULL,
    primary_code text,
    codes_json text DEFAULT '[]' NOT NULL,
    title text NOT NULL,
    summary text NOT NULL,
    discipline text NOT NULL,
    format text NOT NULL,
    nominal_hours integer NOT NULL,
    position integer NOT NULL,
    is_active integer DEFAULT true NOT NULL,
    title_sort_key text NOT NULL,
    code_sort_key text,
    search_text text NOT NULL,
    source_payload_hash text NOT NULL,
    projection_version integer DEFAULT 1 NOT NULL,
    rebuilt_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(program_version_id, course_version_id),
    FOREIGN KEY (bundle_id, program_version_id)
      REFERENCES catalog_bundles(id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    CONSTRAINT catalog_course_search_rows_nonnegative_values_check
      CHECK(nominal_hours >= 0 AND position >= 0),
    CONSTRAINT catalog_course_search_rows_codes_check
      CHECK(json_valid(codes_json) AND json_type(codes_json) = 'array'),
    CONSTRAINT catalog_course_search_rows_source_hash_check
      CHECK(length(source_payload_hash) = 64),
    CONSTRAINT catalog_course_search_rows_projection_version_check
      CHECK(projection_version > 0),
    CONSTRAINT catalog_course_search_rows_search_keys_check
      CHECK(length(trim(title_sort_key)) > 0 AND length(trim(search_text)) > 0)
  )`,
  `CREATE TABLE IF NOT EXISTS catalog_course_search_terms (
    program_version_id text NOT NULL,
    course_version_id text NOT NULL,
    term text NOT NULL,
    field text NOT NULL,
    weight integer DEFAULT 1 NOT NULL,
    PRIMARY KEY(program_version_id, course_version_id, term, field),
    FOREIGN KEY (program_version_id, course_version_id)
      REFERENCES catalog_course_search_rows(program_version_id, course_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    CONSTRAINT catalog_course_search_terms_term_check
      CHECK(length(trim(term)) > 0),
    CONSTRAINT catalog_course_search_terms_field_check
      CHECK(field IN ('title', 'code', 'slug', 'discipline', 'summary', 'outcome')),
    CONSTRAINT catalog_course_search_terms_weight_check
      CHECK(weight > 0)
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
  `CREATE TABLE IF NOT EXISTS learner_pathway_snapshots (
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    bundle_id text NOT NULL,
    source_progress_revision integer NOT NULL,
    calendar_as_of_date text NOT NULL,
    selected_concentration_id text,
    selected_concentration_title text,
    path_resolved integer NOT NULL,
    requirements_satisfied integer NOT NULL,
    course_count integer NOT NULL,
    learning_unit_count integer NOT NULL,
    assessment_count integer NOT NULL,
    nominal_hours integer NOT NULL,
    requirement_evaluation_json text NOT NULL,
    diagnostics_json text DEFAULT '[]' NOT NULL,
    calendar_summary_json text DEFAULT '{}' NOT NULL,
    source_payload_hash text NOT NULL,
    projection_version integer DEFAULT 1 NOT NULL,
    rebuilt_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(learner_id, program_version_id),
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_program_progress(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    FOREIGN KEY (bundle_id, program_version_id)
      REFERENCES catalog_bundles(id, program_version_id)
      ON UPDATE cascade
      ON DELETE restrict,
    CONSTRAINT learner_pathway_snapshots_revision_check
      CHECK(source_progress_revision >= 0),
    CONSTRAINT learner_pathway_snapshots_as_of_date_check
      CHECK(length(calendar_as_of_date) = 10 AND date(calendar_as_of_date) = calendar_as_of_date),
    CONSTRAINT learner_pathway_snapshots_concentration_title_check
      CHECK(selected_concentration_title IS NULL OR length(trim(selected_concentration_title)) > 0),
    CONSTRAINT learner_pathway_snapshots_counts_check
      CHECK(course_count >= 0 AND learning_unit_count >= 0 AND assessment_count >= 0 AND nominal_hours >= 0),
    CONSTRAINT learner_pathway_snapshots_evaluation_check
      CHECK(json_valid(requirement_evaluation_json) AND json_type(requirement_evaluation_json) = 'object'),
    CONSTRAINT learner_pathway_snapshots_diagnostics_check
      CHECK(json_valid(diagnostics_json) AND json_type(diagnostics_json) = 'array'),
    CONSTRAINT learner_pathway_snapshots_calendar_summary_check
      CHECK(json_valid(calendar_summary_json) AND json_type(calendar_summary_json) = 'object'),
    CONSTRAINT learner_pathway_snapshots_source_hash_check
      CHECK(length(source_payload_hash) = 64),
    CONSTRAINT learner_pathway_snapshots_projection_version_check
      CHECK(projection_version > 0)
  )`,
  `CREATE TABLE IF NOT EXISTS learner_pathway_course_rows (
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    course_version_id text NOT NULL,
    course_id text NOT NULL,
    canonical_slug text NOT NULL,
    code text,
    title text NOT NULL,
    summary text NOT NULL,
    format text NOT NULL,
    nominal_hours integer NOT NULL,
    position integer NOT NULL,
    period_id text,
    period_label text,
    requirement_group_ids_json text DEFAULT '[]' NOT NULL,
    prerequisite_course_version_ids_json text DEFAULT '[]' NOT NULL,
    learning_unit_count integer NOT NULL,
    assessment_count integer NOT NULL,
    source_progress_revision integer NOT NULL,
    projection_version integer DEFAULT 1 NOT NULL,
    rebuilt_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(learner_id, program_version_id, course_version_id),
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_pathway_snapshots(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    CONSTRAINT learner_pathway_course_rows_values_check
      CHECK(nominal_hours >= 0 AND position >= 0 AND learning_unit_count >= 0 AND assessment_count >= 0 AND source_progress_revision >= 0),
    CONSTRAINT learner_pathway_course_rows_requirements_check
      CHECK(json_valid(requirement_group_ids_json) AND json_type(requirement_group_ids_json) = 'array'),
    CONSTRAINT learner_pathway_course_rows_prerequisites_check
      CHECK(json_valid(prerequisite_course_version_ids_json) AND json_type(prerequisite_course_version_ids_json) = 'array'),
    CONSTRAINT learner_pathway_course_rows_projection_version_check
      CHECK(projection_version > 0)
  )`,
  `CREATE TABLE IF NOT EXISTS learner_term_schedule_rows (
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    term_key text NOT NULL,
    period_id text,
    label text NOT NULL,
    position integer NOT NULL,
    start_date text NOT NULL,
    end_date text NOT NULL,
    status text NOT NULL,
    course_version_ids_json text DEFAULT '[]' NOT NULL,
    milestones_json text DEFAULT '[]' NOT NULL,
    break_start_date text,
    break_end_date text,
    total_planned_minutes integer NOT NULL,
    completed_minutes integer NOT NULL,
    source_progress_revision integer NOT NULL,
    projection_version integer DEFAULT 1 NOT NULL,
    rebuilt_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(learner_id, program_version_id, term_key),
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_pathway_snapshots(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    CONSTRAINT learner_term_schedule_rows_date_check
      CHECK(length(start_date) = 10 AND date(start_date) = start_date AND length(end_date) = 10 AND date(end_date) = end_date AND end_date >= start_date),
    CONSTRAINT learner_term_schedule_rows_break_check
      CHECK((break_start_date IS NULL AND break_end_date IS NULL) OR (break_start_date IS NOT NULL AND break_end_date IS NOT NULL AND date(break_start_date) = break_start_date AND date(break_end_date) = break_end_date AND break_end_date >= break_start_date)),
    CONSTRAINT learner_term_schedule_rows_status_check
      CHECK(status IN ('completed', 'current', 'upcoming')),
    CONSTRAINT learner_term_schedule_rows_values_check
      CHECK(position >= 0 AND total_planned_minutes >= 0 AND completed_minutes >= 0 AND completed_minutes <= total_planned_minutes AND source_progress_revision >= 0),
    CONSTRAINT learner_term_schedule_rows_courses_check
      CHECK(json_valid(course_version_ids_json) AND json_type(course_version_ids_json) = 'array'),
    CONSTRAINT learner_term_schedule_rows_milestones_check
      CHECK(json_valid(milestones_json) AND json_type(milestones_json) = 'array'),
    CONSTRAINT learner_term_schedule_rows_projection_version_check
      CHECK(projection_version > 0)
  )`,
  `CREATE TABLE IF NOT EXISTS learner_today_assignment_rows (
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    assignment_id text NOT NULL,
    schedule_entry_id text NOT NULL,
    course_version_id text NOT NULL,
    course_canonical_slug text NOT NULL,
    course_title text NOT NULL,
    subject_kind text NOT NULL,
    subject_id text NOT NULL,
    learning_unit_id text,
    assessment_version_id text,
    term_key text,
    period_label text NOT NULL,
    task_kind text NOT NULL,
    title text NOT NULL,
    topic text NOT NULL,
    activity text NOT NULL,
    where_text text NOT NULL,
    resource_url text,
    produce text NOT NULL,
    scheduled_date text NOT NULL,
    deadline_date text NOT NULL,
    start_time text,
    planned_minutes integer NOT NULL,
    position integer NOT NULL,
    status text DEFAULT 'planned' NOT NULL,
    completed_at text,
    assignment_json text DEFAULT '{}' NOT NULL,
    source_progress_revision integer NOT NULL,
    projection_version integer DEFAULT 1 NOT NULL,
    rebuilt_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(learner_id, program_version_id, assignment_id),
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_pathway_snapshots(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    CONSTRAINT learner_today_assignment_rows_subject_check
      CHECK((subject_kind = 'learning_unit' AND learning_unit_id = subject_id AND assessment_version_id IS NULL) OR (subject_kind = 'assessment_version' AND assessment_version_id = subject_id)),
    CONSTRAINT learner_today_assignment_rows_task_kind_check
      CHECK(task_kind IN ('study', 'project', 'midterm', 'final', 'assessment')),
    CONSTRAINT learner_today_assignment_rows_date_check
      CHECK(length(scheduled_date) = 10 AND date(scheduled_date) = scheduled_date AND length(deadline_date) = 10 AND date(deadline_date) = deadline_date),
    CONSTRAINT learner_today_assignment_rows_start_time_check
      CHECK(start_time IS NULL OR (length(start_time) = 5 AND start_time GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(start_time, 1, 2) <= '23')),
    CONSTRAINT learner_today_assignment_rows_values_check
      CHECK(planned_minutes > 0 AND position >= 0 AND source_progress_revision >= 0),
    CONSTRAINT learner_today_assignment_rows_status_check
      CHECK(status IN ('planned', 'completed', 'skipped', 'carried', 'cancelled')),
    CONSTRAINT learner_today_assignment_rows_completion_check
      CHECK((status = 'completed' AND completed_at IS NOT NULL) OR (status <> 'completed' AND completed_at IS NULL)),
    CONSTRAINT learner_today_assignment_rows_assignment_check
      CHECK(json_valid(assignment_json) AND json_type(assignment_json) = 'object'),
    CONSTRAINT learner_today_assignment_rows_projection_version_check
      CHECK(projection_version > 0)
  )`,
  `CREATE TABLE IF NOT EXISTS learner_transcript_rows (
    learner_id text NOT NULL,
    program_version_id text NOT NULL,
    course_version_id text NOT NULL,
    course_canonical_slug text NOT NULL,
    code text NOT NULL,
    title text NOT NULL,
    format text NOT NULL,
    position integer NOT NULL,
    nominal_hours integer NOT NULL,
    total_units integer NOT NULL,
    completed_units integer NOT NULL,
    completed_learning_hours real NOT NULL,
    mastery_state text NOT NULL,
    passed integer NOT NULL,
    weighted_score_percentage real,
    assessment_hours real NOT NULL,
    assessment_count integer NOT NULL,
    assessment_attempt_count integer NOT NULL,
    project_count integer NOT NULL,
    evidenced_project_count integer NOT NULL,
    evidence_count integer NOT NULL,
    assessments_json text DEFAULT '[]' NOT NULL,
    projects_json text DEFAULT '[]' NOT NULL,
    evidence_json text DEFAULT '[]' NOT NULL,
    source_progress_revision integer NOT NULL,
    projection_version integer DEFAULT 1 NOT NULL,
    rebuilt_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY(learner_id, program_version_id, course_version_id),
    FOREIGN KEY (learner_id, program_version_id)
      REFERENCES learner_pathway_snapshots(learner_id, program_version_id)
      ON UPDATE cascade
      ON DELETE cascade,
    CONSTRAINT learner_transcript_rows_values_check
      CHECK(position >= 0 AND nominal_hours >= 0 AND total_units >= 0 AND completed_units >= 0 AND completed_units <= total_units AND completed_learning_hours >= 0 AND assessment_hours >= 0 AND assessment_count >= 0 AND assessment_attempt_count >= 0 AND project_count >= 0 AND evidenced_project_count >= 0 AND evidenced_project_count <= project_count AND evidence_count >= 0 AND source_progress_revision >= 0),
    CONSTRAINT learner_transcript_rows_mastery_state_check
      CHECK(mastery_state IN ('not-started', 'studying', 'assessment-due', 'submitted', 'evaluated', 'passed', 'retry')),
    CONSTRAINT learner_transcript_rows_score_check
      CHECK(weighted_score_percentage IS NULL OR weighted_score_percentage BETWEEN 0 AND 100),
    CONSTRAINT learner_transcript_rows_assessments_check
      CHECK(json_valid(assessments_json) AND json_type(assessments_json) = 'array'),
    CONSTRAINT learner_transcript_rows_projects_check
      CHECK(json_valid(projects_json) AND json_type(projects_json) = 'array'),
    CONSTRAINT learner_transcript_rows_evidence_check
      CHECK(json_valid(evidence_json) AND json_type(evidence_json) = 'array'),
    CONSTRAINT learner_transcript_rows_projection_version_check
      CHECK(projection_version > 0)
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
    catalog_program_summaries_bundle_unique
    ON catalog_program_summaries(bundle_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS
    catalog_program_summaries_slug_version_unique
    ON catalog_program_summaries(canonical_slug, semantic_version)`,
  `CREATE INDEX IF NOT EXISTS
    catalog_program_summaries_active_title_idx
    ON catalog_program_summaries(
      is_active,
      title_sort_key,
      program_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    catalog_program_summaries_discipline_title_idx
    ON catalog_program_summaries(
      is_active,
      discipline,
      title_sort_key,
      program_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    catalog_program_summaries_kind_title_idx
    ON catalog_program_summaries(
      is_active,
      kind,
      title_sort_key,
      program_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    catalog_program_summaries_published_idx
    ON catalog_program_summaries(
      is_active,
      published_at,
      program_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    catalog_course_search_rows_program_position_idx
    ON catalog_course_search_rows(
      program_version_id,
      position,
      course_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    catalog_course_search_rows_active_title_idx
    ON catalog_course_search_rows(
      is_active,
      title_sort_key,
      program_version_id,
      course_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    catalog_course_search_rows_active_code_idx
    ON catalog_course_search_rows(
      is_active,
      code_sort_key,
      program_version_id,
      course_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    catalog_course_search_rows_active_slug_idx
    ON catalog_course_search_rows(
      is_active,
      canonical_slug,
      program_version_id,
      course_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    catalog_course_search_rows_discipline_title_idx
    ON catalog_course_search_rows(
      is_active,
      discipline,
      title_sort_key,
      program_version_id,
      course_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    catalog_course_search_rows_format_title_idx
    ON catalog_course_search_rows(
      is_active,
      format,
      title_sort_key,
      program_version_id,
      course_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    catalog_course_search_terms_lookup_idx
    ON catalog_course_search_terms(
      term,
      weight,
      program_version_id,
      course_version_id
    )`,
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
  `CREATE INDEX IF NOT EXISTS
    learner_pathway_snapshots_revision_idx
    ON learner_pathway_snapshots(
      learner_id,
      source_progress_revision,
      program_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_pathway_course_rows_order_idx
    ON learner_pathway_course_rows(
      learner_id,
      program_version_id,
      position,
      course_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_pathway_course_rows_period_idx
    ON learner_pathway_course_rows(
      learner_id,
      program_version_id,
      period_id,
      position
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_term_schedule_rows_order_idx
    ON learner_term_schedule_rows(
      learner_id,
      program_version_id,
      position
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_term_schedule_rows_date_idx
    ON learner_term_schedule_rows(
      learner_id,
      program_version_id,
      start_date,
      end_date
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_term_schedule_rows_status_idx
    ON learner_term_schedule_rows(
      learner_id,
      program_version_id,
      status,
      start_date
    )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS
    learner_today_assignment_rows_schedule_entry_unique
    ON learner_today_assignment_rows(
      learner_id,
      program_version_id,
      schedule_entry_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_today_assignment_rows_day_idx
    ON learner_today_assignment_rows(
      learner_id,
      program_version_id,
      scheduled_date,
      position
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_today_assignment_rows_day_status_idx
    ON learner_today_assignment_rows(
      learner_id,
      program_version_id,
      scheduled_date,
      status,
      position
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_today_assignment_rows_course_day_idx
    ON learner_today_assignment_rows(
      learner_id,
      program_version_id,
      course_version_id,
      scheduled_date
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_transcript_rows_order_idx
    ON learner_transcript_rows(
      learner_id,
      program_version_id,
      position,
      course_version_id
    )`,
  `CREATE INDEX IF NOT EXISTS
    learner_transcript_rows_passed_idx
    ON learner_transcript_rows(
      learner_id,
      program_version_id,
      passed,
      position
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
