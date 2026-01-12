// Migration script to move 'collections' field to 'collectionIds'
// This fixes the issue where terms had associations stored in the wrong field

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/etnodb';

async function migrateCollectionsField() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('etnodb');
    const terms = db.collection('etnotermos');

    // Find all terms that have a 'collections' field
    const termsWithCollections = await terms
      .find({ collections: { $exists: true, $ne: [] } })
      .toArray();

    console.log(`Found ${termsWithCollections.length} terms with 'collections' field`);

    if (termsWithCollections.length === 0) {
      console.log('No migration needed');
      await client.close();
      return;
    }

    // Migrate each term
    for (const term of termsWithCollections) {
      console.log(`\nMigrating term: ${term.prefLabel}`);
      console.log(`  Current collections: ${JSON.stringify(term.collections)}`);

      // Convert to ObjectIds if they're strings
      const collectionIds = (term.collections || []).map(id => {
        if (typeof id === 'string') {
          return new ObjectId(id);
        }
        return id;
      });

      console.log(`  Converted collectionIds: ${JSON.stringify(collectionIds)}`);

      // Update the term
      await terms.updateOne(
        { _id: term._id },
        {
          $set: { collectionIds },
          $unset: { collections: '' } // Remove the old field
        }
      );

      console.log(`  ✓ Migrated successfully`);
    }

    console.log('\n✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrateCollectionsField();
