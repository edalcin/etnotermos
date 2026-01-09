// Integration Test: Acceptance Scenario 9 - CARE Principles compliance (T038)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase } from '../helpers/test-db.js';

describe('Scenario 9: Data entry with traditional knowledge (CARE Principles)', () => {
  let app;
  let dbConnection;
  const adminAuth = Buffer.from('admin:changeme').toString('base64');

  beforeAll(async () => {
    dbConnection = await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  test('should support proper attribution fields for traditional knowledge', async () => {
    expect(app).toBeDefined();

    // Create source with attribution
    const sourceResponse = await request(app)
      .post('/api/v1/sources')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        type: 'interview',
        fields: {
          interviewee: 'Pajé João',
          community: 'Comunidade Indígena Xavante',
          date: '2023-05-15',
          location: 'Mato Grosso, Brasil',
          consentGiven: true,
        },
      })
      .expect(201);

    const sourceId = sourceResponse.body._id;

    // Create term with traditional knowledge
    const termResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Jenipapo Medicinal',
        definition: 'Uso tradicional do jenipapo para tratamento de anemia',
        sourceIds: [sourceId],
        status: 'active',
      })
      .expect(201);

    const termId = termResponse.body._id;

    // Add cultural context note
    await request(app)
      .post('/api/v1/notes')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        termId,
        type: 'scope',
        content:
          'Conhecimento tradicional compartilhado pela comunidade Xavante. Uso deve respeitar direitos coletivos.',
        sourceIds: [sourceId],
      })
      .expect(201);

    // Verify attribution is preserved
    const termDetail = await request(app).get(`/api/v1/terms/${termId}`).expect(200);

    expect(termDetail.body.sourceIds).toContain(sourceId);

    // Verify source details include attribution
    const sourceDetail = await request(app).get(`/api/v1/sources/${sourceId}`).expect(200);

    expect(sourceDetail.body.type).toBe('interview');
    expect(sourceDetail.body.fields.community).toBe('Comunidade Indígena Xavante');
    expect(sourceDetail.body.fields.consentGiven).toBe(true);
  });
});
