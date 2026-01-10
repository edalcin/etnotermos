// Comprehensive Logging for EtnoTermos
// Winston-based structured JSON logging with request IDs and sanitization

import winston from 'winston';
import { randomUUID } from 'crypto';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Format for console output (development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}${info.requestId ? ` [${info.requestId}]` : ''}`
  )
);

// Format for JSON output (production)
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports = [
  // Console transport for development
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
  }),
];

// Add file transports for production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: jsonFormat,
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: jsonFormat,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false,
});

/**
 * Sanitize sensitive data from logs
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
function sanitize(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Generate a unique request ID
 * @returns {string} UUID request ID
 */
export function generateRequestId() {
  return randomUUID();
}

/**
 * Express middleware to add request ID and logging
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function requestLogger(req, res, next) {
  req.requestId = generateRequestId();

  // Log incoming request
  logger.http('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response on finish
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'error' : 'http';

    logger[logLevel]('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}

/**
 * Enhanced logger with sanitization and request context
 */
export const log = {
  error: (message, meta = {}) => {
    logger.error(message, sanitize(meta));
  },

  warn: (message, meta = {}) => {
    logger.warn(message, sanitize(meta));
  },

  info: (message, meta = {}) => {
    logger.info(message, sanitize(meta));
  },

  http: (message, meta = {}) => {
    logger.http(message, sanitize(meta));
  },

  debug: (message, meta = {}) => {
    logger.debug(message, sanitize(meta));
  },

  // Helper to log with request context
  withRequest: (req) => ({
    error: (message, meta = {}) => logger.error(message, { ...sanitize(meta), requestId: req.requestId }),
    warn: (message, meta = {}) => logger.warn(message, { ...sanitize(meta), requestId: req.requestId }),
    info: (message, meta = {}) => logger.info(message, { ...sanitize(meta), requestId: req.requestId }),
    debug: (message, meta = {}) => logger.debug(message, { ...sanitize(meta), requestId: req.requestId }),
  }),
};

export default log;
