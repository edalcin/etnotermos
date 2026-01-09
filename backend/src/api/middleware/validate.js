// Validation Middleware - T060
// Request validation for query params, body, and path params

import { ObjectId } from 'mongodb';

/**
 * Validate ObjectId format
 */
export function validateObjectId(paramName) {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({
        error: `Invalid ${paramName}: must be a valid ObjectId`,
        field: paramName,
      });
    }

    next();
  };
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(fields) {
  return (req, res, next) => {
    const missing = [];

    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing,
      });
    }

    next();
  };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(req, res, next) {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        error: 'Invalid page parameter: must be a positive integer',
        field: 'page',
      });
    }
    req.query.page = pageNum;
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: 'Invalid limit parameter: must be between 1 and 100',
        field: 'limit',
      });
    }
    req.query.limit = limitNum;
  }

  next();
}

/**
 * Validate search query parameter
 */
export function validateSearchQuery(req, res, next) {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({
      error: 'Search query parameter "q" is required and cannot be empty',
      field: 'q',
    });
  }

  if (q.length > 500) {
    return res.status(400).json({
      error: 'Search query is too long (max 500 characters)',
      field: 'q',
    });
  }

  req.query.q = q.trim();
  next();
}

/**
 * Validate term status enum
 */
export function validateTermStatus(req, res, next) {
  const { status } = req.body;

  if (status) {
    const validStatuses = ['active', 'deprecated', 'candidate'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status: must be one of ${validStatuses.join(', ')}`,
        field: 'status',
      });
    }
  }

  next();
}

/**
 * Validate relationship type enum
 */
export function validateRelationshipType(req, res, next) {
  const { type } = req.body;

  if (!type) {
    return res.status(400).json({
      error: 'Relationship type is required',
      field: 'type',
    });
  }

  const validTypes = [
    'USE',
    'UF',
    'BT',
    'NT',
    'BTG',
    'NTG',
    'BTP',
    'NTP',
    'BTI',
    'NTI',
    'RT',
  ];

  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: `Invalid relationship type: must be one of ${validTypes.join(', ')}`,
      field: 'type',
      validTypes,
    });
  }

  next();
}

/**
 * Validate note type enum
 */
export function validateNoteType(req, res, next) {
  const { type } = req.body;

  if (!type) {
    return res.status(400).json({
      error: 'Note type is required',
      field: 'type',
    });
  }

  const validTypes = ['scope', 'cataloger', 'historical', 'bibliographic', 'definition', 'example'];

  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: `Invalid note type: must be one of ${validTypes.join(', ')}`,
      field: 'type',
      validTypes,
    });
  }

  next();
}

/**
 * Validate source type enum
 */
export function validateSourceType(req, res, next) {
  const { type } = req.body;

  if (!type) {
    return res.status(400).json({
      error: 'Source type is required',
      field: 'type',
    });
  }

  const validTypes = ['bibliographic', 'interview', 'field_notes', 'herbarium_sample'];

  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: `Invalid source type: must be one of ${validTypes.join(', ')}`,
      field: 'type',
      validTypes,
    });
  }

  next();
}

export default {
  validateObjectId,
  validateRequiredFields,
  validatePagination,
  validateSearchQuery,
  validateTermStatus,
  validateRelationshipType,
  validateNoteType,
  validateSourceType,
};
