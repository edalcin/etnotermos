// Contract Test: Public GET /api/v1/export/csv - T027
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { ObjectId } from 'mongodb';

describe('Contract: GET /api/v1/export/csv', () => {
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

  test('should return 200 with CSV content', async () => {
    expect(app).toBeDefined(); // Will fail - app not yet created

    // Insert test terms
    const terms = getCollection('etnotermos');
    await terms.insertMany([
      {
        _id: new ObjectId(),
        prefLabel: 'Test Term 1',
        definition: 'Definition 1',
        status: 'active',
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        prefLabel: 'Test Term 2',
        definition: 'Definition 2',
        status: 'active',
        createdAt: new Date(),
      },
    ]);

    const response = await request(app).get('/api/v1/export/csv').expect(200);

    // Validate content type
    expect(response.headers['content-type']).toMatch(/text\/csv/);
    expect(response.headers['content-disposition']).toMatch(/attachment/);

    // Validate CSV structure
    const csvContent = response.text;
    expect(csvContent).toContain('term_id');
    expect(csvContent).toContain('preferred_name');
    expect(csvContent).toContain('Test Term 1');
    expect(csvContent).toContain('Test Term 2');
  });

  test('should support filtering by collection', async () => {
    expect(app).toBeDefined();

    const collectionId = new ObjectId().toString();

    const response = await request(app)
      .get('/api/v1/export/csv')
      .query({ collections: collectionId })
      .expect(200);

    expect(response.headers['content-type']).toMatch(/text\/csv/);
  });

  test('should support filtering by status', async () => {
    expect(app).toBeDefined();

    const response = await request(app)
      .get('/api/v1/export/csv')
      .query({ status: 'active' })
      .expect(200);

    expect(response.headers['content-type']).toMatch(/text\/csv/);
  });

  test('should handle UTF-8 encoding correctly', async () => {
    expect(app).toBeDefined();

    // Insert term with special characters
    const terms = getCollection('etnotermos');
    await terms.insertOne({
      _id: new ObjectId(),
      prefLabel: 'Açaí',
      altLabels: ['Juçara'],
      definition: 'Palmeira típica da região amazônica',
      status: 'active',
    });

    const response = await request(app).get('/api/v1/export/csv').expect(200);

    const csvContent = response.text;
    expect(csvContent).toContain('Açaí');
    expect(csvContent).toContain('Juçara');
    expect(csvContent).toContain('amazônica');
  });

  test('should return empty CSV with headers only when no terms', async () => {
    expect(app).toBeDefined();

    const response = await request(app).get('/api/v1/export/csv').expect(200);

    const csvContent = response.text;
    const lines = csvContent.split('\n');
    expect(lines.length).toBe(1); // Only header line
    expect(lines[0]).toContain('term_id');
  });
});
