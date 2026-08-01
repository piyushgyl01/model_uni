CREATE TABLE `catalog_program_supersessions` (
	`retired_program_id` text PRIMARY KEY NOT NULL,
	`successor_program_id` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "catalog_program_supersessions_distinct_ids_check" CHECK("catalog_program_supersessions"."retired_program_id" <> "catalog_program_supersessions"."successor_program_id")
);
--> statement-breakpoint
CREATE INDEX `catalog_program_supersessions_successor_idx` ON `catalog_program_supersessions` (`successor_program_id`);