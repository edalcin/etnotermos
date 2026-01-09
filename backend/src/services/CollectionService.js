// CollectionService - T054
// CRUD operations for collections with term association management

import { ObjectId } from 'mongodb';
import { getCollection as getDbCollection } from '../shared/database.js';
import { createCollection, updateCollection as updateCollectionModel } from '../models/Collection.js';
import { createAuditLogCreate, createAuditLogUpdate, createAuditLogDelete } from '../models/AuditLog.js';

/**
 * Create a new collection
 */
export async function createNewCollection(name, description = '', metadata = {}) {
  const collections = getDbCollection('etnotermos-collections');
  const auditLogs = getDbCollection('etnotermos-audit-logs');

  // Check for duplicate name
  const existing = await collections.findOne({ name });
  if (existing) {
    throw new Error(`A collection with name "${name}" already exists`);
  }

  // Create collection
  const collection = createCollection(name, description);

  // Insert
  await collections.insertOne(collection);

  // Audit log
  const auditLog = createAuditLogCreate('Collection', collection, metadata);
  await auditLogs.insertOne(auditLog);

  return collection;
}

/**
 * Get collection by ID
 */
export async function getCollectionById(collectionId) {
  const collections = getDbCollection('etnotermos-collections');
  const collection = await collections.findOne({ _id: new ObjectId(collectionId) });

  if (!collection) {
    throw new Error('Collection not found');
  }

  return collection;
}

/**
 * List all collections
 */
export async function listCollections() {
  const collections = getDbCollection('etnotermos-collections');
  return await collections.find({}).sort({ name: 1 }).toArray();
}

/**
 * Update a collection
 */
export async function updateExistingCollection(collectionId, updates, metadata = {}) {
  const collections = getDbCollection('etnotermos-collections');
  const auditLogs = getDbCollection('etnotermos-audit-logs');

  // Get existing
  const existingCollection = await getCollectionById(collectionId);

  // Check for duplicate name if changing
  if (updates.name && updates.name !== existingCollection.name) {
    const duplicate = await collections.findOne({ name: updates.name });
    if (duplicate) {
      throw new Error(`A collection with name "${updates.name}" already exists`);
    }
  }

  // Update
  const updatedCollection = updateCollectionModel(existingCollection, updates);

  // Save
  await collections.replaceOne({ _id: existingCollection._id }, updatedCollection);

  // Audit log
  const auditLog = createAuditLogUpdate('Collection', collectionId, existingCollection, updatedCollection, metadata);
  await auditLogs.insertOne(auditLog);

  return updatedCollection;
}

/**
 * Delete a collection
 */
export async function deleteCollection(collectionId, metadata = {}) {
  const collections = getDbCollection('etnotermos-collections');
  const terms = getDbCollection('etnotermos');
  const auditLogs = getDbCollection('etnotermos-audit-logs');

  // Get collection
  const collection = await getCollectionById(collectionId);

  // Remove collection from all terms
  const collectionObjId = new ObjectId(collectionId);
  await terms.updateMany(
    { collectionIds: collectionObjId },
    { $pull: { collectionIds: collectionObjId } }
  );

  // Delete collection
  await collections.deleteOne({ _id: collection._id });

  // Audit log
  const auditLog = createAuditLogDelete('Collection', collection, metadata);
  await auditLogs.insertOne(auditLog);

  return { success: true, message: 'Collection deleted successfully' };
}

/**
 * Get terms in a collection
 */
export async function getTermsByCollection(collectionId, options = {}) {
  const terms = getDbCollection('etnotermos');

  const { page = 1, limit = 50 } = options;

  const query = { collectionIds: new ObjectId(collectionId) };
  const skip = (page - 1) * limit;

  const [results, total] = await Promise.all([
    terms.find(query).sort({ prefLabel: 1 }).skip(skip).limit(limit).toArray(),
    terms.countDocuments(query),
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
 * Get collection statistics
 */
export async function getCollectionStatistics(collectionId) {
  const terms = getDbCollection('etnotermos');

  const termCount = await terms.countDocuments({ collectionIds: new ObjectId(collectionId) });

  return {
    termCount,
  };
}

export default {
  createNewCollection,
  getCollectionById,
  listCollections,
  updateExistingCollection,
  deleteCollection,
  getTermsByCollection,
  getCollectionStatistics,
};
