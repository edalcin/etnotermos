import { Router } from 'express';
import { getConceptCollection } from '../../../models/Concept.js';
import { getAcquisitionLogCollection } from '../../../models/AcquisitionLog.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const col = getConceptCollection(db);

    const [candidate, active, deprecated, lastAcq] = await Promise.all([
      col.countDocuments({ status: 'candidate' }),
      col.countDocuments({ status: 'active' }),
      col.countDocuments({ status: 'deprecated' }),
      getAcquisitionLogCollection(db).findOne({}, { sort: { executedAt: -1 } }),
    ]);

    res.render('dashboard', { stats: { candidate, active, deprecated }, lastAcq, user: req.user, currentPage: 'dashboard' });
  } catch (err) {
    next(err);
  }
});

export default router;
