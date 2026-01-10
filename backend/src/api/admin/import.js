// Admin Bulk Import Routes for EtnoTermos
// Handles CSV import with preview and conflict resolution

import express from 'express';
import multer from 'multer';
import * as ImportController from '../controllers/AdminImportController.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

// Configure multer for file uploads (memory storage for CSV processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// All import routes require admin authentication
router.use(adminAuth);

/**
 * POST /api/v1/admin/import/upload
 * Upload and preview CSV file
 */
router.post('/upload', upload.single('file'), ImportController.uploadAndPreview);

/**
 * POST /api/v1/admin/import/execute
 * Execute import with conflict resolutions
 */
router.post('/execute', ImportController.executeImport);

/**
 * GET /api/v1/admin/import/template
 * Download CSV template
 */
router.get('/template', ImportController.downloadTemplate);

/**
 * GET /api/v1/admin/import/history
 * Get import history (from audit logs)
 */
router.get('/history', ImportController.getImportHistory);

export default router;
