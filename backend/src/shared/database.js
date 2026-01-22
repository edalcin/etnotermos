// MongoDB Connection Management for EtnoTermos
import { MongoClient } from 'mongodb';
import { config } from '../config/index.js';

// MongoDB client instance
let client = null;
let db = null;
let collections = {};

/**
 * Connection options with retry logic
 */
const connectionOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Ensure text search index exists on etnotermos collection
 * This is critical for the search functionality to work
 */
async function ensureTextSearchIndex() {
  try {
    const termsCollection = collections['etnotermos'];
    const indexes = await termsCollection.indexes();

    // Check if text search index already exists
    const textIndexExists = indexes.some(idx => idx.name === 'etnotermos_text_search');

    if (textIndexExists) {
      // Check if the index has language_override (old version)
      const existingIndex = indexes.find(idx => idx.name === 'etnotermos_text_search');
      if (existingIndex && existingIndex.language_override) {
        console.log('Dropping old text search index with language_override...');
        await termsCollection.dropIndex('etnotermos_text_search');
      } else {
        console.log('✓ Text search index already exists');
        return;
      }
    }

    console.log('Creating text search index on etnotermos collection...');
    await termsCollection.createIndex(
      {
        prefLabel: 'text',
        altLabels: 'text',
        hiddenLabels: 'text',
        definition: 'text',
        scopeNote: 'text',
        example: 'text',
      },
      {
        name: 'etnotermos_text_search',
        weights: {
          prefLabel: 10,
          altLabels: 5,
          definition: 3,
          scopeNote: 2,
          example: 1,
          hiddenLabels: 1,
        },
        default_language: 'portuguese',
        // No language_override to allow custom language codes
      }
    );
    console.log('✓ Text search index created successfully');
  } catch (error) {
    console.error('Warning: Failed to ensure text search index:', error.message);
    // Don't throw - allow server to start even if index creation fails
  }
}

/**
 * Connect to MongoDB with retry logic
 * @param {number} retries - Number of retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<MongoClient>}
 */
export async function connectToDatabase(retries = 5, delay = 2000) {
  if (client && client.topology && client.topology.isConnected()) {
    console.log('MongoDB already connected');
    return client;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Connecting to MongoDB (attempt ${attempt}/${retries})...`);
      client = new MongoClient(config.mongoUri, connectionOptions);
      await client.connect();

      // Verify connection
      await client.db('admin').command({ ping: 1 });

      db = client.db(config.mongoDbName);
      console.log(`Successfully connected to MongoDB database: ${config.mongoDbName}`);

      // Initialize collection references
      collections = {
        'etnotermos': db.collection('etnotermos'),
        'etnotermos-notes': db.collection('etnotermos-notes'),
        'etnotermos-relationships': db.collection('etnotermos-relationships'),
        'etnotermos-sources': db.collection('etnotermos-sources'),
        'etnotermos-collections': db.collection('etnotermos-collections'),
        'etnotermos-audit-logs': db.collection('etnotermos-audit-logs'),
        'etnotermos-languages': db.collection('etnotermos-languages'),
      };

      // Ensure text search index exists
      await ensureTextSearchIndex();

      // Setup connection event handlers
      setupEventHandlers(client);

      return client;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, error.message);

      if (attempt === retries) {
        console.error('Failed to connect to MongoDB after all retries');
        throw error;
      }

      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Setup MongoDB connection event handlers
 * @param {MongoClient} client - MongoDB client instance
 */
function setupEventHandlers(client) {
  client.on('serverHeartbeatSucceeded', () => {
    if (config.isDevelopment) {
      console.log('MongoDB heartbeat succeeded');
    }
  });

  client.on('serverHeartbeatFailed', (event) => {
    console.error('MongoDB heartbeat failed:', event);
  });

  client.on('connectionPoolCreated', () => {
    console.log('MongoDB connection pool created');
  });

  client.on('connectionPoolClosed', () => {
    console.log('MongoDB connection pool closed');
  });

  client.on('error', (error) => {
    console.error('MongoDB client error:', error);
  });
}

/**
 * Close MongoDB connection gracefully
 */
export async function closeDatabaseConnection() {
  if (client) {
    console.log('Closing MongoDB connection...');
    await client.close();
    client = null;
    db = null;
    collections = {};
    console.log('MongoDB connection closed');
  }
}

/**
 * Get database instance
 * @returns {Db} MongoDB database instance
 */
export function getDatabase() {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

/**
 * Get collection references
 * @returns {Object} Object containing all collection references
 */
export function getCollections() {
  if (!collections || Object.keys(collections).length === 0) {
    throw new Error('Collections not initialized. Call connectToDatabase() first.');
  }
  return collections;
}

/**
 * Get a specific collection
 * @param {string} collectionName - Name of the collection
 * @returns {Collection} MongoDB collection
 */
export function getCollection(collectionName) {
  const cols = getCollections();
  if (!cols[collectionName]) {
    throw new Error(`Collection ${collectionName} not found`);
  }
  return cols[collectionName];
}

/**
 * Check if database is connected
 * @returns {boolean}
 */
export function isConnected() {
  return client && client.topology && client.topology.isConnected();
}

// Handle process termination
process.on('SIGINT', async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

export default {
  connectToDatabase,
  closeDatabaseConnection,
  getDatabase,
  getCollections,
  getCollection,
  isConnected,
};
