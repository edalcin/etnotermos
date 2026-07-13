import { randomUUID } from 'crypto';

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
    .replace(/[\u0300-\u036f]/g, '')
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
      relatedLabelId: String(rel.relatedLabelId),
      relationType: rel.relationType,
    };
  });

  const now = new Date().toISOString();

  return {
    id: randomUUID(),
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

  const toIds = (arr) => (arr ?? []).map((id) => String(id));

  const now = new Date().toISOString();
  const id = data.id ? String(data.id) : randomUUID();

  const prefLabels = (data.prefLabels ?? []).map(createLabel);
  const altLabels = (data.altLabels ?? []).map(createLabel);
  const hiddenLabels = (data.hiddenLabels ?? []).map(createLabel);

  const slug = data.uri ?? (prefLabels[0]
    ? `etnotermos:${generateSlug(prefLabels[0].literalForm)}`
    : `etnotermos:${id}`);

  return {
    id,
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
    broader: toIds(data.broader),
    narrower: toIds(data.narrower),
    related: toIds(data.related),
    synonym: toIds(data.synonym),
    synonymFor: toIds(data.synonymFor),
    ancestors: toIds(data.ancestors),
    replacedBy: data.replacedBy ? String(data.replacedBy) : null,
    deprecatedDate: data.deprecatedDate ?? null,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Returns the SQLite table name for concepts (ADR-005: document-per-row, JSON1).
 * Keeping the accessor here ensures the table name is defined in one place.
 */
export function getConceptTable() {
  return 'etnotermos';
}

/**
 * Fetch a concept row (parsed doc, with `id` merged in) by id.
 * @param {import('better-sqlite3').Database} db
 * @param {string} id
 * @returns {object|null}
 */
export function findConceptById(db, id) {
  const row = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  return row ? JSON.parse(row.doc) : null;
}

/**
 * Insert a new concept row (doc + FTS row) in one transaction.
 * @param {import('better-sqlite3').Database} db
 * @param {object} concept
 */
export function insertConcept(db, concept) {
  const insert = db.transaction((c) => {
    db.prepare(
      `INSERT INTO etnotermos (id, doc, created_at, updated_at) VALUES (?, ?, ?, ?)`
    ).run(c.id, JSON.stringify(c), c.createdAt, c.updatedAt);
    syncConceptFts(db, c);
  });
  insert(concept);
  return concept;
}

/**
 * Replace the FTS5 row for a concept (DELETE+INSERT — FTS5 has no partial UPDATE).
 * Call inside the same transaction as the `doc` write.
 * @param {import('better-sqlite3').Database} db
 * @param {object} concept
 */
export function syncConceptFts(db, concept) {
  db.prepare(`DELETE FROM etnotermos_fts WHERE id = ?`).run(concept.id);
  const labelText = (labels) => (labels ?? []).map((l) => l.literalForm).join(' ');
  db.prepare(
    `INSERT INTO etnotermos_fts (id, prefLabels, altLabels, definition, scopeNote) VALUES (?, ?, ?, ?, ?)`
  ).run(
    concept.id,
    labelText(concept.prefLabels),
    labelText(concept.altLabels),
    concept.definition ?? '',
    concept.scopeNote ?? ''
  );
}
