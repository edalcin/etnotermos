// Contract Test: Public GET /api/v1/search - T026
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { validateResponse } from './setup.js';
import { ObjectId } from 'mongodb';

describe('Contract: GET /api/v1/search', () => {
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

  test('should return 200 with search results', async () => {
    expect(app).toBeDefined(); // Will fail - app not yet created

    // Insert test terms
    const terms = getCollection('etnotermos');
    await terms.insertMany([
      {
        _id: new ObjectId(),
        prefLabel: 'Medicinal Plant',
        definition: 'A plant used for medicinal purposes',
        status: 'active',
      },
      {
        _id: new ObjectId(),
        prefLabel: 'Healing Herb',
        definition: 'An herb with healing properties',
        status: 'active',
      },
    ]);

    // Create text index for search
    await terms.createIndex({
      prefLabel: 'text',
      definition: 'text',
    });

    const response = await request(app)
      .get('/api/v1/search')
      .query({ q: 'medicinal' })
      .expect(200);

    // Validate response
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('prefLabel');
    expect(response.body[0]).toHaveProperty('score'); // Text search score
  });

  test('should support pagination', async () => {
    expect(app).toBeDefined();

    const response = await request(app)
      .get('/api/v1/search')
      .query({ q: 'test', page: 1, limit: 10 })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should support filtering by collection', async () => {
    expect(app).toBeDefined();

    const collectionId = new ObjectId().toString();

    const response = await request(app)
      .get('/api/v1/search')
      .query({ q: 'test', collections: collectionId })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should support filtering by status', async () => {
    expect(app).toBeDefined();

    const response = await request(app)
      .get('/api/v1/search')
      .query({ q: 'test', status: 'active' })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should return 400 when query is missing', async () => {
    expect(app).toBeDefined();

    await request(app).get('/api/v1/search').expect(400);
  });

  test('should return empty array for no matches', async () => {
    expect(app).toBeDefined();

    const response = await request(app)
      .get('/api/v1/search')
      .query({ q: 'nonexistentterm12345' })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });
});
