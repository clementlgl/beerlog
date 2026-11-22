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
		/** Per-person ratings, whole points from 1 to 10; null = not rated */
		ratingSeb: real('rating_seb'),
		ratingClem: real('rating_clem'),
		commentSeb: text('comment_seb'),
		commentClem: text('comment_clem'),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
	},
	(t) => [index('beers_name_idx').on(t.name)]
);

export type Beer = typeof beers.$inferSelect;
export type NewBeer = typeof beers.$inferInsert;
