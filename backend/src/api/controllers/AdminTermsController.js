// Admin Terms Controller - T069
// Full CRUD operations for admin access

import {
  createNewTerm,
  updateExistingTerm,
  deleteTerm,
  deprecateExistingTerm,
  mergeTerms,
  listTerms,
  getTermById,
} from '../../services/TermService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Create a new term
 * POST /api/v1/admin/terms
 */
export const createTermHandler = asyncHandler(async (req, res) => {
  const termData = req.body;

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const term = await createNewTerm(termData, metadata);

  res.status(201).json(term);
});

/**
 * Update an existing term
 * PUT /api/v1/admin/terms/:id
 */
export const updateTermHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const { version } = req.body;

  console.log('[AdminTermsController] Updating term:', id);
  console.log('[AdminTermsController] Updates:', JSON.stringify(updates, null, 2));
  console.log('[AdminTermsController] Version:', version);

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  try {
    const term = await updateExistingTerm(id, updates, version, metadata);
    console.log('[AdminTermsController] Term updated successfully');
    res.status(200).json(term);
  } catch (error) {
    console.error('[AdminTermsController] Error updating term:', error);
    throw error;
  }
});

/**
 * Delete a term
 * DELETE /api/v1/admin/terms/:id
 */
export const deleteTermHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { confirm } = req.query;

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const result = await deleteTerm(id, confirm === 'true', metadata);

  res.status(200).json(result);
});

/**
 * Deprecate a term
 * POST /api/v1/admin/terms/:id/deprecate
 */
export const deprecateTermHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { replacedBy, deprecationNote } = req.body;

  if (!replacedBy) {
    return res.status(400).json({
      error: 'replacedBy field is required for deprecation',
    });
  }

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const term = await deprecateExistingTerm(id, replacedBy, deprecationNote || '', metadata);

  res.status(200).json(term);
});

/**
 * Merge two terms
 * POST /api/v1/admin/terms/:sourceId/merge/:targetId
 */
export const mergeTermsHandler = asyncHandler(async (req, res) => {
  const { sourceId, targetId } = req.params;

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const result = await mergeTerms(sourceId, targetId, metadata);

  res.status(200).json(result);
});

/**
 * List terms with pagination and filtering
 * GET /api/v1/admin/terms
 */
export const listTermsHandler = asyncHandler(async (req, res) => {
  const { page, limit, status, collections, sortBy, sortOrder, q } = req.query;

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    sortBy: sortBy || 'modified',
    sortOrder: sortOrder === 'asc' ? 1 : -1,
  };

  if (status) {
    options.status = status;
  }

  if (collections) {
    options.collectionIds = Array.isArray(collections) ? collections : [collections];
  }

  if (q) {
    options.searchQuery = q;
  }

  const result = await listTerms(options);

  res.status(200).json(result);
});

/**
 * Get a single term by ID
 * GET /api/v1/admin/terms/:id
 */
export const getTermHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const term = await getTermById(id);

  res.status(200).json(term);
});

/**
 * Get all terms with their BT/NT relationships for hierarchy building
 * GET /api/v1/admin/terms/hierarchy
 */
export const getTermsHierarchyHandler = asyncHandler(async (req, res) => {
  const { status, collections, q } = req.query;

  // Import dependencies needed
  const { getCollection } = await import('../../shared/db.js');
  const { ObjectId } = await import('mongodb');

  const termsCollection = getCollection('etnotermos');
  const relationshipsCollection = getCollection('etnotermos-relationships');

  // Build query for terms
  const termQuery = {};
  if (status) termQuery.status = status;
  if (collections) {
    termQuery.collectionIds = { $in: [new ObjectId(collections)] };
  }
  if (q) {
    termQuery.$or = [
      { prefLabel: { $regex: q, $options: 'i' } },
      { altLabels: { $regex: q, $options: 'i' } },
      { definition: { $regex: q, $options: 'i' } }
    ];
  }

  // Fetch all terms
  const allTerms = await termsCollection.find(termQuery).sort({ prefLabel: 1 }).toArray();

  // Fetch all BT/NT relationships (broader/narrower)
  const hierarchicalTypes = ['BT', 'NT', 'BTG', 'NTG', 'BTP', 'NTP', 'BTI', 'NTI'];
  const allRelationships = await relationshipsCollection.find({
    type: { $in: hierarchicalTypes }
  }).toArray();

  // Build a map of term relationships
  const termRelationships = {};

  allTerms.forEach(term => {
    termRelationships[term._id.toString()] = {
      broaderTerms: [],  // BT relationships (parents)
      narrowerTerms: []  // NT relationships (children)
    };
  });

  // Populate relationships
  allRelationships.forEach(rel => {
    const sourceId = rel.sourceTermId.toString();
    const targetId = rel.targetTermId.toString();

    if (rel.type.startsWith('BT')) {
      // Source term has a broader term (target is parent)
      if (termRelationships[sourceId]) {
        termRelationships[sourceId].broaderTerms.push(targetId);
      }
    } else if (rel.type.startsWith('NT')) {
      // Source term has a narrower term (target is child)
      if (termRelationships[sourceId]) {
        termRelationships[sourceId].narrowerTerms.push(targetId);
      }
    }
  });

  res.status(200).json({
    terms: allTerms,
    relationships: termRelationships
  });
});

export default {
  listTermsHandler,
  getTermHandler,
  createTermHandler,
  updateTermHandler,
  deleteTermHandler,
  deprecateTermHandler,
  mergeTermsHandler,
  getTermsHierarchyHandler,
};
