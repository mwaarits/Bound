import { openSqlite } from './sqlite.js';
import type { Database as DB } from 'better-sqlite3';

let _db: DB | null = null;

export function getDb(): DB {
  if (!_db) _db = openSqlite(process.env.DB_PATH ?? ':memory:');
  return _db;
}

export function setDb(db: DB): void {
  _db = db;
}
