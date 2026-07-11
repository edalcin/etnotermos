import { randomUUID } from 'crypto';

export const ACQ_STATUS = Object.freeze({
  SUCCESS: 'success',
  FAILURE: 'failure',
});

export function getAcquisitionLogTable() {
  return 'etnotermos_acquisition_log';
}

export function createAcquisitionLog(data) {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    executedAt: data.executedAt ?? now,
    status: data.status,
    errorMessage: data.errorMessage ?? null,
    fieldsProcessed: data.fieldsProcessed ?? [],
    conceptsCreated: data.conceptsCreated ?? 0,
    conceptsExisting: data.conceptsExisting ?? 0,
    errors: data.errors ?? [],
    hasUnresolved: data.hasUnresolved ?? false,
    durationMs: data.durationMs ?? 0,
  };
}

/**
 * Insert a new acquisition log row.
 * @param {import('better-sqlite3').Database} db
 * @param {object} log
 */
export function insertAcquisitionLog(db, log) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO etnotermos_acquisition_log (id, doc, created_at, updated_at) VALUES (?, ?, ?, ?)`
  ).run(log.id, JSON.stringify(log), now, now);
  return log;
}

/**
 * Most recent acquisition log entry, or null.
 * @param {import('better-sqlite3').Database} db
 */
export function findLastAcquisitionLog(db) {
  const row = db
    .prepare(`SELECT doc FROM etnotermos_acquisition_log ORDER BY executed_at DESC LIMIT 1`)
    .get();
  return row ? JSON.parse(row.doc) : null;
}
