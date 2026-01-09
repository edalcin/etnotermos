// Integration Test: Edge Case 5 - Source cascade deletion (T044)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase } from '../helpers/test-db.js';

describe('Edge Case 5: Source cascade deletion warnings', () => {
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

  test('should warn when source is referenced by multiple terms', async () => {
    expect(app).toBeDefined();

    // Create source
    const sourceResponse = await request(app)
      .post('/api/v1/sources')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        type: 'bibliographic',
        fields: {
          author: 'Silva, J.',
          title: 'Important Reference',
          year: '2022',
        },
      })
      .expect(201);

    const sourceId = sourceResponse.body._id;

    // Create 20 terms referencing this source
    const termPromises = [];
    for (let i = 0; i < 20; i++) {
      const promise = request(app)
        .post('/api/v1/terms')
        .set('Authorization', `Basic ${adminAuth}`)
        .send({
          prefLabel: `Term ${i + 1}`,
          definition: `Definition ${i + 1}`,
          sourceIds: [sourceId],
          status: 'active',
        });
      termPromises.push(promise);
    }

    await Promise.all(termPromises);

    // Attempt to delete source
    const deleteResponse = await request(app)
      .delete(`/api/v1/sources/${sourceId}`)
      .set('Authorization', `Basic ${adminAuth}`)
      .expect(200);

    // Verify warning
    expect(deleteResponse.body).toHaveProperty('warning');
    expect(deleteResponse.body).toHaveProperty('referencedByCount', 20);
    expect(deleteResponse.body).toHaveProperty('referencedBy');

    // Verify options: confirmation required or orphan handling
    expect(deleteResponse.body).toHaveProperty('options');
    expect(deleteResponse.body.options).toContain('confirm_delete'); // Delete and orphan terms
    expect(deleteResponse.body.options).toContain('cancel'); // Cancel deletion
  });

  test('should allow source deletion with confirmation and orphan handling', async () => {
    expect(app).toBeDefined();

    // Create source and term
    const sourceResponse = await request(app)
      .post('/api/v1/sources')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        type: 'bibliographic',
        fields: { author: 'Test', title: 'Test' },
      })
      .expect(201);

    const termResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Test Term',
        definition: 'Test',
        sourceIds: [sourceResponse.body._id],
        status: 'active',
      })
      .expect(201);

    // Delete source with confirmation
    await request(app)
      .delete(`/api/v1/sources/${sourceResponse.body._id}`)
      .set('Authorization', `Basic ${adminAuth}`)
      .query({ confirm: 'true', orphanHandling: 'remove_reference' })
      .expect(200);

    // Verify source is deleted
    await request(app).get(`/api/v1/sources/${sourceResponse.body._id}`).expect(404);

    // Verify term still exists but source reference is removed
    const termCheck = await request(app).get(`/api/v1/terms/${termResponse.body._id}`).expect(200);

    expect(termCheck.body.sourceIds).not.toContain(sourceResponse.body._id);
  });

  test('should handle cascade for notes referencing the source', async () => {
    expect(app).toBeDefined();

    // Create source, term, and note
    const sourceResponse = await request(app)
      .post('/api/v1/sources')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        type: 'interview',
        fields: { interviewee: 'Test Person' },
      })
      .expect(201);

    const termResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Test Term',
        status: 'active',
      })
      .expect(201);

    await request(app)
      .post('/api/v1/notes')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        termId: termResponse.body._id,
        type: 'bibliographic',
        content: 'Note content',
        sourceIds: [sourceResponse.body._id],
      })
      .expect(201);

    // Attempt to delete source
    const deleteResponse = await request(app)
      .delete(`/api/v1/sources/${sourceResponse.body._id}`)
      .set('Authorization', `Basic ${adminAuth}`)
      .expect(200);

    // Should warn about notes also referencing the source
    expect(deleteResponse.body.warning).toMatch(/note/i);
  });
});
