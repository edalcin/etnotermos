// Health Check Endpoint for EtnoTermos
// Provides system health status for monitoring and load balancers

import express from 'express';
import { getDb } from '../../shared/database.js';

const router = express.Router();

/**
 * GET /health
 * Returns health status of the application
 */
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  };

  try {
    // Check MongoDB connection
    const db = getDb();
    const pingResult = await db.admin().ping();
    health.checks.mongodb = {
      status: pingResult.ok === 1 ? 'healthy' : 'unhealthy',
      message: 'MongoDB connection successful'
    };

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    health.checks.memory = {
      status: memoryUsedPercent < 90 ? 'healthy' : 'warning',
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      percentage: `${memoryUsedPercent.toFixed(2)}%`
    };

    // Check term count (200k limit monitoring)
    const termCount = await db.collection('etnotermos').countDocuments();
    const termLimitPercent = (termCount / 200000) * 100;
    health.checks.termLimit = {
      status: termLimitPercent < 90 ? 'healthy' : 'warning',
      termCount,
      limit: 200000,
      percentage: `${termLimitPercent.toFixed(2)}%`,
      message: termLimitPercent >= 90 ? 'Approaching term limit!' : 'Within term limit'
    };

    // Overall status
    const allHealthy = Object.values(health.checks).every(check => check.status === 'healthy');
    health.status = allHealthy ? 'healthy' : 'degraded';

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    health.status = 'unhealthy';
    health.checks.error = {
      status: 'unhealthy',
      message: error.message
    };
    res.status(503).json(health);
  }
});

/**
 * GET /health/ready
 * Readiness probe - returns 200 when application is ready to serve traffic
 */
router.get('/health/ready', async (req, res) => {
  try {
    const db = getDb();
    await db.admin().ping();
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: error.message });
  }
});

/**
 * GET /health/live
 * Liveness probe - returns 200 when application is running
 */
router.get('/health/live', (req, res) => {
  res.status(200).json({ alive: true });
});

export default router;
