// Integration Test: Edge Case 4 - Duplicate term detection (T043)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase } from '../helpers/test-db.js';

describe('Edge Case 4: Duplicate term detection and resolution', () => {
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

  test('should detect duplicate preferred terms', async () => {
    expect(app).toBeDefined();

    // Create first term
    await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Açaí',
        definition: 'First definition',
        status: 'active',
      })
      .expect(201);

    // Attempt to create duplicate
    const duplicateResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Açaí',
        definition: 'Second definition',
        status: 'active',
      })
      .expect(400);

    expect(duplicateResponse.body.error).toMatch(/duplicate/i);
    expect(duplicateResponse.body.error).toMatch(/Açaí/);
  });

  test('should provide resolution options for CSV import duplicates', async () => {
    expect(app).toBeDefined();

    // Create existing term
    const existingResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Existing Term',
        definition: 'Original definition',
        status: 'active',
      })
      .expect(201);

    const existingId = existingResponse.body._id;

    // Simulate CSV import with duplicate
    const csvData = `preferred_name,definition,status
Existing Term,Updated definition from CSV,active
New Term,Brand new term,active`;

    // Upload CSV (simulated)
    const importResponse = await request(app)
      .post('/api/v1/admin/import/preview')
      .set('Authorization', `Basic ${adminAuth}`)
      .set('Content-Type', 'text/csv')
      .send(csvData)
      .expect(200);

    // Verify conflict detection
    expect(importResponse.body).toHaveProperty('conflicts');
    expect(importResponse.body.conflicts.length).toBeGreaterThan(0);

    const conflict = importResponse.body.conflicts[0];
    expect(conflict).toHaveProperty('prefLabel', 'Existing Term');
    expect(conflict).toHaveProperty('existingTermId', existingId);
    expect(conflict).toHaveProperty('resolutionOptions');

    // Resolution options should include: skip, overwrite, merge
    expect(conflict.resolutionOptions).toContain('skip');
    expect(conflict.resolutionOptions).toContain('overwrite');
    expect(conflict.resolutionOptions).toContain('merge');
  });

  test('should allow case-sensitive distinction', async () => {
    expect(app).toBeDefined();

    // Create term with lowercase
    await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'açaí',
        definition: 'Lowercase version',
        status: 'active',
      })
      .expect(201);

    // Create term with uppercase (should be allowed if case-sensitive)
    // OR should be rejected if case-insensitive duplicates are checked
    const uppercaseResponse = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${adminAuth}`)
      .send({
        prefLabel: 'Açaí',
        definition: 'Uppercase version',
        status: 'active',
      });

    // System should either allow (201) or reject (400) based on configuration
    expect([201, 400]).toContain(uppercaseResponse.status);
  });
});
