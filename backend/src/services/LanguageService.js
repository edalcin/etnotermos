// Language Service
// Service for managing languages

import { getCollection } from '../shared/database.js';
import { createLanguage, defaultLanguages } from '../models/Language.js';

/**
 * Get all languages
 */
export async function getAllLanguages() {
  const languages = getCollection('etnotermos-languages');
  return await languages.find({}).sort({ name: 1 }).toArray();
}

/**
 * Get language by code
 */
export async function getLanguageByCode(code) {
  const languages = getCollection('etnotermos-languages');
  const language = await languages.findOne({ code });

  if (!language) {
    throw new Error(`Language not found: ${code}`);
  }

  return language;
}

/**
 * Create a new language
 */
export async function createNewLanguage(data) {
  const languages = getCollection('etnotermos-languages');

  // Check if language code already exists
  const existing = await languages.findOne({ code: data.code });
  if (existing) {
    throw new Error(`Language code already exists: ${data.code}`);
  }

  const language = createLanguage(data);
  await languages.insertOne(language);

  return language;
}

/**
 * Seed default languages if collection is empty
 */
export async function seedDefaultLanguages() {
  const languages = getCollection('etnotermos-languages');

  const count = await languages.countDocuments();
  if (count === 0) {
    console.log('[LanguageService] Seeding default languages...');

    const languageDocs = defaultLanguages.map(lang => createLanguage(lang));
    await languages.insertMany(languageDocs);

    console.log(`[LanguageService] Seeded ${languageDocs.length} default languages`);
  }
}

export default {
  getAllLanguages,
  getLanguageByCode,
  createNewLanguage,
  seedDefaultLanguages,
};
