// Contract Test: Admin GET /api/v1/admin/dashboard - T028
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { validateResponse } from './setup.js';
import { ObjectId } from 'mongodb';

describe('Contract: GET /api/v1/admin/dashboard', () => {
  let app;
  let dbConnection;
  const adminAuth = Buffer.from('admin:changeme').toString('base64');

  beforeAll(async () => {
    dbConnection = await connect();
    // TODO: Import app after implementation
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  test('should return 200 with dashboard statistics', async () => {
    expect(app).toBeDefined(); // Will fail - app not yet created

    // Insert test data
    const terms = getCollection('etnotermos');
    await terms.insertMany([
      {
        _id: new ObjectId(),
        prefLabel: 'Term 1',
        status: 'active',
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        prefLabel: 'Term 2',
        status: 'active',
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        prefLabel: 'Term 3',
        status: 'deprecated',
        createdAt: new Date(),
      },
    ]);

    const response = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Basic ${adminAuth}`)
      .expect(200);

    // Validate response structure
    expect(response.body).toHaveProperty('statistics');
    expect(response.body.statistics).toHaveProperty('totalTerms', 3);
    expect(response.body.statistics).toHaveProperty('termsByStatus');
    expect(response.body.statistics.termsByStatus).toHaveProperty('active', 2);
    expect(response.body.statistics.termsByStatus).toHaveProperty('deprecated', 1);
  });

  test('should include relationship statistics', async () => {
    expect(app).toBeDefined();

    // Insert relationships
    const relationships = getCollection('etnotermos-relationships');
    await relationships.insertMany([
      {
        _id: new ObjectId(),
        sourceTermId: new ObjectId(),
        targetTermId: new ObjectId(),
        type: 'BT',
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        sourceTermId: new ObjectId(),
        targetTermId: new ObjectId(),
        type: 'RT',
        createdAt: new Date(),
      },
    ]);

    const response = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Basic ${adminAuth}`)
      .expect(200);

    expect(response.body.statistics).toHaveProperty('totalRelationships', 2);
    expect(response.body.statistics).toHaveProperty('relationshipsByType');
  });

  test('should include collection statistics', async () => {
    expect(app).toBeDefined();

    const collections = getCollection('etnotermos-collections');
    await collections.insertMany([
      { _id: new ObjectId(), name: 'Medicinal Plants' },
      { _id: new ObjectId(), name: 'Food Plants' },
    ]);

    const response = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Basic ${adminAuth}`)
      .expect(200);

    expect(response.body.statistics).toHaveProperty('totalCollections', 2);
  });

  test('should include recent changes from audit log', async () => {
    expect(app).toBeDefined();

    const auditLogs = getCollection('etnotermos-audit-logs');
    await auditLogs.insertMany([
      {
        _id: new ObjectId(),
        entityType: 'Term',
        entityId: new ObjectId(),
        action: 'create',
        changes: {},
        timestamp: new Date(),
      },
      {
        _id: new ObjectId(),
        entityType: 'Term',
        entityId: new ObjectId(),
        action: 'update',
        changes: {},
        timestamp: new Date(),
      },
    ]);

    const response = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Basic ${adminAuth}`)
      .expect(200);

    expect(response.body).toHaveProperty('recentChanges');
    expect(Array.isArray(response.body.recentChanges)).toBe(true);
    expect(response.body.recentChanges.length).toBeGreaterThan(0);
  });

  test('should return 401 without authentication', async () => {
    expect(app).toBeDefined();

    await request(app).get('/api/v1/admin/dashboard').expect(401);
  });

  test('should return 401 with invalid credentials', async () => {
    expect(app).toBeDefined();

    const invalidAuth = Buffer.from('wrong:credentials').toString('base64');

    await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Basic ${invalidAuth}`)
      .expect(401);
  });
});
