// Note Model - T049
// Contextual information attached to terms (Z39.19 Section 10)

import { ObjectId } from 'mongodb';

/**
 * Note type enumeration (Z39.19 Section 10)
 */
export const NoteType = {
  SCOPE: 'scope', // Scope note (Z39.19 Section 10.2)
  CATALOGER: 'cataloger', // Cataloger's note (internal use)
  HISTORICAL: 'historical', // Historical note (Z39.19 Section 10.4)
  BIBLIOGRAPHIC: 'bibliographic', // Bibliographic reference
  DEFINITION: 'definition', // Definition note (Z39.19 Section 10.3)
  EXAMPLE: 'example', // Usage example (Z39.19 Section 10.5)
};

/**
 * JSON Schema for Note validation
 */
export const noteSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['termId', 'type', 'content', 'createdAt'],
    properties: {
      _id: {
        bsonType: 'objectId',
      },
      termId: {
        bsonType: 'objectId',
        description: 'Reference to the term this note belongs to',
      },
      type: {
        bsonType: 'string',
        enum: Object.values(NoteType),
        description: 'Type of note',
      },
      content: {
        bsonType: 'string',
        description: 'Note content',
      },
      sourceIds: {
        bsonType: 'array',
        items: { bsonType: 'objectId' },
        description: 'References to sources backing up this note',
      },
      createdAt: {
        bsonType: 'date',
        description: 'Creation timestamp',
      },
      updatedAt: {
        bsonType: 'date',
        description: 'Last update timestamp',
      },
    },
  },
};

/**
 * Validate note type
 */
export function validateNoteType(type) {
  return Object.values(NoteType).includes(type);
}

/**
 * Validate note content
 */
export function validateNoteContent(content) {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Content is required and must be a string' };
  }

  if (content.trim().length === 0) {
    return { valid: false, error: 'Content cannot be empty' };
  }

  if (content.length > 10000) {
    return { valid: false, error: 'Content cannot exceed 10000 characters' };
  }

  return { valid: true };
}

/**
 * Create a new note document
 */
export function createNote(termId, type, content, sourceIds = []) {
  // Validate termId
  if (!termId) {
    throw new Error('Term ID is required');
  }

  // Validate type
  if (!validateNoteType(type)) {
    throw new Error(`Invalid note type: ${type}`);
  }

  // Validate content
  const contentValidation = validateNoteContent(content);
  if (!contentValidation.valid) {
    throw new Error(contentValidation.error);
  }

  return {
    _id: new ObjectId(),
    termId: termId instanceof ObjectId ? termId : new ObjectId(termId),
    type,
    content: content.trim(),
    sourceIds: sourceIds.map((id) => (id instanceof ObjectId ? id : new ObjectId(id))),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Update note document
 */
export function updateNote(existingNote, updates) {
  // Validate type if changed
  if (updates.type && !validateNoteType(updates.type)) {
    throw new Error(`Invalid note type: ${updates.type}`);
  }

  // Validate content if changed
  if (updates.content) {
    const validation = validateNoteContent(updates.content);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    updates.content = updates.content.trim();
  }

  // Convert sourceIds to ObjectId if changed
  if (updates.sourceIds) {
    updates.sourceIds = updates.sourceIds.map((id) =>
      id instanceof ObjectId ? id : new ObjectId(id)
    );
  }

  const updated = {
    ...existingNote,
    ...updates,
    updatedAt: new Date(),
  };

  return updated;
}

export default {
  NoteType,
  noteSchema,
  validateNoteType,
  validateNoteContent,
  createNote,
  updateNote,
};
