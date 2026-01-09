// Admin Terms Router - T068 & T084
// Full CRUD routes for term management

import express from 'express';
import {
  createTermHandler,
  updateTermHandler,
  deleteTermHandler,
  deprecateTermHandler,
  mergeTermsHandler,
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
