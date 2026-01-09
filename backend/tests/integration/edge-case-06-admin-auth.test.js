// Integration Test: Edge Case 6 - Admin authentication security (T045)
import request from 'supertest';
import { connect, closeDatabase, clearDatabase } from '../helpers/test-db.js';

describe('Edge Case 6: Admin authentication security', () => {
  let app;
  let dbConnection;
  const adminAuth = Buffer.from('admin:changeme').toString('base64');
  const invalidAuth = Buffer.from('wrong:credentials').toString('base64');

  beforeAll(async () => {
    dbConnection = await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  test('should return 401 for admin operations without authentication', async () => {
    expect(app).toBeDefined();

    // Test all admin endpoints
    await request(app)
      .post('/api/v1/terms')
      .send({ prefLabel: 'Test', status: 'active' })
      .expect(401);

    await request(app).put('/api/v1/terms/123').send({ prefLabel: 'Updated' }).expect(401);

    await request(app).delete('/api/v1/terms/123').expect(401);

    await request(app)
      .post('/api/v1/relationships')
      .send({ sourceTermId: '123', targetTermId: '456', type: 'RT' })
      .expect(401);

    await request(app)
      .post('/api/v1/notes')
      .send({ termId: '123', type: 'scope', content: 'Test' })
      .expect(401);

    await request(app).get('/api/v1/admin/dashboard').expect(401);
  });

  test('should return 401 for invalid credentials', async () => {
    expect(app).toBeDefined();

    const response = await request(app)
      .post('/api/v1/terms')
      .set('Authorization', `Basic ${invalidAuth}`)
      .send({ prefLabel: 'Test', status: 'active' })
      .expect(401);

    expect(response.body.error).toBeDefined();
  });

  test('should not leak data in 401 error responses', async () => {
    expect(app).toBeDefined();

    const response = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Basic ${invalidAuth}`)
      .expect(401);

    // Error message should not include sensitive data
    const errorBody = JSON.stringify(response.body);
    expect(errorBody).not.toMatch(/password/i);
    expect(errorBody).not.toMatch(/secret/i);
    expect(errorBody).not.toMatch(/changeme/i);

    // Should only contain generic error message
    expect(response.body.error).toBeDefined();
    expect(typeof response.body.error).toBe('string');
  });

  test('should accept valid admin credentials', async () => {
    expect(app).toBeDefined();

    // Valid credentials should work
    const response = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Basic ${adminAuth}`)
      .expect(200);

    expect(response.body).toHaveProperty('statistics');
  });

  test('should require WWW-Authenticate header on 401', async () => {
    expect(app).toBeDefined();

    const response = await request(app).get('/api/v1/admin/dashboard').expect(401);

    // Should include WWW-Authenticate header
    expect(response.headers['www-authenticate']).toBeDefined();
    expect(response.headers['www-authenticate']).toMatch(/Basic/);
  });

  test('should handle malformed Authorization headers', async () => {
    expect(app).toBeDefined();

    // Missing "Basic" prefix
    await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', 'InvalidFormat')
      .expect(401);

    // Invalid base64
    await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', 'Basic !!!invalid!!!')
      .expect(401);

    // Empty credentials
    await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', 'Basic ')
      .expect(401);
  });

  test('should not allow timing attacks via authentication', async () => {
    expect(app).toBeDefined();

    // Make multiple requests with invalid credentials
    // Response times should be consistent (no timing leaks)
    const startTime1 = Date.now();
    await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Basic ${Buffer.from('admin:wrong').toString('base64')}`);
    const duration1 = Date.now() - startTime1;

    const startTime2 = Date.now();
    await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Basic ${Buffer.from('wronguser:wrong').toString('base64')}`);
    const duration2 = Date.now() - startTime2;

    // Response times should be similar (within 100ms)
    const timingDifference = Math.abs(duration1 - duration2);
    expect(timingDifference).toBeLessThan(100);
  });
});
