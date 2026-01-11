// Admin Relationships Router - T070
// CRUD routes for relationship management

import express from 'express';
import {
  createRelationshipHandler,
  listRelationshipsHandler,
  deleteRelationshipHandler,
} from '../controllers/AdminRelationshipsController.js';
import {
  validateRequiredFields,
  validateObjectId,
  validateRelationshipType,
  validatePagination,
} from '../middleware/validate.js';
import adminAuth from '../middleware/adminAuth.js';
import auditLog from '../middleware/auditLog.js';

const router = express.Router();

// Apply admin authentication
router.use(adminAuth);

// Apply audit logging
router.use(auditLog);

/**
 * GET /api/v1/admin/relationships
 * List all relationships with term details
 */
router.get('/', validatePagination, listRelationshipsHandler);

/**
 * POST /api/v1/admin/relationships
 * Create a new relationship
 */
router.post(
  '/',
  validateRequiredFields(['sourceTermId', 'targetTermId', 'type']),
  validateRelationshipType,
  createRelationshipHandler
);

/**
 * DELETE /api/v1/admin/relationships/:id
 * Delete a relationship
 */
router.delete('/:id', validateObjectId('id'), deleteRelationshipHandler);

export default router;
