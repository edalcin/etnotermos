// Public Export Controller - T081
// Data export operations

import { exportToCSV } from '../../services/ExportService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Export terms to CSV
 * GET /api/v1/export/csv
 */
export const exportCSVHandler = asyncHandler(async (req, res) => {
  const { status, collections } = req.query;

  const filters = {};
  if (status) {
    filters.status = status;
  }
  if (collections) {
    filters.collectionIds = Array.isArray(collections) ? collections : [collections];
  }

  const csvData = await exportToCSV(filters);

  // Set headers for CSV download
  const filename = `etnotermos_${new Date().toISOString().split('T')[0]}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', Buffer.byteLength(csvData, 'utf8'));

  // Add UTF-8 BOM for Excel compatibility
  res.write('\uFEFF');
  res.write(csvData);
  res.end();
});

export default {
  exportCSVHandler,
};
