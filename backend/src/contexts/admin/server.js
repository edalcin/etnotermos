import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { config, validateConfig } from '../../config/index.js';
import requireAuth from '../../lib/auth/basicAuth.js';
import { requestLogger } from '../../lib/logger.js';
import * as cron from '../../lib/scheduler/acquisitionCron.js';
import * as AcquisitionService from '../../services/AcquisitionService.js';
import indexRouter from './routes/index.js';
import conceptsRouter from './routes/concepts.js';
import labelsRouter from './routes/labels.js';
import relationsRouter from './routes/relations.js';
import acquisitionRouter from './routes/acquisition.js';
import auditRouter from './routes/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(db) {
  const app = express();

  app.locals.db = db;
  app.locals.currentPage = null;

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://unpkg.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          connectSrc: ["'self'"],
        },
      },
    })
  );
  app.use(compression());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(requestLogger);

  app.use('/assets', express.static(path.join(__dirname, 'views', 'assets')));

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'admin', port: config.adminPort });
  });

  app.use(requireAuth);

  app.use('/', indexRouter);
  app.use('/concepts', conceptsRouter);
  app.use('/', labelsRouter);
  app.use('/', relationsRouter);
  app.use('/acquisition', acquisitionRouter);
  app.use('/audit', auditRouter);

  app.use((err, req, res, next) => {
    const code = err.code || err.status || 500;
    const httpStatus = [400, 401, 403, 404, 409, 422].includes(code) ? code : 500;
    return res.status(httpStatus).json({ error: err.message || 'Internal server error' });
  });

  return app;
}

async function main() {
  const errors = validateConfig();
  if (errors.length > 0) {
    errors.forEach((e) => console.error(`ERROR: ${e}`));
    process.exit(1);
  }

  const { connect, getDb } = await import('../../shared/database.js');
  await connect();
  const db = getDb();

  cron.start(AcquisitionService, db);

  const app = createApp(db);
  app.listen(config.adminPort, () => {
    console.log(`EtnoTermos ADMIN interface running on port ${config.adminPort}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  main().catch((err) => {
    console.error('Failed to start admin server:', err);
    process.exit(1);
  });
}
