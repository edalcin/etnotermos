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
 * Validate that adding a `synonym` relation (this concept -> targetId, meaning
 * "this concept is a synonym of the accepted/preferred targetId") won't create
 * a self-reference or a direct reciprocal pair (targetId already treats this
 * concept as ITS synonym, or this concept already treats targetId as ITS
 * synonym) — two concepts can't each claim to be the accepted term for the
 * other. Returns true if safe, false otherwise.
 */
export function validateSynonymNotReciprocal(concept, targetId) {
  const targetStr = targetId.toString();

  if (concept.id?.toString() === targetStr) {
    return false;
  }

  const synonym = concept.synonym ?? [];
  const synonymFor = concept.synonymFor ?? [];
  return !synonym.some((id) => id.toString() === targetStr)
    && !synonymFor.some((id) => id.toString() === targetStr);
}

/**
 * Validate that adding a `related` (associative, skos:related) relation
 * between this concept and targetId does not duplicate an existing
 * synonym/accepted pairing. Rule: two concepts already linked by `synonym`
 * (one is the accepted/preferred term, the other a synonym of it) cannot
 * ALSO be linked by the generic, peer-level `related` relation — that would
 * misrepresent an accepted/synonym pair as two independent, equal concepts.
 * Throws Error when the pairing already exists in either direction.
 */
export function validateRelatedExcludesSynonym(concept, targetId) {
  const targetStr = targetId.toString();
  const synonym = concept.synonym ?? [];
  const synonymFor = concept.synonymFor ?? [];

  if (synonym.some((id) => id.toString() === targetStr) || synonymFor.some((id) => id.toString() === targetStr)) {
    throw new Error(
      'Estes dois conceitos já têm uma relação de sinônimo/aceito entre si. Remova essa relação antes de marcá-los como apenas "relacionados", ou mantenha só a relação de sinônimo.',
    );
  }
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
