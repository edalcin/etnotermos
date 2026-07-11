import { insertAuditEntry, createAuditEntry } from '../models/AuditEntry.js';

export async function log(db, entry) {
  const doc = createAuditEntry(entry);
  insertAuditEntry(db, doc);
  return doc;
}

export async function findMany(db, { conceptId, responsible, page = 1, limit = 20 } = {}) {
  const conditions = [];
  const params = [];

  if (conceptId) {
    conditions.push(`json_extract(doc,'$.conceptId') = ?`);
    params.push(String(conceptId));
  }
  if (responsible) {
    conditions.push(`json_extract(doc,'$.responsible') = ?`);
    params.push(responsible);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const rows = db
    .prepare(
      `SELECT doc FROM etnotermos_audit_log ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  const { total } = db
    .prepare(`SELECT COUNT(*) as total FROM etnotermos_audit_log ${where}`)
    .get(...params);

  return { data: rows.map((r) => JSON.parse(r.doc)), total, page };
}

export default { log, findMany };
