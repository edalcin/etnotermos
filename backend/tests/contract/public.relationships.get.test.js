// Contract Test: Public GET /api/v1/relationships/:termId - T024
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { validateResponse } from './setup.js';
import { ObjectId } from 'mongodb';

describe('Contract: GET /api/v1/relationships/:termId', () => {
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

  test('should return 200 with all relationships for a term', async () => {
    expect(app).toBeDefined(); // Will fail - app not yet created

    // Insert test terms
    const terms = getCollection('etnotermos');
    const mainTerm = { _id: new ObjectId(), prefLabel: 'Main Term' };
    const relatedTerm1 = { _id: new ObjectId(), prefLabel: 'Related 1' };
    const relatedTerm2 = { _id: new ObjectId(), prefLabel: 'Related 2' };
    await terms.insertMany([mainTerm, relatedTerm1, relatedTerm2]);

    // Insert relationships
    const relationships = getCollection('etnotermos-relationships');
    await relationships.insertMany([
      {
        sourceTermId: mainTerm._id,
        targetTermId: relatedTerm1._id,
        type: 'RT',
        createdAt: new Date(),
      },
      {
        sourceTermId: mainTerm._id,
        targetTermId: relatedTerm2._id,
        type: 'BT',
        createdAt: new Date(),
      },
    ]);

    const response = await request(app)
      .get(`/api/v1/relationships/${mainTerm._id.toString()}`)
      .expect(200);

    // Validate response
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('type');
    expect(response.body[0]).toHaveProperty('targetTermId');
  });

  test('should return empty array when term has no relationships', async () => {
    expect(app).toBeDefined();

    const terms = getCollection('etnotermos');
    const loneTerm = { _id: new ObjectId(), prefLabel: 'Lone Term' };
    await terms.insertOne(loneTerm);

    const response = await request(app)
      .get(`/api/v1/relationships/${loneTerm._id.toString()}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  test('should support filtering by relationship type', async () => {
    expect(app).toBeDefined();

    const terms = getCollection('etnotermos');
    const mainTerm = { _id: new ObjectId(), prefLabel: 'Main' };
    await terms.insertOne(mainTerm);

    const response = await request(app)
      .get(`/api/v1/relationships/${mainTerm._id.toString()}`)
      .query({ type: 'BT' })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});
