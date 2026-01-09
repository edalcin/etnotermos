// Contract Test: Public GET /api/v1/terms/:id - T019
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { validateResponse } from './setup.js';
import { ObjectId } from 'mongodb';

describe('Contract: GET /api/v1/terms/:id', () => {
  let app;
  let dbConnection;

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

  test('should return 200 with term details when term exists', async () => {
    expect(app).toBeDefined(); // Will fail - app not yet created

    // Insert a test term
    const terms = getCollection('etnotermos');
    const testTerm = {
      _id: new ObjectId(),
      prefLabel: 'Test Term',
      definition: 'Test definition',
      status: 'active',
      createdAt: new Date(),
    };
    await terms.insertOne(testTerm);

    const response = await request(app)
      .get(`/api/v1/terms/${testTerm._id.toString()}`)
      .expect(200);

    // Validate against OpenAPI schema
    validateResponse(response, '/terms/{id}', 'get', 200);

    // Validate response structure
    expect(response.body).toHaveProperty('_id');
    expect(response.body).toHaveProperty('prefLabel', 'Test Term');
  });

  test('should return 404 when term does not exist', async () => {
    expect(app).toBeDefined();

    const nonExistentId = new ObjectId().toString();

    const response = await request(app)
      .get(`/api/v1/terms/${nonExistentId}`)
      .expect(404);

    // Validate against OpenAPI schema
    validateResponse(response, '/terms/{id}', 'get', 404);
  });

  test('should return 400 for invalid ObjectId format', async () => {
    expect(app).toBeDefined();

    await request(app)
      .get('/api/v1/terms/invalid-id')
      .expect(400);
  });
});
