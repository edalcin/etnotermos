// Admin Import Controller for EtnoTermos
// Handles bulk import operations with conflict resolution

import * as ImportService from '../../services/ImportService.js';
import { generateTemplate } from '../../lib/import/csvParser.js';
import { getDb } from '../../shared/database.js';

/**
 * Upload CSV file and generate preview with conflict detection
 * POST /api/v1/admin/import/upload
 */
export async function uploadAndPreview(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Parse and preview import
    const preview = await ImportService.previewImport(req.file.buffer);

    // Store preview in session or cache for later execution
    // For simplicity, we'll return it and client will send back terms on execute
    req.session = req.session || {};
    req.session.importPreview = preview;

    res.json({
      success: true,
      preview
    });

  } catch (error) {
    console.error('Import preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing import file',
      error: error.message
    });
  }
}

/**
 * Execute import with user-provided conflict resolutions
 * POST /api/v1/admin/import/execute
 * Body: { terms: Array, resolutions: Object }
 */
export async function executeImport(req, res) {
  try {
    const { terms, resolutions } = req.body;

    if (!terms || !Array.isArray(terms)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: terms array required'
      });
    }

    // Execute import
    const results = await ImportService.executeImport(terms, resolutions);

    // Create audit log entry for bulk import operation
    const db = getDb();
    await db.collection('auditLogs').insertOne({
      entityType: 'Import',
      entityId: new Date().toISOString(),
      action: 'bulk_import',
      changes: {
        summary: {
          created: results.created.length,
          updated: results.updated.length,
          skipped: results.skipped.length,
          errors: results.errors.length
        }
      },
      timestamp: new Date(),
      metadata: {
        source: 'admin_interface',
        user: req.user || 'admin'
      }
    });

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Import execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Error executing import',
      error: error.message
    });
  }
}

/**
 * Download CSV template
 * GET /api/v1/admin/import/template
 */
export function downloadTemplate(req, res) {
  try {
    const template = generateTemplate();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="etnotermos-import-template.csv"');

    // Add UTF-8 BOM for Excel compatibility
    res.write('\ufeff');
    res.write(template);
    res.end();

  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating template',
      error: error.message
    });
  }
}

/**
 * Get import history from audit logs
 * GET /api/v1/admin/import/history
 */
export async function getImportHistory(req, res) {
  try {
    const db = getDb();
    const { limit = 20, skip = 0 } = req.query;

    const history = await db.collection('auditLogs')
      .find({ entityType: 'Import' })
      .sort({ timestamp: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection('auditLogs').countDocuments({ entityType: 'Import' });

    res.json({
      success: true,
      history,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: skip + limit < total
      }
    });

  } catch (error) {
    console.error('Import history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching import history',
      error: error.message
    });
  }
}

export default {
  uploadAndPreview,
  executeImport,
  downloadTemplate,
  getImportHistory
};
