// Integration Test: Acceptance Scenario 6 - Admin dashboard access (T035)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { ObjectId } from 'mongodb';

describe('Scenario 6: Admin access to dashboard and analytics', () => {
  let app;
  let dbConnection;
  const adminAuth = Buffer.from('admin:changeme').toString('base64');

  beforeAll(async () => {
    dbConnection = await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  test('should provide analytics dashboard with statistics', async () => {
    expect(app).toBeDefined();

    // Populate database with test data
    const terms = getCollection('etnotermos');
    await terms.insertMany([
      { _id: new ObjectId(), prefLabel: 'Term 1', status: 'active', createdAt: new Date() },
      { _id: new ObjectId(), prefLabel: 'Term 2', status: 'active', createdAt: new Date() },
      { _id: new ObjectId(), prefLabel: 'Term 3', status: 'deprecated', createdAt: new Date() },
    ]);

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

    // Access dashboard
    const dashboardResponse = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Basic ${adminAuth}`)
      .expect(200);

    // Verify statistics
    expect(dashboardResponse.body).toHaveProperty('statistics');
    expect(dashboardResponse.body.statistics.totalTerms).toBe(3);
    expect(dashboardResponse.body.statistics.termsByStatus.active).toBe(2);
    expect(dashboardResponse.body.statistics.termsByStatus.deprecated).toBe(1);
    expect(dashboardResponse.body.statistics.totalRelationships).toBe(2);
  });

  test('should prevent unauthorized access without authentication', async () => {
    expect(app).toBeDefined();

    await request(app).get('/api/v1/admin/dashboard').expect(401);
  });
});
