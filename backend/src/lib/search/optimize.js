// MongoDB Text Search Index Optimization
// Analyzes query patterns and optimizes indexes for better performance

import { textIndexDefinition, textIndexOptions } from './config.js';

/**
 * Analyze query patterns and suggest index optimizations
 * @param {Object} db - MongoDB database instance
 * @returns {Promise<Object>} Optimization recommendations
 */
export async function analyzeQueryPatterns(db) {
  const collection = db.collection('etnotermos');

  try {
    // Get index statistics
    const indexStats = await collection.aggregate([
      { $indexStats: {} }
    ]).toArray();

    // Get collection statistics
    const stats = await collection.stats();

    // Analyze text search index usage
    const textSearchIndex = indexStats.find(idx => idx.name === 'etnotermos_text_search');

    const recommendations = {
      indexStats: textSearchIndex,
      collectionSize: stats.size,
      documentCount: stats.count,
      avgDocumentSize: stats.avgObjSize,
      indexSizes: stats.indexSizes,
      recommendations: []
    };

    // Recommendation: If collection is large, consider compound indexes
    if (stats.count > 50000) {
      recommendations.recommendations.push({
        type: 'compound_index',
        priority: 'high',
        message: 'Consider adding compound indexes for common filter combinations (status + collections)'
      });
    }

    // Recommendation: Monitor index usage
    if (textSearchIndex && textSearchIndex.accesses) {
      recommendations.recommendations.push({
        type: 'monitoring',
        priority: 'medium',
        message: `Text search index accessed ${textSearchIndex.accesses.ops || 0} times since ${textSearchIndex.accesses.since}`
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error analyzing query patterns:', error);
    throw error;
  }
}

/**
 * Create optimized compound indexes for common filter combinations
 * @param {Object} db - MongoDB database instance
 */
export async function createOptimizedIndexes(db) {
  const collection = db.collection('etnotermos');

  const indexes = [
    // Compound index for status + text search
    {
      key: { status: 1, prefLabel: 1 },
      name: 'status_prefLabel',
      background: true
    },

    // Compound index for collections + status
    {
      key: { collectionIds: 1, status: 1 },
      name: 'collections_status',
      background: true
    },

    // Index for temporal queries (recent changes)
    {
      key: { updatedAt: -1 },
      name: 'updated_desc',
      background: true
    },

    // Compound index for relationship traversal
    {
      key: { 'relationships.targetTermId': 1, 'relationships.type': 1 },
      name: 'relationships_target_type',
      background: true
    }
  ];

  const results = [];

  for (const indexSpec of indexes) {
    try {
      // Check if index already exists
      const existingIndexes = await collection.indexes();
      const exists = existingIndexes.some(idx => idx.name === indexSpec.name);

      if (!exists) {
        await collection.createIndex(indexSpec.key, {
          name: indexSpec.name,
          background: indexSpec.background
        });
        results.push({ index: indexSpec.name, status: 'created' });
      } else {
        results.push({ index: indexSpec.name, status: 'exists' });
      }
    } catch (error) {
      results.push({ index: indexSpec.name, status: 'error', error: error.message });
    }
  }

  return results;
}

/**
 * Configure index weights based on query performance analysis
 * @param {Object} db - MongoDB database instance
 * @param {Object} customWeights - Custom weights for text search fields
 */
export async function configureIndexWeights(db, customWeights = {}) {
  const collection = db.collection('etnotermos');

  // Drop existing text index
  try {
    await collection.dropIndex('etnotermos_text_search');
  } catch (error) {
    // Index might not exist, ignore error
  }

  // Merge custom weights with defaults
  const weights = {
    ...textIndexOptions.weights,
    ...customWeights
  };

  // Recreate text index with new weights
  await collection.createIndex(
    textIndexDefinition,
    {
      ...textIndexOptions,
      weights
    }
  );

  return { status: 'updated', weights };
}

/**
 * Run explain plan for a text search query to analyze performance
 * @param {Object} collection - MongoDB collection
 * @param {string} searchTerm - Search term
 * @returns {Promise<Object>} Explain plan results
 */
export async function explainTextSearch(collection, searchTerm) {
  const explainResult = await collection
    .find({
      $text: { $search: searchTerm }
    })
    .explain('executionStats');

  return {
    executionTimeMs: explainResult.executionStats.executionTimeMillis,
    totalDocsExamined: explainResult.executionStats.totalDocsExamined,
    totalKeysExamined: explainResult.executionStats.totalKeysExamined,
    nReturned: explainResult.executionStats.nReturned,
    indexUsed: explainResult.executionStats.executionStages?.indexName,
    efficient: explainResult.executionStats.totalDocsExamined === explainResult.executionStats.nReturned
  };
}

export default {
  analyzeQueryPatterns,
  createOptimizedIndexes,
  configureIndexWeights,
  explainTextSearch
};
