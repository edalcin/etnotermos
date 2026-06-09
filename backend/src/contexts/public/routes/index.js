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

router.get('/browse', (req, res) => res.redirect(301, '/concepts'));
router.get('/search', (req, res) => res.redirect(301, '/concepts'));

router.get('/export', (req, res) => {
  res.render('export', { title: 'Exportar', currentPage: 'export' });
});

router.get('/about', (req, res) => {
  res.render('about', { title: 'Sobre', currentPage: 'about' });
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

const AUDIO_FILENAME_RE = /^[A-Za-z0-9_-]+\.(mp3|wav)$/;
const AUDIO_CONTENT_TYPES = { mp3: 'audio/mpeg', wav: 'audio/wav' };

router.get('/audio/:filename', (req, res) => {
  const { filename } = req.params;

  if (!AUDIO_FILENAME_RE.test(filename)) {
    return res.status(400).json({ message: 'Invalid filename' });
  }

  const ext = filename.split('.').pop();
  res.setHeader('Content-Type', AUDIO_CONTENT_TYPES[ext]);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  const filePath = path.resolve(config.audioStoragePath, filename);
  res.sendFile(filePath, { root: '/' }, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ message: 'Not found' });
    }
  });
});

export default router;
