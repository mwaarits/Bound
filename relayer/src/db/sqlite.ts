import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function openSqlite(path: string): ReturnType<typeof Database> {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new Database(path);
  const sql = readFileSync(new URL('schema.sql', import.meta.url), 'utf-8');
  db.exec(sql);
  return db;
}
