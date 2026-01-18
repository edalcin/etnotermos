// DashboardService - T057
// Aggregate statistics and recent changes for admin dashboard

import { getCollection } from '../shared/database.js';

/**
 * Get dashboard statistics
 */
export async function getDashboardStatistics() {
  const terms = getCollection('etnotermos');
  const relationships = getCollection('etnotermos-relationships');
  const collections = getCollection('etnotermos-collections');
  const sources = getCollection('etnotermos-sources');
  const notes = getCollection('etnotermos-notes');

  // Get term counts by status
  const termsByStatus = await terms
    .aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const totalTerms = termsByStatus.reduce((sum, item) => sum + item.count, 0);

  // Get relationship counts by type
  const relationshipsByType = await relationships
    .aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const totalRelationships = relationshipsByType.reduce((sum, item) => sum + item.count, 0);

  // Get collection count
  const totalCollections = await collections.countDocuments({});

  // Get source counts by type
  const sourcesByType = await sources
    .aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const totalSources = sourcesByType.reduce((sum, item) => sum + item.count, 0);

  // Get note counts by type
  const notesByType = await notes
    .aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const totalNotes = notesByType.reduce((sum, item) => sum + item.count, 0);

  // Calculate term limit monitoring (200k limit)
  const termLimitPercentage = (totalTerms / 200000) * 100;
  const termLimitWarning = termLimitPercentage > 90;

  // Calculate Z39.19 compliance statistics
  const hierarchicalTypes = ['BT', 'NT', 'BTG', 'NTG', 'BTP', 'NTP', 'BTI', 'NTI'];
  const equivalenceTypes = ['USE', 'UF'];

  const hierarchicalRelationships = relationshipsByType
    .filter(item => hierarchicalTypes.includes(item._id))
    .reduce((sum, item) => sum + item.count, 0);

  const associativeRelationships = relationshipsByType
    .filter(item => item._id === 'RT')
    .reduce((sum, item) => sum + item.count, 0);

  const equivalenceRelationships = relationshipsByType
    .filter(item => equivalenceTypes.includes(item._id))
    .reduce((sum, item) => sum + item.count, 0);

  // Count terms with definitions
  const termsWithDefinitions = await terms.countDocuments({
    definition: { $exists: true, $ne: '' }
  });

  return {
    totalTerms,
    activeTerms: termsByStatus.find(item => item._id === 'active')?.count || 0,
    termsByStatus: termsByStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    totalRelationships,
    relationshipsByType: relationshipsByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    totalCollections,
    totalSources,
    sourcesByType: sourcesByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    totalNotes,
    notesByType: notesByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    termLimit: {
      current: totalTerms,
      max: 200000,
      percentage: termLimitPercentage.toFixed(2),
      warning: termLimitWarning,
    },
    // Z39.19 compliance statistics
    hierarchicalRelationships,
    associativeRelationships,
    equivalenceRelationships,
    termsWithDefinitions,
  };
}

/**
 * Get recent changes from audit log
 */
export async function getRecentChanges(limit = 20) {
  const auditLogs = getCollection('etnotermos-audit-logs');
  const terms = getCollection('etnotermos');

  const recentLogs = await auditLogs
    .find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();

  // Enrich with entity names
  const enrichedLogs = await Promise.all(
    recentLogs.map(async (log) => {
      let entityName = null;

      if (log.entityType === 'Term') {
        const term = await terms.findOne({ _id: log.entityId });
        if (term) {
          entityName = term.prefLabel;
        } else if (log.changes && log.changes.after) {
          entityName = log.changes.after.prefLabel;
        } else if (log.changes && log.changes.before) {
          entityName = log.changes.before.prefLabel;
        }
      }

      return {
        ...log,
        entityName,
      };
    })
  );

  return enrichedLogs;
}

/**
 * Get activity timeline (changes grouped by day)
 */
export async function getActivityTimeline(days = 30) {
  const auditLogs = getCollection('etnotermos-audit-logs');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const timeline = await auditLogs
    .aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ])
    .toArray();

  return timeline.map((item) => ({
    date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
    count: item.count,
  }));
}

/**
 * Get popular collections (by term count)
 */
export async function getPopularCollections(limit = 10) {
  const terms = getCollection('etnotermos');
  const collections = getCollection('etnotermos-collections');

  const popular = await terms
    .aggregate([
      { $unwind: '$collectionIds' },
      {
        $group: {
          _id: '$collectionIds',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ])
    .toArray();

  // Enrich with collection data
  const enriched = await Promise.all(
    popular.map(async (item) => {
      const collection = await collections.findOne({ _id: item._id });
      return {
        _id: item._id,
        name: collection ? collection.name : 'Unknown',
        description: collection ? collection.description : null,
        modified: collection ? collection.modified : null,
        termCount: item.count,
      };
    })
  );

  return enriched;
}

export default {
  getDashboardStatistics,
  getRecentChanges,
  getActivityTimeline,
  getPopularCollections,
};
