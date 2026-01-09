// Integration Test: Acceptance Scenario 7 - Data export (T036)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { ObjectId } from 'mongodb';

describe('Scenario 7: Request data export', () => {
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

  test('should generate CSV file with proper UTF-8 encoding', async () => {
    expect(app).toBeDefined();

    // Insert test terms with Portuguese characters
    const terms = getCollection('etnotermos');
    await terms.insertMany([
      {
        _id: new ObjectId(),
        prefLabel: 'Açaí',
        altLabels: ['Juçara'],
        definition: 'Palmeira da Amazônia',
        status: 'active',
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        prefLabel: 'Ipê-roxo',
        definition: 'Árvore medicinal',
        status: 'active',
        createdAt: new Date(),
      },
    ]);

    // Request CSV export
    const exportResponse = await request(app).get('/api/v1/export/csv').expect(200);

    // Verify content type
    expect(exportResponse.headers['content-type']).toMatch(/text\/csv/);
    expect(exportResponse.headers['content-disposition']).toMatch(/attachment/);
    expect(exportResponse.headers['content-disposition']).toMatch(/\.csv/);

    // Verify CSV content
    const csvContent = exportResponse.text;

    // Check headers
    expect(csvContent).toContain('term_id');
    expect(csvContent).toContain('preferred_name');
    expect(csvContent).toContain('alternate_names');
    expect(csvContent).toContain('definition');

    // Check data with UTF-8 characters
    expect(csvContent).toContain('Açaí');
    expect(csvContent).toContain('Juçara');
    expect(csvContent).toContain('Ipê-roxo');
    expect(csvContent).toContain('Amazônia');

    // Verify CSV structure (rows)
    const lines = csvContent.split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(3); // Header + 2 data rows
  });
});
