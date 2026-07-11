import { randomUUID } from 'crypto';

export function getAuditEntryTable() {
  return 'etnotermos_audit_log';
}

export function createAuditEntry(data) {
  return {
    id: randomUUID(),
    conceptId: String(data.conceptId),
    conceptLiteralForm: data.conceptLiteralForm,
    field: data.field,
    previousValue: data.previousValue ?? null,
    newValue: data.newValue,
    responsible: data.responsible,
    timestamp: data.timestamp ?? new Date().toISOString(),
  };
}

/**
 * Insert a new append-only audit log row.
 * @param {import('better-sqlite3').Database} db
 * @param {object} entry
 */
export function insertAuditEntry(db, entry) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO etnotermos_audit_log (id, doc, created_at, updated_at) VALUES (?, ?, ?, ?)`
  ).run(entry.id, JSON.stringify(entry), now, now);
  return entry;
}
