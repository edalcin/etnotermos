// MongoDB Index Creation Script for EtnoTermos - T052
// Creates all necessary indexes for optimal performance

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/etnodb';

async function createIndexes() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('etnodb');

    // Terms collection indexes
    const terms = db.collection('etnotermos');
    console.log('Creating indexes for etnotermos collection...');

    // Unique index on prefLabel (Z39.19 authority control - one preferred term per concept)
    await terms.createIndex({ prefLabel: 1 }, { unique: true });
    console.log('  ✓ Created unique index on prefLabel');

    // Text search index (multilingual)
    await terms.createIndex(
      {
        prefLabel: 'text',
        altLabels: 'text',
        hiddenLabels: 'text',
        definition: 'text',
        scopeNote: 'text',
        example: 'text',
      },
      {
        name: 'etnotermos_text_search',
        weights: {
          prefLabel: 10,
          altLabels: 5,
          definition: 3,
          scopeNote: 2,
          example: 1,
          hiddenLabels: 1,
        },
        default_language: 'portuguese',
      }
    );
    console.log('  ✓ Created text search index');

    // Status index for filtering
    await terms.createIndex({ status: 1 });
    console.log('  ✓ Created index on status');

    // Collection filtering
    await terms.createIndex({ collectionIds: 1 });
    console.log('  ✓ Created index on collectionIds');

    // Temporal queries
    await terms.createIndex({ createdAt: -1 });
    await terms.createIndex({ updatedAt: -1 });
    console.log('  ✓ Created indexes on timestamps');

    // Relationships collection indexes
    const relationships = db.collection('etnotermos-relationships');
    console.log('Creating indexes for etnotermos-relationships collection...');

    // Compound index for relationship traversal
    await relationships.createIndex({ sourceTermId: 1, type: 1 });
    await relationships.createIndex({ targetTermId: 1, type: 1 });
    console.log('  ✓ Created compound indexes for relationship traversal');

    // Index for reciprocal relationship lookup
    await relationships.createIndex({ sourceTermId: 1, targetTermId: 1, type: 1 });
    console.log('  ✓ Created index for reciprocal lookup');

    // Notes collection indexes
    const notes = db.collection('etnotermos-notes');
    console.log('Creating indexes for etnotermos-notes collection...');

    // Index on termId for quick note retrieval
    await notes.createIndex({ termId: 1 });
    console.log('  ✓ Created index on termId');

    // Compound index for filtering by term and type
    await notes.createIndex({ termId: 1, type: 1 });
    console.log('  ✓ Created compound index on termId and type');

    // Sources collection indexes
    const sources = db.collection('etnotermos-sources');
    console.log('Creating indexes for etnotermos-sources collection...');

    // Index on type for filtering
    await sources.createIndex({ type: 1 });
    console.log('  ✓ Created index on type');

    // Collections collection indexes
    const collections = db.collection('etnotermos-collections');
    console.log('Creating indexes for etnotermos-collections collection...');

    // Unique index on name
    await collections.createIndex({ name: 1 }, { unique: true });
    console.log('  ✓ Created unique index on name');

    // Audit logs collection indexes
    const auditLogs = db.collection('etnotermos-audit-logs');
    console.log('Creating indexes for etnotermos-audit-logs collection...');

    // Compound index for querying by entity
    await auditLogs.createIndex({ entityType: 1, entityId: 1 });
    console.log('  ✓ Created compound index on entityType and entityId');

    // Index on timestamp for recent changes
    await auditLogs.createIndex({ timestamp: -1 });
    console.log('  ✓ Created index on timestamp');

    // Index on action type
    await auditLogs.createIndex({ action: 1 });
    console.log('  ✓ Created index on action');

    console.log('\n✅ All indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createIndexes();
