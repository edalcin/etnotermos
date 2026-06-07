import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

let mongod = null;
let client = null;
let db = null;

export async function connect() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  client = new MongoClient(uri);
  await client.connect();
  db = client.db('etnodb');
  return { client, db, uri };
}

export async function disconnect() {
  if (client) await client.close();
  if (mongod) await mongod.stop();
  client = null;
  db = null;
  mongod = null;
}

export async function clearCollections() {
  if (!db) return;
  const cols = await db.collections();
  for (const col of cols) await col.deleteMany({});
}

export function getDb() {
  if (!db) throw new Error('Test DB not connected');
  return db;
}

export function getCollection(name) {
  return db.collection(name);
}

export default { connect, disconnect, clearCollections, getDb, getCollection };
