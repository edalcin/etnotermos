// Contract Test: Admin POST /api/v1/relationships - T023
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { validateResponse } from './setup.js';
import { ObjectId } from 'mongodb';

describe('Contract: POST /api/v1/relationships', () => {
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

  test('should return 201 with created relationship and reciprocal', async () => {
    expect(app).toBeDefined(); // Will fail - app not yet created

    // Insert two test terms
    const terms = getCollection('etnotermos');
    const parentTerm = {
      _id: new ObjectId(),
      prefLabel: 'Plant',
      status: 'active',
    };
    const childTerm = {
      _id: new ObjectId(),
      prefLabel: 'Tree',
      status: 'active',
    };
    await terms.insertMany([parentTerm, childTerm]);

    const newRelationship = {
      sourceTermId: childTerm._id.toString(),
      targetTermId: parentTerm._id.toString(),
      type: 'BT', // Broader Term
    };

    const response = await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send(newRelationship)
      .expect(201);

    // Validate response
    expect(response.body).toHaveProperty('_id');
    expect(response.body).toHaveProperty('type', 'BT');
    expect(response.body).toHaveProperty('reciprocalType', 'NT'); // Automatically generated

    // Verify reciprocal relationship was created
    const relationships = getCollection('etnotermos-relationships');
    const reciprocal = await relationships.findOne({
      sourceTermId: parentTerm._id,
      targetTermId: childTerm._id,
      type: 'NT',
    });
    expect(reciprocal).not.toBeNull();
  });

  test('should validate relationship type', async () => {
    expect(app).toBeDefined();

    const terms = getCollection('etnotermos');
    const term1 = { _id: new ObjectId(), prefLabel: 'Term 1' };
    const term2 = { _id: new ObjectId(), prefLabel: 'Term 2' };
    await terms.insertMany([term1, term2]);

    const invalidRelationship = {
      sourceTermId: term1._id.toString(),
      targetTermId: term2._id.toString(),
      type: 'INVALID_TYPE',
    };

    await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send(invalidRelationship)
      .expect(400);
  });

  test('should prevent circular hierarchies', async () => {
    expect(app).toBeDefined();

    const terms = getCollection('etnotermos');
    const term1 = { _id: new ObjectId(), prefLabel: 'Term 1' };
    const term2 = { _id: new ObjectId(), prefLabel: 'Term 2' };
    await terms.insertMany([term1, term2]);

    // Create relationship: term1 BT term2 (term2 is broader)
    const relationships = getCollection('etnotermos-relationships');
    await relationships.insertOne({
      sourceTermId: term1._id,
      targetTermId: term2._id,
      type: 'BT',
      createdAt: new Date(),
    });

    // Try to create circular relationship: term2 BT term1
    const circularRelationship = {
      sourceTermId: term2._id.toString(),
      targetTermId: term1._id.toString(),
      type: 'BT',
    };

    await request(app)
      .post('/api/v1/relationships')
      .set('Authorization', `Basic ${adminAuth}`)
      .send(circularRelationship)
      .expect(400);
  });

  test('should return 401 without authentication', async () => {
    expect(app).toBeDefined();

    await request(app)
      .post('/api/v1/relationships')
      .send({
        sourceTermId: new ObjectId().toString(),
        targetTermId: new ObjectId().toString(),
        type: 'RT',
      })
      .expect(401);
  });
});
