import { MongoClient } from 'mongodb';
import { config } from '../config/index.js';

let client = null;
let db = null;

export async function connect() {
  if (client) return client;

  client = new MongoClient(config.mongodbUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  await client.db('admin').command({ ping: 1 });
  db = client.db(config.mongoDbName);

  process.on('SIGINT', disconnect);
  process.on('SIGTERM', disconnect);

  return client;
}

export async function disconnect() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function getDb() {
  if (!db) throw new Error('Database not connected. Call connect() first.');
  return db;
}

export function isConnected() {
  return !!client;
}

export default { connect, disconnect, getDb, isConnected };
