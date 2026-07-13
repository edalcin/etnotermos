import { randomUUID } from 'crypto';
import { connect, disconnect, clearCollections, getDb } from '../helpers/db.js';
import * as ConceptService from '../../src/services/ConceptService.js';

function makeConcept(overrides = {}) {
  const id = randomUUID();
  return {
    id,
    uri: `etnotermos:test-${id}`,
    status: 'candidate',
    sourceFields: ['comunidades.tipo'],
    sourceCommunities: [],
    prefLabels: [
      {
        id: randomUUID(),
        literalForm: 'guarita',
        language: 'pt',
        type: 'pref',
        accessLevel: 'public',
        labelRelations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    altLabels: [],
    hiddenLabels: [],
    definition: '',
    scopeNote: '',
    historyNote: '',
    example: '',
    broader: [],
    narrower: [],
    related: [],
    synonym: [],
    synonymFor: [],
    ancestors: [],
    replacedBy: null,
    deprecatedDate: null,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeLabel(overrides = {}) {
  return {
    id: randomUUID(),
    literalForm: 'termo',
    language: 'pt',
    type: 'alt',
    accessLevel: 'public',
    labelRelations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ConceptService — unit tests', () => {
  let db;

  beforeAll(async () => {
    await connect();
    db = getDb();
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  // ---------------------------------------------------------------------------
  // Test helpers — direct SQLite access mirroring the etnotermos/audit_log schema
  // ---------------------------------------------------------------------------

  function insertConceptRow(concept) {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO etnotermos (id, doc, created_at, updated_at) VALUES (?, ?, ?, ?)`
    ).run(concept.id, JSON.stringify(concept), now, now);
    return concept;
  }

  function findConceptRow(id) {
    const row = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
    return row ? JSON.parse(row.doc) : null;
  }

  function findAuditEntries(responsible) {
    return db
      .prepare(`SELECT doc FROM etnotermos_audit_log WHERE json_extract(doc,'$.responsible') = ?`)
      .all(responsible)
      .map((r) => JSON.parse(r.doc));
  }

  // ---------------------------------------------------------------------------
  // Optimistic locking
  // ---------------------------------------------------------------------------

  describe('optimistic locking', () => {
    test('updateNotes rejects with 409 when version is stale', async () => {
      const concept = makeConcept({ version: 5 });
      insertConceptRow(concept);

      await expect(
        ConceptService.updateNotes(db, concept.id, 4, { definition: 'stale' }, 'user1')
      ).rejects.toMatchObject({ code: 409 });
    });

    test('updateNotes increments version on success', async () => {
      const concept = makeConcept({ version: 1 });
      insertConceptRow(concept);

      const result = await ConceptService.updateNotes(
        db, concept.id, 1, { definition: 'updated' }, 'user1'
      );
      expect(result.version).toBe(2);
    });

    test('activate rejects with 409 on version mismatch', async () => {
      const concept = makeConcept({ version: 3 });
      insertConceptRow(concept);

      await expect(
        ConceptService.activate(db, concept.id, 1, 'user1')
      ).rejects.toMatchObject({ code: 409 });
    });
  });

  // ---------------------------------------------------------------------------
  // addBroader — ancestor cascade and narrower reciprocal
  // ---------------------------------------------------------------------------

  describe('addBroader', () => {
    test('sets broader link and creates narrower reciprocal', async () => {
      const child = makeConcept();
      const parent = makeConcept();
      insertConceptRow(child);
      insertConceptRow(parent);

      await ConceptService.addBroader(db, child.id, child.version, parent.id, 'user1');

      const savedChild = findConceptRow(child.id);
      const savedParent = findConceptRow(parent.id);

      expect(savedChild.broader.map(String)).toContain(parent.id);
      expect(savedParent.narrower.map(String)).toContain(child.id);
    });

    test('populates ancestors in cascade', async () => {
      const grandparent = makeConcept();
      const parent = makeConcept({ ancestors: [grandparent.id] });
      const child = makeConcept();
      insertConceptRow(grandparent);
      insertConceptRow(parent);
      insertConceptRow(child);

      await ConceptService.addBroader(db, child.id, child.version, parent.id, 'user1');

      const savedChild = findConceptRow(child.id);
      const ancestorStrs = savedChild.ancestors.map(String);
      expect(ancestorStrs).toContain(parent.id);
      expect(ancestorStrs).toContain(grandparent.id);
    });

    test('rejects cycle with code 400', async () => {
      const a = makeConcept();
      const b = makeConcept({ ancestors: [a.id] });
      insertConceptRow(a);
      insertConceptRow(b);

      await expect(
        ConceptService.addBroader(db, a.id, a.version, b.id, 'user1')
      ).rejects.toMatchObject({ code: 400 });
    });

    test('rejects self-reference with code 400', async () => {
      const a = makeConcept();
      insertConceptRow(a);

      await expect(
        ConceptService.addBroader(db, a.id, a.version, a.id, 'user1')
      ).rejects.toMatchObject({ code: 400 });
    });
  });

  // ---------------------------------------------------------------------------
  // addRelated — bidirectional
  // ---------------------------------------------------------------------------

  describe('addRelated', () => {
    test('creates bidirectional related links', async () => {
      const a = makeConcept();
      const b = makeConcept();
      insertConceptRow(a);
      insertConceptRow(b);

      await ConceptService.addRelated(db, a.id, a.version, b.id, 'user1');

      const savedA = findConceptRow(a.id);
      const savedB = findConceptRow(b.id);

      expect(savedA.related.map(String)).toContain(b.id);
      expect(savedB.related.map(String)).toContain(a.id);
    });
  });

  // ---------------------------------------------------------------------------
  // addSynonym / removeSynonym / removeSynonymFor — directed accepted/synonym pair
  // ---------------------------------------------------------------------------

  describe('addSynonym', () => {
    test('sets synonym link and creates synonymFor reciprocal', async () => {
      const synonym = makeConcept();
      const accepted = makeConcept();
      insertConceptRow(synonym);
      insertConceptRow(accepted);

      await ConceptService.addSynonym(db, synonym.id, synonym.version, accepted.id, 'user1');

      const savedSynonym = findConceptRow(synonym.id);
      const savedAccepted = findConceptRow(accepted.id);

      expect(savedSynonym.synonym.map(String)).toContain(accepted.id);
      expect(savedAccepted.synonymFor.map(String)).toContain(synonym.id);
    });

    test('rejects self-reference with code 400', async () => {
      const a = makeConcept();
      insertConceptRow(a);

      await expect(
        ConceptService.addSynonym(db, a.id, a.version, a.id, 'user1')
      ).rejects.toMatchObject({ code: 400 });
    });

    test('rejects reciprocal pair with code 400', async () => {
      const b = makeConcept();
      const a = makeConcept({ synonymFor: [b.id] });
      insertConceptRow(a);
      insertConceptRow({ ...b, synonym: [a.id] });

      await expect(
        ConceptService.addSynonym(db, a.id, a.version, b.id, 'user1')
      ).rejects.toMatchObject({ code: 400 });
    });
  });

  describe('removeSynonym', () => {
    test('removes the pairing from both sides', async () => {
      const synonym = makeConcept();
      const accepted = makeConcept({ synonymFor: [synonym.id] });
      insertConceptRow(accepted);
      insertConceptRow({ ...synonym, synonym: [accepted.id] });

      await ConceptService.removeSynonym(db, synonym.id, synonym.version, accepted.id, 'user1');

      const savedSynonym = findConceptRow(synonym.id);
      const savedAccepted = findConceptRow(accepted.id);

      expect(savedSynonym.synonym.map(String)).not.toContain(accepted.id);
      expect(savedAccepted.synonymFor.map(String)).not.toContain(synonym.id);
    });
  });

  describe('removeSynonymFor', () => {
    test('removes the pairing from the accepted side', async () => {
      const synonym = makeConcept();
      const accepted = makeConcept({ synonymFor: [synonym.id] });
      insertConceptRow(accepted);
      insertConceptRow({ ...synonym, synonym: [accepted.id] });

      await ConceptService.removeSynonymFor(db, accepted.id, accepted.version, synonym.id, 'user1');

      const savedAccepted = findConceptRow(accepted.id);
      const savedSynonym = findConceptRow(synonym.id);

      expect(savedAccepted.synonymFor.map(String)).not.toContain(synonym.id);
      expect(savedSynonym.synonym.map(String)).not.toContain(accepted.id);
    });
  });

  describe('addRelated — blocked by existing synonym pairing', () => {
    test('rejects with code 400 when a synonym relation already links the pair', async () => {
      const accepted = makeConcept();
      const synonym = makeConcept({ synonym: [accepted.id] });
      insertConceptRow(accepted);
      insertConceptRow(synonym);

      await expect(
        ConceptService.addRelated(db, synonym.id, synonym.version, accepted.id, 'user1')
      ).rejects.toMatchObject({ code: 400 });
    });

    test('allows related between concepts with no synonym pairing', async () => {
      const a = makeConcept();
      const b = makeConcept();
      insertConceptRow(a);
      insertConceptRow(b);

      await expect(
        ConceptService.addRelated(db, a.id, a.version, b.id, 'user1')
      ).resolves.toMatchObject({ ok: true });
    });
  });

  // ---------------------------------------------------------------------------
  // promoteLabel — atomic pref swap within a language
  // ---------------------------------------------------------------------------

  describe('promoteLabel', () => {
    test('promotes an alt label to pref and demotes the previous pref to alt', async () => {
      const altId = randomUUID();
      const concept = makeConcept({
        prefLabels: [makeLabel({ literalForm: 'alimentação', language: 'pt', type: 'pref' })],
        altLabels: [makeLabel({ id: altId, literalForm: 'alimentar', language: 'pt', type: 'alt' })],
      });
      insertConceptRow(concept);

      await ConceptService.promoteLabel(db, concept.id, concept.version, altId, 'user1');

      const saved = findConceptRow(concept.id);
      expect(saved.prefLabels.map((l) => l.literalForm)).toEqual(['alimentar']);
      expect(saved.altLabels.map((l) => l.literalForm)).toEqual(['alimentação']);
      expect(saved.prefLabels[0].id).toBe(altId);
    });

    test('promotes a hidden label without touching a pref in a different language', async () => {
      const hiddenId = randomUUID();
      const concept = makeConcept({
        prefLabels: [makeLabel({ literalForm: 'guarita', language: 'pt', type: 'pref' })],
        hiddenLabels: [makeLabel({ id: hiddenId, literalForm: 'watch-post', language: 'en', type: 'hidden' })],
      });
      insertConceptRow(concept);

      await ConceptService.promoteLabel(db, concept.id, concept.version, hiddenId, 'user1');

      const saved = findConceptRow(concept.id);
      expect(saved.prefLabels.map((l) => l.literalForm).sort()).toEqual(['guarita', 'watch-post']);
      expect(saved.hiddenLabels).toHaveLength(0);
    });

    test('rejects promoting a label that is already pref', async () => {
      const concept = makeConcept();
      insertConceptRow(concept);
      const prefId = concept.prefLabels[0].id;

      await expect(
        ConceptService.promoteLabel(db, concept.id, concept.version, prefId, 'user1')
      ).rejects.toMatchObject({ code: 400 });
    });
  });

  // ---------------------------------------------------------------------------
  // updateLabel — type change relocates the label between arrays
  // ---------------------------------------------------------------------------

  describe('updateLabel — type change', () => {
    test('moves the label into the target array when type changes', async () => {
      const altId = randomUUID();
      const concept = makeConcept({
        altLabels: [makeLabel({ id: altId, literalForm: 'variante', type: 'alt' })],
      });
      insertConceptRow(concept);

      await ConceptService.updateLabel(db, concept.id, concept.version, altId, { type: 'hidden' }, 'user1');

      const saved = findConceptRow(concept.id);
      expect(saved.altLabels).toHaveLength(0);
      expect(saved.hiddenLabels.map((l) => l.id)).toContain(altId);
      expect(saved.hiddenLabels.find((l) => l.id === altId).type).toBe('hidden');
    });

    test('rejects changing the type of the sole prefLabel', async () => {
      const concept = makeConcept();
      insertConceptRow(concept);
      const prefId = concept.prefLabels[0].id;

      await expect(
        ConceptService.updateLabel(db, concept.id, concept.version, prefId, { type: 'alt' }, 'user1')
      ).rejects.toMatchObject({ code: 400 });
    });
  });

  // ---------------------------------------------------------------------------
  // Access level filtering
  // ---------------------------------------------------------------------------

  describe('findById — access level filtering', () => {
    test('public API omits sacred labels', async () => {
      const concept = makeConcept({
        status: 'active',
        altLabels: [
          {
            id: randomUUID(),
            literalForm: 'nome-sagrado',
            language: 'pt',
            type: 'alt',
            accessLevel: 'sacred',
            labelRelations: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });
      insertConceptRow(concept);

      const result = await ConceptService.findById(db, concept.id, { publicOnly: true });
      const sacredLabels = result.altLabels.filter((l) => l.accessLevel === 'sacred');
      expect(sacredLabels).toHaveLength(0);
    });

    test('public API omits restricted labels', async () => {
      const concept = makeConcept({
        status: 'active',
        altLabels: [
          {
            id: randomUUID(),
            literalForm: 'nome-restrito',
            language: 'pt',
            type: 'alt',
            accessLevel: 'restricted',
            labelRelations: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });
      insertConceptRow(concept);

      const result = await ConceptService.findById(db, concept.id, { publicOnly: true });
      const restrictedLabels = result.altLabels.filter((l) => l.accessLevel === 'restricted');
      expect(restrictedLabels).toHaveLength(0);
    });

    test('admin API includes all labels', async () => {
      const concept = makeConcept({
        status: 'active',
        altLabels: [
          {
            id: randomUUID(),
            literalForm: 'nome-sagrado',
            language: 'pt',
            type: 'alt',
            accessLevel: 'sacred',
            labelRelations: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });
      insertConceptRow(concept);

      const result = await ConceptService.findById(db, concept.id, { publicOnly: false });
      expect(result.altLabels).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // AuditEntry creation
  // ---------------------------------------------------------------------------

  describe('audit trail', () => {
    test('activate creates an audit entry', async () => {
      const concept = makeConcept();
      insertConceptRow(concept);

      await ConceptService.activate(db, concept.id, concept.version, 'auditor1');

      const [entry] = findAuditEntries('auditor1');
      expect(entry).toBeDefined();
      expect(entry.newValue).toBe('active');
    });

    test('updateNotes creates audit entries per changed field', async () => {
      const concept = makeConcept();
      insertConceptRow(concept);

      await ConceptService.updateNotes(
        db, concept.id, concept.version,
        { definition: 'nova definição', scopeNote: 'nova nota' },
        'editor1'
      );

      const entries = findAuditEntries('editor1');
      const fields = entries.map((e) => e.field);
      expect(fields).toContain('definition');
      expect(fields).toContain('scopeNote');
    });
  });

  // ---------------------------------------------------------------------------
  // findMany — candidate concepts excluded from publicOnly
  // ---------------------------------------------------------------------------

  describe('findMany', () => {
    test('publicOnly excludes candidate concepts', async () => {
      insertConceptRow(makeConcept({ status: 'active' }));
      insertConceptRow(makeConcept({ status: 'candidate' }));

      const result = await ConceptService.findMany(db, { status: 'active', publicOnly: true });
      const statuses = result.data.map((c) => c.status);
      expect(statuses.every((s) => s === 'active')).toBe(true);
    });

    test('returns pagination metadata', async () => {
      insertConceptRow(makeConcept({ status: 'active' }));

      const result = await ConceptService.findMany(db, { status: 'active', page: 1, limit: 10 });
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('page', 1);
      expect(result.pagination).toHaveProperty('total');
    });
  });
});
