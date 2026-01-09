// Contract Test: Admin POST /api/v1/notes - T025
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { validateResponse } from './setup.js';
import { ObjectId } from 'mongodb';

describe('Contract: POST /api/v1/notes', () => {
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

  test('should return 201 with created note', async () => {
    expect(app).toBeDefined(); // Will fail - app not yet created

    // Insert a test term
    const terms = getCollection('etnotermos');
    const testTerm = { _id: new ObjectId(), prefLabel: 'Test Term' };
    await terms.insertOne(testTerm);

    const newNote = {
      termId: testTerm._id.toString(),
      type: 'scope',
      content: 'This term is used in the context of medicinal plants.',
    };

    const response = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', `Basic ${adminAuth}`)
      .send(newNote)
      .expect(201);

    // Validate response
    expect(response.body).toHaveProperty('_id');
    expect(response.body).toHaveProperty('termId', testTerm._id.toString());
    expect(response.body).toHaveProperty('type', 'scope');
    expect(response.body).toHaveProperty('content');
  });

  test('should validate note type enum', async () => {
    expect(app).toBeDefined();

    const terms = getCollection('etnotermos');
    const testTerm = { _id: new ObjectId(), prefLabel: 'Test Term' };
    await terms.insertOne(testTerm);

    const invalidNote = {
      termId: testTerm._id.toString(),
      type: 'invalid_type',
      content: 'Some content',
    };

    await request(app)
      .post('/api/v1/notes')
      .set('Authorization', `Basic ${adminAuth}`)
      .send(invalidNote)
      .expect(400);
  });

  test('should allow all valid note types', async () => {
    expect(app).toBeDefined();

    const terms = getCollection('etnotermos');
    const testTerm = { _id: new ObjectId(), prefLabel: 'Test Term' };
    await terms.insertOne(testTerm);

    const validTypes = ['scope', 'cataloger', 'historical', 'bibliographic', 'definition', 'example'];

    for (const type of validTypes) {
      const note = {
        termId: testTerm._id.toString(),
        type,
        content: `${type} note content`,
      };

      await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Basic ${adminAuth}`)
        .send(note)
        .expect(201);
    }
  });

  test('should return 401 without authentication', async () => {
    expect(app).toBeDefined();

    await request(app)
      .post('/api/v1/notes')
      .send({
        termId: new ObjectId().toString(),
        type: 'scope',
        content: 'Test',
      })
      .expect(401);
  });
});
