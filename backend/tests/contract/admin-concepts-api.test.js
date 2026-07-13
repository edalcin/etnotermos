// Contract tests for the Admin Concepts/Labels API (port 4001)
// These tests are intentionally written before the server implementation (TDD).
// They will FAIL until the admin server at src/contexts/admin/server.js is built.
import request from 'supertest';
import { randomUUID } from 'crypto';
import { connect, disconnect, clearCollections, getDb } from '../helpers/db.js';
import { createTestApp, basicAuthHeader } from '../helpers/app-admin.js';
import { syncConceptFts } from '../../src/models/Concept.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** Build a concept document matching the canonical fixture shape. */
function buildConcept(overrides = {}) {
  const id = overrides.id ?? randomUUID();
  return {
    id,
    uri: 'etnotermos:test',
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
    id,
  };
}

// ---------------------------------------------------------------------------
// Suite setup
// ---------------------------------------------------------------------------

describe('Admin Concepts/Labels API', () => {
  let app = null;
  let db = null;
  let appUnavailable = false;

  const validAuth = basicAuthHeader('testcurator', 'testpass');
  const badAuth = basicAuthHeader('testcurator', 'wrongpass');

  function insertConceptRow(concept) {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO etnotermos (id, doc, created_at, updated_at) VALUES (?, ?, ?, ?)`
    ).run(concept.id, JSON.stringify(concept), now, now);
    syncConceptFts(db, concept);
    return concept;
  }

  function insertConceptRows(list) {
    list.forEach(insertConceptRow);
  }

  function findConceptRow(id) {
    const row = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
    return row ? JSON.parse(row.doc) : null;
  }

  beforeAll(async () => {
    // bcrypt is a runtime dependency — dynamic import avoids Jest ESM
    // resolution issues that arise with top-level static imports of native addons.
    // Cost factor 1 is intentionally minimal; speed is the only goal in tests.
    const { default: bcrypt } = await import('bcrypt');
    const syncHash = bcrypt.hashSync('testpass', 1);

    // Environment variables must be set BEFORE the config module is imported
    // by the app, so set them here, prior to createTestApp().
    process.env.ADMIN_USERS = JSON.stringify([
      { username: 'testcurator', passwordHash: syncHash },
    ]);

    const { db: testDb } = await connect();
    db = testDb;

    try {
      app = await createTestApp(db);
    } catch {
      appUnavailable = true;
    }
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  // Helper: skip individual tests when the app is not yet implemented.
  function requireApp() {
    if (appUnavailable || !app) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(app).not.toBeNull(); // fails with a clear message
    }
  }

  // ---------------------------------------------------------------------------
  // GET / — Dashboard
  // ---------------------------------------------------------------------------

  describe('GET /', () => {
    it('returns 200 HTML for authenticated requests', async () => {
      requireApp();
      const res = await request(app).get('/').set('Authorization', validAuth);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });

    it('returns 401 when no Authorization header is provided', async () => {
      requireApp();
      const res = await request(app).get('/');
      expect(res.status).toBe(401);
    });

    it('returns 401 when credentials are wrong', async () => {
      requireApp();
      const res = await request(app).get('/').set('Authorization', badAuth);
      expect(res.status).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /concepts — Concept list with filters
  // ---------------------------------------------------------------------------

  describe('GET /concepts', () => {
    it('returns 200 HTML with concept list', async () => {
      requireApp();
      insertConceptRow(buildConcept());
      const res = await request(app)
        .get('/concepts')
        .set('Authorization', validAuth);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });

    it('filters by status=candidate', async () => {
      requireApp();
      insertConceptRows([
        buildConcept({ status: 'candidate' }),
        buildConcept({ status: 'active' }),
      ]);
      const res = await request(app)
        .get('/concepts?status=candidate')
        .set('Authorization', validAuth);
      expect(res.status).toBe(200);
    });

    it('filters by sourceField', async () => {
      requireApp();
      insertConceptRow(buildConcept({ sourceFields: ['comunidades.tipo'] }));
      const res = await request(app)
        .get('/concepts?sourceField=comunidades.tipo')
        .set('Authorization', validAuth);
      expect(res.status).toBe(200);
    });

    it('filters by text query ?q=...', async () => {
      requireApp();
      insertConceptRow(buildConcept());
      const res = await request(app)
        .get('/concepts?q=guarita')
        .set('Authorization', validAuth);
      expect(res.status).toBe(200);
    });

    it('filters orphaned concepts with ?orphaned=true', async () => {
      requireApp();
      insertConceptRow(buildConcept({ broader: [], narrower: [], related: [] }));
      const res = await request(app)
        .get('/concepts?orphaned=true')
        .set('Authorization', validAuth);
      expect(res.status).toBe(200);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /concepts/:id — Concept detail
  // ---------------------------------------------------------------------------

  describe('GET /concepts/:id', () => {
    it('returns 200 HTML with a hidden version field in the form', async () => {
      requireApp();
      const concept = buildConcept({ version: 3 });
      insertConceptRow(concept);
      const res = await request(app)
        .get(`/concepts/${concept.id}`)
        .set('Authorization', validAuth);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      // The version must be embedded in the HTML form as a hidden input
      expect(res.text).toMatch(/type="hidden"[^>]*name="version"[^>]*value="3"|value="3"[^>]*name="version"[^>]*type="hidden"/);
    });

    it('returns 404 for an unknown id', async () => {
      requireApp();
      const res = await request(app)
        .get(`/concepts/${randomUUID()}`)
        .set('Authorization', validAuth);
      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // PUT /concepts/:id — Update concept (optimistic locking)
  // ---------------------------------------------------------------------------

  describe('PUT /concepts/:id', () => {
    it('returns 200 and increments version on successful update', async () => {
      requireApp();
      const concept = buildConcept({ version: 1, definition: 'original' });
      insertConceptRow(concept);

      const res = await request(app)
        .put(`/concepts/${concept.id}`)
        .set('Authorization', validAuth)
        .send({ version: 1, definition: 'updated' });

      expect(res.status).toBe(200);
      // Version in the persisted document must now be 2
      const stored = findConceptRow(concept.id);
      expect(stored.version).toBe(2);
    });

    it('returns 409 when the supplied version does not match the stored version', async () => {
      requireApp();
      const concept = buildConcept({ version: 2 });
      insertConceptRow(concept);

      const res = await request(app)
        .put(`/concepts/${concept.id}`)
        .set('Authorization', validAuth)
        .send({ version: 1, definition: 'stale update' });

      expect(res.status).toBe(409);
    });

    it('returns 404 when the concept does not exist', async () => {
      requireApp();
      const res = await request(app)
        .put(`/concepts/${randomUUID()}`)
        .set('Authorization', validAuth)
        .send({ version: 1, definition: 'ghost update' });

      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /concepts/:id/activate — Lifecycle transition
  // ---------------------------------------------------------------------------

  describe('POST /concepts/:id/activate', () => {
    it('returns 200 {ok:true, status:"active"} for a candidate concept', async () => {
      requireApp();
      const concept = buildConcept({ status: 'candidate' });
      insertConceptRow(concept);

      const res = await request(app)
        .post(`/concepts/${concept.id}/activate`)
        .set('Authorization', validAuth)
        .send({ version: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ ok: true, status: 'active' });
    });

    it('returns 400 when the concept is already active', async () => {
      requireApp();
      const concept = buildConcept({ status: 'active' });
      insertConceptRow(concept);

      const res = await request(app)
        .post(`/concepts/${concept.id}/activate`)
        .set('Authorization', validAuth)
        .send({ version: 1 });

      expect(res.status).toBe(400);
    });

    it('returns 409 on version conflict', async () => {
      requireApp();
      const concept = buildConcept({ status: 'candidate', version: 5 });
      insertConceptRow(concept);

      const res = await request(app)
        .post(`/concepts/${concept.id}/activate`)
        .set('Authorization', validAuth)
        .send({ version: 1 }); // stale

      expect(res.status).toBe(409);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /concepts/:id/deprecate — Lifecycle transition with orphan guard
  // ---------------------------------------------------------------------------

  describe('POST /concepts/:id/deprecate', () => {
    it('returns 400 when replacedById is missing', async () => {
      requireApp();
      const concept = buildConcept({ status: 'active' });
      insertConceptRow(concept);

      const res = await request(app)
        .post(`/concepts/${concept.id}/deprecate`)
        .set('Authorization', validAuth)
        .send({ version: 1 });

      expect(res.status).toBe(400);
    });

    it('returns 200 with orphan list HTML when active children exist and confirmedOrphans is absent', async () => {
      requireApp();
      const parent = buildConcept({ status: 'active' });
      const child = buildConcept({ status: 'active', broader: [parent.id] });
      const replacement = buildConcept({ status: 'active' });
      insertConceptRows([parent, child, replacement]);

      const res = await request(app)
        .post(`/concepts/${parent.id}/deprecate`)
        .set('Authorization', validAuth)
        .send({ version: 1, replacedById: replacement.id.toString() });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
    });

    it('proceeds and returns 200 when confirmedOrphans:true is provided', async () => {
      requireApp();
      const parent = buildConcept({ status: 'active' });
      const child = buildConcept({ status: 'active', broader: [parent.id] });
      const replacement = buildConcept({ status: 'active' });
      insertConceptRows([parent, child, replacement]);

      const res = await request(app)
        .post(`/concepts/${parent.id}/deprecate`)
        .set('Authorization', validAuth)
        .send({
          version: 1,
          replacedById: replacement.id.toString(),
          confirmedOrphans: true,
        });

      expect(res.status).toBe(200);
      const stored = findConceptRow(parent.id);
      expect(stored.status).toBe('deprecated');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /concepts/:id/labels — Add a label
  // ---------------------------------------------------------------------------

  describe('POST /concepts/:id/labels', () => {
    it('returns 201 {ok:true, labelId:"..."} when a new label is created', async () => {
      requireApp();
      const concept = buildConcept();
      insertConceptRow(concept);

      const res = await request(app)
        .post(`/concepts/${concept.id}/labels`)
        .set('Authorization', validAuth)
        .send({ literalForm: 'nova etiqueta', language: 'pt', type: 'alt' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ ok: true });
      expect(typeof res.body.labelId).toBe('string');
    });

    it('returns 422 on duplicate (literalForm + language + type) within the same concept', async () => {
      requireApp();
      const concept = buildConcept();
      insertConceptRow(concept);

      // Insert the same label twice
      await request(app)
        .post(`/concepts/${concept.id}/labels`)
        .set('Authorization', validAuth)
        .send({ literalForm: 'guarita', language: 'pt', type: 'alt' });

      const res = await request(app)
        .post(`/concepts/${concept.id}/labels`)
        .set('Authorization', validAuth)
        .send({ literalForm: 'guarita', language: 'pt', type: 'alt' });

      expect(res.status).toBe(422);
    });
  });

  // ---------------------------------------------------------------------------
  // PUT /concepts/:id/labels/:labelId — Update a label
  // ---------------------------------------------------------------------------

  describe('PUT /concepts/:id/labels/:labelId', () => {
    it('returns 200 when the label is updated successfully', async () => {
      requireApp();
      const concept = buildConcept({ version: 1 });
      insertConceptRow(concept);
      const labelId = concept.prefLabels[0].id;

      const res = await request(app)
        .put(`/concepts/${concept.id}/labels/${labelId}`)
        .set('Authorization', validAuth)
        .send({ literalForm: 'guarita atualizada', language: 'pt', version: 1 });

      expect(res.status).toBe(200);
    });

    it('returns 404 when the label does not exist on the concept', async () => {
      requireApp();
      const concept = buildConcept();
      insertConceptRow(concept);

      const res = await request(app)
        .put(`/concepts/${concept.id}/labels/${randomUUID()}`)
        .set('Authorization', validAuth)
        .send({ literalForm: 'ghost', language: 'pt', version: 1 });

      expect(res.status).toBe(404);
    });

    it('returns 409 on version conflict', async () => {
      requireApp();
      const concept = buildConcept({ version: 3 });
      insertConceptRow(concept);
      const labelId = concept.prefLabels[0].id;

      const res = await request(app)
        .put(`/concepts/${concept.id}/labels/${labelId}`)
        .set('Authorization', validAuth)
        .send({ literalForm: 'stale', language: 'pt', version: 1 });

      expect(res.status).toBe(409);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /concepts/:id/labels/:labelId — Remove a label
  // ---------------------------------------------------------------------------

  describe('DELETE /concepts/:id/labels/:labelId', () => {
    it('returns 200 when an altLabel is deleted', async () => {
      requireApp();
      const altLabelId = randomUUID();
      const concept = buildConcept({
        altLabels: [
          {
            id: altLabelId,
            literalForm: 'alternativa',
            language: 'pt',
            type: 'alt',
            accessLevel: 'public',
            labelRelations: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });
      insertConceptRow(concept);

      const res = await request(app)
        .delete(`/concepts/${concept.id}/labels/${altLabelId}`)
        .set('Authorization', validAuth);

      expect(res.status).toBe(200);
    });

    it('returns 400 when attempting to delete the only prefLabel', async () => {
      requireApp();
      const concept = buildConcept();
      insertConceptRow(concept);
      const onlyPrefLabelId = concept.prefLabels[0].id;

      const res = await request(app)
        .delete(`/concepts/${concept.id}/labels/${onlyPrefLabelId}`)
        .set('Authorization', validAuth);

      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /concepts/:id/labels/:labelId/audio — Upload audio for a label
  // ---------------------------------------------------------------------------

  describe('POST /concepts/:id/labels/:labelId/audio', () => {
    it('returns 201 when a valid audio file is uploaded', async () => {
      requireApp();
      const concept = buildConcept();
      insertConceptRow(concept);
      const labelId = concept.prefLabels[0].id;

      // 1-byte valid mp3 stub — sufficient to pass MIME checks based on Content-Type
      const audioBuffer = Buffer.alloc(1024);

      const res = await request(app)
        .post(`/concepts/${concept.id}/labels/${labelId}/audio`)
        .set('Authorization', validAuth)
        .set('version', '1')
        .attach('audio', audioBuffer, { filename: 'pronunciation.mp3', contentType: 'audio/mpeg' });

      expect(res.status).toBe(201);
    });

    it('returns 400 for an invalid MIME type', async () => {
      requireApp();
      const concept = buildConcept();
      insertConceptRow(concept);
      const labelId = concept.prefLabels[0].id;

      const res = await request(app)
        .post(`/concepts/${concept.id}/labels/${labelId}/audio`)
        .set('Authorization', validAuth)
        .attach('audio', Buffer.alloc(512), { filename: 'malware.exe', contentType: 'application/octet-stream' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when the file exceeds 10 MB', async () => {
      requireApp();
      const concept = buildConcept();
      insertConceptRow(concept);
      const labelId = concept.prefLabels[0].id;

      const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024); // 11 MB

      const res = await request(app)
        .post(`/concepts/${concept.id}/labels/${labelId}/audio`)
        .set('Authorization', validAuth)
        .attach('audio', oversizedBuffer, { filename: 'big.mp3', contentType: 'audio/mpeg' });

      expect(res.status).toBe(400);
    });

    it('returns 409 on version conflict during audio upload', async () => {
      requireApp();
      const concept = buildConcept({ version: 5 });
      insertConceptRow(concept);
      const labelId = concept.prefLabels[0].id;

      const res = await request(app)
        .post(`/concepts/${concept.id}/labels/${labelId}/audio`)
        .set('Authorization', validAuth)
        .field('version', '1') // stale version
        .attach('audio', Buffer.alloc(512), { filename: 'test.mp3', contentType: 'audio/mpeg' });

      expect(res.status).toBe(409);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /concepts/:id/broader — Add a broader relationship
  // ---------------------------------------------------------------------------

  describe('POST /concepts/:id/broader', () => {
    it('returns 200 when a valid broader concept is linked', async () => {
      requireApp();
      const narrow = buildConcept();
      const broad = buildConcept({ uri: 'etnotermos:broad' });
      insertConceptRows([narrow, broad]);

      const res = await request(app)
        .post(`/concepts/${narrow.id}/broader`)
        .set('Authorization', validAuth)
        .send({ targetId: broad.id.toString(), version: 1 });

      expect(res.status).toBe(200);
    });

    it('returns 400 {error:"Relação criaria ciclo hierárquico."} when targetId is an ancestor', async () => {
      requireApp();
      const ancestor = buildConcept({ uri: 'etnotermos:ancestor' });
      const descendant = buildConcept({
        uri: 'etnotermos:descendant',
        ancestors: [ancestor.id],
        broader: [ancestor.id],
      });
      insertConceptRows([ancestor, descendant]);

      // Trying to make the ancestor a narrower of the descendant (cycle)
      const res = await request(app)
        .post(`/concepts/${ancestor.id}/broader`)
        .set('Authorization', validAuth)
        .send({ targetId: descendant.id.toString(), version: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: 'Relação criaria ciclo hierárquico.' });
    });

    it('returns 409 on version conflict', async () => {
      requireApp();
      const narrow = buildConcept({ version: 4 });
      const broad = buildConcept({ uri: 'etnotermos:broad2' });
      insertConceptRows([narrow, broad]);

      const res = await request(app)
        .post(`/concepts/${narrow.id}/broader`)
        .set('Authorization', validAuth)
        .send({ targetId: broad.id.toString(), version: 1 }); // stale

      expect(res.status).toBe(409);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /concepts/:id/related — Add a related (associative) relationship
  // ---------------------------------------------------------------------------

  describe('POST /concepts/:id/related', () => {
    it('returns 200 when a related concept is linked', async () => {
      requireApp();
      const conceptA = buildConcept({ uri: 'etnotermos:a' });
      const conceptB = buildConcept({ uri: 'etnotermos:b' });
      insertConceptRows([conceptA, conceptB]);

      const res = await request(app)
        .post(`/concepts/${conceptA.id}/related`)
        .set('Authorization', validAuth)
        .send({ targetId: conceptB.id.toString(), version: 1 });

      expect(res.status).toBe(200);
    });

    it('returns 409 on version conflict', async () => {
      requireApp();
      const conceptA = buildConcept({ uri: 'etnotermos:a2', version: 7 });
      const conceptB = buildConcept({ uri: 'etnotermos:b2' });
      insertConceptRows([conceptA, conceptB]);

      const res = await request(app)
        .post(`/concepts/${conceptA.id}/related`)
        .set('Authorization', validAuth)
        .send({ targetId: conceptB.id.toString(), version: 1 }); // stale

      expect(res.status).toBe(409);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /concepts/:id/broader/:targetId — Remove a broader relationship
  // ---------------------------------------------------------------------------

  describe('DELETE /concepts/:id/broader/:targetId', () => {
    it('returns 200 when the broader relationship is removed', async () => {
      requireApp();
      const broad = buildConcept({ uri: 'etnotermos:broad-del' });
      const narrow = buildConcept({
        uri: 'etnotermos:narrow-del',
        broader: [broad.id],
        ancestors: [broad.id],
      });
      insertConceptRows([broad, narrow]);

      const res = await request(app)
        .delete(`/concepts/${narrow.id}/broader/${broad.id}`)
        .set('Authorization', validAuth);

      expect(res.status).toBe(200);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /concepts/:id/related/:targetId — Remove a related relationship
  // ---------------------------------------------------------------------------

  describe('DELETE /concepts/:id/related/:targetId', () => {
    it('returns 200 when the related relationship is removed', async () => {
      requireApp();
      const conceptA = buildConcept({ uri: 'etnotermos:a-del' });
      const conceptB = buildConcept({ uri: 'etnotermos:b-del', related: [conceptA.id] });
      insertConceptRows([conceptA, conceptB]);

      const res = await request(app)
        .delete(`/concepts/${conceptB.id}/related/${conceptA.id}`)
        .set('Authorization', validAuth);

      expect(res.status).toBe(200);
    });
  });
});
