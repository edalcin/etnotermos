// Relationship Model - T050
// Semantic relationships between terms (ANSI/NISO Z39.19-2005 Section 8)

import { ObjectId } from 'mongodb';

/**
 * Relationship type enumeration (Z39.19 Section 8)
 */
export const RelationshipType = {
  // Equivalence relationships (Section 8.2)
  USE: 'USE', // Points from non-preferred to preferred term
  UF: 'UF', // Used For - points from preferred to non-preferred terms

  // Hierarchical relationships (Section 8.3)
  BT: 'BT', // Broader Term - generic hierarchical
  NT: 'NT', // Narrower Term - generic hierarchical
  BTG: 'BTG', // Broader Term Generic - generic-specific
  NTG: 'NTG', // Narrower Term Generic - specific-generic
  BTP: 'BTP', // Broader Term Partitive - whole-part
  NTP: 'NTP', // Narrower Term Partitive - part-whole
  BTI: 'BTI', // Broader Term Instance - class-instance
  NTI: 'NTI', // Narrower Term Instance - instance-class

  // Associative relationships (Section 8.4)
  RT: 'RT', // Related Term - associative connection
};

/**
 * Reciprocal relationship type mapping (Z39.19 reciprocity rules)
 */
export const ReciprocalTypes = {
  USE: 'UF',
  UF: 'USE',
  BT: 'NT',
  NT: 'BT',
  BTG: 'NTG',
  NTG: 'BTG',
  BTP: 'NTP',
  NTP: 'BTP',
  BTI: 'NTI',
  NTI: 'BTI',
  RT: 'RT', // RT is self-reciprocal
};

/**
 * Hierarchical relationship types (for circular hierarchy detection)
 */
export const HierarchicalTypes = ['BT', 'NT', 'BTG', 'NTG', 'BTP', 'NTP', 'BTI', 'NTI'];

/**
 * JSON Schema for Relationship validation
 */
export const relationshipSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['sourceTermId', 'targetTermId', 'type', 'createdAt'],
    properties: {
      _id: {
        bsonType: 'objectId',
      },
      sourceTermId: {
        bsonType: 'objectId',
        description: 'Origin term',
      },
      targetTermId: {
        bsonType: 'objectId',
        description: 'Destination term',
      },
      type: {
        bsonType: 'string',
        enum: Object.values(RelationshipType),
        description: 'Relationship type (Z39.19)',
      },
      reciprocalType: {
        bsonType: 'string',
        enum: Object.values(RelationshipType),
        description: 'Automatically computed reciprocal type',
      },
      isReciprocal: {
        bsonType: 'bool',
        description: 'Whether this relationship should be automatically reciprocated',
      },
      createdAt: {
        bsonType: 'date',
        description: 'Creation timestamp',
      },
      validatedAt: {
        bsonType: 'date',
        description: 'When relationship reciprocity was last validated',
      },
    },
  },
};

/**
 * Validate relationship type
 */
export function validateRelationshipType(type) {
  return Object.values(RelationshipType).includes(type);
}

/**
 * Get reciprocal relationship type
 */
export function getReciprocalType(type) {
  return ReciprocalTypes[type];
}

/**
 * Check if relationship type is hierarchical
 */
export function isHierarchical(type) {
  return HierarchicalTypes.includes(type);
}

/**
 * Validate relationship (no self-reference)
 */
export function validateRelationship(sourceTermId, targetTermId, type) {
  // No self-reference
  if (sourceTermId.toString() === targetTermId.toString()) {
    return { valid: false, error: 'Cannot create relationship from term to itself' };
  }

  // Validate type
  if (!validateRelationshipType(type)) {
    return { valid: false, error: `Invalid relationship type: ${type}` };
  }

  return { valid: true };
}

/**
 * Create a new relationship document
 */
export function createRelationship(sourceTermId, targetTermId, type) {
  // Validate
  const validation = validateRelationship(sourceTermId, targetTermId, type);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return {
    _id: new ObjectId(),
    sourceTermId: sourceTermId instanceof ObjectId ? sourceTermId : new ObjectId(sourceTermId),
    targetTermId: targetTermId instanceof ObjectId ? targetTermId : new ObjectId(targetTermId),
    type,
    reciprocalType: getReciprocalType(type),
    isReciprocal: true,
    createdAt: new Date(),
    validatedAt: new Date(),
  };
}

/**
 * Create reciprocal relationship
 */
export function createReciprocalRelationship(originalRelationship) {
  const reciprocalType = getReciprocalType(originalRelationship.type);

  return {
    _id: new ObjectId(),
    sourceTermId: originalRelationship.targetTermId,
    targetTermId: originalRelationship.sourceTermId,
    type: reciprocalType,
    reciprocalType: originalRelationship.type,
    isReciprocal: true,
    createdAt: originalRelationship.createdAt,
    validatedAt: new Date(),
  };
}

/**
 * Validate relationship reciprocity
 */
export function validateReciprocity(relationship, reciprocal) {
  if (!reciprocal) {
    return { valid: false, error: 'Reciprocal relationship not found' };
  }

  // Check if reciprocal points back correctly
  if (
    relationship.sourceTermId.toString() !== reciprocal.targetTermId.toString() ||
    relationship.targetTermId.toString() !== reciprocal.sourceTermId.toString()
  ) {
    return { valid: false, error: 'Reciprocal relationship points to wrong terms' };
  }

  // Check if types are reciprocal
  if (relationship.type !== getReciprocalType(reciprocal.type)) {
    return { valid: false, error: 'Relationship types are not reciprocal' };
  }

  return { valid: true };
}

export default {
  RelationshipType,
  ReciprocalTypes,
  HierarchicalTypes,
  relationshipSchema,
  validateRelationshipType,
  getReciprocalType,
  isHierarchical,
  validateRelationship,
  createRelationship,
  createReciprocalRelationship,
  validateReciprocity,
};
