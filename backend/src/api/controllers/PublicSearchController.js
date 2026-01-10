// Public Search Controller - T079
// MongoDB text search operations

import { searchTerms, getSearchSuggestions } from '../../services/SearchService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Search terms
 * GET /api/v1/search
 */
export const searchTermsHandler = asyncHandler(async (req, res) => {
  const { q, page, limit, status, collections } = req.query;

  const filters = {};
  if (status) {
    filters.status = status;
  }
  if (collections) {
    filters.collectionIds = Array.isArray(collections) ? collections : [collections];
  }

  const options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    includeRelationshipCounts: true,
  };

  const result = await searchTerms(q, filters, options);

  res.status(200).json({
    results: result.data,
    pagination: result.pagination,
    query: result.query,
  });
});

/**
 * Get search suggestions (autocomplete)
 * GET /api/v1/search/suggestions
 */
export const searchSuggestionsHandler = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({
      error: 'Query parameter "q" is required',
    });
  }

  const suggestions = await getSearchSuggestions(q, limit || 10);

  res.status(200).json(suggestions);
});

export default {
  searchTermsHandler,
  searchSuggestionsHandler,
};
