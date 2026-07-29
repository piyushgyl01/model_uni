CREATE TABLE `access_offers` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_version_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`url` text NOT NULL,
	`access_model` text DEFAULT 'unknown' NOT NULL,
	`status` text DEFAULT 'unknown' NOT NULL,
	`login_required` integer DEFAULT false NOT NULL,
	`price_minor` integer,
	`currency` text,
	`region_code` text DEFAULT '*' NOT NULL,
	`valid_from` text,
	`valid_until` text,
	`last_checked_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`resource_version_id`) REFERENCES `resource_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "access_offers_nonnegative_price_check" CHECK("access_offers"."price_minor" IS NULL OR "access_offers"."price_minor" >= 0),
	CONSTRAINT "access_offers_price_currency_check" CHECK("access_offers"."price_minor" IS NULL OR "access_offers"."currency" IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `access_offers_resource_url_region_unique` ON `access_offers` (`resource_version_id`,`url`,`region_code`);--> statement-breakpoint
CREATE INDEX `access_offers_status_checked_idx` ON `access_offers` (`status`,`last_checked_at`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_type` text NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`correlation_id` text,
	`before_json` text,
	`after_json` text,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`occurred_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_events_entity_time_idx` ON `audit_events` (`entity_type`,`entity_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `audit_events_correlation_idx` ON `audit_events` (`correlation_id`);--> statement-breakpoint
CREATE TABLE `competencies` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_competency_id` text,
	`framework` text DEFAULT 'course-atlas' NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`parent_competency_id`) REFERENCES `competencies`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `competencies_framework_code_unique` ON `competencies` (`framework`,`code`);--> statement-breakpoint
CREATE INDEX `competencies_parent_idx` ON `competencies` (`parent_competency_id`);--> statement-breakpoint
CREATE TABLE `competency_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`competency_id` text NOT NULL,
	`program_version_id` text,
	`course_version_id` text,
	`content_unit_id` text,
	`relation` text NOT NULL,
	`proficiency_level` integer,
	`weight` real DEFAULT 1 NOT NULL,
	`is_required` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`competency_id`) REFERENCES `competencies`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`program_version_id`) REFERENCES `program_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_version_id`) REFERENCES `course_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`content_unit_id`) REFERENCES `content_units`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "competency_mappings_one_target_check" CHECK((
        CASE WHEN "competency_mappings"."program_version_id" IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN "competency_mappings"."course_version_id" IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN "competency_mappings"."content_unit_id" IS NOT NULL THEN 1 ELSE 0 END
      ) = 1),
	CONSTRAINT "competency_mappings_proficiency_range_check" CHECK("competency_mappings"."proficiency_level" IS NULL OR "competency_mappings"."proficiency_level" BETWEEN 0 AND 5),
	CONSTRAINT "competency_mappings_weight_range_check" CHECK("competency_mappings"."weight" >= 0 AND "competency_mappings"."weight" <= 1)
);
--> statement-breakpoint
CREATE INDEX `competency_mappings_competency_idx` ON `competency_mappings` (`competency_id`);--> statement-breakpoint
CREATE INDEX `competency_mappings_program_idx` ON `competency_mappings` (`program_version_id`);--> statement-breakpoint
CREATE INDEX `competency_mappings_course_idx` ON `competency_mappings` (`course_version_id`);--> statement-breakpoint
CREATE INDEX `competency_mappings_unit_idx` ON `competency_mappings` (`content_unit_id`);--> statement-breakpoint
CREATE TABLE `content_unit_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`content_unit_id` text NOT NULL,
	`resource_version_id` text NOT NULL,
	`preferred_access_offer_id` text,
	`role` text DEFAULT 'primary' NOT NULL,
	`instructions` text DEFAULT '' NOT NULL,
	`start_locator` text,
	`end_locator` text,
	`is_required` integer DEFAULT true NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`content_unit_id`) REFERENCES `content_units`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resource_version_id`) REFERENCES `resource_versions`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`preferred_access_offer_id`) REFERENCES `access_offers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_unit_resources_unit_resource_role_unique` ON `content_unit_resources` (`content_unit_id`,`resource_version_id`,`role`);--> statement-breakpoint
CREATE INDEX `content_unit_resources_unit_position_idx` ON `content_unit_resources` (`content_unit_id`,`position`);--> statement-breakpoint
CREATE TABLE `content_units` (
	`id` text PRIMARY KEY NOT NULL,
	`course_version_id` text NOT NULL,
	`parent_unit_id` text,
	`key` text NOT NULL,
	`kind` text DEFAULT 'lesson' NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`instructions_markdown` text DEFAULT '' NOT NULL,
	`completion_rule` text DEFAULT 'view' NOT NULL,
	`estimated_minutes` integer,
	`release_offset_days` integer,
	`due_offset_days` integer,
	`is_required` integer DEFAULT true NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`course_version_id`) REFERENCES `course_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_unit_id`) REFERENCES `content_units`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "content_units_nonnegative_minutes_check" CHECK("content_units"."estimated_minutes" IS NULL OR "content_units"."estimated_minutes" >= 0),
	CONSTRAINT "content_units_due_after_release_check" CHECK("content_units"."due_offset_days" IS NULL OR "content_units"."release_offset_days" IS NULL OR "content_units"."due_offset_days" >= "content_units"."release_offset_days")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_units_course_key_unique` ON `content_units` (`course_version_id`,`key`);--> statement-breakpoint
CREATE INDEX `content_units_parent_position_idx` ON `content_units` (`parent_unit_id`,`position`);--> statement-breakpoint
CREATE TABLE `course_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`code` text,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`level` text,
	`nominal_hours` integer,
	`credit_value` real,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "course_versions_positive_version_check" CHECK("course_versions"."version_number" > 0),
	CONSTRAINT "course_versions_nonnegative_hours_check" CHECK("course_versions"."nominal_hours" IS NULL OR "course_versions"."nominal_hours" >= 0),
	CONSTRAINT "course_versions_nonnegative_credit_check" CHECK("course_versions"."credit_value" IS NULL OR "course_versions"."credit_value" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_versions_course_number_unique` ON `course_versions` (`course_id`,`version_number`);--> statement-breakpoint
CREATE INDEX `course_versions_status_idx` ON `course_versions` (`status`,`published_at`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
CREATE TABLE `outbox_events` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`aggregate_type` text NOT NULL,
	`aggregate_id` text NOT NULL,
	`payload_json` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`available_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`locked_at` text,
	`processed_at` text,
	`last_error` text,
	CONSTRAINT "outbox_events_attempts_check" CHECK("outbox_events"."attempts" >= 0)
);
--> statement-breakpoint
CREATE INDEX `outbox_events_dispatch_idx` ON `outbox_events` (`status`,`available_at`);--> statement-breakpoint
CREATE INDEX `outbox_events_aggregate_idx` ON `outbox_events` (`aggregate_type`,`aggregate_id`);--> statement-breakpoint
CREATE TABLE `program_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`program_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`title` text NOT NULL,
	`short_title` text,
	`summary` text DEFAULT '' NOT NULL,
	`credential_type` text NOT NULL,
	`field_of_study` text,
	`language` text DEFAULT 'en' NOT NULL,
	`duration_value` integer,
	`duration_unit` text,
	`nominal_hours` integer,
	`effective_from` text,
	`published_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "program_versions_positive_version_check" CHECK("program_versions"."version_number" > 0),
	CONSTRAINT "program_versions_nonnegative_duration_check" CHECK("program_versions"."duration_value" IS NULL OR "program_versions"."duration_value" > 0),
	CONSTRAINT "program_versions_nonnegative_hours_check" CHECK("program_versions"."nominal_hours" IS NULL OR "program_versions"."nominal_hours" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `program_versions_program_number_unique` ON `program_versions` (`program_id`,`version_number`);--> statement-breakpoint
CREATE INDEX `program_versions_status_idx` ON `program_versions` (`status`,`published_at`);--> statement-breakpoint
CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
CREATE TABLE `provenance_assertions` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`predicate` text NOT NULL,
	`value_json` text NOT NULL,
	`source_resource_version_id` text,
	`source_url` text,
	`asserted_by` text NOT NULL,
	`confidence` real,
	`observed_at` text,
	`asserted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`retracted_at` text,
	FOREIGN KEY (`source_resource_version_id`) REFERENCES `resource_versions`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "provenance_assertions_confidence_range_check" CHECK("provenance_assertions"."confidence" IS NULL OR "provenance_assertions"."confidence" BETWEEN 0 AND 1)
);
--> statement-breakpoint
CREATE INDEX `provenance_assertions_subject_idx` ON `provenance_assertions` (`subject_type`,`subject_id`);--> statement-breakpoint
CREATE INDEX `provenance_assertions_source_idx` ON `provenance_assertions` (`source_resource_version_id`);--> statement-breakpoint
CREATE TABLE `providers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`provider_type` text NOT NULL,
	`homepage_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`archived_at` text
);
--> statement-breakpoint
CREATE INDEX `providers_name_idx` ON `providers` (`name`);--> statement-breakpoint
CREATE TABLE `requirement_course_options` (
	`id` text PRIMARY KEY NOT NULL,
	`requirement_group_id` text NOT NULL,
	`course_version_id` text NOT NULL,
	`credit_override` real,
	`is_recommended` integer DEFAULT false NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`requirement_group_id`) REFERENCES `requirement_groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_version_id`) REFERENCES `course_versions`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "requirement_course_options_nonnegative_credit_check" CHECK("requirement_course_options"."credit_override" IS NULL OR "requirement_course_options"."credit_override" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `requirement_course_options_group_course_unique` ON `requirement_course_options` (`requirement_group_id`,`course_version_id`);--> statement-breakpoint
CREATE INDEX `requirement_course_options_group_position_idx` ON `requirement_course_options` (`requirement_group_id`,`position`);--> statement-breakpoint
CREATE TABLE `requirement_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`program_version_id` text NOT NULL,
	`parent_group_id` text,
	`key` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rule_kind` text DEFAULT 'all_of' NOT NULL,
	`minimum_selections` integer DEFAULT 0 NOT NULL,
	`maximum_selections` integer,
	`required_credits` real,
	`required_hours` integer,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`program_version_id`) REFERENCES `program_versions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_group_id`) REFERENCES `requirement_groups`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "requirement_groups_selection_range_check" CHECK("requirement_groups"."minimum_selections" >= 0 AND ("requirement_groups"."maximum_selections" IS NULL OR "requirement_groups"."maximum_selections" >= "requirement_groups"."minimum_selections")),
	CONSTRAINT "requirement_groups_nonnegative_credits_check" CHECK("requirement_groups"."required_credits" IS NULL OR "requirement_groups"."required_credits" >= 0),
	CONSTRAINT "requirement_groups_nonnegative_hours_check" CHECK("requirement_groups"."required_hours" IS NULL OR "requirement_groups"."required_hours" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `requirement_groups_program_key_unique` ON `requirement_groups` (`program_version_id`,`key`);--> statement-breakpoint
CREATE INDEX `requirement_groups_parent_position_idx` ON `requirement_groups` (`parent_group_id`,`position`);--> statement-breakpoint
CREATE TABLE `resource_rights` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_version_id` text NOT NULL,
	`jurisdiction` text DEFAULT '*' NOT NULL,
	`basis` text DEFAULT 'unknown' NOT NULL,
	`license_identifier` text,
	`license_url` text,
	`rights_holder` text,
	`evidence_url` text,
	`can_link` integer,
	`can_redistribute` integer,
	`can_adapt` integer,
	`commercial_use` integer,
	`verified_at` text,
	`valid_until` text,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`resource_version_id`) REFERENCES `resource_versions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resource_rights_scope_basis_unique` ON `resource_rights` (`resource_version_id`,`jurisdiction`,`basis`);--> statement-breakpoint
CREATE INDEX `resource_rights_verification_idx` ON `resource_rights` (`verified_at`,`valid_until`);--> statement-breakpoint
CREATE TABLE `resource_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`content_fingerprint` text,
	`source_published_at` text,
	`first_observed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_observed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "resource_versions_positive_version_check" CHECK("resource_versions"."version_number" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resource_versions_resource_number_unique` ON `resource_versions` (`resource_id`,`version_number`);--> statement-breakpoint
CREATE INDEX `resource_versions_status_idx` ON `resource_versions` (`status`,`last_observed_at`);--> statement-breakpoint
CREATE TABLE `resources` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_id` text NOT NULL,
	`provider_resource_key` text,
	`kind` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`archived_at` text,
	FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resources_provider_key_unique` ON `resources` (`provider_id`,`provider_resource_key`);--> statement-breakpoint
CREATE INDEX `resources_provider_kind_idx` ON `resources` (`provider_id`,`kind`);--> statement-breakpoint
CREATE TABLE `slug_aliases` (
	`id` text PRIMARY KEY NOT NULL,
	`namespace` text NOT NULL,
	`program_id` text,
	`course_id` text,
	`competency_id` text,
	`provider_id` text,
	`resource_id` text,
	`slug` text NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`is_canonical` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`retired_at` text,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`competency_id`) REFERENCES `competencies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "slug_aliases_one_target_check" CHECK((
        CASE WHEN "slug_aliases"."program_id" IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN "slug_aliases"."course_id" IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN "slug_aliases"."competency_id" IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN "slug_aliases"."provider_id" IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN "slug_aliases"."resource_id" IS NOT NULL THEN 1 ELSE 0 END
      ) = 1),
	CONSTRAINT "slug_aliases_namespace_target_check" CHECK(("slug_aliases"."namespace" = 'program' AND "slug_aliases"."program_id" IS NOT NULL)
        OR ("slug_aliases"."namespace" = 'course' AND "slug_aliases"."course_id" IS NOT NULL)
        OR ("slug_aliases"."namespace" = 'competency' AND "slug_aliases"."competency_id" IS NOT NULL)
        OR ("slug_aliases"."namespace" = 'provider' AND "slug_aliases"."provider_id" IS NOT NULL)
        OR ("slug_aliases"."namespace" = 'resource' AND "slug_aliases"."resource_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `slug_aliases_route_unique` ON `slug_aliases` (`namespace`,`locale`,`slug`);--> statement-breakpoint
CREATE INDEX `slug_aliases_program_idx` ON `slug_aliases` (`program_id`);--> statement-breakpoint
CREATE INDEX `slug_aliases_course_idx` ON `slug_aliases` (`course_id`);--> statement-breakpoint
CREATE INDEX `slug_aliases_competency_idx` ON `slug_aliases` (`competency_id`);--> statement-breakpoint
CREATE INDEX `slug_aliases_provider_idx` ON `slug_aliases` (`provider_id`);--> statement-breakpoint
CREATE INDEX `slug_aliases_resource_idx` ON `slug_aliases` (`resource_id`);