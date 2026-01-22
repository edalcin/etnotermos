// MongoDB Text Search Configuration for EtnoTermos
// Configures text indexes and search options for the etnotermos collection

/**
 * Text index definition for the Terms collection
 * Maps to MongoDB text index specification
 */
export const textIndexDefinition = {
  prefLabel: 'text',
  altLabels: 'text',
  hiddenLabels: 'text',
  definition: 'text',
  scopeNote: 'text',
  example: 'text',
};

/**
 * Index weights to prioritize certain fields in search results
 * Higher weight = more relevance
 */
export const indexWeights = {
  prefLabel: 10, // Preferred label is most important
  altLabels: 5, // Alternative labels are important
  definition: 3, // Definition is moderately important
  scopeNote: 2, // Scope notes less important
  example: 1, // Examples least important
  hiddenLabels: 1, // Hidden labels for search only
};

/**
 * Text search index options
 */
export const textIndexOptions = {
  name: 'etnotermos_text_search',
  weights: indexWeights,
  default_language: 'portuguese',
  // Note: language_override removed to allow custom language codes in the 'language' field
  // All text search will use Portuguese analyzer regardless of language field value
};

/**
 * Default search options for MongoDB text search queries
 */
export const defaultSearchOptions = {
  // Sort by text score (relevance)
  sort: { score: { $meta: 'textScore' } },

  // Project text score into results
  projection: {
    score: { $meta: 'textScore' },
  },

  // Case insensitive by default
  caseSensitive: false,

  // Diacritic insensitive (important for Portuguese)
  diacriticSensitive: false,
};

/**
 * Supported languages for multilingual search
 * MongoDB text search supports multiple languages
 */
export const supportedLanguages = [
  'portuguese', // Primary language
  'english', // Secondary language for scientific terms
  'spanish', // Common in Latin American ethnobotany
];

/**
 * Build a MongoDB text search query
 * @param {string} searchTerm - The search term
 * @param {Object} filters - Additional filters (collections, status, etc.)
 * @returns {Object} MongoDB query object
 */
export function buildTextSearchQuery(searchTerm, filters = {}) {
  const query = {};

  // Only add text search if searchTerm is provided
  if (searchTerm && searchTerm.trim()) {
    query.$text = {
      $search: searchTerm,
      $caseSensitive: false,
      $diacriticSensitive: false,
    };
  }

  // Add additional filters
  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.collectionIds && filters.collectionIds.length > 0) {
    query.collectionIds = { $in: filters.collectionIds };
  }

  if (filters.termType) {
    query.termType = filters.termType;
  }

  return query;
}

export default {
  textIndexDefinition,
  indexWeights,
  textIndexOptions,
  defaultSearchOptions,
  supportedLanguages,
  buildTextSearchQuery,
};
