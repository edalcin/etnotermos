// Integration Test: Acceptance Scenario 5 - View term with multiple note types (T034)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase } from '../helpers/test-db.js';

describe('Scenario 5: View term with multiple note types', () => {
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

  test('should organize and present all note types clearly', async () => {
    expect(app).toBeDefined();

    // Create term
    const termResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Açaí',
        definition: 'Fruto medicinal',
        status: 'active',
      })
      .expect(201);

    const termId = termResponse.body._id;

    // Create all note types
    const noteTypes = ['scope', 'cataloger', 'historical', 'bibliographic', 'definition', 'example'];

    for (const type of noteTypes) {
      await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Basic ${adminAuth}`)
        .send({
          termId,
          type,
          content: `${type} note content for testing`,
        })
        .expect(201);
    }

    // Fetch all notes for the term
    const notesResponse = await request(app)
      .get('/api/v1/notes')
      .query({ termId })
      .expect(200);

    expect(notesResponse.body.length).toBe(6);

    // Verify all types are present
    const types = notesResponse.body.map((note) => note.type);
    noteTypes.forEach((type) => {
      expect(types).toContain(type);
    });

    // Verify filtering by type works
    const scopeNotesResponse = await request(app)
      .get('/api/v1/notes')
      .query({ termId, type: 'scope' })
      .expect(200);

    expect(scopeNotesResponse.body.length).toBe(1);
    expect(scopeNotesResponse.body[0].type).toBe('scope');
  });
});
