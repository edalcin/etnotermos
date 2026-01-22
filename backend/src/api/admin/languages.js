// Admin Languages Router
// Routes for language management

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getAllLanguages, createNewLanguage } from '../../services/LanguageService.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

/**
 * GET /api/v1/admin/languages
 * List all languages
 */
router.get('/', asyncHandler(async (req, res) => {
  const languages = await getAllLanguages();
  res.status(200).json(languages);
}));

/**
 * POST /api/v1/admin/languages
 * Create a new language
 */
router.post('/', asyncHandler(async (req, res) => {
  const { name, nativeName } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Name is required'
    });
  }

  const language = await createNewLanguage({ name, nativeName });
  res.status(201).json(language);
}));

export default router;
