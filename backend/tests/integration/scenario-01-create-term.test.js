// Integration Test: Acceptance Scenario 1 - Create term with definitions, cultural context, and sources (T030)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { ObjectId } from 'mongodb';

describe('Scenario 1: Create term with full metadata', () => {
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

  test('should create term with definitions, cultural context, and bibliographic sources', async () => {
    expect(app).toBeDefined(); // Will fail - app not yet created

    // Step 1: Create a source
    const sourceResponse = await request(app)
      .post('/api/v1/sources')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        type: 'bibliographic',
        fields: {
          author: 'Silva, J.',
          title: 'Plantas Medicinais da Amazônia',
          year: '2022',
          publisher: 'Editora Universitária',
        },
      })
      .expect(201);

    const sourceId = sourceResponse.body._id;

    // Step 2: Create a collection
    const collectionResponse = await request(app)
      .post('/api/v1/collections')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        name: 'Medicinal Plants',
        description: 'Plants used in traditional medicine',
      })
      .expect(201);

    const collectionId = collectionResponse.body._id;

    // Step 3: Create a term with full metadata
    const termResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Açaí',
        altLabels: ['Juçara', 'Palmito-juçara'],
        definition:
          'Palmeira típica da Amazônia, cujos frutos são utilizados na alimentação e possuem propriedades medicinais',
        scopeNote: 'Utilizado principalmente em contextos de medicina tradicional amazônica',
        historyNote: 'O uso medicinal do açaí é documentado há séculos por comunidades indígenas',
        example: 'O açaí é consumido como energético natural',
        status: 'active',
        sourceIds: [sourceId],
        collectionIds: [collectionId],
        facets: {
          plantPart: 'fruit',
          usageType: 'medicinal,alimentício',
        },
      })
      .expect(201);

    const termId = termResponse.body._id;

    // Step 4: Add cultural context note
    await request(app)
      .post('/api/v1/notes')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        termId,
        type: 'scope',
        content:
          'Conhecimento tradicional das comunidades ribeirinhas da Amazônia sobre o uso medicinal do açaí',
        sourceIds: [sourceId],
      })
      .expect(201);

    // Step 5: Verify storage - Retrieve term and check all metadata
    const getTermResponse = await request(app).get(`/api/v1/terms/${termId}`).expect(200);

    const term = getTermResponse.body;

    // Verify all fields are stored correctly
    expect(term.prefLabel).toBe('Açaí');
    expect(term.altLabels).toContain('Juçara');
    expect(term.definition).toContain('Palmeira típica');
    expect(term.scopeNote).toContain('medicina tradicional');
    expect(term.historyNote).toContain('comunidades indígenas');
    expect(term.sourceIds).toContain(sourceId);
    expect(term.collectionIds).toContain(collectionId);
    expect(term.facets.plantPart).toBe('fruit');
    expect(term).toHaveProperty('createdAt');
    expect(term).toHaveProperty('updatedAt');

    // Step 6: Verify notes are linked
    const notesResponse = await request(app).get(`/api/v1/notes?termId=${termId}`).expect(200);

    expect(notesResponse.body.length).toBe(1);
    expect(notesResponse.body[0].type).toBe('scope');
    expect(notesResponse.body[0].content).toContain('comunidades ribeirinhas');
  });
});
