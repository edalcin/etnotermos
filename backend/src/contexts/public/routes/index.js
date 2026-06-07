import { Router } from 'express';
import path from 'path';
import { config } from '../../../config/index.js';
import { getConceptCollection, CONCEPT_STATUS } from '../../../models/Concept.js';

const router = Router();

router.get('/', async (req, res, next) => {
  const db = req.app.locals.db;

  try {
    const col = getConceptCollection(db);
    const filter = { status: CONCEPT_STATUS.ACTIVE };

    const [sourceFields, total] = await Promise.all([
      col.distinct('sourceFields', filter),
      col.countDocuments(filter),
    ]);

    res.render('index', {
      title: 'Início',
      currentPage: 'home',
      sourceFields,
      total,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/health', async (req, res) => {
  const db = req.app.locals.db;

  try {
    await db.command({ ping: 1 });
    res.json({ status: 'ok', mongodb: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', mongodb: 'disconnected' });
  }
});

router.get('/audio/:filename', (req, res) => {
  const { filename } = req.params;

  if (
    filename.includes('..') ||
    filename.includes('/') ||
    filename.includes('%2e') ||
    filename.includes('%2f')
  ) {
    return res.status(400).json({ message: 'Invalid filename' });
  }

  const filePath = path.resolve(config.audioStoragePath, filename);
  res.sendFile(filePath, { root: '/' }, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ message: 'Not found' });
    }
  });
});

export default router;
