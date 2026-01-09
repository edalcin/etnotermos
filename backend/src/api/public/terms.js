// Public Terms Router - T064
// Read-only routes for term access

import express from 'express';
import { listTermsHandler, getTermHandler } from '../controllers/PublicTermsController.js';
import { validateObjectId, validatePagination } from '../middleware/validate.js';
import rateLimit from '../middleware/rateLimit.js';

const router = express.Router();

// Apply rate limiting to all public routes
router.use(rateLimit);

/**
 * GET /api/v1/terms
 * List all terms with pagination
 */
router.get('/', validatePagination, listTermsHandler);

/**
 * GET /api/v1/terms/:id
 * Get a specific term by ID
 */
router.get('/:id', validateObjectId('id'), getTermHandler);

export default router;
