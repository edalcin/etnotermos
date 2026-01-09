// SourceService - T053
// CRUD operations for sources with usage tracking

import { ObjectId } from 'mongodb';
import { getCollection } from '../shared/database.js';
import { createSource, updateSource as updateSourceModel } from '../models/Source.js';
import { createAuditLogCreate, createAuditLogUpdate, createAuditLogDelete } from '../models/AuditLog.js';

/**
 * Create a new source
 */
export async function createNewSource(type, fields, metadata = {}) {
  const sources = getCollection('etnotermos-sources');
  const auditLogs = getCollection('etnotermos-audit-logs');

  // Create source
  const source = createSource(type, fields);

  // Insert
  await sources.insertOne(source);

  // Audit log
  const auditLog = createAuditLogCreate('Source', source, metadata);
  await auditLogs.insertOne(auditLog);

  return source;
}

/**
 * Get source by ID
 */
export async function getSourceById(sourceId) {
  const sources = getCollection('etnotermos-sources');
  const source = await sources.findOne({ _id: new ObjectId(sourceId) });

  if (!source) {
    throw new Error('Source not found');
  }

  return source;
}

/**
 * List sources
 */
export async function listSources(options = {}) {
  const sources = getCollection('etnotermos-sources');

  const { type, page = 1, limit = 50 } = options;

  const query = {};
  if (type) {
    query.type = type;
  }

  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    sources.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    sources.countDocuments(query),
  ]);

  return {
    data: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update a source
 */
export async function updateExistingSource(sourceId, updates, metadata = {}) {
  const sources = getCollection('etnotermos-sources');
  const auditLogs = getCollection('etnotermos-audit-logs');

  // Get existing
  const existingSource = await getSourceById(sourceId);

  // Update
  const updatedSource = updateSourceModel(existingSource, updates);

  // Save
  await sources.replaceOne({ _id: existingSource._id }, updatedSource);

  // Audit log
  const auditLog = createAuditLogUpdate('Source', sourceId, existingSource, updatedSource, metadata);
  await auditLogs.insertOne(auditLog);

  return updatedSource;
}

/**
 * Delete a source (with usage check)
 */
export async function deleteSource(sourceId, force = false, orphanHandling = 'remove_reference', metadata = {}) {
  const sources = getCollection('etnotermos-sources');
  const terms = getCollection('etnotermos');
  const notes = getCollection('etnotermos-notes');
  const auditLogs = getCollection('etnotermos-audit-logs');

  // Get source
  const source = await getSourceById(sourceId);

  // Check usage
  const sourceObjId = new ObjectId(sourceId);
  const [referencingTerms, referencingNotes] = await Promise.all([
    terms.find({ sourceIds: sourceObjId }).toArray(),
    notes.find({ sourceIds: sourceObjId }).toArray(),
  ]);

  const totalReferences = referencingTerms.length + referencingNotes.length;

  if (totalReferences > 0 && !force) {
    return {
      warning: 'This source is referenced by terms and/or notes and cannot be deleted without confirmation',
      referencedByCount: totalReferences,
      referencedBy: {
        terms: referencingTerms.map((t) => ({ _id: t._id, prefLabel: t.prefLabel })),
        notes: referencingNotes.map((n) => ({ _id: n._id, termId: n.termId, type: n.type })),
      },
      options: ['confirm_delete', 'cancel'],
    };
  }

  // Handle orphaned references
  if (orphanHandling === 'remove_reference') {
    await terms.updateMany({ sourceIds: sourceObjId }, { $pull: { sourceIds: sourceObjId } });
    await notes.updateMany({ sourceIds: sourceObjId }, { $pull: { sourceIds: sourceObjId } });
  }

  // Delete source
  await sources.deleteOne({ _id: source._id });

  // Audit log
  const auditLog = createAuditLogDelete('Source', source, { ...metadata, orphanHandling });
  await auditLogs.insertOne(auditLog);

  return { success: true, message: 'Source deleted successfully' };
}

/**
 * Get source usage statistics
 */
export async function getSourceUsage(sourceId) {
  const terms = getCollection('etnotermos');
  const notes = getCollection('etnotermos-notes');

  const sourceObjId = new ObjectId(sourceId);

  const [termCount, noteCount, referencingTerms] = await Promise.all([
    terms.countDocuments({ sourceIds: sourceObjId }),
    notes.countDocuments({ sourceIds: sourceObjId }),
    terms.find({ sourceIds: sourceObjId }, { projection: { _id: 1, prefLabel: 1 } }).limit(10).toArray(),
  ]);

  return {
    totalReferences: termCount + noteCount,
    termCount,
    noteCount,
    sampleTerms: referencingTerms,
  };
}

export default {
  createNewSource,
  getSourceById,
  listSources,
  updateExistingSource,
  deleteSource,
  getSourceUsage,
};
