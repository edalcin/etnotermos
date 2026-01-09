// Integration Test: Edge Case 3 - Special characters and UTF-8 (T042)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';

describe('Edge Case 3: Special characters and UTF-8 handling', () => {
  let app;
  let dbConnection;
  const adminAuth = Buffer.from('admin:changeme').toString('base64');

  beforeAll(async () => {
    dbConnection = await connect();
  });

  afterAll(async () => {
    await clearDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  test('should handle Portuguese diacritics (á, ã, ç) correctly', async () => {
    expect(app).toBeDefined();

    // Create term with diacritics
    const termResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Açaí',
        altLabels: ['Juçara', 'Palmito-açaí'],
        definition: 'Palmeira típica da região amazônica',
        scopeNote: 'Utilização medicinal e alimentícia',
        status: 'active',
      })
      .expect(201);

    const termId = termResponse.body._id;

    // Verify storage
    const getResponse = await request(app).get(`/api/v1/terms/${termId}`).expect(200);

    expect(getResponse.body.prefLabel).toBe('Açaí');
    expect(getResponse.body.altLabels).toContain('Juçara');
    expect(getResponse.body.definition).toContain('amazônica');

    // Create text index
    const terms = getCollection('etnotermos');
    await terms.createIndex({ prefLabel: 'text', definition: 'text' });

    // Test search with diacritics
    const searchResponse = await request(app)
      .get('/api/v1/search')
      .query({ q: 'Açaí' })
      .expect(200);

    expect(searchResponse.body.length).toBeGreaterThan(0);
    expect(searchResponse.body[0].prefLabel).toBe('Açaí');

    // Test search without diacritics (should still find)
    const searchResponse2 = await request(app)
      .get('/api/v1/search')
      .query({ q: 'Acai' })
      .expect(200);

    expect(searchResponse2.body.length).toBeGreaterThan(0);
  });

  test('should handle indigenous characters and symbols', async () => {
    expect(app).toBeDefined();

    const termResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: "Y'kuana'",
        definition: 'Nome indígena de planta sagrada',
        status: 'active',
      })
      .expect(201);

    const getResponse = await request(app).get(`/api/v1/terms/${termResponse.body._id}`).expect(200);

    expect(getResponse.body.prefLabel).toBe("Y'kuana'");
  });

  test('should export UTF-8 correctly in CSV', async () => {
    expect(app).toBeDefined();

    // Create terms with special characters
    await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Ipê-roxo',
        definition: 'Árvore medicinal com floresção roxa',
        status: 'active',
      })
      .expect(201);

    // Export to CSV
    const exportResponse = await request(app).get('/api/v1/export/csv').expect(200);

    const csvContent = exportResponse.text;

    // Verify UTF-8 characters are preserved
    expect(csvContent).toContain('Ipê-roxo');
    expect(csvContent).toContain('Árvore');
    expect(csvContent).toContain('floresção');
  });
});
