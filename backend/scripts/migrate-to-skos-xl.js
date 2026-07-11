/**
 * Migration: old schema → SKOS-XL
 *
 * Old schema: { prefLabel: string, altLabels: string[], ... }
 * New schema: { prefLabels: [{literalForm, language, type, ...}], altLabels: [{...}], ... }
 *
 * ADR-005 (Arquitetura-BioCultural): operates on the `etnotermos` table of the
 * shared unit SQLite file (SQLITE_DB_PATH), not a MongoDB collection.
 *
 * Run: node backend/scripts/migrate-to-skos-xl.js
 */

import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import database from '../src/shared/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

function makeLabel(literalForm, type = 'pref', createdAt = new Date().toISOString()) {
  return {
    id: randomUUID(),
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
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function main() {
  const db = database.connect();

  // Documents needing migration have the OLD `prefLabel` string field.
  const legacyRows = db
    .prepare(`SELECT id, doc FROM etnotermos WHERE json_extract(doc,'$.prefLabel') IS NOT NULL`)
    .all();

  console.log(`Documents to migrate: ${legacyRows.length}`);

  if (legacyRows.length === 0) {
    console.log('Nothing to migrate.');
    dropAndCreateIndexes(db);
    database.disconnect();
    return;
  }

  let migrated = 0;
  let skipped = 0;

  const migrate = db.transaction((rows) => {
    for (const row of rows) {
      const doc = JSON.parse(row.doc);
      const prefLabelStr = doc.prefLabel;

      if (!prefLabelStr || !String(prefLabelStr).trim()) {
        skipped++;
        continue;
      }

      const createdAt = doc.createdAt ?? new Date().toISOString();
      const prefLabels = [makeLabel(prefLabelStr, 'pref', createdAt)];

      const altLabels = (Array.isArray(doc.altLabels) ? doc.altLabels : [])
        .filter((l) => l && typeof l === 'string' && l.trim())
        .map((l) => makeLabel(l, 'alt', createdAt));

      const hiddenLabels = (Array.isArray(doc.hiddenLabels) ? doc.hiddenLabels : [])
        .filter((l) => l && typeof l === 'string' && l.trim())
        .map((l) => makeLabel(l, 'hidden', createdAt));

      const uri = doc.uri || `etnotermos:${generateSlug(prefLabelStr)}`;

      const strOrNull = (v) => (v && String(v).trim() ? String(v).trim() : null);

      const migratedDoc = {
        id: doc.id,
        uri,
        status: doc.status ?? 'candidate',
        prefLabels,
        altLabels,
        hiddenLabels,
        sourceFields: doc.sourceFields ?? [],
        sourceCommunities: doc.sourceCommunities ?? [],
        definition: strOrNull(doc.definition),
        scopeNote: strOrNull(doc.scopeNote),
        historyNote: strOrNull(doc.historyNote),
        example: strOrNull(doc.example),
        broader: doc.broader ?? [],
        narrower: doc.narrower ?? [],
        related: doc.related ?? [],
        ancestors: doc.ancestors ?? [],
        replacedBy: doc.replacedBy ?? null,
        deprecatedDate: doc.deprecatedDate ?? null,
        version: doc.version ?? 1,
        createdAt,
        updatedAt: new Date().toISOString(),
        // Legacy fields (prefLabel, qualifier, termType, useFor, useTerm,
        // deprecationNote, facets, sourceIds, language, _textSearchLanguage)
        // are intentionally dropped by omission — `doc` is fully replaced.
      };

      db.prepare(`UPDATE etnotermos SET doc = ?, updated_at = ? WHERE id = ?`).run(
        JSON.stringify(migratedDoc),
        migratedDoc.updatedAt,
        row.id
      );

      migrated++;
      if (migrated % 50 === 0) {
        console.log(`  Migrated ${migrated}/${legacyRows.length}...`);
      }
    }
  });

  migrate(legacyRows);

  console.log(`Migration complete: ${migrated} migrated, ${skipped} skipped.`);

  dropAndCreateIndexes(db);
  database.disconnect();
}

/**
 * Rebuild generated-column indexes and the FTS5 virtual table from scratch
 * (SQLite/JSON1 equivalent of the old Mongo index rebuild).
 */
function dropAndCreateIndexes(db) {
  console.log('\nRebuilding indexes...');

  db.exec(`DROP INDEX IF EXISTS idx_etnotermos_status;`);
  db.exec(`DROP TABLE IF EXISTS etnotermos_fts;`);
  console.log('  Dropped: idx_etnotermos_status, etnotermos_fts');

  db.exec(`CREATE INDEX IF NOT EXISTS idx_etnotermos_status ON etnotermos(status);`);
  console.log('  Created: idx_etnotermos_status');

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS etnotermos_fts USING fts5(
      id UNINDEXED,
      prefLabels,
      altLabels,
      definition,
      scopeNote,
      tokenize='unicode61 remove_diacritics 2'
    );
  `);
  console.log('  Created: etnotermos_fts (FTS5, weights 10/5/3/2 applied at query time via bm25())');

  const rows = db.prepare(`SELECT doc FROM etnotermos`).all();
  const labelText = (labels) => (labels ?? []).map((l) => l.literalForm).join(' ');
  const insertFts = db.prepare(
    `INSERT INTO etnotermos_fts (id, prefLabels, altLabels, definition, scopeNote) VALUES (?, ?, ?, ?, ?)`
  );
  const reindex = db.transaction((docs) => {
    for (const r of docs) {
      const c = JSON.parse(r.doc);
      insertFts.run(c.id, labelText(c.prefLabels), labelText(c.altLabels), c.definition ?? '', c.scopeNote ?? '');
    }
  });
  reindex(rows);
  console.log(`  Reindexed ${rows.length} concepts into FTS5.`);

  console.log('Indexes rebuilt.');
}

try {
  main();
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}
