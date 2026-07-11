import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { config } from '../../../config/index.js';
import * as ConceptService from '../../../services/ConceptService.js';

const ALLOWED_MIME_EXT = { 'audio/mpeg': '.mp3', 'audio/wav': '.wav' };

const storage = multer.diskStorage({
  // Pass destination as a function so multer only creates the dir on actual upload,
  // not at module load time (avoids EACCES crash on startup when /data doesn't exist yet).
  destination: (req, file, cb) => cb(null, config.audioStoragePath),
  filename: (req, file, cb) => {
    const ext = ALLOWED_MIME_EXT[file.mimetype] ?? '.mp3';
    const safeId = req.params.id.replace(/[^A-Za-z0-9_-]/g, '');
    const safeLabelId = req.params.labelId.replace(/[^A-Za-z0-9_-]/g, '');
    cb(null, `${safeId}-${safeLabelId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (Object.prototype.hasOwnProperty.call(ALLOWED_MIME_EXT, file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('Somente arquivos audio/mpeg e audio/wav são aceitos');
      err.code = 400;
      cb(err, false);
    }
  },
});

/** Fetch the current version of a concept when not provided in the request. */

async function resolveVersion(db, id, bodyVersion, headerVersion) {
  const v = parseInt(bodyVersion ?? headerVersion, 10);
  if (!isNaN(v)) return v;
  const row = db.prepare(`SELECT json_extract(doc,'$.version') as version FROM etnotermos WHERE id = ?`).get(id);
  return row ? row.version : null;
}

const router = Router();

router.post('/concepts/:id/labels', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const version = await resolveVersion(db, req.params.id, req.body.version, req.headers.version);
    if (version === null) return res.status(404).json({ error: 'Conceito não encontrado' });

    const result = await ConceptService.addLabel(db, req.params.id, version, req.body, req.user.username);
    if (!result) return res.status(404).json({ error: 'Conceito não encontrado' });
    res.status(201).json(result);
  } catch (err) {
    if (err.code === 400) return res.status(400).json({ error: err.message });
    if (err.code === 409) return res.status(409).json({ error: err.message });
    if (/duplicado|duplicate/i.test(err.message)) return res.status(422).json({ error: err.message });
    next(err);
  }
});

router.put('/concepts/:id/labels/:labelId', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const version = await resolveVersion(db, req.params.id, req.body.version, req.headers.version);
    if (version === null) return res.status(404).json({ error: 'Conceito não encontrado' });

    const result = await ConceptService.updateLabel(
      db,
      req.params.id,
      version,
      req.params.labelId,
      req.body,
      req.user.username
    );
    if (!result) return res.status(404).json({ error: 'Conceito ou etiqueta não encontrado' });
    res.json(result);
  } catch (err) {
    if (err.code === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

router.delete('/concepts/:id/labels/:labelId', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const version = await resolveVersion(db, req.params.id, req.body?.version, req.headers.version);
    if (version === null) return res.status(404).json({ error: 'Conceito não encontrado' });

    const result = await ConceptService.removeLabel(
      db,
      req.params.id,
      version,
      req.params.labelId,
      req.user.username
    );
    if (!result) return res.status(404).json({ error: 'Conceito ou etiqueta não encontrado' });
    res.json(result);
  } catch (err) {
    if (err.code === 400) return res.status(400).json({ error: err.message });
    if (err.code === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

router.post(
  '/concepts/:id/labels/:labelId/audio',
  (req, res, next) => upload.single('audio')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Arquivo excede o limite de 10 MB' });
      }
      const status = err.code === 400 ? 400 : 500;
      return res.status(status).json({ error: err.message });
    }
    next();
  }),
  async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const version = await resolveVersion(db, req.params.id, req.body?.version, req.headers.version);
      if (version === null) return res.status(404).json({ error: 'Conceito não encontrado' });

      const result = await ConceptService.saveAudio(
        db,
        req.params.id,
        version,
        req.params.labelId,
        req.file ? req.file.path : null,
        req.user.username
      );
      if (!result) return res.status(404).json({ error: 'Conceito ou etiqueta não encontrado' });
      res.status(201).json(result);
    } catch (err) {
      if (err.code === 409) return res.status(409).json({ error: err.message });
      next(err);
    }
  }
);

router.delete('/concepts/:id/labels/:labelId/audio', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const version = await resolveVersion(db, req.params.id, req.body?.version, req.headers.version);
    if (version === null) return res.status(404).json({ error: 'Conceito não encontrado' });

    const result = await ConceptService.removeAudio(
      db,
      req.params.id,
      version,
      req.params.labelId,
      req.user.username
    );
    if (!result) return res.status(404).json({ error: 'Conceito ou etiqueta não encontrado' });
    res.json(result);
  } catch (err) {
    if (err.code === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

export default router;
