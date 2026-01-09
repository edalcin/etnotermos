// Public Relationships Controller - T067
// Read-only operations for relationship queries

import { getRelationshipsByTerm } from '../../services/RelationshipService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get relationships for a term
 * GET /api/v1/relationships/:termId
 */
export const getRelationshipsByTermHandler = asyncHandler(async (req, res) => {
  const { termId } = req.params;
  const { type } = req.query;

  const options = {
    includeTermDetails: true,
  };

  if (type) {
    options.type = type;
  }

  const relationships = await getRelationshipsByTerm(termId, options);

  res.status(200).json(relationships);
});

export default {
  getRelationshipsByTermHandler,
};
