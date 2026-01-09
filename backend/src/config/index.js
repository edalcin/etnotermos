// Configuration management for EtnoTermos
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI'];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`ERROR: Required environment variable ${varName} is not set`);
    process.exit(1);
  }
});

// Export configuration object
export const config = {
  // Server ports
  publicPort: parseInt(process.env.PUBLIC_PORT || '4000', 10),
  adminPort: parseInt(process.env.ADMIN_PORT || '4001', 10),

  // MongoDB connection
  mongoUri: process.env.MONGO_URI,
  mongoDbName: process.env.MONGO_DB_NAME || 'etnodb',
  mongoCollectionName: process.env.MONGO_COLLECTION_NAME || 'etnotermos',

  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // CORS
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:4000', 'http://localhost:4001'],

  // Rate limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window

  // Admin authentication (basic)
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'changeme',
};

// Log configuration on startup (excluding sensitive data)
if (config.isDevelopment) {
  console.log('Configuration loaded:', {
    publicPort: config.publicPort,
    adminPort: config.adminPort,
    nodeEnv: config.nodeEnv,
    mongoDbName: config.mongoDbName,
  });
}

export default config;
