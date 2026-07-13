import bcrypt from 'bcrypt';
import { config } from '../../config/index.js';

export default async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  const unauthorized = (jsonMessage, friendlyMessage) => {
    res.set('WWW-Authenticate', 'Basic realm="BioCultTermos Admin"');
    if (req.accepts('html')) {
      return res.status(401).render('auth-error', {
        title: 'Acesso negado — BioCultTermos Admin',
        message: friendlyMessage,
        currentPage: null,
      });
    }
    return res.status(401).json({ error: jsonMessage });
  };

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return unauthorized(
      'Authentication required',
      'É necessário informar usuário e senha para acessar esta área.'
    );
  }

  let username, password;
  try {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) throw new Error('Missing separator');
    username = decoded.slice(0, separatorIndex);
    password = decoded.slice(separatorIndex + 1);
  } catch {
    return unauthorized(
      'Malformed credentials',
      'As credenciais enviadas estão em um formato inválido.'
    );
  }

  const users = config.adminUsers ?? (() => {
    try { return JSON.parse(process.env.ADMIN_USERS || '[]'); } catch { return []; }
  })();
  const user = users.find((u) => u.username === username);
  if (!user) {
    return unauthorized(
      'Invalid credentials',
      'Usuário ou senha incorretos. Verifique e tente novamente.'
    );
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return unauthorized(
      'Invalid credentials',
      'Usuário ou senha incorretos. Verifique e tente novamente.'
    );
  }

  req.user = { username };
  next();
}

export function makeBasicAuthHeader(username, password) {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}
