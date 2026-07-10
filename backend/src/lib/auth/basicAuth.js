import bcrypt from 'bcrypt';
import { config } from '../../config/index.js';

export default async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="BioCultTermos Admin"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  let username, password;
  try {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) throw new Error('Missing separator');
    username = decoded.slice(0, separatorIndex);
    password = decoded.slice(separatorIndex + 1);
  } catch {
    res.set('WWW-Authenticate', 'Basic realm="BioCultTermos Admin"');
    return res.status(401).json({ error: 'Malformed credentials' });
  }

  const users = config.adminUsers ?? (() => {
    try { return JSON.parse(process.env.ADMIN_USERS || '[]'); } catch { return []; }
  })();
  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.status(403).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(403).json({ error: 'Invalid credentials' });
  }

  req.user = { username };
  next();
}

export function makeBasicAuthHeader(username, password) {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}
