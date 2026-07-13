import { Router } from 'express';
import * as ConceptService from '../../../services/ConceptService.js';
import { REL_SECTIONS } from '../../../lib/relSections.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { status, sourceField, q, page = 1, limit = 20 } = req.query;
    const result = await ConceptService.findMany(db, {
      status,
      sourceField,
      q,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    if (req.get('HX-Request')) {
      return res.render('partials/concept-rows', { concepts: result.data, pagination: result.pagination });
    }

    if (req.get('Accept') === 'application/json') {
      return res.json(result);
    }

    res.render('concepts/list', { ...result, q, sourceField, status, user: req.user, currentPage: 'terms' });
  } catch (err) {
    next(err);
  }
});

// Registered before GET /:id so the literal "search" segment isn't swallowed by :id.
router.get('/search', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { q = '', exclude } = req.query;

    if (!q.trim()) {
      return res.render('partials/concept-suggestions', { concepts: [] });
    }

    const result = await ConceptService.findMany(db, { q: q.trim(), limit: 8 });
    const concepts = result.data.filter((c) => c.id !== exclude);
    res.render('partials/concept-suggestions', { concepts });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const concept = await ConceptService.findById(db, req.params.id);
    if (!concept) return res.status(404).json({ error: 'Conceito não encontrado' });

    if (req.get('Accept') === 'application/json') {
      return res.json(concept);
    }

    res.render('concepts/edit', { concept, relSections: REL_SECTIONS, user: req.user, currentPage: 'terms' });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const version = parseInt(req.body.version, 10);
    const { definition, scopeNote, historyNote, example } = req.body;

    const updated = await ConceptService.updateNotes(
      db,
      req.params.id,
      version,
      { definition, scopeNote, historyNote, example },
      req.user.username
    );

    if (!updated) return res.status(404).json({ error: 'Conceito não encontrado' });
    res.json(updated);
  } catch (err) {
    if (err.code === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

router.post('/:id/activate', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const version = parseInt(req.body.version, 10);

    const result = await ConceptService.activate(db, req.params.id, version, req.user.username);
    if (!result) return res.status(404).json({ error: 'Conceito não encontrado' });
    res.json({ ok: true, status: result.status });
  } catch (err) {
    if (err.code === 400) return res.status(400).json({ error: err.message });
    if (err.code === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

router.post('/:id/deprecate', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const version = parseInt(req.body.version, 10);
    const { replacedById, confirmedOrphans } = req.body;

    if (!replacedById) {
      return res.status(400).json({ error: 'replacedById é obrigatório para deprecar um conceito' });
    }

    const result = await ConceptService.deprecate(
      db,
      req.params.id,
      version,
      { replacedById, confirmedOrphans: confirmedOrphans === 'true' || confirmedOrphans === true },
      req.user.username
    );

    if (!result) return res.status(404).json({ error: 'Conceito não encontrado' });

    if (result.orphans) {
      return res.render('concepts/deprecate-confirm', {
        orphans: result.orphans,
        conceptId: req.params.id,
        version,
        replacedById,
        user: req.user,
        currentPage: 'terms',
      });
    }

    res.json(result);
  } catch (err) {
    if (err.code === 400) return res.status(400).json({ error: err.message });
    if (err.code === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

export default router;
