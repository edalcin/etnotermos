// Public Export Router - T080
// Data export endpoints

import express from 'express';
import { exportCSVHandler } from '../controllers/PublicExportController.js';
import rateLimit from '../middleware/rateLimit.js';

const router = express.Router();

// Apply rate limiting
router.use(rateLimit);

/**
 * GET /api/v1/export/csv
 * Export terms to CSV format
 */
router.get('/csv', exportCSVHandler);

export default router;
