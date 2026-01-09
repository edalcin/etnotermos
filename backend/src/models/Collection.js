// Collection Model - T047
// Simple tagging system for grouping terms thematically

import { ObjectId } from 'mongodb';

/**
 * JSON Schema for Collection validation
 */
export const collectionSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['name', 'createdAt'],
    properties: {
      _id: {
        bsonType: 'objectId',
      },
      name: {
        bsonType: 'string',
        description: 'Collection name (must be unique)',
      },
      description: {
        bsonType: 'string',
        description: 'Optional description of the collection',
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
 * Validate collection name
 */
export function validateCollectionName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required and must be a string' };
  }

  if (name.trim().length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }

  if (name.length > 200) {
    return { valid: false, error: 'Name cannot exceed 200 characters' };
  }

  return { valid: true };
}

/**
 * Create a new collection document
 */
export function createCollection(name, description = '') {
  // Validate name
  const validation = validateCollectionName(name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return {
    _id: new ObjectId(),
    name: name.trim(),
    description: description.trim(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Update collection document
 */
export function updateCollection(existingCollection, updates) {
  const updated = {
    ...existingCollection,
    ...updates,
    updatedAt: new Date(),
  };

  // Validate name if changed
  if (updates.name) {
    const validation = validateCollectionName(updates.name);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    updated.name = updates.name.trim();
  }

  // Trim description if changed
  if (updates.description !== undefined) {
    updated.description = updates.description.trim();
  }

  return updated;
}

export default {
  collectionSchema,
  validateCollectionName,
  createCollection,
  updateCollection,
};
