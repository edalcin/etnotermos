import { ObjectId } from 'mongodb';

export const ACQ_STATUS = Object.freeze({
  SUCCESS: 'success',
  FAILURE: 'failure',
});

export function getAcquisitionLogCollection(db) {
  return db.collection('etnotermos_acquisition_log');
}

export function createAcquisitionLog(data) {
  return {
    _id: new ObjectId(),
    executedAt: data.executedAt ?? new Date(),
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
