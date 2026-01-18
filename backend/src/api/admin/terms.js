// Admin Terms Router - T068 & T084
// Full CRUD routes for term management

import express from 'express';
import {
  listTermsHandler,
  getTermHandler,
  createTermHandler,
  updateTermHandler,
  deleteTermHandler,
  deprecateTermHandler,
  mergeTermsHandler,
  getTermsHierarchyHandler,
  getTermRelationshipsHandler,
  getOrphanTermsHandler,
} from '../controllers/AdminTermsController.js';
import {
  validateRequiredFields,
  validateObjectId,
  validateTermStatus,
} from '../middleware/validate.js';
import adminAuth from '../middleware/adminAuth.js';
import auditLog from '../middleware/auditLog.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// Apply audit logging to all routes
router.use(auditLog);

/**
 * GET /api/v1/admin/terms
 * List all terms with pagination and filtering
 */
router.get('/', listTermsHandler);

/**
 * GET /api/v1/admin/terms/hierarchy
 * Get all terms with BT/NT relationships for tree building
 */
router.get('/hierarchy', getTermsHierarchyHandler);

/**
 * GET /api/v1/admin/terms/orphans
 * Get terms without any relationships
 */
router.get('/orphans', getOrphanTermsHandler);

/**
 * GET /api/v1/admin/terms/:id
 * Get a single term by ID
 */
router.get('/:id', validateObjectId('id'), getTermHandler);

/**
 * GET /api/v1/admin/terms/:id/relationships
 * Get grouped relationships for a term
 */
router.get('/:id/relationships', validateObjectId('id'), getTermRelationshipsHandler);

/**
 * POST /api/v1/admin/terms
 * Create a new term
 */
router.post(
  '/',
  validateRequiredFields(['prefLabel']),
  validateTermStatus,
  createTermHandler
);

/**
 * PUT /api/v1/admin/terms/:id
 * Update an existing term
 */
router.put('/:id', validateObjectId('id'), validateTermStatus, updateTermHandler);

/**
 * DELETE /api/v1/admin/terms/:id
 * Delete a term
 */
router.delete('/:id', validateObjectId('id'), deleteTermHandler);

/**
 * POST /api/v1/admin/terms/:id/deprecate
 * Deprecate a term
 */
router.post(
  '/:id/deprecate',
  validateObjectId('id'),
  validateRequiredFields(['replacedBy']),
  deprecateTermHandler
);

/**
 * POST /api/v1/admin/terms/:sourceId/merge/:targetId
 * Merge two terms
 */
router.post(
  '/:sourceId/merge/:targetId',
  validateObjectId('sourceId'),
  validateObjectId('targetId'),
  mergeTermsHandler
);

export default router;
