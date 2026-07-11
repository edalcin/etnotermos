// Error Handling Middleware - T061
// Centralized error handling with proper logging and response formatting

import { config } from '../../config/index.js';

/**
 * Error types classification
 */
class OperationalError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'OperationalError';
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class ProgrammerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProgrammerError';
    this.statusCode = 500;
    this.isOperational = false;
  }
}

/**
 * Main error handling middleware
 */
export function errorHandler(err, req, res, next) {
  // Default status code
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let isOperational = err.isOperational || false;

  // ALWAYS log the full error for debugging
  console.error('============================================');
  console.error('[ERROR HANDLER] Error caught:');
  console.error('Message:', err.message);
  console.error('Name:', err.name);
  console.error('Status:', statusCode);
  console.error('Stack:', err.stack);
  console.error('Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
  console.error('============================================');

  // Log error with existing function
  logError(err, req, isOperational);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = formatValidationError(err);
    isOperational = true;
  } else if (err.name === 'SqliteError' || (typeof err.code === 'string' && err.code.startsWith('SQLITE_'))) {
    const sqliteError = handleSqliteError(err);
    statusCode = sqliteError.statusCode;
    message = sqliteError.message;
    isOperational = true;
  }

  // Build error response
  const errorResponse = {
    error: message,
    ...(config.isDevelopment && {
      type: err.name,
      stack: err.stack,
      fullError: err,
    }),
  };

  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * Log error with appropriate level
 */
function logError(err, req, isOperational) {
  const errorInfo = {
    message: err.message,
    name: err.name,
    statusCode: err.statusCode,
    isOperational,
    method: req.method,
    url: req.url,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  };

  if (isOperational) {
    // Operational error - expected, log as warning
    console.warn('[Operational Error]', JSON.stringify(errorInfo));
  } else {
    // Programmer error - unexpected, log as error with stack trace
    console.error('[Programmer Error]', JSON.stringify(errorInfo));
    console.error(err.stack);
  }
}

/**
 * Format validation error message
 */
function formatValidationError(err) {
  if (err.errors) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return `Validation failed: ${messages.join(', ')}`;
  }
  return err.message;
}

/**
 * Handle SQLite-specific errors (better-sqlite3)
 */
function handleSqliteError(err) {
  // Primary key / unique constraint violation
  if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return {
      statusCode: 400,
      message: 'Duplicate value. This record already exists.',
    };
  }

  // CHECK constraint violation (e.g. json_valid(doc))
  if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
    return {
      statusCode: 400,
      message: 'Data validation failed. Please check your data.',
    };
  }

  // Database locked/busy (concurrent writers under WAL)
  if (err.code === 'SQLITE_BUSY' || err.code === 'SQLITE_LOCKED') {
    return {
      statusCode: 503,
      message: 'Database is busy. Please try again.',
    };
  }

  // Generic SQLite error
  return {
    statusCode: 500,
    message: config.isDevelopment
      ? `Database error: ${err.message}`
      : 'A database error occurred',
  };
}

/**
 * Async error wrapper for route handlers
 * Catches errors from async functions and passes to error handler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
}

export { OperationalError, ProgrammerError };

export default {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  OperationalError,
  ProgrammerError,
};
