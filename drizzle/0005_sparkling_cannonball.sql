CREATE TABLE `catalog_course_search_rows` (
	`program_version_id` text NOT NULL,
	`course_version_id` text NOT NULL,
	`bundle_id` text NOT NULL,
	`program_id` text NOT NULL,
	`program_canonical_slug` text NOT NULL,
	`program_title` text NOT NULL,
	`course_id` text NOT NULL,
	`canonical_slug` text NOT NULL,
	`semantic_version` text NOT NULL,
	`primary_code` text,
	`codes_json` text DEFAULT '[]' NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`discipline` text NOT NULL,
	`format` text NOT NULL,
	`nominal_hours` integer NOT NULL,
	`position` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`title_sort_key` text NOT NULL,
	`code_sort_key` text,
	`search_text` text NOT NULL,
	`source_payload_hash` text NOT NULL,
	`projection_version` integer DEFAULT 1 NOT NULL,
	`rebuilt_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`program_version_id`, `course_version_id`),
	FOREIGN KEY (`bundle_id`,`program_version_id`) REFERENCES `catalog_bundles`(`id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "catalog_course_search_rows_nonnegative_values_check" CHECK("catalog_course_search_rows"."nominal_hours" >= 0 AND "catalog_course_search_rows"."position" >= 0),
	CONSTRAINT "catalog_course_search_rows_codes_check" CHECK(json_valid("catalog_course_search_rows"."codes_json") AND json_type("catalog_course_search_rows"."codes_json") = 'array'),
	CONSTRAINT "catalog_course_search_rows_source_hash_check" CHECK(length("catalog_course_search_rows"."source_payload_hash") = 64),
	CONSTRAINT "catalog_course_search_rows_projection_version_check" CHECK("catalog_course_search_rows"."projection_version" > 0),
	CONSTRAINT "catalog_course_search_rows_search_keys_check" CHECK(length(trim("catalog_course_search_rows"."title_sort_key")) > 0 AND length(trim("catalog_course_search_rows"."search_text")) > 0)
);
--> statement-breakpoint
CREATE INDEX `catalog_course_search_rows_program_position_idx` ON `catalog_course_search_rows` (`program_version_id`,`position`,`course_version_id`);--> statement-breakpoint
CREATE INDEX `catalog_course_search_rows_active_title_idx` ON `catalog_course_search_rows` (`is_active`,`title_sort_key`,`program_version_id`,`course_version_id`);--> statement-breakpoint
CREATE INDEX `catalog_course_search_rows_active_code_idx` ON `catalog_course_search_rows` (`is_active`,`code_sort_key`,`program_version_id`,`course_version_id`);--> statement-breakpoint
CREATE INDEX `catalog_course_search_rows_active_slug_idx` ON `catalog_course_search_rows` (`is_active`,`canonical_slug`,`program_version_id`,`course_version_id`);--> statement-breakpoint
CREATE INDEX `catalog_course_search_rows_discipline_title_idx` ON `catalog_course_search_rows` (`is_active`,`discipline`,`title_sort_key`,`program_version_id`,`course_version_id`);--> statement-breakpoint
CREATE INDEX `catalog_course_search_rows_format_title_idx` ON `catalog_course_search_rows` (`is_active`,`format`,`title_sort_key`,`program_version_id`,`course_version_id`);--> statement-breakpoint
CREATE TABLE `catalog_course_search_terms` (
	`program_version_id` text NOT NULL,
	`course_version_id` text NOT NULL,
	`term` text NOT NULL,
	`field` text NOT NULL,
	`weight` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`program_version_id`, `course_version_id`, `term`, `field`),
	FOREIGN KEY (`program_version_id`,`course_version_id`) REFERENCES `catalog_course_search_rows`(`program_version_id`,`course_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "catalog_course_search_terms_term_check" CHECK(length(trim("catalog_course_search_terms"."term")) > 0),
	CONSTRAINT "catalog_course_search_terms_field_check" CHECK("catalog_course_search_terms"."field" IN ('title', 'code', 'slug', 'discipline', 'summary', 'outcome')),
	CONSTRAINT "catalog_course_search_terms_weight_check" CHECK("catalog_course_search_terms"."weight" > 0)
);
--> statement-breakpoint
CREATE INDEX `catalog_course_search_terms_lookup_idx` ON `catalog_course_search_terms` (`term`,`weight`,`program_version_id`,`course_version_id`);--> statement-breakpoint
CREATE TABLE `catalog_program_summaries` (
	`program_version_id` text PRIMARY KEY NOT NULL,
	`bundle_id` text NOT NULL,
	`program_id` text NOT NULL,
	`canonical_slug` text NOT NULL,
	`semantic_version` text NOT NULL,
	`title` text NOT NULL,
	`short_title` text,
	`school` text NOT NULL,
	`discipline` text NOT NULL,
	`kind` text NOT NULL,
	`credential_label` text NOT NULL,
	`lifecycle` text DEFAULT 'active' NOT NULL,
	`summary` text NOT NULL,
	`nominal_duration` text NOT NULL,
	`nominal_hours` integer NOT NULL,
	`course_count` integer NOT NULL,
	`available_course_count` integer NOT NULL,
	`learning_unit_count` integer NOT NULL,
	`assessment_count` integer NOT NULL,
	`resource_count` integer NOT NULL,
	`concentration_count` integer NOT NULL,
	`published_at` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`title_sort_key` text NOT NULL,
	`search_text` text NOT NULL,
	`source_payload_hash` text NOT NULL,
	`projection_version` integer DEFAULT 1 NOT NULL,
	`rebuilt_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`bundle_id`,`program_version_id`) REFERENCES `catalog_bundles`(`id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "catalog_program_summaries_counts_check" CHECK("catalog_program_summaries"."nominal_hours" >= 0 AND "catalog_program_summaries"."course_count" >= 0 AND "catalog_program_summaries"."available_course_count" >= "catalog_program_summaries"."course_count" AND "catalog_program_summaries"."learning_unit_count" >= 0 AND "catalog_program_summaries"."assessment_count" >= 0 AND "catalog_program_summaries"."resource_count" >= 0 AND "catalog_program_summaries"."concentration_count" >= 0),
	CONSTRAINT "catalog_program_summaries_lifecycle_check" CHECK("catalog_program_summaries"."lifecycle" IN ('active', 'retired')),
	CONSTRAINT "catalog_program_summaries_source_hash_check" CHECK(length("catalog_program_summaries"."source_payload_hash") = 64),
	CONSTRAINT "catalog_program_summaries_projection_version_check" CHECK("catalog_program_summaries"."projection_version" > 0),
	CONSTRAINT "catalog_program_summaries_search_keys_check" CHECK(length(trim("catalog_program_summaries"."title_sort_key")) > 0 AND length(trim("catalog_program_summaries"."search_text")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_program_summaries_bundle_unique` ON `catalog_program_summaries` (`bundle_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_program_summaries_slug_version_unique` ON `catalog_program_summaries` (`canonical_slug`,`semantic_version`);--> statement-breakpoint
CREATE INDEX `catalog_program_summaries_active_title_idx` ON `catalog_program_summaries` (`is_active`,`title_sort_key`,`program_version_id`);--> statement-breakpoint
CREATE INDEX `catalog_program_summaries_discipline_title_idx` ON `catalog_program_summaries` (`is_active`,`discipline`,`title_sort_key`,`program_version_id`);--> statement-breakpoint
CREATE INDEX `catalog_program_summaries_kind_title_idx` ON `catalog_program_summaries` (`is_active`,`kind`,`title_sort_key`,`program_version_id`);--> statement-breakpoint
CREATE INDEX `catalog_program_summaries_published_idx` ON `catalog_program_summaries` (`is_active`,`published_at`,`program_version_id`);--> statement-breakpoint
CREATE TABLE `learner_pathway_course_rows` (
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`course_version_id` text NOT NULL,
	`course_id` text NOT NULL,
	`canonical_slug` text NOT NULL,
	`code` text,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`format` text NOT NULL,
	`nominal_hours` integer NOT NULL,
	`position` integer NOT NULL,
	`period_id` text,
	`period_label` text,
	`requirement_group_ids_json` text DEFAULT '[]' NOT NULL,
	`prerequisite_course_version_ids_json` text DEFAULT '[]' NOT NULL,
	`learning_unit_count` integer NOT NULL,
	`assessment_count` integer NOT NULL,
	`source_progress_revision` integer NOT NULL,
	`projection_version` integer DEFAULT 1 NOT NULL,
	`rebuilt_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`, `course_version_id`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_pathway_snapshots`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "learner_pathway_course_rows_values_check" CHECK("learner_pathway_course_rows"."nominal_hours" >= 0 AND "learner_pathway_course_rows"."position" >= 0 AND "learner_pathway_course_rows"."learning_unit_count" >= 0 AND "learner_pathway_course_rows"."assessment_count" >= 0 AND "learner_pathway_course_rows"."source_progress_revision" >= 0),
	CONSTRAINT "learner_pathway_course_rows_requirements_check" CHECK(json_valid("learner_pathway_course_rows"."requirement_group_ids_json") AND json_type("learner_pathway_course_rows"."requirement_group_ids_json") = 'array'),
	CONSTRAINT "learner_pathway_course_rows_prerequisites_check" CHECK(json_valid("learner_pathway_course_rows"."prerequisite_course_version_ids_json") AND json_type("learner_pathway_course_rows"."prerequisite_course_version_ids_json") = 'array'),
	CONSTRAINT "learner_pathway_course_rows_projection_version_check" CHECK("learner_pathway_course_rows"."projection_version" > 0)
);
--> statement-breakpoint
CREATE INDEX `learner_pathway_course_rows_order_idx` ON `learner_pathway_course_rows` (`learner_id`,`program_version_id`,`position`,`course_version_id`);--> statement-breakpoint
CREATE INDEX `learner_pathway_course_rows_period_idx` ON `learner_pathway_course_rows` (`learner_id`,`program_version_id`,`period_id`,`position`);--> statement-breakpoint
CREATE TABLE `learner_pathway_snapshots` (
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`bundle_id` text NOT NULL,
	`source_progress_revision` integer NOT NULL,
	`calendar_as_of_date` text NOT NULL,
	`selected_concentration_id` text,
	`selected_concentration_title` text,
	`path_resolved` integer NOT NULL,
	`requirements_satisfied` integer NOT NULL,
	`course_count` integer NOT NULL,
	`learning_unit_count` integer NOT NULL,
	`assessment_count` integer NOT NULL,
	`nominal_hours` integer NOT NULL,
	`requirement_evaluation_json` text NOT NULL,
	`diagnostics_json` text DEFAULT '[]' NOT NULL,
	`calendar_summary_json` text DEFAULT '{}' NOT NULL,
	`source_payload_hash` text NOT NULL,
	`projection_version` integer DEFAULT 1 NOT NULL,
	`rebuilt_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_program_progress`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`bundle_id`,`program_version_id`) REFERENCES `catalog_bundles`(`id`,`program_version_id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "learner_pathway_snapshots_revision_check" CHECK("learner_pathway_snapshots"."source_progress_revision" >= 0),
	CONSTRAINT "learner_pathway_snapshots_as_of_date_check" CHECK(length("learner_pathway_snapshots"."calendar_as_of_date") = 10 AND date("learner_pathway_snapshots"."calendar_as_of_date") = "learner_pathway_snapshots"."calendar_as_of_date"),
	CONSTRAINT "learner_pathway_snapshots_concentration_title_check" CHECK("learner_pathway_snapshots"."selected_concentration_title" IS NULL OR length(trim("learner_pathway_snapshots"."selected_concentration_title")) > 0),
	CONSTRAINT "learner_pathway_snapshots_counts_check" CHECK("learner_pathway_snapshots"."course_count" >= 0 AND "learner_pathway_snapshots"."learning_unit_count" >= 0 AND "learner_pathway_snapshots"."assessment_count" >= 0 AND "learner_pathway_snapshots"."nominal_hours" >= 0),
	CONSTRAINT "learner_pathway_snapshots_evaluation_check" CHECK(json_valid("learner_pathway_snapshots"."requirement_evaluation_json") AND json_type("learner_pathway_snapshots"."requirement_evaluation_json") = 'object'),
	CONSTRAINT "learner_pathway_snapshots_diagnostics_check" CHECK(json_valid("learner_pathway_snapshots"."diagnostics_json") AND json_type("learner_pathway_snapshots"."diagnostics_json") = 'array'),
	CONSTRAINT "learner_pathway_snapshots_calendar_summary_check" CHECK(json_valid("learner_pathway_snapshots"."calendar_summary_json") AND json_type("learner_pathway_snapshots"."calendar_summary_json") = 'object'),
	CONSTRAINT "learner_pathway_snapshots_source_hash_check" CHECK(length("learner_pathway_snapshots"."source_payload_hash") = 64),
	CONSTRAINT "learner_pathway_snapshots_projection_version_check" CHECK("learner_pathway_snapshots"."projection_version" > 0)
);
--> statement-breakpoint
CREATE INDEX `learner_pathway_snapshots_revision_idx` ON `learner_pathway_snapshots` (`learner_id`,`source_progress_revision`,`program_version_id`);--> statement-breakpoint
CREATE TABLE `learner_term_schedule_rows` (
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`term_key` text NOT NULL,
	`period_id` text,
	`label` text NOT NULL,
	`position` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`status` text NOT NULL,
	`course_version_ids_json` text DEFAULT '[]' NOT NULL,
	`milestones_json` text DEFAULT '[]' NOT NULL,
	`break_start_date` text,
	`break_end_date` text,
	`total_planned_minutes` integer NOT NULL,
	`completed_minutes` integer NOT NULL,
	`source_progress_revision` integer NOT NULL,
	`projection_version` integer DEFAULT 1 NOT NULL,
	`rebuilt_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`, `term_key`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_pathway_snapshots`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "learner_term_schedule_rows_date_check" CHECK(length("learner_term_schedule_rows"."start_date") = 10 AND date("learner_term_schedule_rows"."start_date") = "learner_term_schedule_rows"."start_date" AND length("learner_term_schedule_rows"."end_date") = 10 AND date("learner_term_schedule_rows"."end_date") = "learner_term_schedule_rows"."end_date" AND "learner_term_schedule_rows"."end_date" >= "learner_term_schedule_rows"."start_date"),
	CONSTRAINT "learner_term_schedule_rows_break_check" CHECK(("learner_term_schedule_rows"."break_start_date" IS NULL AND "learner_term_schedule_rows"."break_end_date" IS NULL) OR ("learner_term_schedule_rows"."break_start_date" IS NOT NULL AND "learner_term_schedule_rows"."break_end_date" IS NOT NULL AND date("learner_term_schedule_rows"."break_start_date") = "learner_term_schedule_rows"."break_start_date" AND date("learner_term_schedule_rows"."break_end_date") = "learner_term_schedule_rows"."break_end_date" AND "learner_term_schedule_rows"."break_end_date" >= "learner_term_schedule_rows"."break_start_date")),
	CONSTRAINT "learner_term_schedule_rows_status_check" CHECK("learner_term_schedule_rows"."status" IN ('completed', 'current', 'upcoming')),
	CONSTRAINT "learner_term_schedule_rows_values_check" CHECK("learner_term_schedule_rows"."position" >= 0 AND "learner_term_schedule_rows"."total_planned_minutes" >= 0 AND "learner_term_schedule_rows"."completed_minutes" >= 0 AND "learner_term_schedule_rows"."completed_minutes" <= "learner_term_schedule_rows"."total_planned_minutes" AND "learner_term_schedule_rows"."source_progress_revision" >= 0),
	CONSTRAINT "learner_term_schedule_rows_courses_check" CHECK(json_valid("learner_term_schedule_rows"."course_version_ids_json") AND json_type("learner_term_schedule_rows"."course_version_ids_json") = 'array'),
	CONSTRAINT "learner_term_schedule_rows_milestones_check" CHECK(json_valid("learner_term_schedule_rows"."milestones_json") AND json_type("learner_term_schedule_rows"."milestones_json") = 'array'),
	CONSTRAINT "learner_term_schedule_rows_projection_version_check" CHECK("learner_term_schedule_rows"."projection_version" > 0)
);
--> statement-breakpoint
CREATE INDEX `learner_term_schedule_rows_order_idx` ON `learner_term_schedule_rows` (`learner_id`,`program_version_id`,`position`);--> statement-breakpoint
CREATE INDEX `learner_term_schedule_rows_date_idx` ON `learner_term_schedule_rows` (`learner_id`,`program_version_id`,`start_date`,`end_date`);--> statement-breakpoint
CREATE INDEX `learner_term_schedule_rows_status_idx` ON `learner_term_schedule_rows` (`learner_id`,`program_version_id`,`status`,`start_date`);--> statement-breakpoint
CREATE TABLE `learner_today_assignment_rows` (
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`assignment_id` text NOT NULL,
	`schedule_entry_id` text NOT NULL,
	`course_version_id` text NOT NULL,
	`course_canonical_slug` text NOT NULL,
	`course_title` text NOT NULL,
	`subject_kind` text NOT NULL,
	`subject_id` text NOT NULL,
	`learning_unit_id` text,
	`assessment_version_id` text,
	`term_key` text,
	`period_label` text NOT NULL,
	`task_kind` text NOT NULL,
	`title` text NOT NULL,
	`topic` text NOT NULL,
	`activity` text NOT NULL,
	`where_text` text NOT NULL,
	`resource_url` text,
	`produce` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`deadline_date` text NOT NULL,
	`start_time` text,
	`planned_minutes` integer NOT NULL,
	`position` integer NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`completed_at` text,
	`assignment_json` text DEFAULT '{}' NOT NULL,
	`source_progress_revision` integer NOT NULL,
	`projection_version` integer DEFAULT 1 NOT NULL,
	`rebuilt_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`, `assignment_id`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_pathway_snapshots`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "learner_today_assignment_rows_subject_check" CHECK(("learner_today_assignment_rows"."subject_kind" = 'learning_unit' AND "learner_today_assignment_rows"."learning_unit_id" = "learner_today_assignment_rows"."subject_id" AND "learner_today_assignment_rows"."assessment_version_id" IS NULL) OR ("learner_today_assignment_rows"."subject_kind" = 'assessment_version' AND "learner_today_assignment_rows"."assessment_version_id" = "learner_today_assignment_rows"."subject_id")),
	CONSTRAINT "learner_today_assignment_rows_task_kind_check" CHECK("learner_today_assignment_rows"."task_kind" IN ('study', 'project', 'midterm', 'final', 'assessment')),
	CONSTRAINT "learner_today_assignment_rows_date_check" CHECK(length("learner_today_assignment_rows"."scheduled_date") = 10 AND date("learner_today_assignment_rows"."scheduled_date") = "learner_today_assignment_rows"."scheduled_date" AND length("learner_today_assignment_rows"."deadline_date") = 10 AND date("learner_today_assignment_rows"."deadline_date") = "learner_today_assignment_rows"."deadline_date"),
	CONSTRAINT "learner_today_assignment_rows_start_time_check" CHECK("learner_today_assignment_rows"."start_time" IS NULL OR (length("learner_today_assignment_rows"."start_time") = 5 AND "learner_today_assignment_rows"."start_time" GLOB '[0-2][0-9]:[0-5][0-9]' AND substr("learner_today_assignment_rows"."start_time", 1, 2) <= '23')),
	CONSTRAINT "learner_today_assignment_rows_values_check" CHECK("learner_today_assignment_rows"."planned_minutes" > 0 AND "learner_today_assignment_rows"."position" >= 0 AND "learner_today_assignment_rows"."source_progress_revision" >= 0),
	CONSTRAINT "learner_today_assignment_rows_status_check" CHECK("learner_today_assignment_rows"."status" IN ('planned', 'completed', 'skipped', 'carried', 'cancelled')),
	CONSTRAINT "learner_today_assignment_rows_completion_check" CHECK(("learner_today_assignment_rows"."status" = 'completed' AND "learner_today_assignment_rows"."completed_at" IS NOT NULL) OR ("learner_today_assignment_rows"."status" <> 'completed' AND "learner_today_assignment_rows"."completed_at" IS NULL)),
	CONSTRAINT "learner_today_assignment_rows_assignment_check" CHECK(json_valid("learner_today_assignment_rows"."assignment_json") AND json_type("learner_today_assignment_rows"."assignment_json") = 'object'),
	CONSTRAINT "learner_today_assignment_rows_projection_version_check" CHECK("learner_today_assignment_rows"."projection_version" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learner_today_assignment_rows_schedule_entry_unique` ON `learner_today_assignment_rows` (`learner_id`,`program_version_id`,`schedule_entry_id`);--> statement-breakpoint
CREATE INDEX `learner_today_assignment_rows_day_idx` ON `learner_today_assignment_rows` (`learner_id`,`program_version_id`,`scheduled_date`,`position`);--> statement-breakpoint
CREATE INDEX `learner_today_assignment_rows_day_status_idx` ON `learner_today_assignment_rows` (`learner_id`,`program_version_id`,`scheduled_date`,`status`,`position`);--> statement-breakpoint
CREATE INDEX `learner_today_assignment_rows_course_day_idx` ON `learner_today_assignment_rows` (`learner_id`,`program_version_id`,`course_version_id`,`scheduled_date`);--> statement-breakpoint
CREATE TABLE `learner_transcript_rows` (
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`course_version_id` text NOT NULL,
	`course_canonical_slug` text NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`format` text NOT NULL,
	`position` integer NOT NULL,
	`nominal_hours` integer NOT NULL,
	`total_units` integer NOT NULL,
	`completed_units` integer NOT NULL,
	`completed_learning_hours` real NOT NULL,
	`mastery_state` text NOT NULL,
	`passed` integer NOT NULL,
	`weighted_score_percentage` real,
	`assessment_hours` real NOT NULL,
	`assessment_count` integer NOT NULL,
	`assessment_attempt_count` integer NOT NULL,
	`project_count` integer NOT NULL,
	`evidenced_project_count` integer NOT NULL,
	`evidence_count` integer NOT NULL,
	`assessments_json` text DEFAULT '[]' NOT NULL,
	`projects_json` text DEFAULT '[]' NOT NULL,
	`evidence_json` text DEFAULT '[]' NOT NULL,
	`source_progress_revision` integer NOT NULL,
	`projection_version` integer DEFAULT 1 NOT NULL,
	`rebuilt_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`, `course_version_id`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_pathway_snapshots`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "learner_transcript_rows_values_check" CHECK("learner_transcript_rows"."position" >= 0 AND "learner_transcript_rows"."nominal_hours" >= 0 AND "learner_transcript_rows"."total_units" >= 0 AND "learner_transcript_rows"."completed_units" >= 0 AND "learner_transcript_rows"."completed_units" <= "learner_transcript_rows"."total_units" AND "learner_transcript_rows"."completed_learning_hours" >= 0 AND "learner_transcript_rows"."assessment_hours" >= 0 AND "learner_transcript_rows"."assessment_count" >= 0 AND "learner_transcript_rows"."assessment_attempt_count" >= 0 AND "learner_transcript_rows"."project_count" >= 0 AND "learner_transcript_rows"."evidenced_project_count" >= 0 AND "learner_transcript_rows"."evidenced_project_count" <= "learner_transcript_rows"."project_count" AND "learner_transcript_rows"."evidence_count" >= 0 AND "learner_transcript_rows"."source_progress_revision" >= 0),
	CONSTRAINT "learner_transcript_rows_mastery_state_check" CHECK("learner_transcript_rows"."mastery_state" IN ('not-started', 'studying', 'assessment-due', 'submitted', 'evaluated', 'passed', 'retry')),
	CONSTRAINT "learner_transcript_rows_score_check" CHECK("learner_transcript_rows"."weighted_score_percentage" IS NULL OR "learner_transcript_rows"."weighted_score_percentage" BETWEEN 0 AND 100),
	CONSTRAINT "learner_transcript_rows_assessments_check" CHECK(json_valid("learner_transcript_rows"."assessments_json") AND json_type("learner_transcript_rows"."assessments_json") = 'array'),
	CONSTRAINT "learner_transcript_rows_projects_check" CHECK(json_valid("learner_transcript_rows"."projects_json") AND json_type("learner_transcript_rows"."projects_json") = 'array'),
	CONSTRAINT "learner_transcript_rows_evidence_check" CHECK(json_valid("learner_transcript_rows"."evidence_json") AND json_type("learner_transcript_rows"."evidence_json") = 'array'),
	CONSTRAINT "learner_transcript_rows_projection_version_check" CHECK("learner_transcript_rows"."projection_version" > 0)
);
--> statement-breakpoint
CREATE INDEX `learner_transcript_rows_order_idx` ON `learner_transcript_rows` (`learner_id`,`program_version_id`,`position`,`course_version_id`);--> statement-breakpoint
CREATE INDEX `learner_transcript_rows_passed_idx` ON `learner_transcript_rows` (`learner_id`,`program_version_id`,`passed`,`position`);
--> statement-breakpoint
CREATE TABLE `catalog_projection_state` (
	`release_key` text PRIMARY KEY NOT NULL,
	`manifest_hash` text NOT NULL,
	`bundle_count` integer NOT NULL,
	`active_program_count` integer DEFAULT 0 NOT NULL,
	`minimum_path_course_count` integer DEFAULT 0 NOT NULL,
	`learning_unit_count` integer DEFAULT 0 NOT NULL,
	`nominal_hours` integer DEFAULT 0 NOT NULL,
	`school_count` integer DEFAULT 0 NOT NULL,
	`projection_version` integer NOT NULL,
	`projected_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "catalog_projection_state_release_key_check" CHECK(length(trim("catalog_projection_state"."release_key")) > 0),
	CONSTRAINT "catalog_projection_state_manifest_hash_check" CHECK(length("catalog_projection_state"."manifest_hash") = 64),
	CONSTRAINT "catalog_projection_state_bundle_count_check" CHECK("catalog_projection_state"."bundle_count" >= 0),
	CONSTRAINT "catalog_projection_state_aggregate_counts_check" CHECK("catalog_projection_state"."active_program_count" >= 0 AND "catalog_projection_state"."minimum_path_course_count" >= 0 AND "catalog_projection_state"."learning_unit_count" >= 0 AND "catalog_projection_state"."nominal_hours" >= 0 AND "catalog_projection_state"."school_count" >= 0 AND "catalog_projection_state"."school_count" <= "catalog_projection_state"."active_program_count"),
	CONSTRAINT "catalog_projection_state_projection_version_check" CHECK("catalog_projection_state"."projection_version" > 0)
);
--> statement-breakpoint
PRAGMA optimize;
