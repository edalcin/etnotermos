import { Router } from 'express';
import * as AuditService from '../../../services/AuditService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { conceptId, responsible, page = 1, limit = 20 } = req.query;

    const result = await AuditService.findMany(db, {
      conceptId,
      responsible,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    if (req.headers['hx-request']) {
      return res.render('audit-logs', { ...result, user: req.user });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
