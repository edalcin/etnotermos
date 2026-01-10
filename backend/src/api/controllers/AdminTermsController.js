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

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const term = await updateExistingTerm(id, updates, version, metadata);

  res.status(200).json(term);
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

export default {
  listTermsHandler,
  getTermHandler,
  createTermHandler,
  updateTermHandler,
  deleteTermHandler,
  deprecateTermHandler,
  mergeTermsHandler,
};
