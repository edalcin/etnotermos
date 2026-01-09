// Audit Logging Middleware - T063
// Intercept write operations and create audit log entries

import { getCollection } from '../../shared/database.js';
import { ObjectId } from 'mongodb';

/**
 * Audit log middleware for write operations
 * Automatically logs POST, PUT, DELETE operations on admin routes
 */
export function auditLog(req, res, next) {
  // Only log write operations
  const writeOperations = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!writeOperations.includes(req.method)) {
    return next();
  }

  // Store original res.json to intercept response
  const originalJson = res.json.bind(res);

  // Override res.json to capture response data
  res.json = function (data) {
    // Create audit log asynchronously (don't block response)
    createAuditLogEntry(req, res, data).catch((error) => {
      console.error('Failed to create audit log:', error);
    });

    // Send original response
    return originalJson(data);
  };

  next();
}

/**
 * Create audit log entry based on request/response
 */
async function createAuditLogEntry(req, res, responseData) {
  const auditLogs = getCollection('etnotermos-audit-logs');

  // Determine entity type from route
  const entityType = determineEntityType(req.path);
  if (!entityType) {
    return; // Not an entity we track
  }

  // Determine action from HTTP method
  const action = mapHttpMethodToAction(req.method);

  // Extract entity ID from request or response
  const entityId = extractEntityId(req, responseData);
  if (!entityId) {
    return; // Could not determine entity ID
  }

  // Build changes object
  const changes = buildChangesObject(req, action, responseData);

  // Create audit log entry
  const auditLog = {
    _id: new ObjectId(),
    entityType,
    entityId: new ObjectId(entityId),
    action,
    changes,
    timestamp: new Date(),
    metadata: {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.path,
      admin: req.admin?.username || 'unknown',
    },
  };

  try {
    await auditLogs.insertOne(auditLog);
  } catch (error) {
    console.error('Error inserting audit log:', error);
  }
}

/**
 * Determine entity type from request path
 */
function determineEntityType(path) {
  if (path.includes('/terms')) return 'Term';
  if (path.includes('/notes')) return 'Note';
  if (path.includes('/relationships')) return 'Relationship';
  if (path.includes('/sources')) return 'Source';
  if (path.includes('/collections')) return 'Collection';
  return null;
}

/**
 * Map HTTP method to audit action
 */
function mapHttpMethodToAction(method) {
  switch (method) {
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'unknown';
  }
}

/**
 * Extract entity ID from request parameters or response
 */
function extractEntityId(req, responseData) {
  // Try request params first (for PUT/DELETE)
  if (req.params.id) {
    return req.params.id;
  }

  if (req.params.termId) {
    return req.params.termId;
  }

  if (req.params.noteId) {
    return req.params.noteId;
  }

  if (req.params.relationshipId) {
    return req.params.relationshipId;
  }

  if (req.params.sourceId) {
    return req.params.sourceId;
  }

  if (req.params.collectionId) {
    return req.params.collectionId;
  }

  // Try response data (for POST)
  if (responseData && responseData._id) {
    return responseData._id;
  }

  return null;
}

/**
 * Build changes object for audit log
 */
function buildChangesObject(req, action, responseData) {
  const changes = {};

  if (action === 'create') {
    changes.after = sanitizeData(responseData);
  } else if (action === 'update') {
    changes.updates = sanitizeData(req.body);
    changes.after = sanitizeData(responseData);
  } else if (action === 'delete') {
    // Deleted entity info might be in response
    if (responseData && responseData.deletedEntity) {
      changes.before = sanitizeData(responseData.deletedEntity);
    }
  }

  return changes;
}

/**
 * Sanitize data before logging (remove sensitive fields)
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };

  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.apiKey;

  return sanitized;
}

export default auditLog;
