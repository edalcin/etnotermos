import { randomUUID } from 'crypto';
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
    id: randomUUID(),
    literalForm: 'erva-mate',
    language: 'pt',
    type: 'pref',
    accessLevel: 'public',
    ...overrides,
  };
}

function makeConcept(overrides = {}) {
  return {
    id: randomUUID(),
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
    const altId = randomUUID();
    const concept = makeConcept({
      altLabels: [{ id: altId, literalForm: 'mate', language: 'pt', type: 'alt' }],
    });
    expect(() =>
      validateLabelUniqueness(concept, { literalForm: 'mate', language: 'pt', type: 'alt' })
    ).toThrow();
  });

  test('excludes label by id (for update operations)', () => {
    const labelId = randomUUID();
    const concept = makeConcept({
      prefLabels: [makeLabel({ id: labelId, literalForm: 'erva-mate', language: 'pt', type: 'pref' })],
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
      validateLabelUniqueness(concept, { literalForm: 'ilex', language: 'pt', type: 'pref' })
    ).not.toThrow();
  });
});

describe('validateNoCycle', () => {
  test('returns true when target is not an ancestor', () => {
    const concept = makeConcept({ ancestors: [randomUUID()] });
    const unrelatedId = randomUUID();
    expect(validateNoCycle(concept, unrelatedId)).toBe(true);
  });

  test('returns false when target IS an ancestor (would create cycle)', () => {
    const ancestorId = randomUUID();
    const concept = makeConcept({ ancestors: [ancestorId] });
    expect(validateNoCycle(concept, ancestorId)).toBe(false);
  });

  test('returns false for self-reference', () => {
    const concept = makeConcept();
    expect(validateNoCycle(concept, concept.id)).toBe(false);
  });

  test('handles string ID for target', () => {
    const ancestorId = randomUUID();
    const concept = makeConcept({ ancestors: [ancestorId] });
    expect(validateNoCycle(concept, ancestorId.toString())).toBe(false);
  });

  test('returns true with empty ancestors array', () => {
    const concept = makeConcept({ ancestors: [] });
    expect(validateNoCycle(concept, randomUUID())).toBe(true);
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
    const labelId = randomUUID();
    const concept = makeConcept({
      prefLabels: [makeLabel({ id: labelId, language: 'pt', type: 'pref' })],
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

  test('passes when replacedById is a valid id string', () => {
    expect(() => validateDeprecation(randomUUID())).not.toThrow();
  });
});

describe('validateLabelType', () => {
  test('passes for valid label types', () => {
    expect(() => validateLabelType('pref')).not.toThrow();
    expect(() => validateLabelType('alt')).not.toThrow();
    expect(() => validateLabelType('hidden')).not.toThrow();
  });

  test('throws for invalid label type', () => {
    expect(() => validateLabelType('invalid')).toThrow();
  });
});

describe('validateAccessLevel', () => {
  test('passes for valid access levels', () => {
    expect(() => validateAccessLevel('public')).not.toThrow();
    expect(() => validateAccessLevel('restricted')).not.toThrow();
    expect(() => validateAccessLevel('sacred')).not.toThrow();
  });

  test('throws for invalid access level', () => {
    expect(() => validateAccessLevel('invalid')).toThrow();
  });
});
