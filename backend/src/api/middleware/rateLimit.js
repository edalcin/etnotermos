// Rate Limiting Middleware - T062
// In-memory rate limiting (100 requests/minute per IP)

import { config } from '../../config/index.js';

// In-memory store for rate limiting
const requestCounts = new Map();

/**
 * Rate limiting middleware
 * Limits requests to 100 per minute per IP address
 */
export function rateLimit(req, res, next) {
  const clientIp = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = config.rateLimitWindow; // 60000ms = 1 minute
  const maxRequests = config.rateLimitMaxRequests; // 100 requests

  // Get or create entry for this IP
  if (!requestCounts.has(clientIp)) {
    requestCounts.set(clientIp, {
      count: 0,
      resetTime: now + windowMs,
    });
  }

  const clientData = requestCounts.get(clientIp);

  // Reset if window has expired
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + windowMs;
  }

  // Increment request count
  clientData.count++;

  // Set rate limit headers
  res.set({
    'X-RateLimit-Limit': maxRequests,
    'X-RateLimit-Remaining': Math.max(0, maxRequests - clientData.count),
    'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString(),
  });

  // Check if limit exceeded
  if (clientData.count > maxRequests) {
    return res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Maximum ${maxRequests} requests per minute.`,
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
    });
  }

  next();
}

/**
 * Cleanup old entries from memory (run periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();

  for (const [ip, data] of requestCounts.entries()) {
    // Remove entries that haven't been accessed in 10 minutes
    if (now > data.resetTime + 600000) {
      requestCounts.delete(ip);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 300000);

export default rateLimit;
