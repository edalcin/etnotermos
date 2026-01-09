// AuditLog Model - T051
// Track all changes to entities for accountability and CARE principles compliance

import { ObjectId } from 'mongodb';

/**
 * Entity type enumeration
 */
export const EntityType = {
  TERM: 'Term',
  NOTE: 'Note',
  RELATIONSHIP: 'Relationship',
  SOURCE: 'Source',
  COLLECTION: 'Collection',
};

/**
 * Action type enumeration
 */
export const ActionType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  DEPRECATE: 'deprecate',
  MERGE: 'merge',
};

/**
 * JSON Schema for AuditLog validation
 */
export const auditLogSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['entityType', 'entityId', 'action', 'timestamp'],
    properties: {
      _id: {
        bsonType: 'objectId',
      },
      entityType: {
        bsonType: 'string',
        enum: Object.values(EntityType),
        description: 'Type of entity being audited',
      },
      entityId: {
        bsonType: 'objectId',
        description: 'ID of the entity being audited',
      },
      action: {
        bsonType: 'string',
        enum: Object.values(ActionType),
        description: 'Action performed',
      },
      changes: {
        bsonType: 'object',
        description: 'Object containing before/after values',
      },
      timestamp: {
        bsonType: 'date',
        description: 'When the action occurred',
      },
      metadata: {
        bsonType: 'object',
        description: 'Additional context (user, IP, etc.)',
      },
    },
  },
};

/**
 * Validate entity type
 */
export function validateEntityType(entityType) {
  return Object.values(EntityType).includes(entityType);
}

/**
 * Validate action type
 */
export function validateActionType(action) {
  return Object.values(ActionType).includes(action);
}

/**
 * Create a new audit log entry
 */
export function createAuditLog(entityType, entityId, action, changes = {}, metadata = {}) {
  // Validate entity type
  if (!validateEntityType(entityType)) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  // Validate action
  if (!validateActionType(action)) {
    throw new Error(`Invalid action type: ${action}`);
  }

  // Validate entityId
  if (!entityId) {
    throw new Error('Entity ID is required');
  }

  return {
    _id: new ObjectId(),
    entityType,
    entityId: entityId instanceof ObjectId ? entityId : new ObjectId(entityId),
    action,
    changes,
    timestamp: new Date(),
    metadata,
  };
}

/**
 * Create audit log for create action
 */
export function createAuditLogCreate(entityType, entity, metadata = {}) {
  return createAuditLog(
    entityType,
    entity._id,
    ActionType.CREATE,
    {
      after: entity,
    },
    metadata
  );
}

/**
 * Create audit log for update action
 */
export function createAuditLogUpdate(entityType, entityId, before, after, metadata = {}) {
  return createAuditLog(
    entityType,
    entityId,
    ActionType.UPDATE,
    {
      before,
      after,
    },
    metadata
  );
}

/**
 * Create audit log for delete action
 */
export function createAuditLogDelete(entityType, entity, metadata = {}) {
  return createAuditLog(
    entityType,
    entity._id,
    ActionType.DELETE,
    {
      before: entity,
    },
    metadata
  );
}

/**
 * Create audit log for deprecate action
 */
export function createAuditLogDeprecate(entityId, replacedById, deprecationNote, metadata = {}) {
  return createAuditLog(
    EntityType.TERM,
    entityId,
    ActionType.DEPRECATE,
    {
      replacedBy: replacedById,
      deprecationNote,
    },
    metadata
  );
}

/**
 * Create audit log for merge action
 */
export function createAuditLogMerge(sourceEntityId, targetEntityId, metadata = {}) {
  return createAuditLog(
    EntityType.TERM,
    sourceEntityId,
    ActionType.MERGE,
    {
      mergedInto: targetEntityId,
    },
    metadata
  );
}

export default {
  EntityType,
  ActionType,
  auditLogSchema,
  validateEntityType,
  validateActionType,
  createAuditLog,
  createAuditLogCreate,
  createAuditLogUpdate,
  createAuditLogDelete,
  createAuditLogDeprecate,
  createAuditLogMerge,
};
