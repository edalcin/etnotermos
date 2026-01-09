// Integration Test: Acceptance Scenario 3 - Search functionality (T032)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { ObjectId } from 'mongodb';

describe('Scenario 3: Search for plant name or usage context', () => {
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

  test('should search and return relevant terms with relationships and notes', async () => {
    expect(app).toBeDefined(); // Will fail - app not yet created

    const adminAuth = Buffer.from('admin:changeme').toString('base64');

    // Step 1: Create several terms related to medicinal plants
    const term1Response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Açaí Medicinal',
        altLabels: ['Juçara medicinal'],
        definition: 'Uso medicinal do açaí para tratamento de anemia',
        scopeNote: 'Utilizado em contextos de medicina tradicional',
        status: 'active',
      })
      .expect(201);

    const term2Response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Guaraná',
        definition: 'Planta medicinal energética da Amazônia',
        scopeNote: 'Uso medicinal como estimulante natural',
        status: 'active',
      })
      .expect(201);

    const term3Response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Cipó',
        definition: 'Planta utilizada para artesanato',
        scopeNote: 'Não tem uso medicinal',
        status: 'active',
      })
      .expect(201);

    const term1Id = term1Response.body._id;
    const term2Id = term2Response.body._id;

    // Step 2: Add relationships
    await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        sourceTermId: term1Id,
        targetTermId: term2Id,
        type: 'RT', // Related term
      })
      .expect(201);

    // Step 3: Add notes
    await request(app)
      .post('/api/v1/notes')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        termId: term1Id,
        type: 'scope',
        content: 'Conhecimento tradicional sobre uso medicinal do açaí',
      })
      .expect(201);

    // Step 4: Create text index for search
    const terms = getCollection('etnotermos');
    await terms.createIndex({
      prefLabel: 'text',
      altLabels: 'text',
      definition: 'text',
      scopeNote: 'text',
    });

    // Step 5: Search for "medicinal"
    const searchResponse = await request(app)
      .get('/api/v1/search')
      .query({ q: 'medicinal' })
      .expect(200);

    // Verify search results
    expect(Array.isArray(searchResponse.body)).toBe(true);
    expect(searchResponse.body.length).toBeGreaterThanOrEqual(2);

    // Verify relevant terms are returned
    const termIds = searchResponse.body.map((t) => t._id);
    expect(termIds).toContain(term1Id);
    expect(termIds).toContain(term2Id);

    // Verify term3 (non-medicinal) is not in results
    expect(termIds).not.toContain(term3Response.body._id);

    // Step 6: Verify enriched results include relationship counts
    const term1Result = searchResponse.body.find((t) => t._id === term1Id);
    expect(term1Result).toHaveProperty('relationshipCount');

    // Step 7: Fetch full term details with relationships
    const termDetailResponse = await request(app).get(`/api/v1/terms/${term1Id}`).expect(200);

    expect(termDetailResponse.body.prefLabel).toBe('Açaí Medicinal');

    // Step 8: Fetch relationships for the term
    const relationshipsResponse = await request(app)
      .get(`/api/v1/relationships/${term1Id}`)
      .expect(200);

    expect(Array.isArray(relationshipsResponse.body)).toBe(true);
    expect(relationshipsResponse.body.length).toBeGreaterThan(0);
    expect(relationshipsResponse.body[0].type).toBe('RT');

    // Step 9: Fetch notes for the term
    const notesResponse = await request(app)
      .get(`/api/v1/notes`)
      .query({ termId: term1Id })
      .expect(200);

    expect(Array.isArray(notesResponse.body)).toBe(true);
    expect(notesResponse.body.length).toBe(1);
    expect(notesResponse.body[0].type).toBe('scope');
  });

  test('should support search with diacritics and special characters', async () => {
    expect(app).toBeDefined();

    const adminAuth = Buffer.from('admin:changeme').toString('base64');

    // Create term with Portuguese diacritics
    await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Ipê-roxo',
        definition: 'Árvore medicinal brasileira',
        status: 'active',
      })
      .expect(201);

    // Create text index
    const terms = getCollection('etnotermos');
    await terms.createIndex({
      prefLabel: 'text',
      definition: 'text',
    });

    // Search with diacritics
    const searchResponse = await request(app)
      .get('/api/v1/search')
      .query({ q: 'Ipê' })
      .expect(200);

    expect(searchResponse.body.length).toBeGreaterThan(0);

    // Search without diacritics should still find it
    const searchResponse2 = await request(app)
      .get('/api/v1/search')
      .query({ q: 'Ipe' })
      .expect(200);

    expect(searchResponse2.body.length).toBeGreaterThan(0);
  });
});
