// Admin Collections Router - T076
// CRUD routes for collection management

import express from 'express';
import {
  createCollectionHandler,
  getCollectionHandler,
  listCollectionsHandler,
  getCollectionTermsHandler,
  updateCollectionHandler,
  deleteCollectionHandler,
} from '../controllers/AdminCollectionsController.js';
import {
  validateRequiredFields,
  validateObjectId,
  validatePagination,
} from '../middleware/validate.js';
import adminAuth from '../middleware/adminAuth.js';
import auditLog from '../middleware/auditLog.js';

const router = express.Router();

// GET routes (public access)
router.get('/', listCollectionsHandler);
router.get('/:id', validateObjectId('id'), getCollectionHandler);
router.get('/:id/terms', validateObjectId('id'), validatePagination, getCollectionTermsHandler);

// Apply admin authentication for write operations
router.use(adminAuth);

// Apply audit logging
router.use(auditLog);

/**
 * POST /api/v1/admin/collections
 * Create a new collection
 */
router.post('/', validateRequiredFields(['name']), createCollectionHandler);

/**
 * PUT /api/v1/admin/collections/:id
 * Update a collection
 */
router.put('/:id', validateObjectId('id'), updateCollectionHandler);

/**
 * DELETE /api/v1/admin/collections/:id
 * Delete a collection
 */
router.delete('/:id', validateObjectId('id'), deleteCollectionHandler);

export default router;
