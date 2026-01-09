// Integration Test: Acceptance Scenario 10 - External API access (T039)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { ObjectId } from 'mongodb';

describe('Scenario 10: External system requests data via public API', () => {
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

  test('should provide read-only API access for external systems', async () => {
    expect(app).toBeDefined();

    // Insert test data
    const terms = getCollection('etnotermos');
    const testTerms = [
      {
        _id: new ObjectId(),
        prefLabel: 'API Test Term 1',
        definition: 'First test term',
        status: 'active',
      },
      {
        _id: new ObjectId(),
        prefLabel: 'API Test Term 2',
        definition: 'Second test term',
        status: 'active',
      },
    ];
    await terms.insertMany(testTerms);

    // Test API endpoints (simulating external system)
    const listResponse = await request(app)
      .get('/api/v1/terms')
      .set('User-Agent', 'External-System/1.0')
      .expect(200);

    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.length).toBeGreaterThanOrEqual(2);

    // Get specific term
    const termId = testTerms[0]._id.toString();
    const getResponse = await request(app)
      .get(`/api/v1/terms/${termId}`)
      .set('User-Agent', 'External-System/1.0')
      .expect(200);

    expect(getResponse.body.prefLabel).toBe('API Test Term 1');

    // Search
    const searchResponse = await request(app)
      .get('/api/v1/search')
      .query({ q: 'API Test' })
      .set('User-Agent', 'External-System/1.0')
      .expect(200);

    expect(Array.isArray(searchResponse.body)).toBe(true);
  });

  test('should enforce rate limiting for API access', async () => {
    expect(app).toBeDefined();

    // Make many requests to trigger rate limit
    // Rate limit is 100 requests per minute
    const requests = [];
    for (let i = 0; i < 105; i++) {
      requests.push(request(app).get('/api/v1/terms'));
    }

    const responses = await Promise.all(requests);

    // At least one request should be rate limited
    const rateLimited = responses.some((res) => res.status === 429);
    expect(rateLimited).toBe(true);
  });
});
