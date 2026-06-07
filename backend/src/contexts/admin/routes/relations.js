import { Router } from 'express';
import { ObjectId } from 'mongodb';
import * as ConceptService from '../../../services/ConceptService.js';

const router = Router();

async function resolveVersion(db, id, bodyVersion) {
  const v = parseInt(bodyVersion, 10);
  if (!isNaN(v)) return v;
  const col = db.collection('etnotermos');
  const doc = await col.findOne({ _id: new ObjectId(id) }, { projection: { version: 1 } });
  return doc ? doc.version : null;
}

router.post('/concepts/:id/broader', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const version = await resolveVersion(db, req.params.id, req.body.version);
    if (version === null) return res.status(404).json({ error: 'Conceito não encontrado' });

    const { targetId } = req.body;
    const result = await ConceptService.addBroader(db, req.params.id, version, targetId, req.user.username);
    if (!result) return res.status(404).json({ error: 'Conceito não encontrado' });
    res.status(200).json(result);
  } catch (err) {
    if (err.code === 400) return res.status(400).json({ error: err.message });
    if (err.code === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

router.delete('/concepts/:id/broader/:targetId', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const version = await resolveVersion(db, req.params.id, req.body?.version);
    if (version === null) return res.status(404).json({ error: 'Conceito não encontrado' });

    const result = await ConceptService.removeBroader(
      db,
      req.params.id,
      version,
      req.params.targetId,
      req.user.username
    );
    if (!result) return res.status(404).json({ error: 'Conceito não encontrado' });
    res.json(result);
  } catch (err) {
    if (err.code === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

router.post('/concepts/:id/related', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const version = await resolveVersion(db, req.params.id, req.body.version);
    if (version === null) return res.status(404).json({ error: 'Conceito não encontrado' });

    const { targetId } = req.body;
    const result = await ConceptService.addRelated(db, req.params.id, version, targetId, req.user.username);
    if (!result) return res.status(404).json({ error: 'Conceito não encontrado' });
    res.status(200).json(result);
  } catch (err) {
    if (err.code === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

router.delete('/concepts/:id/related/:targetId', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const version = await resolveVersion(db, req.params.id, req.body?.version);
    if (version === null) return res.status(404).json({ error: 'Conceito não encontrado' });

    const result = await ConceptService.removeRelated(
      db,
      req.params.id,
      version,
      req.params.targetId,
      req.user.username
    );
    if (!result) return res.status(404).json({ error: 'Conceito não encontrado' });
    res.json(result);
  } catch (err) {
    if (err.code === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

export default router;
