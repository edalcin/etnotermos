// NoteService - T052
// CRUD operations for notes with source association

import { ObjectId } from 'mongodb';
import { getCollection } from '../shared/database.js';
import { createNote, updateNote as updateNoteModel } from '../models/Note.js';
import { createAuditLogCreate, createAuditLogUpdate, createAuditLogDelete } from '../models/AuditLog.js';

/**
 * Create a new note
 */
export async function createNewNote(termId, type, content, sourceIds = [], metadata = {}) {
  const notes = getCollection('etnotermos-notes');
  const terms = getCollection('etnotermos');
  const auditLogs = getCollection('etnotermos-audit-logs');

  // Verify term exists
  const term = await terms.findOne({ _id: new ObjectId(termId) });
  if (!term) {
    throw new Error(`Term ${termId} not found`);
  }

  // Create note
  const note = createNote(termId, type, content, sourceIds);

  // Insert
  await notes.insertOne(note);

  // Audit log
  const auditLog = createAuditLogCreate('Note', note, metadata);
  await auditLogs.insertOne(auditLog);

  return note;
}

/**
 * Get notes for a term
 */
export async function getNotesByTerm(termId, type = null) {
  const notes = getCollection('etnotermos-notes');

  const query = { termId: new ObjectId(termId) };
  if (type) {
    query.type = type;
  }

  return await notes.find(query).sort({ createdAt: -1 }).toArray();
}

/**
 * Update a note
 */
export async function updateExistingNote(noteId, updates, metadata = {}) {
  const notes = getCollection('etnotermos-notes');
  const auditLogs = getCollection('etnotermos-audit-logs');

  // Get existing note
  const existingNote = await notes.findOne({ _id: new ObjectId(noteId) });
  if (!existingNote) {
    throw new Error('Note not found');
  }

  // Update
  const updatedNote = updateNoteModel(existingNote, updates);

  // Save
  await notes.replaceOne({ _id: existingNote._id }, updatedNote);

  // Audit log
  const auditLog = createAuditLogUpdate('Note', noteId, existingNote, updatedNote, metadata);
  await auditLogs.insertOne(auditLog);

  return updatedNote;
}

/**
 * Delete a note
 */
export async function deleteNote(noteId, metadata = {}) {
  const notes = getCollection('etnotermos-notes');
  const auditLogs = getCollection('etnotermos-audit-logs');

  // Get note
  const note = await notes.findOne({ _id: new ObjectId(noteId) });
  if (!note) {
    throw new Error('Note not found');
  }

  // Delete
  await notes.deleteOne({ _id: note._id });

  // Audit log
  const auditLog = createAuditLogDelete('Note', note, metadata);
  await auditLogs.insertOne(auditLog);

  return { success: true, message: 'Note deleted successfully' };
}

export default {
  createNewNote,
  getNotesByTerm,
  updateExistingNote,
  deleteNote,
};
