// Admin Access Control Middleware - T059
// Basic authentication for admin routes

import { config } from '../../config/index.js';

/**
 * Admin authentication middleware
 * Verifies basic authentication credentials for admin API access
 */
export function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check if authorization header exists
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="EtnoTermos Admin"');
    return res.status(401).json({
      error: 'Authentication required',
    });
  }

  try {
    // Decode credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Verify credentials (constant-time comparison to prevent timing attacks)
    const usernameValid = constantTimeCompare(username, config.adminUsername);
    const passwordValid = constantTimeCompare(password, config.adminPassword);

    if (usernameValid && passwordValid) {
      // Authentication successful
      req.admin = { username };
      next();
    } else {
      // Invalid credentials
      res.set('WWW-Authenticate', 'Basic realm="EtnoTermos Admin"');
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }
  } catch (error) {
    // Malformed authorization header
    res.set('WWW-Authenticate', 'Basic realm="EtnoTermos Admin"');
    return res.status(401).json({
      error: 'Invalid authorization header',
    });
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const aLen = Buffer.byteLength(a);
  const bLen = Buffer.byteLength(b);

  // Always compare full length to prevent timing attacks
  const bufferA = Buffer.alloc(Math.max(aLen, bLen), 0);
  const bufferB = Buffer.alloc(Math.max(aLen, bLen), 0);

  bufferA.write(a);
  bufferB.write(b);

  // Use Node.js crypto.timingSafeEqual if available, otherwise manual comparison
  if (Buffer.prototype.equals) {
    return aLen === bLen && bufferA.equals(bufferB);
  }

  // Manual constant-time comparison fallback
  let mismatch = aLen !== bLen ? 1 : 0;
  for (let i = 0; i < Math.max(aLen, bLen); i++) {
    mismatch |= bufferA[i] ^ bufferB[i];
  }

  return mismatch === 0;
}

export default adminAuth;
