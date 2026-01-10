// Import Service for EtnoTermos
// Handles bulk import of terms with conflict detection and resolution

import { getDb } from '../shared/database.js';
import { parseCSV, validateTerms } from '../lib/import/csvParser.js';
import { ObjectId } from 'mongodb';

/**
 * Preview import and detect conflicts
 * @param {string|Buffer} fileContent - CSV file content
 * @returns {Promise<Object>} Preview with terms, conflicts, and validation results
 */
export async function previewImport(fileContent) {
  const db = getDb();
  const termsCollection = db.collection('etnotermos');

  // Parse CSV
  const parseResult = parseCSV(fileContent);

  if (parseResult.errors.length > 0) {
    return {
      success: false,
      parseErrors: parseResult.errors,
      warnings: parseResult.warnings,
      terms: []
    };
  }

  // Validate terms
  const validation = validateTerms(parseResult.terms);

  // Check for conflicts with existing terms
  const conflicts = await detectConflicts(validation.valid, termsCollection);

  return {
    success: true,
    summary: {
      total: parseResult.terms.length,
      valid: validation.valid.length,
      invalid: validation.invalid.length,
      conflicts: conflicts.length,
      warnings: parseResult.warnings.length
    },
    terms: validation.valid,
    invalid: validation.invalid,
    conflicts,
    warnings: parseResult.warnings
  };
}

/**
 * Detect conflicts between import terms and existing database terms
 * @param {Array} terms - Validated terms to import
 * @param {Collection} collection - MongoDB collection
 * @returns {Promise<Array>} Array of conflicts
 */
async function detectConflicts(terms, collection) {
  const conflicts = [];

  for (const term of terms) {
    // Check for ID conflicts (if term has _id)
    if (term._id) {
      const existingById = await collection.findOne({ _id: term._id });
      if (existingById) {
        conflicts.push({
          type: 'id_conflict',
          importTerm: term,
          existingTerm: existingById,
          message: `Term with ID "${term._id}" already exists`,
          resolutionOptions: ['skip', 'overwrite', 'merge']
        });
        continue;
      }
    }

    // Check for preferred name conflicts
    const existingByName = await collection.findOne({
      prefLabel: { $regex: new RegExp(`^${escapeRegex(term.prefLabel)}$`, 'i') }
    });

    if (existingByName) {
      conflicts.push({
        type: 'name_conflict',
        importTerm: term,
        existingTerm: existingByName,
        message: `Term with preferred name "${term.prefLabel}" already exists`,
        resolutionOptions: ['skip', 'overwrite', 'merge', 'create_alternate']
      });
    }
  }

  return conflicts;
}

/**
 * Execute import with conflict resolution
 * @param {Array} terms - Terms to import
 * @param {Object} resolutions - Conflict resolutions map { termIndex: 'skip'|'overwrite'|'merge' }
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import results
 */
export async function executeImport(terms, resolutions = {}, options = {}) {
  const db = getDb();
  const termsCollection = db.collection('etnotermos');
  const relationshipsCollection = db.collection('relationships');
  const auditLogCollection = db.collection('auditLogs');

  const results = {
    created: [],
    updated: [],
    skipped: [],
    errors: []
  };

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i];
    const resolution = resolutions[i] || 'skip';

    try {
      // Check for existing term
      const existing = await findExistingTerm(term, termsCollection);

      if (existing && resolution === 'skip') {
        results.skipped.push({
          term: term.prefLabel,
          reason: 'Conflict - skipped by resolution'
        });
        continue;
      }

      if (existing && resolution === 'overwrite') {
        // Overwrite existing term
        const updated = await overwriteTerm(existing._id, term, termsCollection, auditLogCollection);
        results.updated.push(updated);
      } else if (existing && resolution === 'merge') {
        // Merge with existing term
        const merged = await mergeTerm(existing._id, term, termsCollection, auditLogCollection);
        results.updated.push(merged);
      } else if (!existing) {
        // Create new term
        const created = await createTerm(term, termsCollection, auditLogCollection);
        results.created.push(created);
      }

      // Process relationships (if term was created or updated)
      if (term._relationships) {
        const termId = existing?._id || results.created[results.created.length - 1]._id;
        await processRelationships(termId, term._relationships, relationshipsCollection, auditLogCollection);
      }

    } catch (error) {
      results.errors.push({
        term: term.prefLabel,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Find existing term by ID or preferred name
 */
async function findExistingTerm(term, collection) {
  if (term._id) {
    const byId = await collection.findOne({ _id: term._id });
    if (byId) return byId;
  }

  return await collection.findOne({
    prefLabel: { $regex: new RegExp(`^${escapeRegex(term.prefLabel)}$`, 'i') }
  });
}

/**
 * Create new term
 */
async function createTerm(term, collection, auditLog) {
  const now = new Date();
  const termDoc = {
    ...term,
    _id: term._id || new ObjectId().toString(),
    createdAt: now,
    updatedAt: now,
    version: 1
  };

  // Remove temporary import fields
  delete termDoc._relationships;
  delete termDoc._collections;
  delete termDoc._sources;

  await collection.insertOne(termDoc);

  // Audit log
  await auditLog.insertOne({
    entityType: 'Term',
    entityId: termDoc._id,
    action: 'create',
    changes: termDoc,
    timestamp: now,
    metadata: { source: 'csv_import' }
  });

  return termDoc;
}

/**
 * Overwrite existing term
 */
async function overwriteTerm(termId, newTerm, collection, auditLog) {
  const now = new Date();
  const existing = await collection.findOne({ _id: termId });

  const updated = {
    ...newTerm,
    _id: termId,
    createdAt: existing.createdAt,
    updatedAt: now,
    version: (existing.version || 0) + 1
  };

  delete updated._relationships;
  delete updated._collections;
  delete updated._sources;

  await collection.replaceOne({ _id: termId }, updated);

  // Audit log
  await auditLog.insertOne({
    entityType: 'Term',
    entityId: termId,
    action: 'update',
    changes: { before: existing, after: updated },
    timestamp: now,
    metadata: { source: 'csv_import', resolution: 'overwrite' }
  });

  return updated;
}

/**
 * Merge imported term with existing term (combine fields)
 */
async function mergeTerm(termId, newTerm, collection, auditLog) {
  const now = new Date();
  const existing = await collection.findOne({ _id: termId });

  // Merge strategy: combine arrays, keep existing non-empty fields, add new fields
  const merged = {
    ...existing,
    altLabels: [...new Set([...(existing.altLabels || []), ...(newTerm.altLabels || [])])],
    hiddenLabels: [...new Set([...(existing.hiddenLabels || []), ...(newTerm.hiddenLabels || [])])],
    definition: newTerm.definition || existing.definition,
    scopeNote: newTerm.scopeNote || existing.scopeNote,
    example: newTerm.example || existing.example,
    facets: { ...(existing.facets || {}), ...(newTerm.facets || {}) },
    updatedAt: now,
    version: (existing.version || 0) + 1
  };

  await collection.replaceOne({ _id: termId }, merged);

  // Audit log
  await auditLog.insertOne({
    entityType: 'Term',
    entityId: termId,
    action: 'update',
    changes: { before: existing, after: merged },
    timestamp: now,
    metadata: { source: 'csv_import', resolution: 'merge' }
  });

  return merged;
}

/**
 * Process relationships from CSV import
 */
async function processRelationships(termId, relationships, collection, auditLog) {
  const relationshipTypes = {
    BT: 'NT', // Broader Term → reciprocal is Narrower Term
    NT: 'BT',
    RT: 'RT', // Related Term is reciprocal
    UF: 'USE'
  };

  for (const [type, targetTerms] of Object.entries(relationships)) {
    for (const targetId of targetTerms) {
      const now = new Date();

      // Create relationship
      await collection.insertOne({
        sourceTermId: termId,
        targetTermId: targetId,
        type,
        reciprocalType: relationshipTypes[type],
        isReciprocal: true,
        createdAt: now,
        validatedAt: now
      });

      // Create reciprocal relationship
      await collection.insertOne({
        sourceTermId: targetId,
        targetTermId: termId,
        type: relationshipTypes[type],
        reciprocalType: type,
        isReciprocal: true,
        createdAt: now,
        validatedAt: now
      });

      // Audit log
      await auditLog.insertOne({
        entityType: 'Relationship',
        entityId: `${termId}-${targetId}`,
        action: 'create',
        changes: { sourceTermId: termId, targetTermId: targetId, type },
        timestamp: now,
        metadata: { source: 'csv_import' }
      });
    }
  }
}

/**
 * Escape regex special characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default {
  previewImport,
  executeImport
};
