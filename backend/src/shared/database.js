/**
 * SQLite Connection Module (JSON1 document store)
 *
 * Opens the SAME shared unit SQLite file as BioCultDB (SQLITE_DB_PATH), applies
 * WAL/foreign_keys/busy_timeout PRAGMAs, and idempotently ensures the
 * `etnotermos`, `etnotermos_acquisition_log`, `etnotermos_audit_log` tables plus
 * the `etnotermos_fts` FTS5 virtual table.
 *
 * ADR-005 (Arquitetura-BioCultural): the unit's SQLite file is shared by its
 * tools via distinct tables. `biocultdb_records` is OWNED and created by
 * BioCultDB's own `shared/database.js` — this module NEVER creates or alters
 * it, only reads it (see services/AcquisitionService.js).
 */

import path from 'path';
import fs from 'fs';
import SqliteDb from 'better-sqlite3';
import { config } from '../config/index.js';

let db = null;

/**
 * Normalizes a string for accent/case-insensitive alphabetical sorting:
 * strips diacritics (NFD decomposition + combining-mark removal) and
 * lowercases, so "árvore" sorts next to "arvore" instead of after "z"
 * under SQLite's default BINARY collation. Pure ECMAScript — no ICU
 * dependency, so it works identically on any Node build/platform.
 */
export function unicodeSortKey(value) {
  if (value == null) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function connect() {
  if (db) return db;

  fs.mkdirSync(path.dirname(config.sqlitePath), { recursive: true });

  db = new SqliteDb(config.sqlitePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.function('unicode_sort_key', { deterministic: true }, unicodeSortKey);

  ensureSchema(db);

  process.on('SIGINT', disconnect);
  process.on('SIGTERM', disconnect);

  return db;
}

function ensureSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS etnotermos (
      id         TEXT PRIMARY KEY,
      doc        TEXT NOT NULL CHECK (json_valid(doc)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  ensureGeneratedColumn(database, 'etnotermos', 'status', "json_extract(doc,'$.status')");
  ensureGeneratedColumn(database, 'etnotermos', 'version', "CAST(json_extract(doc,'$.version') AS INTEGER)");
  database.exec(`CREATE INDEX IF NOT EXISTS idx_etnotermos_status ON etnotermos(status);`);

  database.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS etnotermos_fts USING fts5(
      id UNINDEXED,
      prefLabels,
      altLabels,
      definition,
      scopeNote,
      tokenize='unicode61 remove_diacritics 2'
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS etnotermos_acquisition_log (
      id         TEXT PRIMARY KEY,
      doc        TEXT NOT NULL CHECK (json_valid(doc)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  ensureGeneratedColumn(database, 'etnotermos_acquisition_log', 'executed_at', "json_extract(doc,'$.executedAt')");
  database.exec(
    `CREATE INDEX IF NOT EXISTS idx_etnotermos_acquisition_log_executed_at ON etnotermos_acquisition_log(executed_at);`
  );

  database.exec(`
    CREATE TABLE IF NOT EXISTS etnotermos_audit_log (
      id         TEXT PRIMARY KEY,
      doc        TEXT NOT NULL CHECK (json_valid(doc)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  ensureGeneratedColumn(database, 'etnotermos_audit_log', 'concept_id', "json_extract(doc,'$.conceptId')");
  database.exec(
    `CREATE INDEX IF NOT EXISTS idx_etnotermos_audit_log_concept ON etnotermos_audit_log(concept_id);`
  );
}

/**
 * Idempotently add a generated column. `PRAGMA table_info` does not
 * reliably reflect columns added via `ALTER TABLE ... ADD COLUMN ...
 * GENERATED ALWAYS AS (...) VIRTUAL` (confirmed: sqlite_master.sql has the
 * column, but table_info omits it) — so existence is detected by catching
 * SQLite's own "duplicate column name" error instead.
 */
function ensureGeneratedColumn(database, table, name, expression) {
  try {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${name} GENERATED ALWAYS AS (${expression}) VIRTUAL;`);
  } catch (error) {
    if (!/duplicate column name/i.test(error.message)) throw error;
  }
}

export function disconnect() {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Get the raw better-sqlite3 connection. Call connect() first.
 * @returns {import('better-sqlite3').Database}
 */
export function getDb() {
  if (!db) throw new Error('Database not connected. Call connect() first.');
  return db;
}

export function isConnected() {
  return !!db;
}

export default { connect, disconnect, getDb, isConnected };
