// Public Relationships Router - T066
// Read-only routes for relationship queries

import express from 'express';
import { getRelationshipsByTermHandler } from '../controllers/PublicRelationshipsController.js';
import { validateObjectId } from '../middleware/validate.js';
import rateLimit from '../middleware/rateLimit.js';

const router = express.Router();

// Apply rate limiting
router.use(rateLimit);

/**
 * GET /api/v1/relationships/:termId
 * Get all relationships for a specific term
 */
router.get('/:termId', validateObjectId('termId'), getRelationshipsByTermHandler);

export default router;
