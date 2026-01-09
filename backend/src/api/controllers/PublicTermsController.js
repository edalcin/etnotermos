// Public Terms Controller - T065
// Read-only operations for public access

import { listTerms, getTermById } from '../../services/TermService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * List terms with pagination and filtering
 * GET /api/v1/terms
 */
export const listTermsHandler = asyncHandler(async (req, res) => {
  const { page, limit, status, collections, sortBy, sortOrder } = req.query;

  const options = {
    page: page || 1,
    limit: limit || 20,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder === 'asc' ? 1 : -1,
  };

  if (status) {
    options.status = status;
  }

  if (collections) {
    options.collectionIds = Array.isArray(collections) ? collections : [collections];
  }

  const result = await listTerms(options);

  res.status(200).json(result.data);
});

/**
 * Get a single term by ID
 * GET /api/v1/terms/:id
 */
export const getTermHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const term = await getTermById(id);

  res.status(200).json(term);
});

export default {
  listTermsHandler,
  getTermHandler,
};
