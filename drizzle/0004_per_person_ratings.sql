CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `beers` ADD `rating_1` real;--> statement-breakpoint
ALTER TABLE `beers` ADD `rating_2` real;--> statement-breakpoint
ALTER TABLE `beers` ADD `comment_1` text;--> statement-breakpoint
ALTER TABLE `beers` ADD `comment_2` text;--> statement-breakpoint
-- The shared rating becomes both people's rating; the shared comment goes to person 2 (Clément).
UPDATE `beers` SET `rating_1` = `rating`, `rating_2` = `rating`, `comment_2` = `comment`;
