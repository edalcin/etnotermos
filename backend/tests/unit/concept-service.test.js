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
    ancestors: [],
    replacedBy: null,
    deprecatedDate: null,
    version: 1,
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
