CREATE TABLE `learner_practice_rounds` (
	`id` text NOT NULL,
	`learner_id` text NOT NULL,
	`program_version_id` text NOT NULL,
	`course_version_id` text NOT NULL,
	`learning_unit_id` text,
	`skill_id` text NOT NULL,
	`mode` text NOT NULL,
	`level` integer NOT NULL,
	`question_count` integer NOT NULL,
	`correct_count` integer NOT NULL,
	`duration_seconds` integer NOT NULL,
	`study_date` text NOT NULL,
	`completed_at` text NOT NULL,
	`last_mutation_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`learner_id`, `program_version_id`, `id`),
	FOREIGN KEY (`learner_id`,`program_version_id`) REFERENCES `learner_program_progress`(`learner_id`,`program_version_id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "learner_practice_rounds_mode_check" CHECK("learner_practice_rounds"."mode" IN ('check', 'practice')),
	CONSTRAINT "learner_practice_rounds_counts_check" CHECK("learner_practice_rounds"."level" BETWEEN 1 AND 10 AND "learner_practice_rounds"."question_count" BETWEEN 1 AND 20 AND "learner_practice_rounds"."correct_count" BETWEEN 0 AND "learner_practice_rounds"."question_count" AND "learner_practice_rounds"."duration_seconds" >= 0),
	CONSTRAINT "learner_practice_rounds_skill_check" CHECK(length(trim("learner_practice_rounds"."skill_id")) > 0)
);
--> statement-breakpoint
CREATE INDEX `learner_practice_rounds_day_idx` ON `learner_practice_rounds` (`learner_id`,`program_version_id`,`study_date`);