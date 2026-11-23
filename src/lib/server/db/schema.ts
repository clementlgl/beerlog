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
		/** Per-person ratings (person 1 and 2, see settings), whole points from 1 to 10; null = not rated */
		rating1: real('rating_1'),
		rating2: real('rating_2'),
		comment1: text('comment_1'),
		comment2: text('comment_2'),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
	},
	(t) => [index('beers_name_idx').on(t.name)]
);

export type Beer = typeof beers.$inferSelect;
export type NewBeer = typeof beers.$inferInsert;

/** Key/value app settings (e.g. the tasters' names). */
export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});
