// Public Search Router - T078
// Search endpoints

import express from 'express';
import { searchTermsHandler, searchSuggestionsHandler } from '../controllers/PublicSearchController.js';
import { validateSearchQuery, validatePagination } from '../middleware/validate.js';
import rateLimit from '../middleware/rateLimit.js';

const router = express.Router();

// Apply rate limiting
router.use(rateLimit);

/**
 * GET /api/v1/search
 * Full text search
 */
router.get('/', validateSearchQuery, validatePagination, searchTermsHandler);

/**
 * GET /api/v1/search/suggestions
 * Autocomplete suggestions
 */
router.get('/suggestions', searchSuggestionsHandler);

export default router;
