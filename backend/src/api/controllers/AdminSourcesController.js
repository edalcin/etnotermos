// Admin Sources Controller - T075
// CRUD operations for sources

import {
  createNewSource,
  getSourceById,
  listSources,
  updateExistingSource,
  deleteSource,
} from '../../services/SourceService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Create a new source
 * POST /api/v1/admin/sources
 */
export const createSourceHandler = asyncHandler(async (req, res) => {
  const { type, fields } = req.body;

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const source = await createNewSource(type, fields, metadata);

  res.status(201).json(source);
});

/**
 * Get a source by ID
 * GET /api/v1/sources/:id
 */
export const getSourceHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const source = await getSourceById(id);

  res.status(200).json(source);
});

/**
 * List all sources
 * GET /api/v1/sources
 */
export const listSourcesHandler = asyncHandler(async (req, res) => {
  const { type, page, limit } = req.query;

  const options = {
    page: page || 1,
    limit: limit || 50,
  };

  if (type) {
    options.type = type;
  }

  const result = await listSources(options);

  res.status(200).json(result);
});

/**
 * Update a source
 * PUT /api/v1/admin/sources/:id
 */
export const updateSourceHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const source = await updateExistingSource(id, updates, metadata);

  res.status(200).json(source);
});

/**
 * Delete a source
 * DELETE /api/v1/admin/sources/:id
 */
export const deleteSourceHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { confirm, orphanHandling } = req.query;

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const result = await deleteSource(
    id,
    confirm === 'true',
    orphanHandling || 'remove_reference',
    metadata
  );

  res.status(200).json(result);
});

export default {
  createSourceHandler,
  getSourceHandler,
  listSourcesHandler,
  updateSourceHandler,
  deleteSourceHandler,
};
