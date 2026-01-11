// Admin Audit Logs Controller
// Read-only operations for audit logs

import { ObjectId } from 'mongodb';
import { getCollection } from '../../shared/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * List audit logs with pagination and filtering
 * GET /api/v1/admin/audit-logs
 */
export const listAuditLogsHandler = asyncHandler(async (req, res) => {
  const auditLogs = getCollection('etnotermos-audit-logs');

  const { page = 1, limit = 50, entityType, action } = req.query;

  // Build query
  const query = {};
  if (entityType) {
    query.entityType = entityType;
  }
  if (action) {
    query.action = action;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query with pagination
  const [data, total] = await Promise.all([
    auditLogs
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray(),
    auditLogs.countDocuments(query),
  ]);

  res.status(200).json({
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * Get audit logs for a specific entity
 * GET /api/v1/admin/audit-logs/:entityType/:entityId
 */
export const getEntityAuditLogsHandler = asyncHandler(async (req, res) => {
  const auditLogs = getCollection('etnotermos-audit-logs');
  const { entityType, entityId } = req.params;

  const logs = await auditLogs
    .find({
      entityType,
      entityId: new ObjectId(entityId),
    })
    .sort({ timestamp: -1 })
    .toArray();

  res.status(200).json(logs);
});

export default {
  listAuditLogsHandler,
  getEntityAuditLogsHandler,
};
