import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb(dbPath = "./coolhub.db") {
  if (_db) return _db;

  const dir = dirname(dbPath);
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // Auto-create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS unit_config (
      uid TEXT PRIMARY KEY,
      custom_name TEXT,
      group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
      visible INTEGER NOT NULL DEFAULT 1,
      temp_min REAL,
      temp_max REAL
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unit_uid TEXT,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      cron TEXT NOT NULL,
      action TEXT NOT NULL DEFAULT '{}',
      enabled INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS temperature_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_uid TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      current_temp REAL NOT NULL,
      set_temp REAL NOT NULL,
      mode TEXT NOT NULL,
      is_on INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_temp_history_uid_ts
      ON temperature_history(unit_uid, timestamp);
  `);

  _db = drizzle(sqlite, { schema });
  return _db;
}

export { schema };
