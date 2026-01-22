// Language Model
// Model for managing available languages in the system

import { ObjectId } from 'mongodb';

/**
 * JSON Schema for Language validation
 */
export const languageSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['name', 'createdAt'],
    properties: {
      _id: {
        bsonType: 'objectId',
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
  const nameValidation = validateLanguageName(data.name);
  if (!nameValidation.valid) {
    throw new Error(nameValidation.error);
  }

  return {
    _id: new ObjectId(),
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
    name: 'Português (Brasil)',
    nativeName: 'Português (Brasil)',
  },
  {
    name: 'English',
    nativeName: 'English',
  },
  {
    name: 'Español',
    nativeName: 'Español',
  },
  {
    name: 'Français',
    nativeName: 'Français',
  },
  {
    name: 'Deutsch',
    nativeName: 'Deutsch',
  },
  {
    name: 'Italiano',
    nativeName: 'Italiano',
  },
];

export default {
  languageSchema,
  validateLanguageName,
  createLanguage,
  defaultLanguages,
};
