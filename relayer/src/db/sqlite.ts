import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export function openSqlite(path: string): ReturnType<typeof Database> {
  const db = new Database(path);
  const sql = readFileSync(new URL('schema.sql', import.meta.url), 'utf-8');
  db.exec(sql);
  return db;
}
