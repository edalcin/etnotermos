import { Router } from 'express';
import * as ConceptService from '../../../services/ConceptService.js';
import { CONCEPT_STATUS } from '../../../models/Concept.js';

const router = Router();

function wantsJson(req) {
  return req.get('Accept') === 'application/json';
}

router.get('/', async (req, res, next) => {
  const db = req.app.locals.db;
  const { q, sourceField, page = 1, limit = 20 } = req.query;

  try {
    const result = await ConceptService.findMany(db, {
      status: CONCEPT_STATUS.ACTIVE,
      publicOnly: true,
      q,
      sourceField,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    if (req.get('HX-Request')) {
      return res.render('partials/concept-list', { ...result, q, sourceField });
    }

    if (wantsJson(req)) {
      return res.json(result);
    }

    res.render('index', {
      title: 'Termos',
      currentPage: 'concepts',
      ...result,
      q: q || '',
      sourceField: sourceField || '',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  const db = req.app.locals.db;
  const { id } = req.params;

  try {
    const concept = await ConceptService.findById(db, id, { publicOnly: true });

    if (!concept || concept.status !== CONCEPT_STATUS.ACTIVE) {
      if (concept && concept.status === CONCEPT_STATUS.DEPRECATED) {
        if (wantsJson(req)) {
          return res.status(410).json({
            message: 'Conceito descontinuado',
            replacedBy: concept.replacedBy ?? null,
          });
        }
        return res.status(410).render('concept-detail', {
          title: 'Conceito descontinuado',
          currentPage: 'concepts',
          concept,
          includeGraph: true,
        });
      }

      if (wantsJson(req)) {
        return res.status(404).json({ message: 'Conceito não encontrado' });
      }
      return res.status(404).render('404', { title: '404 — Não encontrado' });
    }

    if (wantsJson(req)) {
      return res.json(concept);
    }

    res.render('concept-detail', {
      title: concept.prefLabels?.[0]?.literalForm ?? 'Conceito',
      currentPage: 'concepts',
      concept,
      includeGraph: true,
    });
  } catch (err) {
    if (err.message?.includes('input must be a 24 character hex string')) {
      if (wantsJson(req)) {
        return res.status(404).json({ message: 'Conceito não encontrado' });
      }
      return res.status(404).render('404', { title: '404 — Não encontrado' });
    }
    next(err);
  }
});

export default router;
