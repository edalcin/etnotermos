// Admin Collections Controller - T077
// CRUD operations for collections

import {
  createNewCollection,
  getCollectionById,
  listCollections,
  updateExistingCollection,
  deleteCollection,
  getTermsByCollection,
} from '../../services/CollectionService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Create a new collection
 * POST /api/v1/admin/collections
 */
export const createCollectionHandler = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const collection = await createNewCollection(name, description || '', metadata);

  res.status(201).json(collection);
});

/**
 * Get a collection by ID
 * GET /api/v1/collections/:id
 */
export const getCollectionHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const collection = await getCollectionById(id);

  res.status(200).json(collection);
});

/**
 * List all collections
 * GET /api/v1/collections
 */
export const listCollectionsHandler = asyncHandler(async (req, res) => {
  const collections = await listCollections();

  res.status(200).json(collections);
});

/**
 * Get terms in a collection
 * GET /api/v1/collections/:id/terms
 */
export const getCollectionTermsHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query;

  const options = {
    page: page || 1,
    limit: limit || 50,
  };

  const result = await getTermsByCollection(id, options);

  res.status(200).json(result);
});

/**
 * Update a collection
 * PUT /api/v1/admin/collections/:id
 */
export const updateCollectionHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const collection = await updateExistingCollection(id, updates, metadata);

  res.status(200).json(collection);
});

/**
 * Delete a collection
 * DELETE /api/v1/admin/collections/:id
 */
export const deleteCollectionHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const result = await deleteCollection(id, metadata);

  res.status(200).json(result);
});

export default {
  createCollectionHandler,
  getCollectionHandler,
  listCollectionsHandler,
  getCollectionTermsHandler,
  updateCollectionHandler,
  deleteCollectionHandler,
};
