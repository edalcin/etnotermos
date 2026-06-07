import { ObjectId } from 'mongodb';
import { getAuditEntryCollection, createAuditEntry } from '../models/AuditEntry.js';

export async function log(db, entry) {
  const col = getAuditEntryCollection(db);
  const doc = createAuditEntry(entry);
  await col.insertOne(doc);
  return doc;
}

export async function findMany(db, { conceptId, responsible, page = 1, limit = 20 } = {}) {
  const col = getAuditEntryCollection(db);
  const filter = {};
  if (conceptId) {
    try {
      filter.conceptId = new ObjectId(conceptId);
    } catch {
      filter.conceptId = conceptId;
    }
  }
  if (responsible) filter.responsible = responsible;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    col.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);

  return { data, total, page };
}

export default { log, findMany };
