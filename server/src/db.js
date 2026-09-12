import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.VERCEL
  ? "/tmp"
  : path.resolve(__dirname, "..", "data");

fs.mkdirSync(DATA_DIR, { recursive: true });

let db = null;

function wrapDb(raw) {
  return {
    get(sql, params = []) {
      return Promise.resolve(raw.prepare(sql).get(...params));
    },
    all(sql, params = []) {
      return Promise.resolve(raw.prepare(sql).all(...params));
    },
    run(sql, params = []) {
      const info = raw.prepare(sql).run(...params);
      return Promise.resolve({ lastID: info.lastInsertRowid, changes: info.changes });
    },
    exec(sql) {
      raw.exec(sql);
      return Promise.resolve();
    },
  };
}

export async function getDb() {
  if (db) return db;

  const raw = new Database(path.join(DATA_DIR, "questlog.db"));
  raw.pragma("journal_mode = WAL");
  raw.pragma("foreign_keys = ON");

  db = wrapDb(raw);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      username        TEXT NOT NULL UNIQUE,
      password_hash   TEXT NOT NULL,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      last_active_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS characters (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      hp         INTEGER NOT NULL DEFAULT 100,
      max_hp     INTEGER NOT NULL DEFAULT 100,
      xp         INTEGER NOT NULL DEFAULT 0,
      level      INTEGER NOT NULL DEFAULT 1,
      coins      INTEGER NOT NULL DEFAULT 0,
      attr_int   INTEGER NOT NULL DEFAULT 0,
      attr_str   INTEGER NOT NULL DEFAULT 0,
      attr_craft INTEGER NOT NULL DEFAULT 0,
      attr_spirit INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title          TEXT NOT NULL,
      description    TEXT NOT NULL DEFAULT '',
      attr           TEXT NOT NULL DEFAULT 'int',
      reward         INTEGER NOT NULL DEFAULT 25,
      priority       TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','high','epic')),
      status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','done')),
      due_date       TEXT,
      done_at        TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      completed_on   TEXT
    );

    CREATE TABLE IF NOT EXISTS completion_log (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_id        INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
      title          TEXT,
      attr           TEXT,
      reward         INTEGER,
      completed_on   TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS shop_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price       INTEGER NOT NULL,
      kind        TEXT NOT NULL,
      accent      TEXT NOT NULL DEFAULT '#ffd23f'
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      item_slug  TEXT NOT NULL REFERENCES shop_items(slug) ON DELETE CASCADE,
      equipped   INTEGER NOT NULL DEFAULT 0,
      purchased_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const userCount = await db.get("SELECT COUNT(*) as count FROM users");
  if (userCount.count === 0) {
    const { seedDb } = await import("./seed.js");
    await seedDb();
  }

  return db;
}
