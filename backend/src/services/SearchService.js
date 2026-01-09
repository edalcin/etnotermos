// SearchService - T055
// MongoDB text search with multilingual support and relevance ranking

import { ObjectId } from 'mongodb';
import { getCollection } from '../shared/database.js';
import { buildTextSearchQuery, defaultSearchOptions } from '../lib/search/config.js';

/**
 * Perform text search across terms
 */
export async function searchTerms(searchTerm, filters = {}, options = {}) {
  const terms = getCollection('etnotermos');

  const { page = 1, limit = 20, includeRelationshipCounts = false } = options;

  // Build search query
  const query = buildTextSearchQuery(searchTerm, filters);

  // Execute search with pagination
  const skip = (page - 1) * limit;

  const results = await terms
    .find(query, {
      projection: {
        ...defaultSearchOptions.projection,
      },
    })
    .sort(defaultSearchOptions.sort)
    .skip(skip)
    .limit(limit)
    .toArray();

  // Get total count
  const total = await terms.countDocuments(query);

  // Enrich results with relationship counts if requested
  let enrichedResults = results;
  if (includeRelationshipCounts) {
    enrichedResults = await enrichWithRelationshipCounts(results);
  }

  return {
    data: enrichedResults,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    query: searchTerm,
  };
}

/**
 * Enrich results with relationship counts
 */
async function enrichWithRelationshipCounts(terms) {
  const relationships = getCollection('etnotermos-relationships');

  return await Promise.all(
    terms.map(async (term) => {
      const relationshipCount = await relationships.countDocuments({
        $or: [{ sourceTermId: term._id }, { targetTermId: term._id }],
      });

      return {
        ...term,
        relationshipCount,
      };
    })
  );
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSearchSuggestions(prefix, limit = 10) {
  const terms = getCollection('etnotermos');

  // Use regex for prefix matching
  const query = {
    status: 'active',
    $or: [
      { prefLabel: { $regex: `^${prefix}`, $options: 'i' } },
      { altLabels: { $regex: `^${prefix}`, $options: 'i' } },
    ],
  };

  const suggestions = await terms
    .find(query, {
      projection: { _id: 1, prefLabel: 1, altLabels: 1 },
    })
    .limit(limit)
    .toArray();

  return suggestions.map((term) => ({
    _id: term._id,
    prefLabel: term.prefLabel,
  }));
}

/**
 * Advanced search with multiple criteria
 */
export async function advancedSearch(criteria, options = {}) {
  const terms = getCollection('etnotermos');

  const { page = 1, limit = 20 } = options;

  // Build complex query
  const query = {};

  if (criteria.prefLabel) {
    query.prefLabel = { $regex: criteria.prefLabel, $options: 'i' };
  }

  if (criteria.status) {
    query.status = criteria.status;
  }

  if (criteria.termType) {
    query.termType = criteria.termType;
  }

  if (criteria.collectionIds && criteria.collectionIds.length > 0) {
    query.collectionIds = { $in: criteria.collectionIds.map((id) => new ObjectId(id)) };
  }

  if (criteria.sourceIds && criteria.sourceIds.length > 0) {
    query.sourceIds = { $in: criteria.sourceIds.map((id) => new ObjectId(id)) };
  }

  if (criteria.createdAfter) {
    query.createdAt = { $gte: new Date(criteria.createdAfter) };
  }

  if (criteria.createdBefore) {
    query.createdAt = { ...query.createdAt, $lte: new Date(criteria.createdBefore) };
  }

  // Execute query
  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    terms.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).toArray(),
    terms.countDocuments(query),
  ]);

  return {
    data: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export default {
  searchTerms,
  getSearchSuggestions,
  advancedSearch,
};
