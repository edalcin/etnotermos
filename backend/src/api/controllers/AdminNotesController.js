// Admin Notes Controller - T073
// CRUD operations for notes

import {
  createNewNote,
  getNotesByTerm,
  updateExistingNote,
  deleteNote,
} from '../../services/NoteService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Create a new note
 * POST /api/v1/admin/notes
 */
export const createNoteHandler = asyncHandler(async (req, res) => {
  const { termId, type, content, sourceIds } = req.body;

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const note = await createNewNote(termId, type, content, sourceIds || [], metadata);

  res.status(201).json(note);
});

/**
 * Get notes for a term
 * GET /api/v1/notes
 */
export const getNotesHandler = asyncHandler(async (req, res) => {
  const { termId, type } = req.query;

  if (!termId) {
    return res.status(400).json({
      error: 'termId query parameter is required',
    });
  }

  const notes = await getNotesByTerm(termId, type);

  res.status(200).json(notes);
});

/**
 * Update a note
 * PUT /api/v1/admin/notes/:id
 */
export const updateNoteHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const note = await updateExistingNote(id, updates, metadata);

  res.status(200).json(note);
});

/**
 * Delete a note
 * DELETE /api/v1/admin/notes/:id
 */
export const deleteNoteHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const result = await deleteNote(id, metadata);

  res.status(200).json(result);
});

export default {
  createNoteHandler,
  getNotesHandler,
  updateNoteHandler,
  deleteNoteHandler,
};
