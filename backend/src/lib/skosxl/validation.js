export const LABEL_TYPE = ['pref', 'alt', 'hidden'];
export const ACCESS_LEVEL = ['public', 'restricted', 'sacred'];

/**
 * Collect all labels from a concept across all label arrays.
 * Returns a flat array with each label tagged with its type.
 */
function allLabels(concept) {
  return [
    ...(concept.prefLabels ?? []).map((l) => ({ ...l, type: 'pref' })),
    ...(concept.altLabels ?? []).map((l) => ({ ...l, type: 'alt' })),
    ...(concept.hiddenLabels ?? []).map((l) => ({ ...l, type: 'hidden' })),
  ];
}

/**
 * Validate label uniqueness within a concept.
 * Rule: (literalForm + language + type) must be unique in the concept.
 * Checks against ALL label arrays, excluding the label being updated.
 * Throws Error when a duplicate is found.
 */
export function validateLabelUniqueness(concept, newLabel, excludeLabelId = null) {
  const labels = allLabels(concept).filter(
    (l) => !excludeLabelId || l.id?.toString() !== excludeLabelId.toString(),
  );

  const duplicate = labels.find(
    (l) =>
      l.literalForm === newLabel.literalForm &&
      l.language === newLabel.language &&
      l.type === newLabel.type,
  );

  if (duplicate) {
    throw new Error(
      `Rótulo duplicado: já existe um rótulo com literalForm='${newLabel.literalForm}', language='${newLabel.language}', type='${newLabel.type}' neste conceito.`,
    );
  }
}

/**
 * Validate that adding a broader relation won't create a cycle.
 * Rule: targetId must NOT be an ancestor (which would mean target is a descendant).
 * Also guards against self-reference.
 * Returns true if safe, false if a cycle would be created.
 */
export function validateNoCycle(concept, targetId) {
  const targetStr = targetId.toString();

  if (concept.id?.toString() === targetStr) {
    return false;
  }

  const ancestors = concept.ancestors ?? [];
  return !ancestors.some((id) => id.toString() === targetStr);
}

/**
 * Validate max 1 prefLabel per language in a concept.
 * Throws Error when a prefLabel for the same language already exists.
 */
export function validateSinglePrefLabelPerLanguage(concept, newLabel, excludeLabelId = null) {
  if (newLabel.type !== 'pref') {
    return;
  }

  const existing = (concept.prefLabels ?? []).filter(
    (l) => !excludeLabelId || l.id?.toString() !== excludeLabelId.toString(),
  );

  const conflict = existing.find((l) => l.language === newLabel.language);

  if (conflict) {
    throw new Error(
      `Já existe um prefLabel para o idioma '${newLabel.language}' neste conceito.`,
    );
  }
}

/**
 * Validate that a concept can be deprecated.
 * Rule: replacedBy must be provided.
 * Throws Error when missing.
 */
export function validateDeprecation(replacedById) {
  if (!replacedById) {
    throw new Error('Depreciação requer um conceito substituto (replacedBy).');
  }
}

/**
 * Validate label type is one of the allowed values.
 * Throws Error with descriptive message when invalid.
 */
export function validateLabelType(type) {
  if (!LABEL_TYPE.includes(type)) {
    throw new Error(
      `Tipo de rótulo inválido: '${type}'. Valores permitidos: ${LABEL_TYPE.join(', ')}.`,
    );
  }
}

/**
 * Validate accessLevel is one of the allowed values.
 * Throws Error with descriptive message when invalid.
 */
export function validateAccessLevel(accessLevel) {
  if (!ACCESS_LEVEL.includes(accessLevel)) {
    throw new Error(
      `Nível de acesso inválido: '${accessLevel}'. Valores permitidos: ${ACCESS_LEVEL.join(', ')}.`,
    );
  }
}
