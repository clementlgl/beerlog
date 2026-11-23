ALTER TABLE `beers` ADD `rated_at_1` integer;--> statement-breakpoint
ALTER TABLE `beers` ADD `rated_at_2` integer;--> statement-breakpoint
-- Existing ratings: best guess is the last time the beer was saved.
UPDATE `beers` SET `rated_at_1` = `updated_at` WHERE `rating_1` IS NOT NULL;--> statement-breakpoint
UPDATE `beers` SET `rated_at_2` = `updated_at` WHERE `rating_2` IS NOT NULL;
