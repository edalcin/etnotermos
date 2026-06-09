/**
 * Migration: old schema → SKOS-XL
 *
 * Old schema: { prefLabel: string, altLabels: string[], ... }
 * New schema: { prefLabels: [{literalForm, language, type, ...}], altLabels: [{...}], ... }
 *
 * Run: node backend/scripts/migrate-to-skos-xl.js
 */

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const DB_NAME   = process.env.MONGO_DB_NAME || 'etnodb';

if (!MONGO_URI) {
  console.error('ERROR: MONGODB_URI or MONGO_URI not set');
  process.exit(1);
}

function makeLabel(literalForm, type = 'pref', createdAt = new Date()) {
  return {
    _id: new ObjectId(),
    literalForm: String(literalForm).trim(),
    language: 'pt',
    type,
    sourcePeople: null,
    sourceRegion: null,
    accessLevel: 'public',
    source: null,
    validatingOrg: null,
    validationDate: null,
    audioPath: null,
    holderPeople: null,
    collectorResearcher: null,
    priorInformedConsent: null,
    bibliographicSource: null,
    labelRelations: [],
    createdAt,
    updatedAt: createdAt,
  };
}

function generateSlug(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db  = client.db(DB_NAME);
  const col = db.collection('etnotermos');

  // Count documents needing migration (have old prefLabel string field)
  const total = await col.countDocuments({ prefLabel: { $exists: true } });
  console.log(`Documents to migrate: ${total}`);

  if (total === 0) {
    console.log('Nothing to migrate.');
    await dropAndCreateIndexes(col);
    await client.close();
    return;
  }

  const cursor = col.find({ prefLabel: { $exists: true } });
  let migrated = 0;
  let skipped  = 0;

  for await (const doc of cursor) {
    const prefLabelStr = doc.prefLabel;

    if (!prefLabelStr || !String(prefLabelStr).trim()) {
      // No usable prefLabel — skip (should not happen but be safe)
      skipped++;
      continue;
    }

    const createdAt = doc.createdAt ?? new Date();
    const prefLabels = [makeLabel(prefLabelStr, 'pref', createdAt)];

    const altLabels = (Array.isArray(doc.altLabels) ? doc.altLabels : [])
      .filter((l) => l && typeof l === 'string' && l.trim())
      .map((l) => makeLabel(l, 'alt', createdAt));

    const hiddenLabels = (Array.isArray(doc.hiddenLabels) ? doc.hiddenLabels : [])
      .filter((l) => l && typeof l === 'string' && l.trim())
      .map((l) => makeLabel(l, 'hidden', createdAt));

    const uri = doc.uri || `etnotermos:${generateSlug(prefLabelStr)}`;

    // Map old note fields — convert empty strings to null
    const strOrNull = (v) => (v && String(v).trim() ? String(v).trim() : null);

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          uri,
          prefLabels,
          altLabels,
          hiddenLabels,
          sourceFields:      doc.sourceFields      ?? [],
          sourceCommunities: doc.sourceCommunities  ?? [],
          definition:  strOrNull(doc.definition),
          scopeNote:   strOrNull(doc.scopeNote),
          historyNote: strOrNull(doc.historyNote),
          example:     strOrNull(doc.example),
          broader:   doc.broader   ?? [],
          narrower:  doc.narrower  ?? [],
          related:   doc.related   ?? [],
          ancestors: doc.ancestors ?? [],
          replacedBy:    doc.replacedBy    ?? null,
          deprecatedDate: doc.deprecatedDate ?? null,
        },
        $unset: {
          prefLabel:           '',
          qualifier:           '',
          termType:            '',
          useFor:              '',
          useTerm:             '',
          deprecationNote:     '',
          facets:              '',
          sourceIds:           '',
          language:            '',
          _textSearchLanguage: '',
          // collectionIds kept as-is (could map to SKOS ConceptScheme later)
        },
      },
    );

    migrated++;
    if (migrated % 50 === 0) {
      console.log(`  Migrated ${migrated}/${total}...`);
    }
  }

  console.log(`Migration complete: ${migrated} migrated, ${skipped} skipped.`);

  await dropAndCreateIndexes(col);
  await client.close();
}

async function dropAndCreateIndexes(col) {
  console.log('\nRebuilding indexes...');

  // Drop all non-_id indexes to start clean
  const indexes = await col.indexes();
  for (const idx of indexes) {
    if (idx.name === '_id_') continue;
    try {
      await col.dropIndex(idx.name);
      console.log(`  Dropped: ${idx.name}`);
    } catch (e) {
      console.warn(`  Could not drop ${idx.name}: ${e.message}`);
    }
  }

  // Status index (common filter)
  await col.createIndex({ status: 1 }, { name: 'status_1' });
  console.log('  Created: status_1');

  // sourceFields index
  await col.createIndex({ sourceFields: 1 }, { name: 'sourceFields_1' });
  console.log('  Created: sourceFields_1');

  // Text search on labels and notes
  await col.createIndex(
    {
      'prefLabels.literalForm': 'text',
      'altLabels.literalForm':  'text',
      definition: 'text',
      scopeNote:  'text',
    },
    {
      name: 'etnotermos_text_search',
      default_language: 'portuguese',
      weights: {
        'prefLabels.literalForm': 10,
        'altLabels.literalForm':   5,
        definition: 3,
        scopeNote:  2,
      },
    },
  );
  console.log('  Created: etnotermos_text_search');

  console.log('Indexes rebuilt.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
