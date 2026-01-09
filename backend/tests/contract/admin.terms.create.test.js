// Contract Test: Admin POST /api/v1/terms - T020
import request from 'supertest';
import { connect, closeDatabase, clearDatabase } from '../helpers/test-db.js';
import { validateResponse, validateRequestBody } from './setup.js';

describe('Contract: POST /api/v1/terms', () => {
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

  test('should return 201 with created term', async () => {
    expect(app).toBeDefined(); // Will fail - app not yet created

    const newTerm = {
      prefLabel: 'Exemplum herba',
      altLabels: ['Example herb'],
      definition: 'A species of plant used in traditional medicine',
      status: 'active',
    };

    // Validate request body
    validateRequestBody(newTerm, '/terms', 'post');

    const response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send(newTerm)
      .expect(201);

    // Validate against OpenAPI schema
    validateResponse(response, '/terms', 'post', 201);

    // Validate response structure
    expect(response.body).toHaveProperty('_id');
    expect(response.body).toHaveProperty('prefLabel', 'Exemplum herba');
    expect(response.body).toHaveProperty('createdAt');
  });

  test('should return 401 without authentication', async () => {
    expect(app).toBeDefined();

    const newTerm = {
      prefLabel: 'Test Term',
      definition: 'Test definition',
    };

    await request(app)
      .post('/api/v1/terms')
      .send(newTerm)
      .expect(401);
  });

  test('should return 400 for invalid request body', async () => {
    expect(app).toBeDefined();

    const invalidTerm = {
      // Missing required prefLabel
      definition: 'Test definition',
    };

    await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send(invalidTerm)
      .expect(400);
  });

  test('should return 400 for duplicate prefLabel', async () => {
    expect(app).toBeDefined();

    const term = {
      prefLabel: 'Duplicate Term',
      definition: 'First definition',
    };

    // Create first term
    await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send(term)
      .expect(201);

    // Try to create duplicate
    await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send(term)
      .expect(400);
  });
});
