// Admin Notes Router - T072
// CRUD routes for note management

import express from 'express';
import {
  createNoteHandler,
  getNotesHandler,
  updateNoteHandler,
  deleteNoteHandler,
} from '../controllers/AdminNotesController.js';
import {
  validateRequiredFields,
  validateObjectId,
  validateNoteType,
} from '../middleware/validate.js';
import adminAuth from '../middleware/adminAuth.js';
import auditLog from '../middleware/auditLog.js';

const router = express.Router();

// GET route for notes (public access for fetching)
router.get('/', getNotesHandler);

// Apply admin authentication for write operations
router.use(adminAuth);

// Apply audit logging
router.use(auditLog);

/**
 * POST /api/v1/admin/notes
 * Create a new note
 */
router.post(
  '/',
  validateRequiredFields(['termId', 'type', 'content']),
  validateNoteType,
  createNoteHandler
);

/**
 * PUT /api/v1/admin/notes/:id
 * Update a note
 */
router.put('/:id', validateObjectId('id'), updateNoteHandler);

/**
 * DELETE /api/v1/admin/notes/:id
 * Delete a note
 */
router.delete('/:id', validateObjectId('id'), deleteNoteHandler);

export default router;
