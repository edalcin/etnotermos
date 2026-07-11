import { Router } from 'express';
import * as AcquisitionService from '../../../services/AcquisitionService.js';

const router = Router();

function listLogs(db, { status, page = 1, limit = 20 }) {
  const where = status ? `WHERE json_extract(doc,'$.status') = ?` : '';
  const params = status ? [status] : [];
  const offset = (page - 1) * limit;

  const rows = db
    .prepare(`SELECT doc FROM etnotermos_acquisition_log ${where} ORDER BY executed_at DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);
  const total = db
    .prepare(`SELECT COUNT(*) as n FROM etnotermos_acquisition_log ${where}`)
    .get(...params).n;

  return { data: rows.map((r) => JSON.parse(r.doc)), total };
}

router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const { data: logs, total } = listLogs(db, { status, page: pageNum, limit: limitNum });

    res.render('acquisition/logs', {
      logs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
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
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const { data, total } = listLogs(db, { status, page: pageNum, limit: limitNum });

    res.json({ data, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

router.get('/logs/:id', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const id = req.params.id;

    const row = db.prepare(`SELECT doc FROM etnotermos_acquisition_log WHERE id = ?`).get(id);
    if (!row) return res.status(404).json({ error: 'Log não encontrado' });
    res.json(JSON.parse(row.doc));
  } catch (err) {
    next(err);
  }
});

export default router;
