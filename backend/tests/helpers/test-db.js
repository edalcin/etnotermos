// Test Database Utilities using mongodb-memory-server
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

let mongod = null;
let client = null;
let db = null;

/**
 * Connect to the in-memory database
 */
export async function connect() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  client = new MongoClient(uri);
  await client.connect();

  db = client.db('etnodb');

  return { client, db, uri };
}

/**
 * Drop database and close connection
 */
export async function closeDatabase() {
  if (client) {
    await client.close();
  }
  if (mongod) {
    await mongod.stop();
  }
}

/**
 * Clear all collections in the database
 */
export async function clearDatabase() {
  if (db) {
    const collections = await db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
}

/**
 * Get database instance
 */
export function getDb() {
  return db;
}

/**
 * Get collection
 */
export function getCollection(name) {
  return db.collection(name);
}

export default {
  connect,
  closeDatabase,
  clearDatabase,
  getDb,
  getCollection,
};
