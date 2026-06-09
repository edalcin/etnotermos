import { Router } from 'express';
import * as AuditService from '../../../services/AuditService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { conceptId, responsible, page = 1, limit = 50 } = req.query;

    const result = await AuditService.findMany(db, {
      conceptId,
      responsible,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    if (req.headers['accept']?.includes('application/json') && !req.headers['hx-request']) {
      return res.json(result);
    }

    res.render('audit-logs', {
      ...result,
      totalPages: Math.ceil(result.total / parseInt(limit, 10)) || 1,
      limit: parseInt(limit, 10),
      conceptId: conceptId || '',
      responsible: responsible || '',
      user: req.user,
      currentPage: 'audit',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
