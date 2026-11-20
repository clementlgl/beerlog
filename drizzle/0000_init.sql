CREATE TABLE `beers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`barcode` text,
	`name` text NOT NULL,
	`brewery` text,
	`style` text,
	`abv` real,
	`country` text,
	`photo` text,
	`rating` real,
	`comment` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `beers_barcode_unique` ON `beers` (`barcode`);--> statement-breakpoint
CREATE INDEX `beers_name_idx` ON `beers` (`name`);