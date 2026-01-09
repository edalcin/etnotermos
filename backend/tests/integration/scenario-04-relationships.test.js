// Integration Test: Acceptance Scenario 4 - Many-to-many relationships (T033)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase } from '../helpers/test-db.js';

describe('Scenario 4: Establish many-to-many relationships', () => {
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

  test('should create bidirectional relationships navigable from both terms', async () => {
    expect(app).toBeDefined(); // Will fail - app not yet created

    // Step 1: Create three terms
    const term1Response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Açaí',
        definition: 'Fruto medicinal',
        status: 'active',
      })
      .expect(201);

    const term2Response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Guaraná',
        definition: 'Semente energética',
        status: 'active',
      })
      .expect(201);

    const term3Response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Cupuaçu',
        definition: 'Fruto nutricional',
        status: 'active',
      })
      .expect(201);

    const term1Id = term1Response.body._id;
    const term2Id = term2Response.body._id;
    const term3Id = term3Response.body._id;

    // Step 2: Create multiple relationships (many-to-many)
    // Açaí related to Guaraná
    const rel1Response = await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        sourceTermId: term1Id,
        targetTermId: term2Id,
        type: 'RT', // Related Term
      })
      .expect(201);

    // Açaí related to Cupuaçu
    const rel2Response = await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        sourceTermId: term1Id,
        targetTermId: term3Id,
        type: 'RT',
      })
      .expect(201);

    // Guaraná related to Cupuaçu
    const rel3Response = await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        sourceTermId: term2Id,
        targetTermId: term3Id,
        type: 'RT',
      })
      .expect(201);

    // Step 3: Verify bidirectional navigation from Açaí
    const acaiRelationships = await request(app)
      .get(`/api/v1/relationships/${term1Id}`)
      .expect(200);

    expect(acaiRelationships.body.length).toBe(2);
    const acaiTargets = acaiRelationships.body.map((r) => r.targetTermId);
    expect(acaiTargets).toContain(term2Id);
    expect(acaiTargets).toContain(term3Id);

    // Step 4: Verify bidirectional navigation from Guaraná
    const guaranaRelationships = await request(app)
      .get(`/api/v1/relationships/${term2Id}`)
      .expect(200);

    expect(guaranaRelationships.body.length).toBeGreaterThanOrEqual(2);
    const guaranaTargets = guaranaRelationships.body.map((r) => r.targetTermId);

    // Should see Açaí (reciprocal) and Cupuaçu
    expect(guaranaTargets).toContain(term1Id); // Reciprocal from Açaí
    expect(guaranaTargets).toContain(term3Id);

    // Step 5: Verify bidirectional navigation from Cupuaçu
    const cupuacuRelationships = await request(app)
      .get(`/api/v1/relationships/${term3Id}`)
      .expect(200);

    expect(cupuacuRelationships.body.length).toBeGreaterThanOrEqual(2);
    const cupuacuTargets = cupuacuRelationships.body.map((r) => r.targetTermId);

    // Should see both Açaí and Guaraná (reciprocals)
    expect(cupuacuTargets).toContain(term1Id);
    expect(cupuacuTargets).toContain(term2Id);

    // Step 6: Verify reciprocal relationships were auto-created
    // For RT relationships, reciprocal should also be RT
    acaiRelationships.body.forEach((rel) => {
      expect(rel.type).toBe('RT');
      expect(rel).toHaveProperty('reciprocalType', 'RT');
    });
  });

  test('should support hierarchical relationships (BT/NT)', async () => {
    expect(app).toBeDefined();

    // Create parent and child terms
    const parentResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Plantas da Amazônia',
        definition: 'Termo genérico',
        status: 'active',
      })
      .expect(201);

    const childResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Açaí',
        definition: 'Termo específico',
        status: 'active',
      })
      .expect(201);

    const parentId = parentResponse.body._id;
    const childId = childResponse.body._id;

    // Create BT relationship (child -> parent)
    await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        sourceTermId: childId,
        targetTermId: parentId,
        type: 'BT',
      })
      .expect(201);

    // Verify reciprocal NT was created (parent -> child)
    const parentRelationships = await request(app)
      .get(`/api/v1/relationships/${parentId}`)
      .expect(200);

    const ntRelationships = parentRelationships.body.filter((r) => r.type === 'NT');
    expect(ntRelationships.length).toBeGreaterThan(0);
    expect(ntRelationships[0].targetTermId).toBe(childId);
  });
});
