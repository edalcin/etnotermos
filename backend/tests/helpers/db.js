import SqliteDb from 'better-sqlite3';

let db = null;

/**
 * Opens an in-memory SQLite database with the same schema as
 * `src/shared/database.js` (etnotermos* tables + FTS5), plus a minimal
 * `biocultdb_records` table so AcquisitionService tests can seed unit-shared
 * data without depending on the BioCultDB repo.
 */
export async function connect() {
  db = new SqliteDb(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS etnotermos (
      id         TEXT PRIMARY KEY,
      doc        TEXT NOT NULL CHECK (json_valid(doc)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  ensureGeneratedColumn('etnotermos', 'status', "json_extract(doc,'$.status')");
  ensureGeneratedColumn('etnotermos', 'version', "CAST(json_extract(doc,'$.version') AS INTEGER)");
  db.exec(`CREATE INDEX IF NOT EXISTS idx_etnotermos_status ON etnotermos(status);`);

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS etnotermos_fts USING fts5(
      id UNINDEXED, prefLabels, altLabels, definition, scopeNote,
      tokenize='unicode61 remove_diacritics 2'
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS etnotermos_acquisition_log (
      id         TEXT PRIMARY KEY,
      doc        TEXT NOT NULL CHECK (json_valid(doc)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  ensureGeneratedColumn('etnotermos_acquisition_log', 'executed_at', "json_extract(doc,'$.executedAt')");

  db.exec(`
    CREATE TABLE IF NOT EXISTS etnotermos_audit_log (
      id         TEXT PRIMARY KEY,
      doc        TEXT NOT NULL CHECK (json_valid(doc)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  ensureGeneratedColumn('etnotermos_audit_log', 'concept_id', "json_extract(doc,'$.conceptId')");

  // Unit-shared table (owned by BioCultDB in production) — minimal shape for
  // AcquisitionService tests that read it via json_each.
  db.exec(`
    CREATE TABLE IF NOT EXISTS biocultdb_records (
      id         TEXT PRIMARY KEY,
      doc        TEXT NOT NULL CHECK (json_valid(doc)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  return { db, uri: ':memory:' };
}

function ensureGeneratedColumn(table, name, expression) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((c) => c.name === name)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} GENERATED ALWAYS AS (${expression}) VIRTUAL;`);
  }
}

export async function disconnect() {
  if (db) db.close();
  db = null;
}

export async function clearCollections() {
  if (!db) return;
  for (const table of ['etnotermos', 'etnotermos_acquisition_log', 'etnotermos_audit_log', 'etnotermos_fts', 'biocultdb_records']) {
    db.exec(`DELETE FROM ${table};`);
  }
}

export function getDb() {
  if (!db) throw new Error('Test DB not connected');
  return db;
}

export default { connect, disconnect, clearCollections, getDb };
