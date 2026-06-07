import { ObjectId } from 'mongodb';

export function getAuditEntryCollection(db) {
  return db.collection('etnotermos_audit_log');
}

export function createAuditEntry(data) {
  return {
    _id: new ObjectId(),
    conceptId: data.conceptId instanceof ObjectId ? data.conceptId : new ObjectId(data.conceptId),
    conceptLiteralForm: data.conceptLiteralForm,
    field: data.field,
    previousValue: data.previousValue ?? null,
    newValue: data.newValue,
    responsible: data.responsible,
    timestamp: data.timestamp ?? new Date(),
  };
}
