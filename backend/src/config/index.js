import dotenv from 'dotenv';
dotenv.config();

function parseAdminUsers() {
  const raw = process.env.ADMIN_USERS;
  if (!raw) return null;
  try {
    const users = JSON.parse(raw);
    if (!Array.isArray(users) || users.length === 0) {
      throw new Error('ADMIN_USERS must be a non-empty JSON array');
    }
    return users;
  } catch (err) {
    console.error('ERROR: ADMIN_USERS must be valid JSON array: [{"username":"x","passwordHash":"$2b$..."}]');
    console.error(err.message);
    return null;
  }
}

export const config = {
  publicPort: parseInt(process.env.PUBLIC_PORT || '4000', 10),
  adminPort: parseInt(process.env.ADMIN_PORT || '4001', 10),

  mongodbUri: process.env.MONGODB_URI || process.env.MONGO_URI || null,
  mongoDbName: process.env.MONGO_DB_NAME || 'etnodb',

  adminUsers: parseAdminUsers(),

  audioStoragePath: process.env.AUDIO_STORAGE_PATH || '/data/audio',

  acquisitionCronSchedule: process.env.ACQUISITION_CRON_SCHEDULE || '0 3 * * *',

  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
};

export function validateConfig() {
  const errors = [];
  if (!config.mongodbUri) errors.push('MONGODB_URI is not set');
  if (!config.adminUsers) errors.push('ADMIN_USERS is not set or invalid');
  return errors;
}

export default config;
