import { Router } from 'express';
import * as ConceptService from '../../../services/ConceptService.js';

const router = Router();

router.get('/relationships', async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const rows = db
      .prepare(
        `SELECT doc FROM etnotermos e
         WHERE json_array_length(json_extract(e.doc,'$.broader')) > 0
            OR json_array_length(json_extract(e.doc,'$.narrower')) > 0
            OR json_array_length(json_extract(e.doc,'$.related')) > 0
         ORDER BY updated_at DESC
         LIMIT 100`
      )
      .all();
    const withRelations = rows.map((r) => {
      const c = JSON.parse(r.doc);
      return {
        prefLabels: c.prefLabels,
        broader: c.broader,
        narrower: c.narrower,
        related: c.related,
        status: c.status,
      };
    });

    const totals = db
      .prepare(
        `SELECT
           SUM(json_array_length(json_extract(doc,'$.broader'))) as totalBroader,
           SUM(json_array_length(json_extract(doc,'$.narrower'))) as totalNarrower,
           SUM(json_array_length(json_extract(doc,'$.related'))) as totalRelated,
           SUM(
             CASE WHEN json_array_length(json_extract(doc,'$.broader')) > 0
                     OR json_array_length(json_extract(doc,'$.narrower')) > 0
                     OR json_array_length(json_extract(doc,'$.related')) > 0
                  THEN 1 ELSE 0 END
           ) as withAnyRelation
         FROM etnotermos`
      )
      .get();

    const stats = [totals];

    const s = stats[0] || { totalBroader: 0, totalNarrower: 0, totalRelated: 0, withAnyRelation: 0 };

    res.render('relationships', {
      concepts: withRelations,
      stats: s,
      user: req.user,
      currentPage: 'relationships',
    });
  } catch (err) {
    next(err);
  }
});

async function resolveVersion(db, id, bodyVersion) {
  const v = parseInt(bodyVersion, 10);
  if (!isNaN(v)) return v;
  const row = db.prepare(`SELECT json_extract(doc,'$.version') as version FROM etnotermos WHERE id = ?`).get(id);
  return row ? row.version : null;
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
