import { Router } from 'express';
import { ObjectId } from 'mongodb';
import * as AcquisitionService from '../../../services/AcquisitionService.js';
import { getAcquisitionLogCollection } from '../../../models/AcquisitionLog.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { status, page = 1, limit = 20 } = req.query;
    const col = getAcquisitionLogCollection(db);

    const filter = status ? { status } : {};
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [logs, total] = await Promise.all([
      col.find(filter).sort({ executedAt: -1 }).skip(skip).limit(parseInt(limit, 10)).toArray(),
      col.countDocuments(filter),
    ]);

    res.render('acquisition/logs', {
      logs,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      filters: { status: status || '' },
      acquisitionRunning: false,
      user: req.user,
      currentPage: 'acquisition',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/run', (req, res) => {
  const db = req.app.locals.db;
  AcquisitionService.run(db).catch(() => {});
  if (req.headers['hx-request']) {
    return res.send(
      '<span class="text-forest-700 font-medium">Aquisição iniciada. Aguarde alguns segundos e recarregue o dashboard para ver o resultado.</span>'
    );
  }
  res.status(202).json({ ok: true, message: 'Aquisição iniciada em background.' });
});

router.get('/status', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { lastRun } = await AcquisitionService.getLastRunStatus(db);
    res.json({ lastRun, scheduledNext: null });
  } catch (err) {
    next(err);
  }
});

router.get('/logs', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { status, page = 1, limit = 20 } = req.query;
    const col = getAcquisitionLogCollection(db);

    const filter = status ? { status } : {};
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [data, total] = await Promise.all([
      col.find(filter).sort({ executedAt: -1 }).skip(skip).limit(parseInt(limit, 10)).toArray(),
      col.countDocuments(filter),
    ]);

    res.json({ data, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (err) {
    next(err);
  }
});

router.get('/logs/:id', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    let oid;
    try {
      oid = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const col = getAcquisitionLogCollection(db);
    const doc = await col.findOne({ _id: oid });
    if (!doc) return res.status(404).json({ error: 'Log não encontrado' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

export default router;
