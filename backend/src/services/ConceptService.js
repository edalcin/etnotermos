import {
  createLabel,
  syncConceptFts,
  CONCEPT_STATUS,
  ACCESS_LEVEL,
} from '../models/Concept.js';
import {
  validateLabelUniqueness,
  validateSinglePrefLabelPerLanguage,
  validateDeprecation,
  validateLabelType,
  validateSynonymNotReciprocal,
  validateRelatedExcludesSynonym,
} from '../lib/skosxl/validation.js';
import * as AuditService from './AuditService.js';

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Apply an update to a concept using optimistic locking (ADR-005 SQLite).
 * Reads the current doc, checks `version` inside a transaction, applies
 * `mutateFn` (mutates the concept object in place), bumps version/updatedAt,
 * writes `doc` back and syncs the FTS5 row — all atomically.
 * Throws a 409 error when the document has been modified concurrently, or
 * returns null when the concept does not exist.
 */
function optimisticUpdate(db, id, version, mutateFn) {
  const tx = db.transaction(() => {
    const row = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
    if (!row) return null;

    const concept = JSON.parse(row.doc);
    if (concept.version !== version) {
      const err = new Error('Conceito foi modificado por outro usuário. Recarregue antes de salvar.');
      err.code = 409;
      throw err;
    }

    mutateFn(concept);
    concept.version = version + 1;
    concept.updatedAt = new Date().toISOString();

    db.prepare(`UPDATE etnotermos SET doc = ?, updated_at = ? WHERE id = ?`).run(
      JSON.stringify(concept),
      concept.updatedAt,
      id
    );
    syncConceptFts(db, concept);

    return concept;
  });

  return tx();
}

/**
 * Locate a label inside a concept, searching all three label arrays in order.
 * Returns { label, arrayName } or null when not found.
 */
function findLabelInConcept(concept, labelId) {
  const id = labelId.toString();
  for (const arrayName of ['prefLabels', 'altLabels', 'hiddenLabels']) {
    const label = concept[arrayName].find((l) => l.id.toString() === id);
    if (label) return { label, arrayName };
  }
  return null;
}

/**
 * Return the SQLite-document array field name for a given label type string.
 * e.g. "pref" → "prefLabels"
 */
function labelArrayName(type) {
  const map = { pref: 'prefLabels', alt: 'altLabels', hidden: 'hiddenLabels' };
  return map[type] ?? 'altLabels';
}

/**
 * Strip labels with sacred or restricted accessLevel from a concept clone.
 * Operates on all three label arrays in-place on the provided object.
 */
function stripNonPublicLabels(concept) {
  const isPublic = (l) => l.accessLevel === ACCESS_LEVEL.PUBLIC;
  concept.prefLabels = (concept.prefLabels ?? []).filter(isPublic);
  concept.altLabels = (concept.altLabels ?? []).filter(isPublic);
  concept.hiddenLabels = (concept.hiddenLabels ?? []).filter(isPublic);
  return concept;
}

/**
 * Derive a short prefLabel string from a concept document.
 * Prefers the Portuguese prefLabel; falls back to the first available.
 */
function shortPrefLabel(concept) {
  if (!concept) return null;
  const labels = concept.prefLabels ?? [];
  const pt = labels.find((l) => l.language === 'pt');
  return (pt ?? labels[0])?.literalForm ?? null;
}

/**
 * Resolve an array of ids into summary objects { id, prefLabels }.
 * Missing concepts are silently omitted.
 */
function resolveIds(db, ids) {
  if (!ids || ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const rows = db
    .prepare(`SELECT doc FROM etnotermos WHERE id IN (${placeholders})`)
    .all(...ids.map(String));

  return rows.map((row) => {
    const doc = JSON.parse(row.doc);
    return { id: doc.id, prefLabels: doc.prefLabels ?? [] };
  });
}

/**
 * Collect all descendant concept ids for `concept` using BFS over the narrower
 * field. Returns a flat array of string ids.
 */
function collectDescendants(db, concept) {
  const visited = new Set();
  const queue = [...(concept.narrower ?? [])];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const key = String(currentId);
    if (visited.has(key)) continue;
    visited.add(key);

    const row = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(key);
    if (row) {
      const child = JSON.parse(row.doc);
      if (child.narrower?.length) queue.push(...child.narrower);
    }
  }

  return [...visited];
}

// ---------------------------------------------------------------------------
// Exported service methods
// ---------------------------------------------------------------------------

/**
 * Whitelisted sortable columns for findMany's ORDER BY, keyed by the `sort`
 * query param. `sort`/`dir` are only ever used as lookups into this map (or
 * mapped to the literal 'ASC'/'DESC'), never concatenated raw into SQL.
 * The `unicode_sort_key()` SQL function (registered in shared/database.js)
 * groups accented Portuguese letters with their base form.
 */
const SORTABLE_COLUMNS = {
  label: `COALESCE(json_extract(e.doc,'$.prefLabels[0].literalForm'), '')`,
  status: `json_extract(e.doc,'$.status')`,
};

/** Builds an `ORDER BY` clause for a whitelisted column, or '' when `sort` is unset/unknown. */
function buildOrderByClause(sort, dir) {
  const column = SORTABLE_COLUMNS[sort];
  if (!column) return '';
  const direction = dir === 'desc' ? 'DESC' : 'ASC';
  return `ORDER BY unicode_sort_key(${column}) ${direction}`;
}

/**
 * Return a paginated list of concepts with optional filtering and text search.
 *
 * options:
 *   status       – filter by CONCEPT_STATUS value
 *   sourceField  – filter by entry in sourceFields array
 *   q            – full-text search across prefLabel/altLabel literalForms (FTS5)
 *   page         – 1-based page number (default 1)
 *   limit        – page size (default 20)
 *   publicOnly   – when true, restrict to active concepts and strip non-public labels
 *   sort         – column to sort by: 'label' | 'status' (default: relevance/insertion order)
 *   dir          – sort direction: 'asc' | 'desc' (default: 'asc')
 */
export async function findMany(db, options = {}) {
  const { status, sourceField, q, page = 1, limit = 20, publicOnly = false, sort, dir } = options;
  const offset = (page - 1) * limit;
  const orderBy = buildOrderByClause(sort, dir);

  const statusFilter = publicOnly ? CONCEPT_STATUS.ACTIVE : status;
  const extraConditions = [];
  const extraParams = [];
  if (statusFilter) {
    extraConditions.push(`json_extract(e.doc,'$.status') = ?`);
    extraParams.push(statusFilter);
  }
  if (sourceField) {
    extraConditions.push(
      `EXISTS (SELECT 1 FROM json_each(json_extract(e.doc,'$.sourceFields')) je WHERE je.value = ?)`
    );
    extraParams.push(sourceField);
  }
  const extraWhere = extraConditions.length ? `AND ${extraConditions.join(' AND ')}` : '';

  let rows, total;

  if (q) {
    try {
      const ftsQuery = q.replace(/"/g, '""');
      rows = db
        .prepare(
          `SELECT e.doc FROM etnotermos_fts f
           JOIN etnotermos e ON e.id = f.id
           WHERE etnotermos_fts MATCH ? ${extraWhere}
           ${orderBy || 'ORDER BY bm25(etnotermos_fts, 10.0, 5.0, 3.0, 2.0)'}
           LIMIT ? OFFSET ?`
        )
        .all(`"${ftsQuery}"`, ...extraParams, limit, offset);
      total = db
        .prepare(
          `SELECT COUNT(*) as total FROM etnotermos_fts f
           JOIN etnotermos e ON e.id = f.id
           WHERE etnotermos_fts MATCH ? ${extraWhere}`
        )
        .get(`"${ftsQuery}"`, ...extraParams).total;
    } catch {
      // Fallback: LIKE search over prefLabels literal forms when FTS5 query fails.
      const likePattern = `%${q}%`;
      rows = db
        .prepare(
          `SELECT e.doc FROM etnotermos e
           WHERE EXISTS (SELECT 1 FROM json_each(json_extract(e.doc,'$.prefLabels')) je WHERE json_extract(je.value,'$.literalForm') LIKE ?)
           ${extraWhere}
           ${orderBy}
           LIMIT ? OFFSET ?`
        )
        .all(likePattern, ...extraParams, limit, offset);
      total = db
        .prepare(
          `SELECT COUNT(*) as total FROM etnotermos e
           WHERE EXISTS (SELECT 1 FROM json_each(json_extract(e.doc,'$.prefLabels')) je WHERE json_extract(je.value,'$.literalForm') LIKE ?)
           ${extraWhere}`
        )
        .get(likePattern, ...extraParams).total;
    }
  } else {
    const where = extraConditions.length ? `WHERE ${extraConditions.join(' AND ')}` : '';
    rows = db
      .prepare(`SELECT doc FROM etnotermos e ${where} ${orderBy} LIMIT ? OFFSET ?`)
      .all(...extraParams, limit, offset);
    total = db.prepare(`SELECT COUNT(*) as total FROM etnotermos e ${where}`).get(...extraParams).total;
  }

  const project = (doc) => ({
    id: doc.id,
    uri: doc.uri,
    status: doc.status,
    sourceFields: doc.sourceFields,
    prefLabels: doc.prefLabels,
    altLabels: doc.altLabels,
  });

  const raw = rows.map((r) => project(JSON.parse(r.doc)));
  const data = publicOnly ? raw.map((c) => stripNonPublicLabels({ ...c })) : raw;

  return { data, total, page, limit, pagination: { page, limit, total } };
}

/**
 * Fetch a single concept by id with broader/narrower/related resolved to summaries.
 *
 * options:
 *   publicOnly – when true, strip non-public labels before returning
 *
 * Returns null when the concept does not exist.
 */
export async function findById(db, id, options = {}) {
  const { publicOnly = false } = options;

  const row = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  if (!row) return null;
  const concept = JSON.parse(row.doc);

  const broader = resolveIds(db, concept.broader);
  const narrower = resolveIds(db, concept.narrower);
  const related = resolveIds(db, concept.related);
  const synonym = resolveIds(db, concept.synonym);
  const synonymFor = resolveIds(db, concept.synonymFor);

  const result = { ...concept, broader, narrower, related, synonym, synonymFor };

  return publicOnly ? stripNonPublicLabels(result) : result;
}

/**
 * Update the note fields (definition, scopeNote, historyNote, example) of a concept.
 * Uses optimistic locking via the version field.
 * Writes one audit log entry per changed field.
 */
export async function updateNotes(db, id, version, noteData, username) {
  const row = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  if (!row) return null;
  const concept = JSON.parse(row.doc);

  const noteFields = ['definition', 'scopeNote', 'historyNote', 'example'];
  const auditEntries = [];

  const updated = optimisticUpdate(db, id, version, (c) => {
    for (const field of noteFields) {
      if (noteData[field] === undefined) continue;
      auditEntries.push({
        conceptId: c.id,
        conceptLiteralForm: shortPrefLabel(c),
        field,
        previousValue: c[field] ?? null,
        newValue: noteData[field],
        responsible: username,
      });
      c[field] = noteData[field];
    }
  });

  if (!updated) return null;

  await Promise.all(auditEntries.map((entry) => AuditService.log(db, entry)));

  return updated;
}

/**
 * Transition a concept from "candidate" to "active" status.
 * Throws 400 when the current status is not "candidate".
 * Throws 409 on concurrent modification.
 */
export async function activate(db, id, version, username) {
  const row = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  if (!row) return null;
  const concept = JSON.parse(row.doc);

  if (concept.status !== CONCEPT_STATUS.CANDIDATE) {
    const err = new Error('Conceito não está em status candidate');
    err.code = 400;
    throw err;
  }

  optimisticUpdate(db, id, version, (c) => {
    c.status = CONCEPT_STATUS.ACTIVE;
  });

  await AuditService.log(db, {
    conceptId: concept.id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: 'status',
    previousValue: CONCEPT_STATUS.CANDIDATE,
    newValue: CONCEPT_STATUS.ACTIVE,
    responsible: username,
  });

  return { ok: true, status: CONCEPT_STATUS.ACTIVE };
}

/**
 * Deprecate a concept, optionally with orphan child confirmation.
 *
 * When active children (narrower concepts) exist and confirmedOrphans is not
 * true, returns { orphans: [...] } instead of proceeding — the caller should
 * show a confirmation dialog before calling again.
 *
 * On success returns { ok: true, status: "deprecated", orphanCount: N }.
 */
export async function deprecate(db, id, version, { replacedById, confirmedOrphans } = {}, username) {
  validateDeprecation(replacedById);

  const row = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  if (!row) return null;
  const concept = JSON.parse(row.doc);

  const activeChildren = db
    .prepare(
      `SELECT doc FROM etnotermos e
       WHERE EXISTS (SELECT 1 FROM json_each(json_extract(e.doc,'$.broader')) je WHERE je.value = ?)
       AND json_extract(e.doc,'$.status') = ?`
    )
    .all(id, CONCEPT_STATUS.ACTIVE)
    .map((r) => JSON.parse(r.doc));

  if (activeChildren.length > 0 && confirmedOrphans !== true) {
    return { orphans: activeChildren };
  }

  const deprecatedDate = new Date().toISOString();
  const historyNote = `Substituído por ${replacedById} em ${deprecatedDate}. Curador: ${username}`;

  optimisticUpdate(db, id, version, (c) => {
    c.status = CONCEPT_STATUS.DEPRECATED;
    c.replacedBy = String(replacedById);
    c.deprecatedDate = deprecatedDate;
    c.historyNote = historyNote;
  });

  await AuditService.log(db, {
    conceptId: concept.id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: 'status',
    previousValue: concept.status,
    newValue: CONCEPT_STATUS.DEPRECATED,
    responsible: username,
  });

  return { ok: true, status: CONCEPT_STATUS.DEPRECATED, orphanCount: activeChildren.length };
}

/**
 * Add a new label to a concept's prefLabels, altLabels, or hiddenLabels array.
 * Validates uniqueness and single-prefLabel-per-language constraints before writing.
 * Returns { ok: true, labelId } on success.
 */
export async function addLabel(db, id, version, labelData, username) {
  const row = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  if (!row) return null;
  const concept = JSON.parse(row.doc);

  validateLabelUniqueness(concept, labelData);
  validateSinglePrefLabelPerLanguage(concept, labelData);

  const newLabel = createLabel(labelData);
  const arrayName = labelArrayName(labelData.type);

  optimisticUpdate(db, id, version, (c) => {
    c[arrayName].push(newLabel);
  });

  await AuditService.log(db, {
    conceptId: concept.id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: arrayName,
    previousValue: null,
    newValue: newLabel.literalForm,
    responsible: username,
  });

  return { ok: true, labelId: newLabel.id, version: version + 1 };
}

/**
 * Update an existing label inside a concept.
 * Supports partial updates — only fields present in labelData are changed.
 * Returns the updated label document.
 */
export async function updateLabel(db, id, version, labelId, labelData, username) {
  const row = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  if (!row) return null;
  const concept = JSON.parse(row.doc);

  const found = findLabelInConcept(concept, labelId);
  if (!found) return null;

  const { label: existing, arrayName } = found;

  validateLabelUniqueness(concept, { ...existing, ...labelData }, labelId);
  if (labelData.type === 'pref' || existing.type === 'pref') {
    validateSinglePrefLabelPerLanguage(concept, { ...existing, ...labelData }, labelId);
  }

  // Changing `type` must relocate the label to the matching array
  // (prefLabels/altLabels/hiddenLabels) — the array a label lives in is
  // what the UI and every other invariant (uniqueness, single-pref-per-
  // language, "can't delete the sole prefLabel") actually key off, not a
  // standalone field. A plain field write here would silently desync them.
  const typeChanged = labelData.type !== undefined && labelData.type !== existing.type;
  if (typeChanged) {
    validateLabelType(labelData.type);
    if (existing.type === 'pref' && concept.prefLabels.length === 1) {
      const err = new Error(
        'Não é possível mudar o tipo do único prefLabel deste conceito. Promova outro rótulo a preferencial (isso demove este automaticamente) antes de alterá-lo.'
      );
      err.code = 400;
      throw err;
    }
  }
  const newArrayName = typeChanged ? labelArrayName(labelData.type) : arrayName;

  const updatableFields = [
    'literalForm', 'language', 'type', 'accessLevel', 'sourcePeople',
    'sourceRegion', 'source', 'validatingOrg', 'validationDate',
    'holderPeople', 'collectorResearcher', 'priorInformedConsent', 'bibliographicSource',
  ];

  const auditEntries = [];

  const updated = optimisticUpdate(db, id, version, (c) => {
    const idx = c[arrayName].findIndex((l) => l.id.toString() === labelId.toString());
    const label = c[arrayName][idx];
    for (const field of updatableFields) {
      if (labelData[field] === undefined) continue;
      auditEntries.push({
        conceptId: c.id,
        conceptLiteralForm: shortPrefLabel(c),
        field: `${arrayName}.${field}`,
        previousValue: label[field] ?? null,
        newValue: labelData[field],
        responsible: username,
      });
      label[field] = labelData[field];
    }
    label.updatedAt = new Date().toISOString();
    if (typeChanged) {
      c[arrayName].splice(idx, 1);
      c[newArrayName].push(label);
    }
  });

  if (!updated) return null;

  await Promise.all(auditEntries.map((entry) => AuditService.log(db, entry)));

  return findLabelInConcept(updated, labelId)?.label ?? null;
}

/**
 * Promote a label to `pref` for its language, atomically demoting the
 * concept's current prefLabel for that same language (if any) to `alt`.
 * This is the only safe way to swap which label is "the" preferred term —
 * calling updateLabel(type:'pref') on the target alone would collide with
 * the single-prefLabel-per-language invariant against the label it's meant
 * to replace. Throws 400 when the label is already pref.
 */
export async function promoteLabel(db, id, version, labelId, username) {
  const row = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  if (!row) return null;
  const concept = JSON.parse(row.doc);

  const found = findLabelInConcept(concept, labelId);
  if (!found) return null;
  const { label: target, arrayName: fromArrayName } = found;

  if (target.type === 'pref') {
    const err = new Error('Este rótulo já é preferencial.');
    err.code = 400;
    throw err;
  }

  const auditEntries = [];

  const updated = optimisticUpdate(db, id, version, (c) => {
    const demoteIdx = c.prefLabels.findIndex((l) => l.language === target.language);
    if (demoteIdx !== -1) {
      const [demoted] = c.prefLabels.splice(demoteIdx, 1);
      demoted.type = 'alt';
      demoted.updatedAt = new Date().toISOString();
      c.altLabels.push(demoted);
      auditEntries.push({
        conceptId: c.id,
        conceptLiteralForm: shortPrefLabel(c) ?? demoted.literalForm,
        field: 'prefLabels.type',
        previousValue: `${demoted.literalForm} (pref)`,
        newValue: `${demoted.literalForm} (alt)`,
        responsible: username,
      });
    }

    const promoteArray = c[fromArrayName];
    const promoteIdx = promoteArray.findIndex((l) => l.id.toString() === labelId.toString());
    const [promoted] = promoteArray.splice(promoteIdx, 1);
    promoted.type = 'pref';
    promoted.updatedAt = new Date().toISOString();
    c.prefLabels.push(promoted);
    auditEntries.push({
      conceptId: c.id,
      conceptLiteralForm: shortPrefLabel(c),
      field: `${fromArrayName}.type`,
      previousValue: `${promoted.literalForm} (${fromArrayName === 'hiddenLabels' ? 'hidden' : 'alt'})`,
      newValue: `${promoted.literalForm} (pref)`,
      responsible: username,
    });
  });

  if (!updated) return null;

  await Promise.all(auditEntries.map((entry) => AuditService.log(db, entry)));

  return { ok: true, version: version + 1 };
}

/**
 * Remove a label from a concept.
 * Prevents removal of the sole prefLabel.
 */
export async function removeLabel(db, id, version, labelId, username) {
  const row = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  if (!row) return null;
  const concept = JSON.parse(row.doc);

  const found = findLabelInConcept(concept, labelId);
  if (!found) return null;

  const { label, arrayName } = found;

  if (label.type === 'pref' && concept.prefLabels.length === 1) {
    const err = new Error('Não é possível remover o único prefLabel');
    err.code = 400;
    throw err;
  }

  optimisticUpdate(db, id, version, (c) => {
    c[arrayName] = c[arrayName].filter((l) => l.id.toString() !== labelId.toString());
  });

  await AuditService.log(db, {
    conceptId: concept.id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: arrayName,
    previousValue: label.literalForm,
    newValue: null,
    responsible: username,
  });

  return { ok: true };
}

/**
 * Attach an audio file path to a specific label.
 */
export async function saveAudio(db, id, version, labelId, audioPath, username) {
  const row = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  if (!row) return null;
  const concept = JSON.parse(row.doc);

  const found = findLabelInConcept(concept, labelId);
  if (!found) return null;

  const { arrayName } = found;

  optimisticUpdate(db, id, version, (c) => {
    const label = c[arrayName].find((l) => l.id.toString() === labelId.toString());
    label.audioPath = audioPath;
    label.updatedAt = new Date().toISOString();
  });

  await AuditService.log(db, {
    conceptId: concept.id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: `${arrayName}.audioPath`,
    previousValue: found.label.audioPath ?? null,
    newValue: audioPath,
    responsible: username,
  });

  return { ok: true, version: version + 1 };
}

/**
 * Remove the audio file path from a specific label (set to null).
 */
export async function removeAudio(db, id, version, labelId, username) {
  return saveAudio(db, id, version, labelId, null, username);
}

/**
 * Add a broader (parent) concept, updating ancestors and cascading to all descendants.
 * Throws 400 when the relation would create a hierarchical cycle.
 */
export async function addBroader(db, id, version, targetId, username) {
  const conceptRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  const targetRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(targetId);
  if (!conceptRow || !targetRow) return null;

  const concept = JSON.parse(conceptRow.doc);
  const target = JSON.parse(targetRow.doc);

  const idStr = String(id);
  const targetIdStr = String(targetId);
  if (idStr === targetIdStr || (target.ancestors ?? []).some((a) => String(a) === idStr)) {
    const err = new Error('Relação criaria ciclo hierárquico.');
    err.code = 400;
    throw err;
  }

  // The new ancestors for `concept` are all of target's ancestors plus target itself.
  const newAncestors = [...(target.ancestors ?? []), targetIdStr];

  const updatedConcept = optimisticUpdate(db, id, version, (c) => {
    c.broader.push(targetIdStr);
    c.ancestors = newAncestors;
  });

  // Add concept as a narrower child of target (no version lock needed here).
  db.transaction(() => {
    const tRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(targetId);
    const t = JSON.parse(tRow.doc);
    if (!(t.narrower ?? []).includes(idStr)) {
      t.narrower = [...(t.narrower ?? []), idStr];
      t.updatedAt = new Date().toISOString();
      db.prepare(`UPDATE etnotermos SET doc = ?, updated_at = ? WHERE id = ?`).run(
        JSON.stringify(t),
        t.updatedAt,
        targetId
      );
    }
  })();

  // Cascade ancestor updates to all descendants via BFS.
  const descendantIds = collectDescendants(db, updatedConcept);

  if (descendantIds.length > 0) {
    const cascadeAncestors = [...newAncestors, idStr];
    db.transaction(() => {
      for (const descId of descendantIds) {
        const dRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(descId);
        if (!dRow) continue;
        const d = JSON.parse(dRow.doc);
        d.ancestors = cascadeAncestors;
        d.updatedAt = new Date().toISOString();
        db.prepare(`UPDATE etnotermos SET doc = ?, updated_at = ? WHERE id = ?`).run(
          JSON.stringify(d),
          d.updatedAt,
          descId
        );
      }
    })();
  }

  await AuditService.log(db, {
    conceptId: concept.id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: 'broader',
    previousValue: null,
    newValue: targetIdStr,
    responsible: username,
  });

  return { ok: true };
}

/**
 * Remove a broader (parent) concept, recalculating ancestors and cascading.
 */
export async function removeBroader(db, id, version, targetId, username) {
  const conceptRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  const targetRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(targetId);
  if (!conceptRow || !targetRow) return null;

  const concept = JSON.parse(conceptRow.doc);
  const targetIdStr = String(targetId);

  // Recalculate ancestors from the remaining broader parents after removal.
  const remainingBroader = (concept.broader ?? []).filter((bid) => String(bid) !== targetIdStr);

  let newAncestors = [];
  if (remainingBroader.length > 0) {
    const placeholders = remainingBroader.map(() => '?').join(',');
    const parentDocs = db
      .prepare(`SELECT doc FROM etnotermos WHERE id IN (${placeholders})`)
      .all(...remainingBroader.map(String))
      .map((r) => JSON.parse(r.doc));

    const ancestorSets = parentDocs.map((p) => [...(p.ancestors ?? []).map(String), String(p.id)]);
    newAncestors = [...new Set(ancestorSets.flat())];
  }

  const updatedConcept = optimisticUpdate(db, id, version, (c) => {
    c.broader = remainingBroader;
    c.ancestors = newAncestors;
  });

  db.transaction(() => {
    const tRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(targetId);
    const t = JSON.parse(tRow.doc);
    t.narrower = (t.narrower ?? []).filter((n) => String(n) !== String(id));
    t.updatedAt = new Date().toISOString();
    db.prepare(`UPDATE etnotermos SET doc = ?, updated_at = ? WHERE id = ?`).run(
      JSON.stringify(t),
      t.updatedAt,
      targetId
    );
  })();

  // Cascade updated ancestors to all descendants.
  const descendantIds = collectDescendants(db, updatedConcept);

  if (descendantIds.length > 0) {
    const cascadeAncestors = [...newAncestors, String(id)];
    db.transaction(() => {
      for (const descId of descendantIds) {
        const dRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(descId);
        if (!dRow) continue;
        const d = JSON.parse(dRow.doc);
        d.ancestors = cascadeAncestors;
        d.updatedAt = new Date().toISOString();
        db.prepare(`UPDATE etnotermos SET doc = ?, updated_at = ? WHERE id = ?`).run(
          JSON.stringify(d),
          d.updatedAt,
          descId
        );
      }
    })();
  }

  await AuditService.log(db, {
    conceptId: concept.id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: 'broader',
    previousValue: targetIdStr,
    newValue: null,
    responsible: username,
  });

  return { ok: true };
}

/**
 * Add a symmetric associative (skos:related) relationship between two concepts.
 * Both concepts receive each other's id in their related array.
 */
export async function addRelated(db, id, version, targetId, username) {
  const conceptRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  const targetRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(targetId);
  if (!conceptRow || !targetRow) return null;
  const concept = JSON.parse(conceptRow.doc);
  const targetIdStr = String(targetId);

  try {
    validateRelatedExcludesSynonym(concept, targetIdStr);
  } catch (err) {
    err.code = 400;
    throw err;
  }

  optimisticUpdate(db, id, version, (c) => {
    if (!(c.related ?? []).includes(targetIdStr)) {
      c.related = [...(c.related ?? []), targetIdStr];
    }
  });

  db.transaction(() => {
    const tRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(targetId);
    const t = JSON.parse(tRow.doc);
    if (!(t.related ?? []).includes(String(id))) {
      t.related = [...(t.related ?? []), String(id)];
      t.updatedAt = new Date().toISOString();
      db.prepare(`UPDATE etnotermos SET doc = ?, updated_at = ? WHERE id = ?`).run(
        JSON.stringify(t),
        t.updatedAt,
        targetId
      );
    }
  })();

  await AuditService.log(db, {
    conceptId: concept.id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: 'related',
    previousValue: null,
    newValue: targetIdStr,
    responsible: username,
  });

  return { ok: true, version: version + 1 };
}

/**
 * Remove a symmetric associative relationship between two concepts.
 */
export async function removeRelated(db, id, version, targetId, username) {
  const conceptRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  const targetRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(targetId);
  if (!conceptRow || !targetRow) return null;
  const concept = JSON.parse(conceptRow.doc);
  const targetIdStr = String(targetId);

  optimisticUpdate(db, id, version, (c) => {
    c.related = (c.related ?? []).filter((r) => String(r) !== targetIdStr);
  });

  db.transaction(() => {
    const tRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(targetId);
    const t = JSON.parse(tRow.doc);
    t.related = (t.related ?? []).filter((r) => String(r) !== String(id));
    t.updatedAt = new Date().toISOString();
    db.prepare(`UPDATE etnotermos SET doc = ?, updated_at = ? WHERE id = ?`).run(
      JSON.stringify(t),
      t.updatedAt,
      targetId
    );
  })();

  await AuditService.log(db, {
    conceptId: concept.id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: 'related',
    previousValue: targetIdStr,
    newValue: null,
    responsible: username,
  });

  return { ok: true };
}

/**
 * Add a directed `synonym` relationship: `id` (the synonym / non-preferred
 * form) points to `targetId` (the accepted / preferred concept). Mirrors
 * broader/narrower's asymmetric pattern — `id` gets `synonym` pushed under
 * optimistic lock; `targetId` gets the reciprocal `synonymFor` entry written
 * without its own version check (same as addBroader's narrower write).
 * Throws 400 when the pair would be self-referential or reciprocal (two
 * concepts each claiming to be the accepted term for the other).
 */
export async function addSynonym(db, id, version, targetId, username) {
  const conceptRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  const targetRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(targetId);
  if (!conceptRow || !targetRow) return null;

  const concept = JSON.parse(conceptRow.doc);
  const targetIdStr = String(targetId);

  if (!validateSynonymNotReciprocal(concept, targetIdStr)) {
    const err = new Error(
      'Relação de sinônimo inválida: os dois conceitos não podem ser sinônimo um do outro (autorreferência ou par recíproco).'
    );
    err.code = 400;
    throw err;
  }

  optimisticUpdate(db, id, version, (c) => {
    if (!(c.synonym ?? []).includes(targetIdStr)) {
      c.synonym = [...(c.synonym ?? []), targetIdStr];
    }
  });

  db.transaction(() => {
    const tRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(targetId);
    const t = JSON.parse(tRow.doc);
    if (!(t.synonymFor ?? []).includes(String(id))) {
      t.synonymFor = [...(t.synonymFor ?? []), String(id)];
      t.updatedAt = new Date().toISOString();
      db.prepare(`UPDATE etnotermos SET doc = ?, updated_at = ? WHERE id = ?`).run(
        JSON.stringify(t),
        t.updatedAt,
        targetId
      );
    }
  })();

  await AuditService.log(db, {
    conceptId: concept.id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: 'synonym',
    previousValue: null,
    newValue: targetIdStr,
    responsible: username,
  });

  return { ok: true, version: version + 1 };
}

/**
 * Remove a `synonym` relationship from the synonym side: `id` stops being a
 * synonym of `targetId`. Mirrors removeRelated.
 */
export async function removeSynonym(db, id, version, targetId, username) {
  const conceptRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  const targetRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(targetId);
  if (!conceptRow || !targetRow) return null;
  const concept = JSON.parse(conceptRow.doc);
  const targetIdStr = String(targetId);

  optimisticUpdate(db, id, version, (c) => {
    c.synonym = (c.synonym ?? []).filter((r) => String(r) !== targetIdStr);
  });

  db.transaction(() => {
    const tRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(targetId);
    const t = JSON.parse(tRow.doc);
    t.synonymFor = (t.synonymFor ?? []).filter((r) => String(r) !== String(id));
    t.updatedAt = new Date().toISOString();
    db.prepare(`UPDATE etnotermos SET doc = ?, updated_at = ? WHERE id = ?`).run(
      JSON.stringify(t),
      t.updatedAt,
      targetId
    );
  })();

  await AuditService.log(db, {
    conceptId: concept.id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: 'synonym',
    previousValue: targetIdStr,
    newValue: null,
    responsible: username,
  });

  return { ok: true };
}

/**
 * Remove a `synonym` relationship from the accepted side: `id` (accepted)
 * stops being the accepted term for `targetId` (its synonym). Same pairing
 * as removeSynonym, entered from the other concept's edit page — `id`'s own
 * `synonymFor` array is version-locked; `targetId`'s `synonym` array is
 * updated without a version check, matching the reciprocal-write pattern
 * used throughout (addBroader's narrower write, addRelated's mirror write).
 */
export async function removeSynonymFor(db, id, version, targetId, username) {
  const conceptRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(id);
  const targetRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(targetId);
  if (!conceptRow || !targetRow) return null;
  const concept = JSON.parse(conceptRow.doc);
  const targetIdStr = String(targetId);

  optimisticUpdate(db, id, version, (c) => {
    c.synonymFor = (c.synonymFor ?? []).filter((r) => String(r) !== targetIdStr);
  });

  db.transaction(() => {
    const tRow = db.prepare(`SELECT doc FROM etnotermos WHERE id = ?`).get(targetId);
    const t = JSON.parse(tRow.doc);
    t.synonym = (t.synonym ?? []).filter((r) => String(r) !== String(id));
    t.updatedAt = new Date().toISOString();
    db.prepare(`UPDATE etnotermos SET doc = ?, updated_at = ? WHERE id = ?`).run(
      JSON.stringify(t),
      t.updatedAt,
      targetId
    );
  })();

  await AuditService.log(db, {
    conceptId: concept.id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: 'synonymFor',
    previousValue: targetIdStr,
    newValue: null,
    responsible: username,
  });

  return { ok: true };
}

/**
 * Update only the accessLevel field of a specific label.
 * Convenience wrapper over updateLabel for CARE governance changes.
 */
export async function updateLabelAccessLevel(db, id, version, labelId, accessLevel, username) {
  return updateLabel(db, id, version, labelId, { accessLevel }, username);
}

export default { findMany, findById, updateNotes, activate, deprecate, addLabel, updateLabel, promoteLabel, updateLabelAccessLevel, removeLabel, saveAudio, removeAudio, addBroader, removeBroader, addRelated, removeRelated, addSynonym, removeSynonym, removeSynonymFor };
