import { Router } from 'express';
import { ObjectId } from 'mongodb';
import * as ConceptService from '../../../services/ConceptService.js';

const router = Router();

router.get('/relationships', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const col = db.collection('etnotermos');

    const [withRelations, stats] = await Promise.all([
      col
        .find({
          $or: [
            { broader: { $exists: true, $ne: [] } },
            { narrower: { $exists: true, $ne: [] } },
            { related: { $exists: true, $ne: [] } },
          ],
        })
        .project({ prefLabels: 1, broader: 1, narrower: 1, related: 1, status: 1 })
        .sort({ updatedAt: -1 })
        .limit(100)
        .toArray(),
      col
        .aggregate([
          {
            $group: {
              _id: null,
              totalBroader: { $sum: { $size: { $ifNull: ['$broader', []] } } },
              totalNarrower: { $sum: { $size: { $ifNull: ['$narrower', []] } } },
              totalRelated: { $sum: { $size: { $ifNull: ['$related', []] } } },
              withAnyRelation: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $gt: [{ $size: { $ifNull: ['$broader', []] } }, 0] },
                        { $gt: [{ $size: { $ifNull: ['$narrower', []] } }, 0] },
                        { $gt: [{ $size: { $ifNull: ['$related', []] } }, 0] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ])
        .toArray(),
    ]);

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
