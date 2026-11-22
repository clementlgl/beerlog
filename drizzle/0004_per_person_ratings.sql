ALTER TABLE `beers` ADD `rating_seb` real;--> statement-breakpoint
ALTER TABLE `beers` ADD `rating_clem` real;--> statement-breakpoint
ALTER TABLE `beers` ADD `comment_seb` text;--> statement-breakpoint
ALTER TABLE `beers` ADD `comment_clem` text;--> statement-breakpoint
-- The shared rating becomes both people's rating; the shared comment goes to Clément.
UPDATE `beers` SET `rating_seb` = `rating`, `rating_clem` = `rating`, `comment_clem` = `comment`;
