// Integration Test: Edge Case 1 - Circular relationships (T040)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase } from '../helpers/test-db.js';

describe('Edge Case 1: Circular relationship prevention', () => {
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

  test('should prevent direct circular hierarchies (A→B→A)', async () => {
    expect(app).toBeDefined();

    // Create two terms
    const term1Response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Term A',
        definition: 'First term',
        status: 'active',
      })
      .expect(201);

    const term2Response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Term B',
        definition: 'Second term',
        status: 'active',
      })
      .expect(201);

    const term1Id = term1Response.body._id;
    const term2Id = term2Response.body._id;

    // Create A BT B (B is broader than A)
    await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        sourceTermId: term1Id,
        targetTermId: term2Id,
        type: 'BT',
      })
      .expect(201);

    // Attempt to create B BT A (circular!)
    const circularResponse = await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        sourceTermId: term2Id,
        targetTermId: term1Id,
        type: 'BT',
      })
      .expect(400);

    // Verify clear error message
    expect(circularResponse.body.error).toMatch(/circular/i);
    expect(circularResponse.body.error).toMatch(/hierarchy/i);
  });

  test('should prevent indirect circular hierarchies (A→B→C→A)', async () => {
    expect(app).toBeDefined();

    // Create three terms
    const term1Response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({ prefLabel: 'Term A', status: 'active' })
      .expect(201);

    const term2Response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({ prefLabel: 'Term B', status: 'active' })
      .expect(201);

    const term3Response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({ prefLabel: 'Term C', status: 'active' })
      .expect(201);

    const term1Id = term1Response.body._id;
    const term2Id = term2Response.body._id;
    const term3Id = term3Response.body._id;

    // Create A BT B
    await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({ sourceTermId: term1Id, targetTermId: term2Id, type: 'BT' })
      .expect(201);

    // Create B BT C
    await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({ sourceTermId: term2Id, targetTermId: term3Id, type: 'BT' })
      .expect(201);

    // Attempt to create C BT A (creates circle: A→B→C→A)
    const circularResponse = await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({ sourceTermId: term3Id, targetTermId: term1Id, type: 'BT' })
      .expect(400);

    expect(circularResponse.body.error).toMatch(/circular/i);
  });
});
