CREATE TABLE `learner_assessment_attempts` (
	`id` text NOT NULL,
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`course_version_id` text NOT NULL,
	`assessment_version_id` text NOT NULL,
	`attempt_number` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`submission_text` text,
	`submission_url` text,
	`submission_evidence_json` text DEFAULT '[]' NOT NULL,
	`score` real,
	`maximum_score` real,
	`passed` integer,
	`evaluation_method` text,
	`feedback` text,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`submitted_at` text,
	`evaluated_at` text,
	`last_mutation_id` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`, `id`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_program_progress`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "learner_assessment_attempts_number_check" CHECK("learner_assessment_attempts"."attempt_number" > 0),
	CONSTRAINT "learner_assessment_attempts_score_check" CHECK(("learner_assessment_attempts"."score" IS NULL AND "learner_assessment_attempts"."maximum_score" IS NULL)
        OR ("learner_assessment_attempts"."score" IS NOT NULL AND "learner_assessment_attempts"."maximum_score" IS NOT NULL AND "learner_assessment_attempts"."score" >= 0 AND "learner_assessment_attempts"."maximum_score" > 0 AND "learner_assessment_attempts"."score" <= "learner_assessment_attempts"."maximum_score")),
	CONSTRAINT "learner_assessment_attempts_evidence_check" CHECK(json_valid("learner_assessment_attempts"."submission_evidence_json") AND json_type("learner_assessment_attempts"."submission_evidence_json") = 'array'),
	CONSTRAINT "learner_assessment_attempts_evaluation_method_check" CHECK("learner_assessment_attempts"."evaluation_method" IS NULL OR "learner_assessment_attempts"."evaluation_method" IN ('self', 'automatic', 'peer', 'instructor')),
	CONSTRAINT "learner_assessment_attempts_passed_check" CHECK("learner_assessment_attempts"."passed" IS NULL OR "learner_assessment_attempts"."passed" IN (0, 1)),
	CONSTRAINT "learner_assessment_attempts_lifecycle_check" CHECK(("learner_assessment_attempts"."status" = 'draft' AND "learner_assessment_attempts"."submitted_at" IS NULL AND "learner_assessment_attempts"."evaluated_at" IS NULL)
        OR ("learner_assessment_attempts"."status" = 'submitted' AND "learner_assessment_attempts"."submitted_at" IS NOT NULL AND "learner_assessment_attempts"."evaluated_at" IS NULL)
        OR ("learner_assessment_attempts"."status" = 'evaluated' AND "learner_assessment_attempts"."submitted_at" IS NOT NULL AND "learner_assessment_attempts"."evaluated_at" IS NOT NULL AND "learner_assessment_attempts"."passed" IS NOT NULL AND "learner_assessment_attempts"."evaluation_method" IS NOT NULL)
        OR "learner_assessment_attempts"."status" = 'void')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learner_assessment_attempts_number_unique` ON `learner_assessment_attempts` (`learner_id`,`program_version_id`,`assessment_version_id`,`attempt_number`);--> statement-breakpoint
CREATE INDEX `learner_assessment_attempts_course_idx` ON `learner_assessment_attempts` (`learner_id`,`program_version_id`,`course_version_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `learner_assessment_attempts_status_idx` ON `learner_assessment_attempts` (`learner_id`,`program_version_id`,`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `learner_prerequisite_waivers` (
	`id` text NOT NULL,
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`course_version_id` text NOT NULL,
	`prerequisite_course_version_id` text NOT NULL,
	`basis` text NOT NULL,
	`reason` text NOT NULL,
	`evidence_text_or_url` text,
	`granted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`revoked_at` text,
	`last_mutation_id` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`, `id`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_program_progress`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "learner_prerequisite_waivers_distinct_courses_check" CHECK("learner_prerequisite_waivers"."course_version_id" <> "learner_prerequisite_waivers"."prerequisite_course_version_id"),
	CONSTRAINT "learner_prerequisite_waivers_reason_check" CHECK(length(trim("learner_prerequisite_waivers"."reason")) > 0),
	CONSTRAINT "learner_prerequisite_waivers_basis_check" CHECK("learner_prerequisite_waivers"."basis" IN ('placement', 'prior_learning', 'review', 'manual'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learner_prerequisite_waivers_active_unique` ON `learner_prerequisite_waivers` (`learner_id`,`program_version_id`,`course_version_id`,`prerequisite_course_version_id`) WHERE "learner_prerequisite_waivers"."revoked_at" IS NULL;--> statement-breakpoint
CREATE INDEX `learner_prerequisite_waivers_course_idx` ON `learner_prerequisite_waivers` (`learner_id`,`program_version_id`,`course_version_id`,`revoked_at`);--> statement-breakpoint
CREATE TABLE `learner_program_states` (
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`last_mutation_id` text,
	`enrollment_status` text DEFAULT 'not_enrolled' NOT NULL,
	`start_date` text,
	`pace_hours_per_week` real,
	`study_days_json` text DEFAULT '[]' NOT NULL,
	`timezone` text,
	`enrolled_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_program_progress`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "learner_program_states_revision_check" CHECK("learner_program_states"."revision" >= 0),
	CONSTRAINT "learner_program_states_enrollment_status_check" CHECK("learner_program_states"."enrollment_status" IN ('not_enrolled', 'enrolled', 'paused', 'completed')),
	CONSTRAINT "learner_program_states_start_date_check" CHECK("learner_program_states"."start_date" IS NULL OR (length("learner_program_states"."start_date") = 10 AND date("learner_program_states"."start_date") = "learner_program_states"."start_date")),
	CONSTRAINT "learner_program_states_pace_check" CHECK("learner_program_states"."pace_hours_per_week" IS NULL OR ("learner_program_states"."pace_hours_per_week" > 0 AND "learner_program_states"."pace_hours_per_week" <= 168)),
	CONSTRAINT "learner_program_states_study_days_check" CHECK(json_valid("learner_program_states"."study_days_json") AND json_type("learner_program_states"."study_days_json") = 'array'),
	CONSTRAINT "learner_program_states_timezone_check" CHECK("learner_program_states"."timezone" IS NULL OR length(trim("learner_program_states"."timezone")) > 0)
);
--> statement-breakpoint
CREATE INDEX `learner_program_states_status_idx` ON `learner_program_states` (`learner_id`,`enrollment_status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `learner_progress_events` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`mutation_id` text,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_json` text DEFAULT '{}' NOT NULL,
	`occurred_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_program_progress`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`learner_id`,`program_version_id`,`mutation_id`) REFERENCES `learner_progress_mutations`(`learner_id`,`program_version_id`,`mutation_id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "learner_progress_events_entity_check" CHECK(length(trim("learner_progress_events"."entity_id")) > 0 AND length(trim("learner_progress_events"."event_type")) > 0),
	CONSTRAINT "learner_progress_events_payload_check" CHECK(json_valid("learner_progress_events"."payload_json") AND json_type("learner_progress_events"."payload_json") = 'object')
);
--> statement-breakpoint
CREATE INDEX `learner_progress_events_program_time_idx` ON `learner_progress_events` (`learner_id`,`program_version_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `learner_progress_events_entity_time_idx` ON `learner_progress_events` (`learner_id`,`program_version_id`,`entity_type`,`entity_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `learner_progress_mutations` (
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`mutation_id` text NOT NULL,
	`device_id` text NOT NULL,
	`base_revision` integer NOT NULL,
	`result_revision` integer NOT NULL,
	`payload_hash` text NOT NULL,
	`applied_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`, `mutation_id`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_program_progress`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "learner_progress_mutations_revision_check" CHECK("learner_progress_mutations"."base_revision" >= 0 AND "learner_progress_mutations"."result_revision" = "learner_progress_mutations"."base_revision" + 1),
	CONSTRAINT "learner_progress_mutations_hash_check" CHECK(length("learner_progress_mutations"."payload_hash") = 64),
	CONSTRAINT "learner_progress_mutations_device_check" CHECK(length(trim("learner_progress_mutations"."device_id")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learner_progress_mutations_revision_unique` ON `learner_progress_mutations` (`learner_id`,`program_version_id`,`result_revision`);--> statement-breakpoint
CREATE TABLE `learner_requirement_selections` (
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`requirement_group_id` text NOT NULL,
	`requirement_option_id` text NOT NULL,
	`course_version_id` text NOT NULL,
	`selection_source` text DEFAULT 'learner' NOT NULL,
	`selected_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`, `requirement_group_id`, `requirement_option_id`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_program_progress`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "learner_requirement_selections_source_check" CHECK("learner_requirement_selections"."selection_source" IN ('learner', 'default', 'import'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learner_requirement_selections_group_course_unique` ON `learner_requirement_selections` (`learner_id`,`program_version_id`,`requirement_group_id`,`course_version_id`);--> statement-breakpoint
CREATE INDEX `learner_requirement_selections_course_idx` ON `learner_requirement_selections` (`learner_id`,`program_version_id`,`course_version_id`);--> statement-breakpoint
CREATE TABLE `learner_schedule_entries` (
	`id` text NOT NULL,
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`course_version_id` text NOT NULL,
	`learning_unit_id` text,
	`assessment_version_id` text,
	`scheduled_date` text NOT NULL,
	`start_time` text,
	`planned_minutes` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`source_placement_id` text,
	`origin_entry_id` text,
	`completed_at` text,
	`last_mutation_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`, `id`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_program_progress`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`learner_id`,`program_version_id`,`origin_entry_id`) REFERENCES `learner_schedule_entries`(`learner_id`,`program_version_id`,`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "learner_schedule_entries_subject_check" CHECK("learner_schedule_entries"."learning_unit_id" IS NULL OR "learner_schedule_entries"."assessment_version_id" IS NULL),
	CONSTRAINT "learner_schedule_entries_date_check" CHECK(length("learner_schedule_entries"."scheduled_date") = 10 AND date("learner_schedule_entries"."scheduled_date") = "learner_schedule_entries"."scheduled_date"),
	CONSTRAINT "learner_schedule_entries_start_time_check" CHECK("learner_schedule_entries"."start_time" IS NULL OR (length("learner_schedule_entries"."start_time") = 5 AND "learner_schedule_entries"."start_time" GLOB '[0-2][0-9]:[0-5][0-9]' AND substr("learner_schedule_entries"."start_time", 1, 2) <= '23')),
	CONSTRAINT "learner_schedule_entries_minutes_check" CHECK("learner_schedule_entries"."planned_minutes" > 0),
	CONSTRAINT "learner_schedule_entries_position_check" CHECK("learner_schedule_entries"."position" >= 0),
	CONSTRAINT "learner_schedule_entries_status_check" CHECK("learner_schedule_entries"."status" IN ('planned', 'completed', 'skipped', 'carried', 'cancelled')),
	CONSTRAINT "learner_schedule_entries_completion_check" CHECK(("learner_schedule_entries"."status" = 'completed' AND "learner_schedule_entries"."completed_at" IS NOT NULL)
        OR ("learner_schedule_entries"."status" <> 'completed' AND "learner_schedule_entries"."completed_at" IS NULL))
);
--> statement-breakpoint
CREATE INDEX `learner_schedule_entries_day_idx` ON `learner_schedule_entries` (`learner_id`,`program_version_id`,`scheduled_date`,`position`);--> statement-breakpoint
CREATE INDEX `learner_schedule_entries_status_day_idx` ON `learner_schedule_entries` (`learner_id`,`program_version_id`,`status`,`scheduled_date`);--> statement-breakpoint
CREATE TABLE `learner_unit_evidence` (
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`course_version_id` text NOT NULL,
	`learning_unit_id` text NOT NULL,
	`status` text NOT NULL,
	`text_or_url` text,
	`submitted_at` text,
	`tombstoned_at` text,
	`last_mutation_id` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`, `course_version_id`, `learning_unit_id`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_program_progress`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "learner_unit_evidence_status_payload_check" CHECK(("learner_unit_evidence"."status" = 'active' AND length(trim("learner_unit_evidence"."text_or_url")) > 0 AND "learner_unit_evidence"."submitted_at" IS NOT NULL AND "learner_unit_evidence"."tombstoned_at" IS NULL)
        OR ("learner_unit_evidence"."status" = 'tombstoned' AND "learner_unit_evidence"."text_or_url" IS NULL AND "learner_unit_evidence"."submitted_at" IS NULL AND "learner_unit_evidence"."tombstoned_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX `learner_unit_evidence_program_updated_idx` ON `learner_unit_evidence` (`learner_id`,`program_version_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `learner_unit_states` (
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`course_version_id` text NOT NULL,
	`learning_unit_id` text NOT NULL,
	`status` text NOT NULL,
	`completed_at` text,
	`tombstoned_at` text,
	`last_mutation_id` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`, `course_version_id`, `learning_unit_id`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_program_progress`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "learner_unit_states_status_timestamps_check" CHECK(("learner_unit_states"."status" = 'completed' AND "learner_unit_states"."completed_at" IS NOT NULL AND "learner_unit_states"."tombstoned_at" IS NULL)
        OR ("learner_unit_states"."status" = 'tombstoned' AND "learner_unit_states"."completed_at" IS NULL AND "learner_unit_states"."tombstoned_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX `learner_unit_states_program_status_idx` ON `learner_unit_states` (`learner_id`,`program_version_id`,`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `learner_unit_states_course_idx` ON `learner_unit_states` (`learner_id`,`program_version_id`,`course_version_id`,`status`);
--> statement-breakpoint
INSERT INTO learner_program_states (
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
ON CONFLICT(learner_id, program_version_id) DO NOTHING;
--> statement-breakpoint
INSERT INTO learner_unit_states (
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
) DO NOTHING;
--> statement-breakpoint
PRAGMA optimize;
