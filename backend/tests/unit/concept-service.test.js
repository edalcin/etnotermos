import { ObjectId } from 'mongodb';
import { connect, disconnect, clearCollections, getDb } from '../helpers/db.js';
import * as ConceptService from '../../src/services/ConceptService.js';

function makeConcept(overrides = {}) {
  return {
    _id: new ObjectId(),
    uri: `etnotermos:test-${new ObjectId()}`,
    status: 'candidate',
    sourceFields: ['comunidades.tipo'],
    sourceCommunities: [],
    prefLabels: [
      {
        _id: new ObjectId(),
        literalForm: 'guarita',
        language: 'pt',
        type: 'pref',
        accessLevel: 'public',
        labelRelations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
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
    createdAt: new Date(),
    updatedAt: new Date(),
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
  // Optimistic locking
  // ---------------------------------------------------------------------------

  describe('optimistic locking', () => {
    test('updateNotes rejects with 409 when version is stale', async () => {
      const concept = makeConcept({ version: 5 });
      await db.collection('etnotermos').insertOne(concept);

      await expect(
        ConceptService.updateNotes(db, concept._id, 4, { definition: 'stale' }, 'user1')
      ).rejects.toMatchObject({ code: 409 });
    });

    test('updateNotes increments version on success', async () => {
      const concept = makeConcept({ version: 1 });
      await db.collection('etnotermos').insertOne(concept);

      const result = await ConceptService.updateNotes(
        db, concept._id, 1, { definition: 'updated' }, 'user1'
      );
      expect(result.version).toBe(2);
    });

    test('activate rejects with 409 on version mismatch', async () => {
      const concept = makeConcept({ version: 3 });
      await db.collection('etnotermos').insertOne(concept);

      await expect(
        ConceptService.activate(db, concept._id, 1, 'user1')
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
      await db.collection('etnotermos').insertMany([child, parent]);

      await ConceptService.addBroader(db, child._id, child.version, parent._id, 'user1');

      const savedChild = await db.collection('etnotermos').findOne({ _id: child._id });
      const savedParent = await db.collection('etnotermos').findOne({ _id: parent._id });

      expect(savedChild.broader.map(String)).toContain(parent._id.toString());
      expect(savedParent.narrower.map(String)).toContain(child._id.toString());
    });

    test('populates ancestors in cascade', async () => {
      const grandparent = makeConcept();
      const parent = makeConcept({ ancestors: [grandparent._id] });
      const child = makeConcept();
      await db.collection('etnotermos').insertMany([grandparent, parent, child]);

      await ConceptService.addBroader(db, child._id, child.version, parent._id, 'user1');

      const savedChild = await db.collection('etnotermos').findOne({ _id: child._id });
      const ancestorStrs = savedChild.ancestors.map(String);
      expect(ancestorStrs).toContain(parent._id.toString());
      expect(ancestorStrs).toContain(grandparent._id.toString());
    });

    test('rejects cycle with code 400', async () => {
      const a = makeConcept();
      const b = makeConcept({ ancestors: [a._id] });
      await db.collection('etnotermos').insertMany([a, b]);

      await expect(
        ConceptService.addBroader(db, a._id, a.version, b._id, 'user1')
      ).rejects.toMatchObject({ code: 400 });
    });

    test('rejects self-reference with code 400', async () => {
      const a = makeConcept();
      await db.collection('etnotermos').insertOne(a);

      await expect(
        ConceptService.addBroader(db, a._id, a.version, a._id, 'user1')
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
      await db.collection('etnotermos').insertMany([a, b]);

      await ConceptService.addRelated(db, a._id, a.version, b._id, 'user1');

      const savedA = await db.collection('etnotermos').findOne({ _id: a._id });
      const savedB = await db.collection('etnotermos').findOne({ _id: b._id });

      expect(savedA.related.map(String)).toContain(b._id.toString());
      expect(savedB.related.map(String)).toContain(a._id.toString());
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
            _id: new ObjectId(),
            literalForm: 'nome-sagrado',
            language: 'pt',
            type: 'alt',
            accessLevel: 'sacred',
            labelRelations: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });
      await db.collection('etnotermos').insertOne(concept);

      const result = await ConceptService.findById(db, concept._id, { publicOnly: true });
      const sacredLabels = result.altLabels.filter((l) => l.accessLevel === 'sacred');
      expect(sacredLabels).toHaveLength(0);
    });

    test('public API omits restricted labels', async () => {
      const concept = makeConcept({
        status: 'active',
        altLabels: [
          {
            _id: new ObjectId(),
            literalForm: 'nome-restrito',
            language: 'pt',
            type: 'alt',
            accessLevel: 'restricted',
            labelRelations: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });
      await db.collection('etnotermos').insertOne(concept);

      const result = await ConceptService.findById(db, concept._id, { publicOnly: true });
      const restrictedLabels = result.altLabels.filter((l) => l.accessLevel === 'restricted');
      expect(restrictedLabels).toHaveLength(0);
    });

    test('admin API includes all labels', async () => {
      const concept = makeConcept({
        status: 'active',
        altLabels: [
          {
            _id: new ObjectId(),
            literalForm: 'nome-sagrado',
            language: 'pt',
            type: 'alt',
            accessLevel: 'sacred',
            labelRelations: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });
      await db.collection('etnotermos').insertOne(concept);

      const result = await ConceptService.findById(db, concept._id, { publicOnly: false });
      expect(result.altLabels).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // AuditEntry creation
  // ---------------------------------------------------------------------------

  describe('audit trail', () => {
    test('activate creates an audit entry', async () => {
      const concept = makeConcept();
      await db.collection('etnotermos').insertOne(concept);

      await ConceptService.activate(db, concept._id, concept.version, 'auditor1');

      const entry = await db.collection('etnotermos_audit_log').findOne({ responsible: 'auditor1' });
      expect(entry).not.toBeNull();
      expect(entry.newValue).toBe('active');
    });

    test('updateNotes creates audit entries per changed field', async () => {
      const concept = makeConcept();
      await db.collection('etnotermos').insertOne(concept);

      await ConceptService.updateNotes(
        db, concept._id, concept.version,
        { definition: 'nova definição', scopeNote: 'nova nota' },
        'editor1'
      );

      const entries = await db.collection('etnotermos_audit_log').find({ responsible: 'editor1' }).toArray();
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
      await db.collection('etnotermos').insertMany([
        makeConcept({ status: 'active' }),
        makeConcept({ status: 'candidate' }),
      ]);

      const result = await ConceptService.findMany(db, { status: 'active', publicOnly: true });
      const statuses = result.data.map((c) => c.status);
      expect(statuses.every((s) => s === 'active')).toBe(true);
    });

    test('returns pagination metadata', async () => {
      await db.collection('etnotermos').insertOne(makeConcept({ status: 'active' }));

      const result = await ConceptService.findMany(db, { status: 'active', page: 1, limit: 10 });
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('page', 1);
      expect(result.pagination).toHaveProperty('total');
    });
  });
});
