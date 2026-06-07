import { ObjectId } from 'mongodb';
import {
  validateLabelUniqueness,
  validateNoCycle,
  validateSinglePrefLabelPerLanguage,
  validateDeprecation,
  validateLabelType,
  validateAccessLevel,
} from '../../src/lib/skosxl/validation.js';

function makeLabel(overrides = {}) {
  return {
    _id: new ObjectId(),
    literalForm: 'erva-mate',
    language: 'pt',
    type: 'pref',
    accessLevel: 'public',
    ...overrides,
  };
}

function makeConcept(overrides = {}) {
  return {
    _id: new ObjectId(),
    prefLabels: [makeLabel({ type: 'pref', literalForm: 'erva-mate' })],
    altLabels: [],
    hiddenLabels: [],
    ancestors: [],
    ...overrides,
  };
}

describe('validateLabelUniqueness', () => {
  test('passes when no existing labels conflict', () => {
    const concept = makeConcept();
    expect(() =>
      validateLabelUniqueness(concept, { literalForm: 'ilex', language: 'pt', type: 'alt' })
    ).not.toThrow();
  });

  test('throws on exact duplicate (literalForm + language + type)', () => {
    const concept = makeConcept();
    expect(() =>
      validateLabelUniqueness(concept, { literalForm: 'erva-mate', language: 'pt', type: 'pref' })
    ).toThrow();
  });

  test('allows same literalForm with different type', () => {
    const concept = makeConcept();
    expect(() =>
      validateLabelUniqueness(concept, { literalForm: 'erva-mate', language: 'pt', type: 'alt' })
    ).not.toThrow();
  });

  test('allows same literalForm with different language', () => {
    const concept = makeConcept();
    expect(() =>
      validateLabelUniqueness(concept, { literalForm: 'erva-mate', language: 'en', type: 'pref' })
    ).not.toThrow();
  });

  test('checks across all label arrays (altLabels, hiddenLabels)', () => {
    const altId = new ObjectId();
    const concept = makeConcept({
      altLabels: [{ _id: altId, literalForm: 'mate', language: 'pt', type: 'alt' }],
    });
    expect(() =>
      validateLabelUniqueness(concept, { literalForm: 'mate', language: 'pt', type: 'alt' })
    ).toThrow();
  });

  test('excludes label by id (for update operations)', () => {
    const labelId = new ObjectId();
    const concept = makeConcept({
      prefLabels: [makeLabel({ _id: labelId, literalForm: 'erva-mate', language: 'pt', type: 'pref' })],
    });
    expect(() =>
      validateLabelUniqueness(
        concept,
        { literalForm: 'erva-mate', language: 'pt', type: 'pref' },
        labelId
      )
    ).not.toThrow();
  });

  test('handles empty concept with no labels', () => {
    const concept = makeConcept({ prefLabels: [], altLabels: [], hiddenLabels: [] });
    expect(() =>
      validateLabelUniqueness(concept, { literalForm: 'any', language: 'pt', type: 'pref' })
    ).not.toThrow();
  });
});

describe('validateNoCycle', () => {
  test('returns true when target is not an ancestor', () => {
    const concept = makeConcept({ ancestors: [new ObjectId()] });
    const unrelatedId = new ObjectId();
    expect(validateNoCycle(concept, unrelatedId)).toBe(true);
  });

  test('returns false when target IS an ancestor (would create cycle)', () => {
    const ancestorId = new ObjectId();
    const concept = makeConcept({ ancestors: [ancestorId] });
    expect(validateNoCycle(concept, ancestorId)).toBe(false);
  });

  test('returns false for self-reference', () => {
    const concept = makeConcept();
    expect(validateNoCycle(concept, concept._id)).toBe(false);
  });

  test('handles string ID for target', () => {
    const ancestorId = new ObjectId();
    const concept = makeConcept({ ancestors: [ancestorId] });
    expect(validateNoCycle(concept, ancestorId.toString())).toBe(false);
  });

  test('returns true with empty ancestors array', () => {
    const concept = makeConcept({ ancestors: [] });
    expect(validateNoCycle(concept, new ObjectId())).toBe(true);
  });
});

describe('validateSinglePrefLabelPerLanguage', () => {
  test('throws when a prefLabel for the same language already exists', () => {
    const concept = makeConcept({
      prefLabels: [makeLabel({ language: 'pt', type: 'pref' })],
    });
    expect(() =>
      validateSinglePrefLabelPerLanguage(concept, { literalForm: 'mate', language: 'pt', type: 'pref' })
    ).toThrow();
  });

  test('passes when no prefLabel for that language exists', () => {
    const concept = makeConcept({ prefLabels: [] });
    expect(() =>
      validateSinglePrefLabelPerLanguage(concept, { literalForm: 'mate', language: 'pt', type: 'pref' })
    ).not.toThrow();
  });

  test('skips check for non-pref labels', () => {
    const concept = makeConcept();
    expect(() =>
      validateSinglePrefLabelPerLanguage(concept, { literalForm: 'mate', language: 'pt', type: 'alt' })
    ).not.toThrow();
  });

  test('allows pref label in a different language', () => {
    const concept = makeConcept({
      prefLabels: [makeLabel({ language: 'pt', type: 'pref' })],
    });
    expect(() =>
      validateSinglePrefLabelPerLanguage(concept, { literalForm: 'mate', language: 'en', type: 'pref' })
    ).not.toThrow();
  });

  test('excludes label id when updating existing label', () => {
    const labelId = new ObjectId();
    const concept = makeConcept({
      prefLabels: [makeLabel({ _id: labelId, language: 'pt', type: 'pref' })],
    });
    expect(() =>
      validateSinglePrefLabelPerLanguage(
        concept,
        { literalForm: 'updated', language: 'pt', type: 'pref' },
        labelId
      )
    ).not.toThrow();
  });
});

describe('validateDeprecation', () => {
  test('throws when replacedById is null', () => {
    expect(() => validateDeprecation(null)).toThrow();
  });

  test('throws when replacedById is undefined', () => {
    expect(() => validateDeprecation(undefined)).toThrow();
  });

  test('throws when replacedById is empty string', () => {
    expect(() => validateDeprecation('')).toThrow();
  });

  test('passes when replacedById is a valid ObjectId string', () => {
    expect(() => validateDeprecation(new ObjectId().toString())).not.toThrow();
  });
});

describe('validateLabelType', () => {
  test('passes for pref, alt, hidden', () => {
    expect(() => validateLabelType('pref')).not.toThrow();
    expect(() => validateLabelType('alt')).not.toThrow();
    expect(() => validateLabelType('hidden')).not.toThrow();
  });

  test('throws for invalid type', () => {
    expect(() => validateLabelType('preferred')).toThrow();
    expect(() => validateLabelType('')).toThrow();
  });
});

describe('validateAccessLevel', () => {
  test('passes for public, restricted, sacred', () => {
    expect(() => validateAccessLevel('public')).not.toThrow();
    expect(() => validateAccessLevel('restricted')).not.toThrow();
    expect(() => validateAccessLevel('sacred')).not.toThrow();
  });

  test('throws for invalid access level', () => {
    expect(() => validateAccessLevel('private')).toThrow();
    expect(() => validateAccessLevel('')).toThrow();
  });
});
