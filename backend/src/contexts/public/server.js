import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { config, validateConfig } from '../../config/index.js';
import { connect, getDb } from '../../shared/database.js';
import { requestLogger, log } from '../../lib/logger.js';
import conceptRoutes from './routes/concepts.js';
import indexRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSP_HEADER =
  "default-src 'self'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "script-src 'self' 'unsafe-inline' https://unpkg.com; " +
  "img-src 'self' data: https:; " +
  "font-src 'self' https: data:; " +
  "connect-src 'self'";

function securityHeaders(req, res, next) {
  res.setHeader('Content-Security-Policy', CSP_HEADER);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '0');
  next();
}

export function createApp(db) {
  const app = express();

  app.set('trust proxy', 1);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use((req, res, next) => {
    if (req.url.includes('..')) {
      return res.status(400).json({ message: 'Invalid request path' });
    }
    next();
  });

  app.use(securityHeaders);
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.use('/assets', express.static(path.join(__dirname, 'views', 'assets')));

  app.locals.db = db;

  app.use('/', indexRoutes);
  app.use('/concepts', conceptRoutes);

  app.use((req, res) => {
    if (req.accepts('html')) {
      return res.status(404).render('404', { title: '404 — Não encontrado' });
    }
    res.status(404).json({ message: 'Not found' });
  });

  app.use((err, req, res, next) => {
    const status = err.code || err.status || 500;
    log.error('Public server error', { message: err.message, status, url: req.url });

    if (req.accepts('html')) {
      return res.status(status).render('error', {
        title: 'Erro',
        message: config.isDevelopment ? err.message : 'Erro interno',
        stack: config.isDevelopment ? err.stack : null,
      });
    }
    res.status(status).json({
      message: config.isDevelopment ? err.message : 'Internal Server Error',
      ...(config.isDevelopment && { stack: err.stack }),
    });
  });

  return app;
}

async function main() {
  try {
    const errors = validateConfig();
    if (errors.length > 0) {
      errors.forEach((e) => log.error(`Config error: ${e}`));
      process.exit(1);
    }

    await connect();
    const db = getDb();
    const app = createApp(db);
    app.listen(config.publicPort, () => {
      log.info(`EtnoTermos PUBLIC running on port ${config.publicPort}`, {
        env: config.nodeEnv,
      });
    });
  } catch (err) {
    log.error('Failed to start public server', { message: err.message });
    process.exit(1);
  }
}

if (process.argv[1] === __filename) {
  main();
}
