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

  // BUSINESS RULE: Preferred terms cannot be associated as alternatives (USE relationship)
  // USE means: sourceTerm is a non-preferred term pointing to targetTerm (preferred)
  // UF means: sourceTerm is a preferred term pointing to targetTerm (non-preferred alias)
  if (type === 'USE') {
    // For USE relationship, the source term becomes non-preferred
    // Check if source term is marked as preferred - if so, we need to change it
    if (sourceTerm.termType === 'preferred') {
      // Automatically change the source term to entry (non-preferred)
      await terms.updateOne(
        { _id: new ObjectId(sourceTermId) },
        {
          $set: {
            termType: 'entry',
            useTerm: new ObjectId(targetTermId),
            updatedAt: new Date()
          },
          $inc: { version: 1 }
        }
      );
      console.log(`[RelationshipService] Changed term "${sourceTerm.prefLabel}" from preferred to entry (non-preferred) due to USE relationship`);
    }
  }

  if (type === 'UF') {
    // For UF relationship, the target term is being marked as non-preferred alias of source
    // Check if target term is preferred - if so, reject the relationship
    if (targetTerm.termType === 'preferred') {
      throw new Error(`Termo Preferencial "${targetTerm.prefLabel}" nao pode ser associado como termo alternativo (UF). Termos Preferenciais representam conceitos principais e nao podem ser sinonimos de outros termos.`);
    }
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
 * Get grouped relationships for a term (organized by category)
 * Returns relationships grouped into hierarchical, associative, and equivalence categories
 */
export async function getGroupedRelationshipsByTerm(termId) {
  const relationships = getCollection('etnotermos-relationships');
  const terms = getCollection('etnotermos');

  // Get all relationships where this term is the source
  const rels = await relationships.find({
    sourceTermId: new ObjectId(termId)
  }).toArray();

  // Collect all target term IDs
  const targetTermIds = [...new Set(rels.map(r => r.targetTermId.toString()))];

  // Fetch all target terms at once
  const targetTerms = await terms.find({
    _id: { $in: targetTermIds.map(id => new ObjectId(id)) }
  }).toArray();

  // Create lookup map
  const termMap = {};
  targetTerms.forEach(t => {
    termMap[t._id.toString()] = {
      _id: t._id,
      prefLabel: t.prefLabel,
      status: t.status,
      definition: t.definition
    };
  });

  // Organize by category and type
  const result = {
    hierarchical: { BT: [], NT: [], BTG: [], NTG: [], BTP: [], NTP: [], BTI: [], NTI: [] },
    associative: { RT: [] },
    equivalence: { USE: [], UF: [] }
  };

  rels.forEach(rel => {
    const targetTerm = termMap[rel.targetTermId.toString()];
    const relData = {
      _id: rel._id,
      type: rel.type,
      targetTermId: rel.targetTermId,
      targetTerm: targetTerm || { prefLabel: 'Termo não encontrado', status: 'unknown' },
      createdAt: rel.createdAt
    };

    // Categorize by type
    if (['BT', 'BTG', 'BTP', 'BTI', 'NT', 'NTG', 'NTP', 'NTI'].includes(rel.type)) {
      if (result.hierarchical[rel.type]) {
        result.hierarchical[rel.type].push(relData);
      }
    } else if (rel.type === 'RT') {
      result.associative.RT.push(relData);
    } else if (['USE', 'UF'].includes(rel.type)) {
      if (result.equivalence[rel.type]) {
        result.equivalence[rel.type].push(relData);
      }
    }
  });

  return result;
}

/**
 * Get relationship counts by type for a term
 */
export async function getRelationshipCountsByTerm(termId) {
  const relationships = getCollection('etnotermos-relationships');

  const counts = await relationships.aggregate([
    { $match: { sourceTermId: new ObjectId(termId) } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]).toArray();

  const result = { BT: 0, NT: 0, RT: 0, USE: 0, UF: 0 };
  counts.forEach(c => {
    // Aggregate BT variants into BT count
    if (['BT', 'BTG', 'BTP', 'BTI'].includes(c._id)) {
      result.BT += c.count;
    }
    // Aggregate NT variants into NT count
    else if (['NT', 'NTG', 'NTP', 'NTI'].includes(c._id)) {
      result.NT += c.count;
    }
    else if (c._id === 'RT') {
      result.RT = c.count;
    }
    else if (c._id === 'USE') {
      result.USE = c.count;
    }
    else if (c._id === 'UF') {
      result.UF = c.count;
    }
  });

  return result;
}

/**
 * Get relationship counts for multiple terms at once (batch operation)
 */
export async function getRelationshipCountsBatch(termIds) {
  const relationships = getCollection('etnotermos-relationships');

  const objectIds = termIds.map(id => new ObjectId(id));

  const counts = await relationships.aggregate([
    { $match: { sourceTermId: { $in: objectIds } } },
    { $group: {
      _id: { termId: '$sourceTermId', type: '$type' },
      count: { $sum: 1 }
    }}
  ]).toArray();

  // Initialize result map
  const result = {};
  termIds.forEach(id => {
    result[id] = { BT: 0, NT: 0, RT: 0, USE: 0, UF: 0 };
  });

  // Populate counts
  counts.forEach(c => {
    const termId = c._id.termId.toString();
    const type = c._id.type;

    if (!result[termId]) return;

    // Aggregate BT variants
    if (['BT', 'BTG', 'BTP', 'BTI'].includes(type)) {
      result[termId].BT += c.count;
    }
    // Aggregate NT variants
    else if (['NT', 'NTG', 'NTP', 'NTI'].includes(type)) {
      result[termId].NT += c.count;
    }
    else if (type === 'RT') {
      result[termId].RT = c.count;
    }
    else if (type === 'USE') {
      result[termId].USE = c.count;
    }
    else if (type === 'UF') {
      result[termId].UF = c.count;
    }
  });

  return result;
}

/**
 * Get orphan terms (terms without any relationships)
 */
export async function getOrphanTerms(options = {}) {
  const terms = getCollection('etnotermos');
  const relationships = getCollection('etnotermos-relationships');

  const { page = 1, limit = 20 } = options;

  // Get all term IDs that have relationships
  const termsWithRelationships = await relationships.aggregate([
    { $group: { _id: '$sourceTermId' } }
  ]).toArray();

  const termIdsWithRels = new Set(termsWithRelationships.map(t => t._id.toString()));

  // Find terms not in that set
  const allTerms = await terms.find({}).toArray();
  const orphans = allTerms.filter(t => !termIdsWithRels.has(t._id.toString()));

  // Apply pagination
  const skip = (page - 1) * limit;
  const paginatedOrphans = orphans.slice(skip, skip + limit);

  return {
    data: paginatedOrphans,
    pagination: {
      page,
      limit,
      total: orphans.length,
      totalPages: Math.ceil(orphans.length / limit)
    }
  };
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

/**
 * List relationships with populated term details
 */
export async function listRelationshipsWithTerms(options = {}) {
  const relationships = getCollection('etnotermos-relationships');
  const { page = 1, limit = 20, type } = options;

  // Build query
  const query = {};
  if (type) {
    query.type = type;
  }

  const skip = (page - 1) * parseInt(limit);

  // Aggregation pipeline with $lookup to populate terms
  const pipeline = [
    { $match: query },
    {
      $lookup: {
        from: 'etnotermos',
        localField: 'sourceTermId',
        foreignField: '_id',
        as: 'sourceTerm',
      },
    },
    {
      $lookup: {
        from: 'etnotermos',
        localField: 'targetTermId',
        foreignField: '_id',
        as: 'targetTerm',
      },
    },
    { $unwind: { path: '$sourceTerm', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$targetTerm', preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: parseInt(limit) },
  ];

  const [data, total] = await Promise.all([
    relationships.aggregate(pipeline).toArray(),
    relationships.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
}

export default {
  createNewRelationship,
  getRelationshipsByTerm,
  deleteRelationship,
  validateAllReciprocity,
  updateRelationshipValidation,
  getRelationshipStatistics,
  listRelationshipsWithTerms,
  getGroupedRelationshipsByTerm,
  getRelationshipCountsByTerm,
  getRelationshipCountsBatch,
  getOrphanTerms,
};
