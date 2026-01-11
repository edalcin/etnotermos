// TermService - T050
// Business logic for term CRUD operations with Z39.19 compliance

import { ObjectId } from 'mongodb';
import { getCollection } from '../shared/database.js';
import { createTerm, updateTerm as updateTermModel, deprecateTerm as deprecateTermModel } from '../models/Term.js';
import { validateAuthorityControl, validateHomographQualifier } from '../lib/validation/z39-19.js';
import { createAuditLogCreate, createAuditLogUpdate, createAuditLogDelete } from '../models/AuditLog.js';

/**
 * Get term by ID
 */
export async function getTermById(termId) {
  const terms = getCollection('etnotermos');
  const term = await terms.findOne({ _id: new ObjectId(termId) });

  if (!term) {
    throw new Error('Term not found');
  }

  return term;
}

/**
 * List terms with pagination and filtering
 */
export async function listTerms(options = {}) {
  const terms = getCollection('etnotermos');

  const {
    page = 1,
    limit = 20,
    status,
    collectionIds,
    sortBy = 'createdAt',
    sortOrder = -1,
    startsWith,
    searchQuery,
  } = options;

  // Build query
  const query = {};
  if (status) {
    query.status = status;
  }
  if (collectionIds && collectionIds.length > 0) {
    query.collectionIds = { $in: collectionIds.map((id) => new ObjectId(id)) };
  }
  if (startsWith) {
    query.prefLabel = { $regex: `^${startsWith}`, $options: 'i' };
  }
  if (searchQuery) {
    query.$or = [
      { prefLabel: { $regex: searchQuery, $options: 'i' } },
      { altLabels: { $regex: searchQuery, $options: 'i' } },
      { definition: { $regex: searchQuery, $options: 'i' } },
    ];
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    terms.find(query).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit).toArray(),
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
 * Create a new term
 */
export async function createNewTerm(data, metadata = {}) {
  const terms = getCollection('etnotermos');
  const auditLogs = getCollection('etnotermos-audit-logs');

  // CRITICAL FIX: Remove or normalize invalid language values
  // MongoDB text index doesn't support "pt-BR", only "portuguese" or null
  if (data.language === 'pt-BR' || data.language === 'pt') {
    console.log('[TermService] Removing invalid language value from new term:', data.language);
    delete data.language;
  }

  // Validate authority control (unique prefLabel)
  const authorityCheck = await validateAuthorityControl(data.prefLabel);
  if (!authorityCheck.valid) {
    throw new Error(authorityCheck.error);
  }

  // Validate homograph qualifier (optional warning)
  const homographCheck = validateHomographQualifier(
    data.prefLabel,
    data.qualifier,
    data.definition
  );
  if (!homographCheck.valid && homographCheck.warning) {
    // Log warning but don't block creation
    console.warn(`[Z39.19 Warning] ${homographCheck.warning}`);
  }

  // Create term document
  const term = createTerm(data);

  // Insert term
  await terms.insertOne(term);

  // Create audit log
  const auditLog = createAuditLogCreate('Term', term, metadata);
  await auditLogs.insertOne(auditLog);

  return term;
}

/**
 * Update an existing term
 */
export async function updateExistingTerm(termId, updates, expectedVersion, metadata = {}) {
  console.log('[TermService] Starting updateExistingTerm for:', termId);

  const terms = getCollection('etnotermos');
  const auditLogs = getCollection('etnotermos-audit-logs');

  // CRITICAL FIX: Remove or normalize invalid language values
  // MongoDB text index doesn't support "pt-BR", only "portuguese" or null
  if (updates.language === 'pt-BR' || updates.language === 'pt') {
    console.log('[TermService] Removing invalid language value:', updates.language);
    delete updates.language;
  }

  // Get existing term
  console.log('[TermService] Getting existing term...');
  const existingTerm = await getTermById(termId);
  console.log('[TermService] Existing term found:', existingTerm.prefLabel);

  // Check for authority control if prefLabel is being changed
  if (updates.prefLabel && updates.prefLabel !== existingTerm.prefLabel) {
    console.log('[TermService] Checking authority control for new prefLabel:', updates.prefLabel);
    const authorityCheck = await validateAuthorityControl(updates.prefLabel, existingTerm._id);
    if (!authorityCheck.valid) {
      console.error('[TermService] Authority control failed:', authorityCheck.error);
      throw new Error(authorityCheck.error);
    }
  }

  // Update term with optimistic locking
  let updatedTerm;
  try {
    console.log('[TermService] Updating term model...');
    updatedTerm = updateTermModel(existingTerm, updates, expectedVersion);
    console.log('[TermService] Term model updated successfully');
  } catch (error) {
    console.error('[TermService] Error updating term model:', error.message);
    // Version conflict - attempt merge
    if (error.message.includes('Version conflict')) {
      console.log('[TermService] Attempting merge...');
      const mergeResult = await attemptMerge(existingTerm, updates);
      if (mergeResult.success) {
        updatedTerm = mergeResult.term;
        console.log('[TermService] Merge successful');
      } else {
        throw new Error(
          `Version conflict: ${error.message}. Manual resolution required: ${mergeResult.conflicts.join(', ')}`
        );
      }
    } else {
      throw error;
    }
  }

  // Save updated term
  console.log('[TermService] Saving updated term to database...');
  const result = await terms.replaceOne({ _id: existingTerm._id }, updatedTerm);
  console.log('[TermService] Database result:', result);

  if (result.modifiedCount === 0) {
    console.error('[TermService] Failed to update term - modifiedCount is 0');
    throw new Error('Failed to update term');
  }

  // Create audit log
  console.log('[TermService] Creating audit log...');
  const auditLog = createAuditLogUpdate('Term', termId, existingTerm, updatedTerm, metadata);
  await auditLogs.insertOne(auditLog);
  console.log('[TermService] Audit log created successfully');

  return updatedTerm;
}

/**
 * Attempt to merge conflicting updates (optimistic locking conflict resolution)
 */
async function attemptMerge(existingTerm, updates) {
  // Three-way merge for disjoint fields
  const conflicts = [];
  const merged = { ...existingTerm };

  for (const [key, value] of Object.entries(updates)) {
    // Skip metadata fields
    if (['_id', 'createdAt', 'updatedAt', 'version'].includes(key)) {
      continue;
    }

    // Check if field was modified in both versions
    if (existingTerm[key] !== merged[key]) {
      conflicts.push(key);
    } else {
      // No conflict, apply update
      merged[key] = value;
    }
  }

  if (conflicts.length > 0) {
    return { success: false, conflicts };
  }

  // Increment version
  merged.version = existingTerm.version + 1;
  merged.updatedAt = new Date();

  return { success: true, term: merged };
}

/**
 * Delete a term (with dependency check)
 */
export async function deleteTerm(termId, force = false, metadata = {}) {
  const terms = getCollection('etnotermos');
  const relationships = getCollection('etnotermos-relationships');
  const notes = getCollection('etnotermos-notes');
  const auditLogs = getCollection('etnotermos-audit-logs');

  // Get existing term
  const existingTerm = await getTermById(termId);

  // Check for dependencies
  const dependencies = await checkTermDependencies(termId);

  if (dependencies.length > 0 && !force) {
    return {
      warning: 'This term has dependencies and cannot be deleted without confirmation',
      dependencies,
      requiresConfirmation: true,
    };
  }

  // Delete term
  await terms.deleteOne({ _id: new ObjectId(termId) });

  // Delete associated notes
  await notes.deleteMany({ termId: new ObjectId(termId) });

  // Delete associated relationships
  await relationships.deleteMany({
    $or: [{ sourceTermId: new ObjectId(termId) }, { targetTermId: new ObjectId(termId) }],
  });

  // Create audit log
  const auditLog = createAuditLogDelete('Term', existingTerm, metadata);
  await auditLogs.insertOne(auditLog);

  return { success: true, message: 'Term deleted successfully' };
}

/**
 * Check term dependencies (relationships, notes)
 */
async function checkTermDependencies(termId) {
  const relationships = getCollection('etnotermos-relationships');
  const terms = getCollection('etnotermos');

  // Find all relationships where this term is the target (other terms depend on it)
  const dependentRelationships = await relationships
    .find({ targetTermId: new ObjectId(termId) })
    .toArray();

  const dependencies = [];

  for (const rel of dependentRelationships) {
    const dependentTerm = await terms.findOne({ _id: rel.sourceTermId });
    if (dependentTerm) {
      dependencies.push({
        termId: dependentTerm._id.toString(),
        prefLabel: dependentTerm.prefLabel,
        relationshipType: rel.type,
      });
    }
  }

  return dependencies;
}

/**
 * Deprecate a term (T058)
 */
export async function deprecateExistingTerm(termId, replacedById, deprecationNote = '', metadata = {}) {
  const terms = getCollection('etnotermos');
  const auditLogs = getCollection('etnotermos-audit-logs');

  // Get existing term
  const existingTerm = await getTermById(termId);

  // Verify replacement term exists
  await getTermById(replacedById);

  // Deprecate term
  const deprecatedTerm = deprecateTermModel(existingTerm, replacedById, deprecationNote);

  // Save
  await terms.replaceOne({ _id: existingTerm._id }, deprecatedTerm);

  // Create audit log
  const auditLog = createAuditLogUpdate('Term', termId, existingTerm, deprecatedTerm, {
    ...metadata,
    action: 'deprecate',
  });
  await auditLogs.insertOne(auditLog);

  return deprecatedTerm;
}

/**
 * Merge two terms (T058)
 */
export async function mergeTerms(sourceTermId, targetTermId, metadata = {}) {
  const terms = getCollection('etnotermos');
  const relationships = getCollection('etnotermos-relationships');
  const notes = getCollection('etnotermos-notes');
  const auditLogs = getCollection('etnotermos-audit-logs');

  // Get both terms
  const [sourceTerm, targetTerm] = await Promise.all([
    getTermById(sourceTermId),
    getTermById(targetTermId),
  ]);

  // Move all relationships from source to target
  await relationships.updateMany(
    { sourceTermId: new ObjectId(sourceTermId) },
    { $set: { sourceTermId: new ObjectId(targetTermId) } }
  );

  await relationships.updateMany(
    { targetTermId: new ObjectId(sourceTermId) },
    { $set: { targetTermId: new ObjectId(targetTermId) } }
  );

  // Move all notes from source to target
  await notes.updateMany(
    { termId: new ObjectId(sourceTermId) },
    { $set: { termId: new ObjectId(targetTermId) } }
  );

  // Merge collections and sources
  const mergedCollectionIds = [
    ...new Set([...(targetTerm.collectionIds || []), ...(sourceTerm.collectionIds || [])]),
  ];
  const mergedSourceIds = [
    ...new Set([...(targetTerm.sourceIds || []), ...(sourceTerm.sourceIds || [])]),
  ];

  await terms.updateOne(
    { _id: new ObjectId(targetTermId) },
    {
      $set: {
        collectionIds: mergedCollectionIds,
        sourceIds: mergedSourceIds,
        updatedAt: new Date(),
      },
    }
  );

  // Deprecate source term
  await deprecateExistingTerm(sourceTermId, targetTermId, 'Merged into another term', metadata);

  // Create merge audit log
  const mergeLog = {
    _id: new ObjectId(),
    entityType: 'Term',
    entityId: new ObjectId(sourceTermId),
    action: 'merge',
    changes: {
      mergedInto: targetTermId,
      sourceTermLabel: sourceTerm.prefLabel,
      targetTermLabel: targetTerm.prefLabel,
    },
    timestamp: new Date(),
    metadata,
  };
  await auditLogs.insertOne(mergeLog);

  return {
    success: true,
    message: `Term "${sourceTerm.prefLabel}" merged into "${targetTerm.prefLabel}"`,
    targetTerm: await getTermById(targetTermId),
  };
}

export default {
  getTermById,
  listTerms,
  createNewTerm,
  updateExistingTerm,
  deleteTerm,
  deprecateExistingTerm,
  mergeTerms,
};
