// Returns an Express app wired to the provided db (for Supertest — no listen())
// Populated when public server is implemented (T025/T026/T027).
// Import createApp from the public context once it's built.
export async function createTestApp(db) {
  const { createApp } = await import('../../src/contexts/public/server.js');
  return createApp(db);
}
