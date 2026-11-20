import path from 'node:path';

const env = process.env;
export const DATA_DIR = path.resolve(env.DATA_DIR || './data');
export const PHOTO_DIR = path.join(DATA_DIR, 'photos');
export const DB_PATH = path.join(DATA_DIR, 'beerlog.db');
export const MIGRATIONS_DIR = path.resolve(env.MIGRATIONS_DIR || './drizzle');
