// Contract Test: Admin Acquisition & Audit API (port 4001)
// Tests FAIL intentionally until the server is implemented (TDD).
import request from 'supertest';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import { connect, disconnect, clearCollections, getDb } from '../helpers/db.js';
import { createTestApp, basicAuthHeader } from '../helpers/app-admin.js';

const TEST_USERNAME = 'testcurator';
const TEST_PASSWORD = 'testpassword';

// Fixtures
function makeAcquisitionLog(overrides = {}) {
  return {
    _id: new ObjectId(),
    executedAt: new Date(),
    status: 'success',
    errorMessage: null,
    fieldsProcessed: ['comunidades.tipo'],
    conceptsCreated: 5,
    conceptsExisting: 10,
    errors: [],
    hasUnresolved: false,
    durationMs: 500,
    ...overrides,
  };
}

function makeAuditEntry(overrides = {}) {
  return {
    _id: new ObjectId(),
    conceptId: new ObjectId(),
    conceptLiteralForm: 'guarita',
    field: 'status',
    previousValue: 'candidate',
    newValue: 'active',
    responsible: TEST_USERNAME,
    timestamp: new Date(),
    ...overrides,
  };
}

describe('Contract: Admin Acquisition & Audit API', () => {
  let app;
  let authHeader;

  beforeAll(async () => {
    // Seed ADMIN_USERS env before importing the app so auth middleware picks it up
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 1);
    process.env.ADMIN_USERS = JSON.stringify([{ username: TEST_USERNAME, passwordHash }]);

    await connect();

    // App creation is wrapped in try/catch because the server is not implemented yet.
    // Tests that require `app` will fail on `expect(app).toBeDefined()`.
    try {
      const db = getDb();
      app = await createTestApp(db);
    } catch {
      app = undefined;
    }

    authHeader = basicAuthHeader(TEST_USERNAME, TEST_PASSWORD);
  });

  afterAll(async () => {
    await disconnect();
    delete process.env.ADMIN_USERS;
  });

  beforeEach(async () => {
    await clearCollections();
  });

  // ---------------------------------------------------------------------------
  // POST /acquisition/run
  // ---------------------------------------------------------------------------
  describe('POST /acquisition/run', () => {
    test('returns 202 with ok:true when authenticated', async () => {
      expect(app).toBeDefined();

      const res = await request(app)
        .post('/acquisition/run')
        .set('Authorization', authHeader)
        .expect(202);

      expect(res.body).toHaveProperty('ok', true);
      expect(res.body).toHaveProperty('message', 'Aquisição iniciada em background.');
    });

    test('returns 401 without auth', async () => {
      expect(app).toBeDefined();

      await request(app).post('/acquisition/run').expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /acquisition/status
  // ---------------------------------------------------------------------------
  describe('GET /acquisition/status', () => {
    test('returns 200 with lastRun:null when no runs exist', async () => {
      expect(app).toBeDefined();

      const res = await request(app)
        .get('/acquisition/status')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body).toHaveProperty('lastRun', null);
      expect(res.body).toHaveProperty('scheduledNext');
    });

    test('returns lastRun object with required fields after a run exists', async () => {
      expect(app).toBeDefined();

      const db = getDb();
      const log = makeAcquisitionLog();
      await db.collection('etnotermos_acquisition_log').insertOne(log);

      const res = await request(app)
        .get('/acquisition/status')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body.lastRun).not.toBeNull();
      expect(res.body.lastRun).toHaveProperty('executedAt');
      expect(res.body.lastRun).toHaveProperty('status');
      expect(res.body.lastRun).toHaveProperty('conceptsCreated');
      expect(res.body.lastRun).toHaveProperty('conceptsExisting');
      expect(res.body.lastRun).toHaveProperty('durationMs');
      expect(res.body.lastRun).toHaveProperty('hasUnresolved');
      expect(res.body).toHaveProperty('scheduledNext');
    });
  });

  // ---------------------------------------------------------------------------
  // GET /acquisition/logs
  // ---------------------------------------------------------------------------
  describe('GET /acquisition/logs', () => {
    test('returns 200 with empty paginated result when no logs exist', async () => {
      expect(app).toBeDefined();

      const res = await request(app)
        .get('/acquisition/logs')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total', 0);
      expect(res.body).toHaveProperty('page', 1);
    });

    test('returns all logs when they exist', async () => {
      expect(app).toBeDefined();

      const db = getDb();
      await db.collection('etnotermos_acquisition_log').insertMany([
        makeAcquisitionLog({ status: 'success' }),
        makeAcquisitionLog({ status: 'failure', errorMessage: 'timeout' }),
      ]);

      const res = await request(app)
        .get('/acquisition/logs')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body.total).toBe(2);
      expect(res.body.data).toHaveLength(2);
    });

    test('filters logs by ?status=success', async () => {
      expect(app).toBeDefined();

      const db = getDb();
      await db.collection('etnotermos_acquisition_log').insertMany([
        makeAcquisitionLog({ status: 'success' }),
        makeAcquisitionLog({ status: 'failure', errorMessage: 'timeout' }),
      ]);

      const res = await request(app)
        .get('/acquisition/logs?status=success')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0]).toHaveProperty('status', 'success');
    });

    test('filters logs by ?status=failure', async () => {
      expect(app).toBeDefined();

      const db = getDb();
      await db.collection('etnotermos_acquisition_log').insertMany([
        makeAcquisitionLog({ status: 'success' }),
        makeAcquisitionLog({ status: 'failure', errorMessage: 'timeout' }),
      ]);

      const res = await request(app)
        .get('/acquisition/logs?status=failure')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0]).toHaveProperty('status', 'failure');
    });

    test('respects ?page=1 pagination parameter', async () => {
      expect(app).toBeDefined();

      const res = await request(app)
        .get('/acquisition/logs?page=1')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body).toHaveProperty('page', 1);
    });

    test('returns 401 without auth', async () => {
      expect(app).toBeDefined();

      await request(app).get('/acquisition/logs').expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /acquisition/logs/:id
  // ---------------------------------------------------------------------------
  describe('GET /acquisition/logs/:id', () => {
    test('returns 200 with log details for a known id', async () => {
      expect(app).toBeDefined();

      const db = getDb();
      const log = makeAcquisitionLog();
      await db.collection('etnotermos_acquisition_log').insertOne(log);

      const res = await request(app)
        .get(`/acquisition/logs/${log._id.toString()}`)
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('conceptsCreated', 5);
      expect(res.body).toHaveProperty('conceptsExisting', 10);
      expect(res.body).toHaveProperty('durationMs', 500);
      expect(res.body).toHaveProperty('hasUnresolved', false);
    });

    test('returns 404 for an unknown id', async () => {
      expect(app).toBeDefined();

      const unknownId = new ObjectId().toString();

      await request(app)
        .get(`/acquisition/logs/${unknownId}`)
        .set('Authorization', authHeader)
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /audit
  // ---------------------------------------------------------------------------
  describe('GET /audit', () => {
    test('returns 200 with empty paginated result when no entries exist', async () => {
      expect(app).toBeDefined();

      const res = await request(app)
        .get('/audit')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total', 0);
      expect(res.body).toHaveProperty('page', 1);
    });

    test('returns JSON when Accept:application/json is set', async () => {
      expect(app).toBeDefined();

      const res = await request(app)
        .get('/audit')
        .set('Authorization', authHeader)
        .set('Accept', 'application/json')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    test('filters by ?conceptId=...', async () => {
      expect(app).toBeDefined();

      const db = getDb();
      const targetConceptId = new ObjectId();
      await db.collection('etnotermos_audit_log').insertMany([
        makeAuditEntry({ conceptId: targetConceptId }),
        makeAuditEntry({ conceptId: new ObjectId() }),
      ]);

      const res = await request(app)
        .get(`/audit?conceptId=${targetConceptId.toString()}`)
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].conceptId.toString()).toBe(targetConceptId.toString());
    });

    test('filters by ?responsible=...', async () => {
      expect(app).toBeDefined();

      const db = getDb();
      await db.collection('etnotermos_audit_log').insertMany([
        makeAuditEntry({ responsible: 'testcurator' }),
        makeAuditEntry({ responsible: 'othercurator' }),
      ]);

      const res = await request(app)
        .get('/audit?responsible=testcurator')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0]).toHaveProperty('responsible', 'testcurator');
    });

    test('respects ?page=1 pagination parameter', async () => {
      expect(app).toBeDefined();

      const res = await request(app)
        .get('/audit?page=1')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body).toHaveProperty('page', 1);
    });

    test('returns 401 without auth', async () => {
      expect(app).toBeDefined();

      await request(app).get('/audit').expect(401);
    });
  });
});
