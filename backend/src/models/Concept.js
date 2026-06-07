import { ObjectId } from 'mongodb';

export const CONCEPT_STATUS = Object.freeze({
  CANDIDATE: 'candidate',
  ACTIVE: 'active',
  DEPRECATED: 'deprecated',
});

export const LABEL_TYPE = Object.freeze({
  PREF: 'pref',
  ALT: 'alt',
  HIDDEN: 'hidden',
});

export const ACCESS_LEVEL = Object.freeze({
  PUBLIC: 'public',
  RESTRICTED: 'restricted',
  SACRED: 'sacred',
});

export const LABEL_RELATION_TYPE = Object.freeze({
  LOANWORD: 'loanword',
  COGNATE: 'cognate',
  DIALECTAL_VARIANT: 'dialectal-variant',
});

/**
 * Derives a URL-safe slug from a label's literal form.
 * Normalises Unicode, strips diacritics, lowercases, and
 * collapses runs of non-alphanumeric characters into hyphens.
 */
export function generateSlug(literalForm) {
  return literalForm
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Factory for a SKOS-XL Label subdocument.
 * Throws when required fields are missing or invalid.
 */
export function createLabel(data) {
  if (!data.literalForm || typeof data.literalForm !== 'string' || !data.literalForm.trim()) {
    throw new Error('Label literalForm is required');
  }

  if (data.literalForm.length > 500) {
    throw new Error('Label literalForm cannot exceed 500 characters');
  }

  if (!data.language || typeof data.language !== 'string') {
    throw new Error('Label language (ISO 639-3) is required');
  }

  if (!Object.values(LABEL_TYPE).includes(data.type)) {
    throw new Error(`Invalid label type: ${data.type}`);
  }

  if (data.accessLevel && !Object.values(ACCESS_LEVEL).includes(data.accessLevel)) {
    throw new Error(`Invalid access level: ${data.accessLevel}`);
  }

  const labelRelations = (data.labelRelations ?? []).map((rel) => {
    if (!Object.values(LABEL_RELATION_TYPE).includes(rel.relationType)) {
      throw new Error(`Invalid label relation type: ${rel.relationType}`);
    }
    return {
      relatedLabelId: rel.relatedLabelId instanceof ObjectId
        ? rel.relatedLabelId
        : new ObjectId(rel.relatedLabelId),
      relationType: rel.relationType,
    };
  });

  const now = new Date();

  return {
    _id: new ObjectId(),
    literalForm: data.literalForm.trim(),
    language: data.language,
    type: data.type,
    sourcePeople: data.sourcePeople ?? null,
    sourceRegion: data.sourceRegion ?? null,
    accessLevel: data.accessLevel ?? ACCESS_LEVEL.PUBLIC,
    source: data.source ?? null,
    validatingOrg: data.validatingOrg ?? null,
    validationDate: data.validationDate ?? null,
    audioPath: data.audioPath ?? null,
    holderPeople: data.holderPeople ?? null,
    collectorResearcher: data.collectorResearcher ?? null,
    priorInformedConsent: data.priorInformedConsent ?? null,
    bibliographicSource: data.bibliographicSource ?? null,
    labelRelations,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Factory for a SKOS-XL Concept document.
 * Throws when invariants are violated (empty sourceFields, bad status, etc.).
 */
export function createConcept(data) {
  if (!Array.isArray(data.sourceFields) || data.sourceFields.length === 0) {
    throw new Error('Concept sourceFields must be a non-empty array');
  }

  const status = data.status ?? CONCEPT_STATUS.CANDIDATE;
  if (!Object.values(CONCEPT_STATUS).includes(status)) {
    throw new Error(`Invalid concept status: ${status}`);
  }

  const toObjectIds = (arr) =>
    (arr ?? []).map((id) => (id instanceof ObjectId ? id : new ObjectId(id)));

  const now = new Date();
  const id = data._id instanceof ObjectId ? data._id : (data._id ? new ObjectId(data._id) : new ObjectId());

  const prefLabels = (data.prefLabels ?? []).map(createLabel);
  const altLabels = (data.altLabels ?? []).map(createLabel);
  const hiddenLabels = (data.hiddenLabels ?? []).map(createLabel);

  const slug = data.uri ?? (prefLabels[0]
    ? `etnotermos:${generateSlug(prefLabels[0].literalForm)}`
    : `etnotermos:${id.toHexString()}`);

  return {
    _id: id,
    uri: slug,
    status,
    sourceFields: data.sourceFields,
    sourceCommunities: data.sourceCommunities ?? [],
    prefLabels,
    altLabels,
    hiddenLabels,
    definition: data.definition ?? null,
    scopeNote: data.scopeNote ?? null,
    historyNote: data.historyNote ?? null,
    example: data.example ?? null,
    broader: toObjectIds(data.broader),
    narrower: toObjectIds(data.narrower),
    related: toObjectIds(data.related),
    ancestors: toObjectIds(data.ancestors),
    replacedBy: data.replacedBy
      ? (data.replacedBy instanceof ObjectId ? data.replacedBy : new ObjectId(data.replacedBy))
      : null,
    deprecatedDate: data.deprecatedDate ?? null,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Returns the MongoDB collection for concepts.
 * Keeping the accessor here ensures the collection name is defined
 * in one place and never duplicated across services.
 */
export function getConceptCollection(db) {
  return db.collection('etnotermos');
}
