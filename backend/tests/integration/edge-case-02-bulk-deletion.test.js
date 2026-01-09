// Integration Test: Edge Case 2 - Bulk deletion warnings (T041)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase } from '../helpers/test-db.js';

describe('Edge Case 2: Bulk deletion with many dependencies', () => {
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

  test('should warn about all 50 dependencies before deletion', async () => {
    expect(app).toBeDefined();

    // Create parent term
    const parentResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Parent Term',
        definition: 'Has many children',
        status: 'active',
      })
      .expect(201);

    const parentId = parentResponse.body._id;

    // Create 50 child terms with relationships
    const createPromises = [];
    for (let i = 0; i < 50; i++) {
      const promise = (async () => {
        const childResponse = await request(app)
          .post('/api/v1/terms')
          .set('Authorization', `Basic ${adminAuth}`)
          .send({
            prefLabel: `Child Term ${i + 1}`,
            definition: `Child ${i + 1}`,
            status: 'active',
          });

        await request(app)
          .post('/api/v1/relationships')
          .set('Authorization', `Basic ${adminAuth}`)
          .send({
            sourceTermId: childResponse.body._id,
            targetTermId: parentId,
            type: 'BT',
          });
      })();

      createPromises.push(promise);
    }

    await Promise.all(createPromises);

    // Attempt to delete parent
    const deleteResponse = await request(app)
      .delete(`/api/v1/terms/${parentId}`)
      .set('Authorization', `Basic ${adminAuth}`)
      .expect(200);

    // Verify warning lists all dependencies
    expect(deleteResponse.body).toHaveProperty('warning');
    expect(deleteResponse.body).toHaveProperty('dependencies');
    expect(deleteResponse.body.dependencies.length).toBe(50);

    // Verify dependency information is useful
    expect(deleteResponse.body.dependencies[0]).toHaveProperty('termId');
    expect(deleteResponse.body.dependencies[0]).toHaveProperty('prefLabel');
    expect(deleteResponse.body.dependencies[0]).toHaveProperty('relationshipType');

    // Verify confirmation is required
    expect(deleteResponse.body).toHaveProperty('requiresConfirmation', true);
  });
});
