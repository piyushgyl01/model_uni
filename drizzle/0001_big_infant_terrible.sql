CREATE TABLE `catalog_bundle_payload_chunks` (
	`bundle_id` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`payload_chunk` text NOT NULL,
	PRIMARY KEY(`bundle_id`, `chunk_index`),
	FOREIGN KEY (`bundle_id`) REFERENCES `catalog_bundles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "catalog_bundle_payload_chunks_index_check" CHECK("catalog_bundle_payload_chunks"."chunk_index" >= 0),
	CONSTRAINT "catalog_bundle_payload_chunks_size_check" CHECK(length(CAST("catalog_bundle_payload_chunks"."payload_chunk" AS BLOB)) <= 250000)
);
--> statement-breakpoint
CREATE TABLE `catalog_bundles` (
	`id` text PRIMARY KEY NOT NULL,
	`schema_version` integer NOT NULL,
	`program_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`canonical_slug` text NOT NULL,
	`semantic_version` text NOT NULL,
	`published_at` text NOT NULL,
	`payload_hash` text NOT NULL,
	`summary_json` text NOT NULL,
	`seeded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "catalog_bundles_schema_version_check" CHECK("catalog_bundles"."schema_version" > 0),
	CONSTRAINT "catalog_bundles_payload_hash_check" CHECK(length("catalog_bundles"."payload_hash") = 64)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_bundles_program_version_id_unique` ON `catalog_bundles` (`program_version_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_bundles_program_semver_unique` ON `catalog_bundles` (`program_id`,`semantic_version`);--> statement-breakpoint
CREATE UNIQUE INDEX `catalog_bundles_id_program_version_unique` ON `catalog_bundles` (`id`,`program_version_id`);--> statement-breakpoint
CREATE INDEX `catalog_bundles_slug_idx` ON `catalog_bundles` (`canonical_slug`,`semantic_version`);--> statement-breakpoint
CREATE TABLE `learner_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_subject` text NOT NULL,
	`email` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learners`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "learner_accounts_provider_check" CHECK(length(trim("learner_accounts"."provider")) > 0),
	CONSTRAINT "learner_accounts_subject_check" CHECK(length(trim("learner_accounts"."provider_subject")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learner_accounts_provider_subject_unique` ON `learner_accounts` (`provider`,`provider_subject`);--> statement-breakpoint
CREATE INDEX `learner_accounts_learner_idx` ON `learner_accounts` (`learner_id`);--> statement-breakpoint
CREATE TABLE `learner_program_progress` (
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`bundle_id` text NOT NULL,
	`selected_concentration_id` text,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`),
	FOREIGN KEY (`learner_id`) REFERENCES `learners`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bundle_id`,`program_version_id`) REFERENCES `catalog_bundles`(`id`,`program_version_id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `learner_program_progress_bundle_idx` ON `learner_program_progress` (`bundle_id`);--> statement-breakpoint
CREATE INDEX `learner_program_progress_updated_idx` ON `learner_program_progress` (`updated_at`);--> statement-breakpoint
CREATE TABLE `learner_progress_imports` (
	`learner_id` text NOT NULL,
	`client_import_id` text NOT NULL,
	`storage_namespace` text NOT NULL,
	`disposition` text NOT NULL,
	`payload_hash` text NOT NULL,
	`imported_unit_count` integer DEFAULT 0 NOT NULL,
	`confirmed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `client_import_id`),
	FOREIGN KEY (`learner_id`) REFERENCES `learners`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "learner_progress_imports_namespace_check" CHECK(length(trim("learner_progress_imports"."storage_namespace")) > 0),
	CONSTRAINT "learner_progress_imports_hash_check" CHECK(length("learner_progress_imports"."payload_hash") = 64),
	CONSTRAINT "learner_progress_imports_count_check" CHECK("learner_progress_imports"."imported_unit_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX `learner_progress_imports_confirmed_idx` ON `learner_progress_imports` (`learner_id`,`confirmed_at`);--> statement-breakpoint
CREATE TABLE `learner_unit_completions` (
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`course_version_id` text NOT NULL,
	`learning_unit_id` text NOT NULL,
	`completed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`, `course_version_id`, `learning_unit_id`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_program_progress`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `learner_unit_completions_program_idx` ON `learner_unit_completions` (`learner_id`,`program_version_id`);--> statement-breakpoint
CREATE INDEX `learner_unit_completions_course_idx` ON `learner_unit_completions` (`learner_id`,`program_version_id`,`course_version_id`);--> statement-breakpoint
CREATE TABLE `learners` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
