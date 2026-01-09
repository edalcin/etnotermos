// RelationshipService - T051
// Business logic for relationship management with automatic reciprocal generation

import { ObjectId } from 'mongodb';
import { getCollection } from '../shared/database.js';
import {
  createRelationship,
  createReciprocalRelationship,
  validateReciprocity,
} from '../models/Relationship.js';
import { validateRelationshipFull } from '../lib/validation/z39-19.js';
import { createAuditLogCreate, createAuditLogDelete } from '../models/AuditLog.js';

/**
 * Create a relationship with automatic reciprocal generation
 */
export async function createNewRelationship(sourceTermId, targetTermId, type, metadata = {}) {
  const relationships = getCollection('etnotermos-relationships');
  const terms = getCollection('etnotermos');
  const auditLogs = getCollection('etnotermos-audit-logs');

  // Verify both terms exist
  const [sourceTerm, targetTerm] = await Promise.all([
    terms.findOne({ _id: new ObjectId(sourceTermId) }),
    terms.findOne({ _id: new ObjectId(targetTermId) }),
  ]);

  if (!sourceTerm) {
    throw new Error(`Source term ${sourceTermId} not found`);
  }
  if (!targetTerm) {
    throw new Error(`Target term ${targetTermId} not found`);
  }

  // Run Z39.19 validation checks
  const validation = await validateRelationshipFull(
    new ObjectId(sourceTermId),
    new ObjectId(targetTermId),
    type
  );

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Check if relationship already exists
  const existingRelationship = await relationships.findOne({
    sourceTermId: new ObjectId(sourceTermId),
    targetTermId: new ObjectId(targetTermId),
    type,
  });

  if (existingRelationship) {
    throw new Error('This relationship already exists');
  }

  // Create main relationship
  const relationship = createRelationship(sourceTermId, targetTermId, type);

  // Create reciprocal relationship
  const reciprocal = createReciprocalRelationship(relationship);

  // Insert both relationships
  await relationships.insertMany([relationship, reciprocal]);

  // Create audit logs
  const auditLog1 = createAuditLogCreate('Relationship', relationship, metadata);
  const auditLog2 = createAuditLogCreate('Relationship', reciprocal, {
    ...metadata,
    reciprocal: true,
  });
  await auditLogs.insertMany([auditLog1, auditLog2]);

  return {
    relationship,
    reciprocal,
  };
}

/**
 * Get relationships for a term
 */
export async function getRelationshipsByTerm(termId, options = {}) {
  const relationships = getCollection('etnotermos-relationships');
  const terms = getCollection('etnotermos');

  const { type, includeTermDetails = false } = options;

  // Build query
  const query = {
    $or: [{ sourceTermId: new ObjectId(termId) }, { targetTermId: new ObjectId(termId) }],
  };

  if (type) {
    query.type = type;
  }

  // Get relationships
  let results = await relationships.find(query).toArray();

  // Include term details if requested
  if (includeTermDetails) {
    results = await Promise.all(
      results.map(async (rel) => {
        const [source, target] = await Promise.all([
          terms.findOne({ _id: rel.sourceTermId }),
          terms.findOne({ _id: rel.targetTermId }),
        ]);

        return {
          ...rel,
          sourceTerm: source ? { _id: source._id, prefLabel: source.prefLabel } : null,
          targetTerm: target ? { _id: target._id, prefLabel: target.prefLabel } : null,
        };
      })
    );
  }

  return results;
}

/**
 * Delete a relationship (and its reciprocal)
 */
export async function deleteRelationship(relationshipId, metadata = {}) {
  const relationships = getCollection('etnotermos-relationships');
  const auditLogs = getCollection('etnotermos-audit-logs');

  // Get the relationship
  const relationship = await relationships.findOne({ _id: new ObjectId(relationshipId) });

  if (!relationship) {
    throw new Error('Relationship not found');
  }

  // Find and delete reciprocal
  const reciprocal = await relationships.findOne({
    sourceTermId: relationship.targetTermId,
    targetTermId: relationship.sourceTermId,
    type: relationship.reciprocalType,
  });

  if (reciprocal) {
    await relationships.deleteOne({ _id: reciprocal._id });

    // Audit log for reciprocal deletion
    const auditLog2 = createAuditLogDelete('Relationship', reciprocal, {
      ...metadata,
      reciprocal: true,
    });
    await auditLogs.insertOne(auditLog2);
  }

  // Delete main relationship
  await relationships.deleteOne({ _id: relationship._id });

  // Create audit log
  const auditLog = createAuditLogDelete('Relationship', relationship, metadata);
  await auditLogs.insertOne(auditLog);

  return { success: true, message: 'Relationship and reciprocal deleted successfully' };
}

/**
 * Validate all relationship reciprocity in the database
 * Useful for maintenance and data integrity checks
 */
export async function validateAllReciprocity() {
  const relationships = getCollection('etnotermos-relationships');

  const allRelationships = await relationships.find({}).toArray();
  const issues = [];

  for (const rel of allRelationships) {
    // Find reciprocal
    const reciprocal = await relationships.findOne({
      sourceTermId: rel.targetTermId,
      targetTermId: rel.sourceTermId,
      type: rel.reciprocalType,
    });

    // Validate
    const validation = validateReciprocity(rel, reciprocal);

    if (!validation.valid) {
      issues.push({
        relationshipId: rel._id,
        sourceTermId: rel.sourceTermId,
        targetTermId: rel.targetTermId,
        type: rel.type,
        error: validation.error,
      });
    }
  }

  return {
    total: allRelationships.length,
    valid: allRelationships.length - issues.length,
    issues,
  };
}

/**
 * Update relationship validation timestamp
 */
export async function updateRelationshipValidation(relationshipId) {
  const relationships = getCollection('etnotermos-relationships');

  await relationships.updateOne(
    { _id: new ObjectId(relationshipId) },
    { $set: { validatedAt: new Date() } }
  );
}

/**
 * Get relationship statistics
 */
export async function getRelationshipStatistics() {
  const relationships = getCollection('etnotermos-relationships');

  const stats = await relationships
    .aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ])
    .toArray();

  const total = stats.reduce((sum, item) => sum + item.count, 0);

  return {
    total,
    byType: stats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };
}

export default {
  createNewRelationship,
  getRelationshipsByTerm,
  deleteRelationship,
  validateAllReciprocity,
  updateRelationshipValidation,
  getRelationshipStatistics,
};
