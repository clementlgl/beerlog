import { sqliteTable, integer, text, real, index } from 'drizzle-orm/sqlite-core';

export const beers = sqliteTable(
	'beers',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		barcode: text('barcode').unique(),
		name: text('name').notNull(),
		brewery: text('brewery'),
		style: text('style'),
		abv: real('abv'),
		country: text('country'),
		/** Local photo filename inside DATA_DIR/photos */
		photo: text('photo'),
		/** Shared rating, whole points from 1 to 10; null = not rated */
		rating: real('rating'),
		comment: text('comment'),
		createdBy: text('created_by').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedBy: text('updated_by').notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
	},
	(t) => [index('beers_name_idx').on(t.name)]
);

export type Beer = typeof beers.$inferSelect;
export type NewBeer = typeof beers.$inferInsert;
