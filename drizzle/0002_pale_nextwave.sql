CREATE TABLE `resource_freshness` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_version_id` text NOT NULL,
	`status` text DEFAULT 'unchecked' NOT NULL,
	`checked_at` text,
	`http_status` integer,
	`resolved_url` text,
	`content_fingerprint` text,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`resource_version_id`) REFERENCES `resource_versions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resource_freshness_resource_version_unique` ON `resource_freshness` (`resource_version_id`);--> statement-breakpoint
CREATE INDEX `resource_freshness_status_idx` ON `resource_freshness` (`status`,`checked_at`);