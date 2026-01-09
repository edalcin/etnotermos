// Admin Relationships Controller - T071
// CRUD operations for relationships

import {
  createNewRelationship,
  deleteRelationship,
} from '../../services/RelationshipService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Create a new relationship
 * POST /api/v1/admin/relationships
 */
export const createRelationshipHandler = asyncHandler(async (req, res) => {
  const { sourceTermId, targetTermId, type } = req.body;

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const result = await createNewRelationship(sourceTermId, targetTermId, type, metadata);

  res.status(201).json(result.relationship);
});

/**
 * Delete a relationship
 * DELETE /api/v1/admin/relationships/:id
 */
export const deleteRelationshipHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const metadata = {
    admin: req.admin?.username,
    ip: req.ip,
  };

  const result = await deleteRelationship(id, metadata);

  res.status(200).json(result);
});

export default {
  createRelationshipHandler,
  deleteRelationshipHandler,
};
