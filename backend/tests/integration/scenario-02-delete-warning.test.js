// Integration Test: Acceptance Scenario 2 - Delete warning for dependent terms (T031)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase } from '../helpers/test-db.js';

describe('Scenario 2: Delete warning for parent term with dependencies', () => {
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

  test('should warn about dependent child terms before deletion', async () => {
    expect(app).toBeDefined(); // Will fail - app not yet created

    // Step 1: Create parent term (broader term)
    const parentResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Plantas Medicinais',
        definition: 'Termo geral para plantas com propriedades medicinais',
        status: 'active',
      })
      .expect(201);

    const parentId = parentResponse.body._id;

    // Step 2: Create child terms (narrower terms)
    const child1Response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Açaí',
        definition: 'Planta medicinal específica',
        status: 'active',
      })
      .expect(201);

    const child1Id = child1Response.body._id;

    const child2Response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Guaraná',
        definition: 'Outra planta medicinal específica',
        status: 'active',
      })
      .expect(201);

    const child2Id = child2Response.body._id;

    // Step 3: Create hierarchical relationships (BT/NT)
    await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        sourceTermId: child1Id,
        targetTermId: parentId,
        type: 'BT', // child1 has broader term parent
      })
      .expect(201);

    await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        sourceTermId: child2Id,
        targetTermId: parentId,
        type: 'BT', // child2 has broader term parent
      })
      .expect(201);

    // Step 4: Attempt to delete parent term
    const deleteResponse = await request(app)
      .delete(`/api/v1/terms/${parentId}`)
      .set('Authorization', `Basic ${adminAuth}`)
      .expect(200);

    // Step 5: Verify warning about dependencies
    expect(deleteResponse.body).toHaveProperty('warning');
    expect(deleteResponse.body.warning).toMatch(/dependent/i);
    expect(deleteResponse.body).toHaveProperty('dependencies');
    expect(Array.isArray(deleteResponse.body.dependencies)).toBe(true);
    expect(deleteResponse.body.dependencies.length).toBe(2);

    // Verify dependency details include child terms
    const dependencyIds = deleteResponse.body.dependencies.map((dep) => dep.termId);
    expect(dependencyIds).toContain(child1Id);
    expect(dependencyIds).toContain(child2Id);

    // Step 6: Verify parent term still exists (not deleted without confirmation)
    const getParentResponse = await request(app).get(`/api/v1/terms/${parentId}`).expect(200);

    expect(getParentResponse.body.prefLabel).toBe('Plantas Medicinais');
  });

  test('should allow deletion with confirmation flag when dependencies exist', async () => {
    expect(app).toBeDefined();

    // Create parent and child terms with relationship
    const parentResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Parent Term',
        definition: 'Parent',
        status: 'active',
      })
      .expect(201);

    const childResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Child Term',
        definition: 'Child',
        status: 'active',
      })
      .expect(201);

    await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        sourceTermId: childResponse.body._id,
        targetTermId: parentResponse.body._id,
        type: 'BT',
      })
      .expect(201);

    // Delete with confirmation flag
    await request(app)
      .delete(`/api/v1/terms/${parentResponse.body._id}`)
      .set('Authorization', `Basic ${adminAuth}`)
      .query({ confirm: 'true' })
      .expect(200);

    // Verify term is actually deleted
    await request(app).get(`/api/v1/terms/${parentResponse.body._id}`).expect(404);
  });
});
