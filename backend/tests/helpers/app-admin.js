// Returns an Express app wired to the provided db (for Supertest — no listen())
// Populated when admin server is implemented (T028+).
export async function createTestApp(db) {
  const { createApp } = await import('../../src/contexts/admin/server.js');
  return createApp(db);
}

// Base64-encode credentials for Basic Auth header
export function basicAuthHeader(username, password) {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}
