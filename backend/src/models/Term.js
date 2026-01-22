// Term Model - T048
// Core entity following ANSI/NISO Z39.19-2005 controlled vocabulary standards

import { ObjectId } from 'mongodb';

/**
 * Term type enumeration (Z39.19 Section 8.2)
 */
export const TermType = {
  PREFERRED: 'preferred', // Preferred term for a concept
  ENTRY: 'entry', // Entry term (non-preferred, redirects via USE)
  DEPRECATED: 'deprecated', // Deprecated term (superseded)
};

/**
 * Term status enumeration
 */
export const TermStatus = {
  ACTIVE: 'active',
  DEPRECATED: 'deprecated',
  CANDIDATE: 'candidate',
};

/**
 * JSON Schema for Term validation
 */
export const termSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['prefLabel', 'status', 'createdAt'],
    properties: {
      _id: {
        bsonType: 'objectId',
      },
      prefLabel: {
        bsonType: 'string',
        description: 'Preferred label (Z39.19 Section 8.2)',
      },
      altLabels: {
        bsonType: 'array',
        items: { bsonType: 'string' },
        description: 'Alternative labels (synonyms)',
      },
      hiddenLabels: {
        bsonType: 'array',
        items: { bsonType: 'string' },
        description: 'Hidden labels for search only',
      },
      definition: {
        bsonType: 'string',
        description: 'Formal definition (Z39.19 Section 10.3)',
      },
      scopeNote: {
        bsonType: 'string',
        description: 'Usage context and boundaries (Z39.19 Section 10.2)',
      },
      historyNote: {
        bsonType: 'string',
        description: 'Term evolution and changes (Z39.19 Section 10.4)',
      },
      example: {
        bsonType: 'string',
        description: 'Usage examples (Z39.19 Section 10.5)',
      },
      language: {
        bsonType: 'string',
        description: 'Language name of the term',
      },
      qualifier: {
        bsonType: 'string',
        description: 'Disambiguation qualifier for homographs',
      },
      termType: {
        bsonType: 'string',
        enum: Object.values(TermType),
        description: 'Term type classification',
      },
      status: {
        bsonType: 'string',
        enum: Object.values(TermStatus),
        description: 'Current status of the term',
      },
      useFor: {
        bsonType: 'array',
        items: { bsonType: 'objectId' },
        description: 'Entry terms that redirect to this preferred term',
      },
      useTerm: {
        bsonType: 'objectId',
        description: 'For entry terms, reference to preferred term (USE)',
      },
      replacedBy: {
        bsonType: 'objectId',
        description: 'Term ID that replaces this deprecated term',
      },
      deprecatedDate: {
        bsonType: 'date',
        description: 'When term was deprecated',
      },
      deprecationNote: {
        bsonType: 'string',
        description: 'Reason for deprecation',
      },
      facets: {
        bsonType: 'object',
        description: 'Faceted classification fields',
      },
      sourceIds: {
        bsonType: 'array',
        items: { bsonType: 'objectId' },
        description: 'References to Source entities',
      },
      collectionIds: {
        bsonType: 'array',
        items: { bsonType: 'objectId' },
        description: 'References to Collection entities',
      },
      version: {
        bsonType: 'int',
        description: 'Version for optimistic locking',
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
 * Validate term status
 */
export function validateTermStatus(status) {
  return Object.values(TermStatus).includes(status);
}

/**
 * Validate term type
 */
export function validateTermType(type) {
  return Object.values(TermType).includes(type);
}

/**
 * Validate preferred label (Z39.19 authority control)
 */
export function validatePrefLabel(prefLabel) {
  if (!prefLabel || typeof prefLabel !== 'string') {
    return { valid: false, error: 'Preferred label is required and must be a string' };
  }

  if (prefLabel.trim().length === 0) {
    return { valid: false, error: 'Preferred label cannot be empty' };
  }

  if (prefLabel.length > 500) {
    return { valid: false, error: 'Preferred label cannot exceed 500 characters' };
  }

  return { valid: true };
}

/**
 * Create a new term document
 */
export function createTerm(data) {
  // Validate required fields
  const prefLabelValidation = validatePrefLabel(data.prefLabel);
  if (!prefLabelValidation.valid) {
    throw new Error(prefLabelValidation.error);
  }

  if (data.status && !validateTermStatus(data.status)) {
    throw new Error(`Invalid term status: ${data.status}`);
  }

  if (data.termType && !validateTermType(data.termType)) {
    throw new Error(`Invalid term type: ${data.termType}`);
  }

  return {
    _id: new ObjectId(),
    prefLabel: data.prefLabel.trim(),
    altLabels: data.altLabels || [],
    hiddenLabels: data.hiddenLabels || [],
    definition: data.definition || '',
    scopeNote: data.scopeNote || '',
    historyNote: data.historyNote || '',
    example: data.example || '',
    language: data.language || 'Português (Brasil)',
    qualifier: data.qualifier || '',
    termType: data.termType || TermType.PREFERRED,
    status: data.status || TermStatus.CANDIDATE,
    useFor: data.useFor || [],
    useTerm: data.useTerm || null,
    replacedBy: data.replacedBy || null,
    deprecatedDate: data.deprecatedDate || null,
    deprecationNote: data.deprecationNote || '',
    facets: data.facets || {},
    sourceIds: data.sourceIds || [],
    collectionIds: data.collectionIds || [],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Update term document with optimistic locking
 */
export function updateTerm(existingTerm, updates, expectedVersion) {
  // Check version for optimistic locking
  if (expectedVersion !== undefined && existingTerm.version !== expectedVersion) {
    throw new Error(
      `Version conflict: expected ${expectedVersion}, found ${existingTerm.version}`
    );
  }

  // Validate updates
  if (updates.prefLabel) {
    const validation = validatePrefLabel(updates.prefLabel);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    updates.prefLabel = updates.prefLabel.trim();
  }

  if (updates.status && !validateTermStatus(updates.status)) {
    throw new Error(`Invalid term status: ${updates.status}`);
  }

  if (updates.termType && !validateTermType(updates.termType)) {
    throw new Error(`Invalid term type: ${updates.termType}`);
  }

  const updated = {
    ...existingTerm,
    ...updates,
    version: existingTerm.version + 1,
    updatedAt: new Date(),
  };

  return updated;
}

/**
 * Deprecate a term
 */
export function deprecateTerm(existingTerm, replacedById, deprecationNote = '') {
  if (!replacedById) {
    throw new Error('Replacement term ID is required for deprecation');
  }

  return {
    ...existingTerm,
    status: TermStatus.DEPRECATED,
    replacedBy: new ObjectId(replacedById),
    deprecatedDate: new Date(),
    deprecationNote,
    version: existingTerm.version + 1,
    updatedAt: new Date(),
  };
}

export default {
  TermType,
  TermStatus,
  termSchema,
  validateTermStatus,
  validateTermType,
  validatePrefLabel,
  createTerm,
  updateTerm,
  deprecateTerm,
};
