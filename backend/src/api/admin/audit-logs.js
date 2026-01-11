// Admin Audit Logs Router
// Read-only routes for audit log access

import express from 'express';
import {
  listAuditLogsHandler,
  getEntityAuditLogsHandler,
} from '../controllers/AdminAuditLogsController.js';
import { validateObjectId, validatePagination } from '../middleware/validate.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Apply admin authentication
router.use(adminAuth);

/**
 * GET /api/v1/admin/audit-logs
 * List all audit logs with pagination and filtering
 */
router.get('/', validatePagination, listAuditLogsHandler);

/**
 * GET /api/v1/admin/audit-logs/:entityType/:entityId
 * Get audit logs for a specific entity
 */
router.get('/:entityType/:entityId', validateObjectId('entityId'), getEntityAuditLogsHandler);

export default router;
