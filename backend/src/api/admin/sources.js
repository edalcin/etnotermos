// Admin Sources Router - T074
// CRUD routes for source management

import express from 'express';
import {
  createSourceHandler,
  getSourceHandler,
  listSourcesHandler,
  updateSourceHandler,
  deleteSourceHandler,
} from '../controllers/AdminSourcesController.js';
import {
  validateRequiredFields,
  validateObjectId,
  validateSourceType,
  validatePagination,
} from '../middleware/validate.js';
import adminAuth from '../middleware/adminAuth.js';
import auditLog from '../middleware/auditLog.js';

const router = express.Router();

// GET routes (public access)
router.get('/', validatePagination, listSourcesHandler);
router.get('/:id', validateObjectId('id'), getSourceHandler);

// Apply admin authentication for write operations
router.use(adminAuth);

// Apply audit logging
router.use(auditLog);

/**
 * POST /api/v1/admin/sources
 * Create a new source
 */
router.post(
  '/',
  validateRequiredFields(['type', 'fields']),
  validateSourceType,
  createSourceHandler
);

/**
 * PUT /api/v1/admin/sources/:id
 * Update a source
 */
router.put('/:id', validateObjectId('id'), updateSourceHandler);

/**
 * DELETE /api/v1/admin/sources/:id
 * Delete a source
 */
router.delete('/:id', validateObjectId('id'), deleteSourceHandler);

export default router;
