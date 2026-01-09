// Admin Dashboard Controller - T083
// Dashboard statistics and audit logs

import {
  getDashboardStatistics,
  getRecentChanges,
  getActivityTimeline,
  getPopularCollections,
} from '../../services/DashboardService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getCollection } from '../../shared/database.js';

/**
 * Get dashboard statistics
 * GET /api/v1/admin/dashboard
 */
export const getDashboardHandler = asyncHandler(async (req, res) => {
  const statistics = await getDashboardStatistics();
  const recentChanges = await getRecentChanges(10);
  const popularCollections = await getPopularCollections(5);

  res.status(200).json({
    statistics,
    recentChanges,
    popularCollections,
  });
});

/**
 * Get audit logs with filtering
 * GET /api/v1/admin/audit-logs
 */
export const getAuditLogsHandler = asyncHandler(async (req, res) => {
  const { page, limit, entityType, action } = req.query;

  const auditLogs = getCollection('etnotermos-audit-logs');

  const query = {};
  if (entityType) {
    query.entityType = entityType;
  }
  if (action) {
    query.action = action;
  }

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    auditLogs.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum).toArray(),
    auditLogs.countDocuments(query),
  ]);

  res.status(200).json({
    data: logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Get activity timeline
 * GET /api/v1/admin/activity-timeline
 */
export const getActivityTimelineHandler = asyncHandler(async (req, res) => {
  const { days } = req.query;

  const timeline = await getActivityTimeline(parseInt(days) || 30);

  res.status(200).json(timeline);
});

export default {
  getDashboardHandler,
  getAuditLogsHandler,
  getActivityTimelineHandler,
};
