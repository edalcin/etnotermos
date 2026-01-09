// Contract Test: Admin PUT /api/v1/terms/:id - T021
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { validateResponse } from './setup.js';
import { ObjectId } from 'mongodb';

describe('Contract: PUT /api/v1/terms/:id', () => {
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

  test('should return 200 with updated term', async () => {
    expect(app).toBeDefined(); // Will fail - app not yet created

    // Insert a test term
    const terms = getCollection('etnotermos');
    const testTerm = {
      _id: new ObjectId(),
      prefLabel: 'Original Term',
      definition: 'Original definition',
      status: 'active',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await terms.insertOne(testTerm);

    const update = {
      prefLabel: 'Updated Term',
      definition: 'Updated definition',
      version: 1,
    };

    const response = await request(app)
      .put(`/api/v1/terms/${testTerm._id.toString()}`)
      .set('Authorization', `Basic ${adminAuth}`)
      .send(update)
      .expect(200);

    // Validate against OpenAPI schema
    validateResponse(response, '/terms/{id}', 'put', 200);

    // Validate response structure
    expect(response.body).toHaveProperty('prefLabel', 'Updated Term');
    expect(response.body).toHaveProperty('version', 2);
  });

  test('should detect version conflict (optimistic locking)', async () => {
    expect(app).toBeDefined();

    const terms = getCollection('etnotermos');
    const testTerm = {
      _id: new ObjectId(),
      prefLabel: 'Test Term',
      definition: 'Test definition',
      version: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await terms.insertOne(testTerm);

    const update = {
      prefLabel: 'Updated Term',
      version: 1, // Stale version
    };

    await request(app)
      .put(`/api/v1/terms/${testTerm._id.toString()}`)
      .set('Authorization', `Basic ${adminAuth}`)
      .send(update)
      .expect(409); // Conflict
  });

  test('should return 404 for non-existent term', async () => {
    expect(app).toBeDefined();

    const nonExistentId = new ObjectId().toString();
    const update = {
      prefLabel: 'Updated Term',
      version: 1,
    };

    await request(app)
      .put(`/api/v1/terms/${nonExistentId}`)
      .set('Authorization', `Basic ${adminAuth}`)
      .send(update)
      .expect(404);
  });

  test('should return 401 without authentication', async () => {
    expect(app).toBeDefined();

    const terms = getCollection('etnotermos');
    const testTerm = {
      _id: new ObjectId(),
      prefLabel: 'Test Term',
      version: 1,
    };
    await terms.insertOne(testTerm);

    await request(app)
      .put(`/api/v1/terms/${testTerm._id.toString()}`)
      .send({ prefLabel: 'Updated' })
      .expect(401);
  });
});
