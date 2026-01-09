// Source Model - T046
// Represents bibliographic and field sources following Z39.19 guidelines

import { ObjectId } from 'mongodb';

/**
 * Source type enumeration
 */
export const SourceType = {
  BIBLIOGRAPHIC: 'bibliographic',
  INTERVIEW: 'interview',
  FIELD_NOTES: 'field_notes',
  HERBARIUM_SAMPLE: 'herbarium_sample',
};

/**
 * JSON Schema for Source validation
 */
export const sourceSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['type', 'fields', 'createdAt'],
    properties: {
      _id: {
        bsonType: 'objectId',
      },
      type: {
        bsonType: 'string',
        enum: Object.values(SourceType),
        description: 'Type of source',
      },
      fields: {
        bsonType: 'object',
        description: 'Flexible object for type-specific fields',
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
 * Validate source type
 */
export function validateSourceType(type) {
  return Object.values(SourceType).includes(type);
}

/**
 * Validate source fields based on type
 */
export function validateSourceFields(type, fields) {
  if (!fields || typeof fields !== 'object') {
    return { valid: false, error: 'Fields must be an object' };
  }

  switch (type) {
    case SourceType.BIBLIOGRAPHIC:
      // Common fields: author, title, year, publisher, journal, etc.
      if (!fields.title) {
        return { valid: false, error: 'Bibliographic sources must have a title' };
      }
      break;

    case SourceType.INTERVIEW:
      // Required: interviewee, date
      if (!fields.interviewee) {
        return { valid: false, error: 'Interview sources must have an interviewee' };
      }
      break;

    case SourceType.FIELD_NOTES:
      // Required: date, location
      if (!fields.date) {
        return { valid: false, error: 'Field notes must have a date' };
      }
      break;

    case SourceType.HERBARIUM_SAMPLE:
      // Required: sampleId, location
      if (!fields.sampleId) {
        return { valid: false, error: 'Herbarium samples must have a sampleId' };
      }
      break;
  }

  return { valid: true };
}

/**
 * Create a new source document
 */
export function createSource(type, fields) {
  // Validate type
  if (!validateSourceType(type)) {
    throw new Error(`Invalid source type: ${type}`);
  }

  // Validate fields
  const validation = validateSourceFields(type, fields);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return {
    _id: new ObjectId(),
    type,
    fields,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Update source document
 */
export function updateSource(existingSource, updates) {
  const updated = {
    ...existingSource,
    ...updates,
    updatedAt: new Date(),
  };

  // Validate if type changed
  if (updates.type && !validateSourceType(updates.type)) {
    throw new Error(`Invalid source type: ${updates.type}`);
  }

  // Validate fields if changed
  if (updates.fields || updates.type) {
    const type = updates.type || existingSource.type;
    const fields = updates.fields || existingSource.fields;
    const validation = validateSourceFields(type, fields);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  return updated;
}

export default {
  SourceType,
  sourceSchema,
  validateSourceType,
  validateSourceFields,
  createSource,
  updateSource,
};
