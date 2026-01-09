// Contract Test: Admin DELETE /api/v1/terms/:id - T022
import request from 'supertest';
import { connect, closeDatabase, clearDatabase, getCollection } from '../helpers/test-db.js';
import { validateResponse } from './setup.js';
import { ObjectId } from 'mongodb';

describe('Contract: DELETE /api/v1/terms/:id', () => {
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

  test('should return 200 when term is deleted successfully', async () => {
    expect(app).toBeDefined(); // Will fail - app not yet created

    // Insert a test term with no dependencies
    const terms = getCollection('etnotermos');
    const testTerm = {
      _id: new ObjectId(),
      prefLabel: 'Term to Delete',
      definition: 'Will be deleted',
      status: 'active',
      createdAt: new Date(),
    };
    await terms.insertOne(testTerm);

    const response = await request(app)
      .delete(`/api/v1/terms/${testTerm._id.toString()}`)
      .set('Authorization', `Basic ${adminAuth}`)
      .expect(200);

    // Validate response
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toMatch(/deleted/i);

    // Verify term is deleted
    const deletedTerm = await terms.findOne({ _id: testTerm._id });
    expect(deletedTerm).toBeNull();
  });

  test('should return warning when term has dependencies', async () => {
    expect(app).toBeDefined();

    // Insert a parent term
    const terms = getCollection('etnotermos');
    const parentTerm = {
      _id: new ObjectId(),
      prefLabel: 'Parent Term',
      definition: 'Has children',
      status: 'active',
      createdAt: new Date(),
    };
    await terms.insertOne(parentTerm);

    // Insert a child term with BT relationship
    const childTerm = {
      _id: new ObjectId(),
      prefLabel: 'Child Term',
      definition: 'Depends on parent',
      status: 'active',
      createdAt: new Date(),
    };
    await terms.insertOne(childTerm);

    // Create relationship
    const relationships = getCollection('etnotermos-relationships');
    await relationships.insertOne({
      sourceTermId: childTerm._id,
      targetTermId: parentTerm._id,
      type: 'BT',
      createdAt: new Date(),
    });

    const response = await request(app)
      .delete(`/api/v1/terms/${parentTerm._id.toString()}`)
      .set('Authorization', `Basic ${adminAuth}`)
      .expect(200);

    // Should include warning about dependencies
    expect(response.body).toHaveProperty('warning');
    expect(response.body).toHaveProperty('dependencies');
    expect(response.body.dependencies.length).toBeGreaterThan(0);
  });

  test('should return 404 for non-existent term', async () => {
    expect(app).toBeDefined();

    const nonExistentId = new ObjectId().toString();

    await request(app)
      .delete(`/api/v1/terms/${nonExistentId}`)
      .set('Authorization', `Basic ${adminAuth}`)
      .expect(404);
  });

  test('should return 401 without authentication', async () => {
    expect(app).toBeDefined();

    const terms = getCollection('etnotermos');
    const testTerm = {
      _id: new ObjectId(),
      prefLabel: 'Test Term',
    };
    await terms.insertOne(testTerm);

    await request(app)
      .delete(`/api/v1/terms/${testTerm._id.toString()}`)
      .expect(401);
  });
});
