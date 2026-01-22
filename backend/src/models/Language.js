// Language Model
// Model for managing available languages in the system

import { ObjectId } from 'mongodb';

/**
 * JSON Schema for Language validation
 */
export const languageSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['code', 'name', 'createdAt'],
    properties: {
      _id: {
        bsonType: 'objectId',
      },
      code: {
        bsonType: 'string',
        description: 'Language code (e.g., pt-BR, en, es)',
      },
      name: {
        bsonType: 'string',
        description: 'Language name (e.g., Português (Brasil), English, Español)',
      },
      nativeName: {
        bsonType: 'string',
        description: 'Language name in its native form',
      },
      createdAt: {
        bsonType: 'date',
        description: 'Creation timestamp',
      },
    },
  },
};

/**
 * Validate language code
 */
export function validateLanguageCode(code) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Language code is required and must be a string' };
  }

  if (code.trim().length === 0) {
    return { valid: false, error: 'Language code cannot be empty' };
  }

  if (code.length > 20) {
    return { valid: false, error: 'Language code cannot exceed 20 characters' };
  }

  return { valid: true };
}

/**
 * Validate language name
 */
export function validateLanguageName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Language name is required and must be a string' };
  }

  if (name.trim().length === 0) {
    return { valid: false, error: 'Language name cannot be empty' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Language name cannot exceed 100 characters' };
  }

  return { valid: true };
}

/**
 * Create a new language document
 */
export function createLanguage(data) {
  const codeValidation = validateLanguageCode(data.code);
  if (!codeValidation.valid) {
    throw new Error(codeValidation.error);
  }

  const nameValidation = validateLanguageName(data.name);
  if (!nameValidation.valid) {
    throw new Error(nameValidation.error);
  }

  return {
    _id: new ObjectId(),
    code: data.code.trim(),
    name: data.name.trim(),
    nativeName: data.nativeName?.trim() || data.name.trim(),
    createdAt: new Date(),
  };
}

/**
 * Default languages to seed database
 */
export const defaultLanguages = [
  {
    code: 'pt-BR',
    name: 'Português (Brasil)',
    nativeName: 'Português (Brasil)',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
  {
    code: 'es',
    name: 'Español',
    nativeName: 'Español',
  },
  {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
  },
  {
    code: 'de',
    name: 'Deutsch',
    nativeName: 'Deutsch',
  },
  {
    code: 'it',
    name: 'Italiano',
    nativeName: 'Italiano',
  },
];

export default {
  languageSchema,
  validateLanguageCode,
  validateLanguageName,
  createLanguage,
  defaultLanguages,
};
