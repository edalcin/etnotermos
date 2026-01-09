// Admin Dashboard Router - T082
// Dashboard and analytics endpoints

import express from 'express';
import {
  getDashboardHandler,
  getAuditLogsHandler,
  getActivityTimelineHandler,
} from '../controllers/AdminDashboardController.js';
import { validatePagination } from '../middleware/validate.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

/**
 * GET /api/v1/admin/dashboard
 * Get dashboard statistics and overview
 */
router.get('/', getDashboardHandler);

/**
 * GET /api/v1/admin/audit-logs
 * Get audit logs with filtering and pagination
 */
router.get('/audit-logs', validatePagination, getAuditLogsHandler);

/**
 * GET /api/v1/admin/activity-timeline
 * Get activity timeline for the last N days
 */
router.get('/activity-timeline', getActivityTimelineHandler);

export default router;
