import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'node:fs';
import { DATA_DIR, PHOTO_DIR, DB_PATH, MIGRATIONS_DIR } from '../config';
import * as schema from './schema';

fs.mkdirSync(PHOTO_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
migrate(db, { migrationsFolder: MIGRATIONS_DIR });

export { schema };
