// Integration Test: Acceptance Scenario 8 - Public read-only access (T037)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { ObjectId } from 'mongodb';

describe('Scenario 8: Public user accesses read-only interface', () => {
  let app;
  let dbConnection;

  beforeAll(async () => {
    dbConnection = await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  test('should allow public read access without authentication', async () => {
    expect(app).toBeDefined();

    // Insert test data
    const terms = getCollection('etnotermos');
    const testTerm = {
      _id: new ObjectId(),
      prefLabel: 'Public Term',
      definition: 'Public definition',
      status: 'active',
    };
    await terms.insertOne(testTerm);

    // Access public endpoints without authentication
    await request(app).get('/api/v1/terms').expect(200);

    await request(app).get(`/api/v1/terms/${testTerm._id.toString()}`).expect(200);

    await request(app)
      .get('/api/v1/search')
      .query({ q: 'public' })
      .expect(200);

    await request(app).get('/api/v1/export/csv').expect(200);
  });

  test('should block write operations without authentication', async () => {
    expect(app).toBeDefined();

    // Attempt to create term without auth
    await request(app)
      .post('/api/v1/terms')
      .send({
        prefLabel: 'Unauthorized Term',
        definition: 'Should fail',
      })
      .expect(401);

    // Attempt to update term without auth
    await request(app)
      .put(`/api/v1/terms/${new ObjectId().toString()}`)
      .send({
        prefLabel: 'Updated',
      })
      .expect(401);

    // Attempt to delete term without auth
    await request(app).delete(`/api/v1/terms/${new ObjectId().toString()}`).expect(401);
  });
});
