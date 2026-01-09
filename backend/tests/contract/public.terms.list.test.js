// Contract Test: Public GET /api/v1/terms (list) - T018
import request from 'supertest';
import { connect, closeDatabase, clearDatabase } from '../helpers/test-db.js';
import { validateResponse } from './setup.js';

describe('Contract: GET /api/v1/terms (list)', () => {
  let app;
  let dbConnection;

  beforeAll(async () => {
    dbConnection = await connect();
    // TODO: Import app after implementation
    // app = (await import('../../src/contexts/public/server.js')).default;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  test('should return 200 with paginated list of terms', async () => {
    // This test will fail until the endpoint is implemented
    expect(app).toBeDefined(); // Will fail - app not yet created

    const response = await request(app)
      .get('/api/v1/terms')
      .query({ page: 1, limit: 20 })
      .expect(200);

    // Validate against OpenAPI schema
    validateResponse(response, '/terms', 'get', 200);

    // Validate response structure
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should accept pagination parameters', async () => {
    expect(app).toBeDefined();

    const response = await request(app)
      .get('/api/v1/terms')
      .query({ page: 2, limit: 10 })
      .expect(200);

    validateResponse(response, '/terms', 'get', 200);
  });

  test('should default to page 1 and limit 20 when not specified', async () => {
    expect(app).toBeDefined();

    const response = await request(app)
      .get('/api/v1/terms')
      .expect(200);

    validateResponse(response, '/terms', 'get', 200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
