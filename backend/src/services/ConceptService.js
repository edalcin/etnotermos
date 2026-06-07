import { ObjectId } from 'mongodb';
import {
  getConceptCollection,
  createLabel,
  CONCEPT_STATUS,
  ACCESS_LEVEL,
} from '../models/Concept.js';
import {
  validateLabelUniqueness,
  validateSinglePrefLabelPerLanguage,
  validateDeprecation,
} from '../lib/skosxl/validation.js';
import * as AuditService from './AuditService.js';

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Apply an update to a concept using optimistic locking.
 * Automatically increments version and sets updatedAt.
 * Throws a 409 error when the document has been modified concurrently.
 */
async function optimisticUpdate(col, id, version, update) {
  const result = await col.updateOne(
    { _id: new ObjectId(id), version },
    {
      ...update,
      $inc: { version: 1 },
      $set: { ...(update.$set ?? {}), updatedAt: new Date() },
    },
  );

  if (result.matchedCount === 0) {
    const err = new Error('Conceito foi modificado por outro usuário. Recarregue antes de salvar.');
    err.code = 409;
    throw err;
  }

  return result;
}

/**
 * Locate a label inside a concept, searching all three label arrays in order.
 * Returns { label, arrayName } or null when not found.
 */
function findLabelInConcept(concept, labelId) {
  const id = labelId.toString();
  for (const arrayName of ['prefLabels', 'altLabels', 'hiddenLabels']) {
    const label = concept[arrayName].find((l) => l._id.toString() === id);
    if (label) return { label, arrayName };
  }
  return null;
}

/**
 * Return the MongoDB array field name for a given label type string.
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
 * Resolve an array of ObjectIds into summary objects { _id, prefLabel }.
 * Missing concepts are silently omitted.
 */
async function resolveIds(col, ids) {
  if (!ids || ids.length === 0) return [];
  const docs = await col
    .find(
      { _id: { $in: ids.map((id) => (id instanceof ObjectId ? id : new ObjectId(id))) } },
      { projection: { prefLabels: 1 } },
    )
    .toArray();

  return docs.map((doc) => ({ _id: doc._id, prefLabels: doc.prefLabels ?? [] }));
}

/**
 * Collect all descendant concept ids for `concept` using BFS over the narrower
 * field. Returns a flat array of ObjectIds.
 */
async function collectDescendants(col, concept) {
  const visited = new Set();
  const queue = [...(concept.narrower ?? [])];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const key = currentId.toString();
    if (visited.has(key)) continue;
    visited.add(key);

    const child = await col.findOne(
      { _id: currentId instanceof ObjectId ? currentId : new ObjectId(currentId) },
      { projection: { narrower: 1 } },
    );
    if (child?.narrower?.length) {
      queue.push(...child.narrower);
    }
  }

  return [...visited].map((id) => new ObjectId(id));
}

// ---------------------------------------------------------------------------
// Exported service methods
// ---------------------------------------------------------------------------

/**
 * Return a paginated list of concepts with optional filtering and text search.
 *
 * options:
 *   status       – filter by CONCEPT_STATUS value
 *   sourceField  – filter by entry in sourceFields array
 *   q            – full-text search across prefLabel/altLabel literalForms
 *   page         – 1-based page number (default 1)
 *   limit        – page size (default 20)
 *   publicOnly   – when true, restrict to active concepts and strip non-public labels
 */
export async function findMany(db, options = {}) {
  const col = getConceptCollection(db);
  const { status, sourceField, q, page = 1, limit = 20, publicOnly = false } = options;

  const filter = {};

  if (publicOnly) {
    filter.status = CONCEPT_STATUS.ACTIVE;
  } else if (status) {
    filter.status = status;
  }

  if (sourceField) {
    filter.sourceFields = sourceField;
  }

  if (q) {
    filter.$text = { $search: q };
  }

  const projection = {
    prefLabels: 1,
    altLabels: 1,
    sourceFields: 1,
    status: 1,
    uri: 1,
  };

  const skip = (page - 1) * limit;

  let raw, total;
  try {
    [raw, total] = await Promise.all([
      col.find(filter, { projection }).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);
  } catch (err) {
    if (q && /text index/i.test(err.message)) {
      delete filter.$text;
      filter['prefLabels.literalForm'] = { $regex: q, $options: 'i' };
      [raw, total] = await Promise.all([
        col.find(filter, { projection }).skip(skip).limit(limit).toArray(),
        col.countDocuments(filter),
      ]);
    } else {
      throw err;
    }
  }

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
  const col = getConceptCollection(db);
  const { publicOnly = false } = options;

  const concept = await col.findOne({ _id: new ObjectId(id) });
  if (!concept) return null;

  const [broader, narrower, related] = await Promise.all([
    resolveIds(col, concept.broader),
    resolveIds(col, concept.narrower),
    resolveIds(col, concept.related),
  ]);

  const result = { ...concept, broader, narrower, related };

  return publicOnly ? stripNonPublicLabels(result) : result;
}

/**
 * Update the note fields (definition, scopeNote, historyNote, example) of a concept.
 * Uses optimistic locking via the version field.
 * Writes one audit log entry per changed field.
 */
export async function updateNotes(db, id, version, noteData, username) {
  const col = getConceptCollection(db);
  const concept = await col.findOne({ _id: new ObjectId(id) });
  if (!concept) return null;

  const noteFields = ['definition', 'scopeNote', 'historyNote', 'example'];
  const $set = {};
  const auditEntries = [];

  for (const field of noteFields) {
    if (noteData[field] === undefined) continue;
    $set[field] = noteData[field];
    auditEntries.push({
      conceptId: concept._id,
      conceptLiteralForm: shortPrefLabel(concept),
      field,
      previousValue: concept[field] ?? null,
      newValue: noteData[field],
      responsible: username,
    });
  }

  await optimisticUpdate(col, id, version, { $set });

  await Promise.all(auditEntries.map((entry) => AuditService.log(db, entry)));

  return col.findOne({ _id: new ObjectId(id) });
}

/**
 * Transition a concept from "candidate" to "active" status.
 * Throws 400 when the current status is not "candidate".
 * Throws 409 on concurrent modification.
 */
export async function activate(db, id, version, username) {
  const col = getConceptCollection(db);
  const concept = await col.findOne({ _id: new ObjectId(id) });
  if (!concept) return null;

  if (concept.status !== CONCEPT_STATUS.CANDIDATE) {
    const err = new Error('Conceito não está em status candidate');
    err.code = 400;
    throw err;
  }

  await optimisticUpdate(col, id, version, { $set: { status: CONCEPT_STATUS.ACTIVE } });

  await AuditService.log(db, {
    conceptId: concept._id,
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

  const col = getConceptCollection(db);
  const concept = await col.findOne({ _id: new ObjectId(id) });
  if (!concept) return null;

  const activeChildren = await col
    .find({
      broader: new ObjectId(id),
      status: CONCEPT_STATUS.ACTIVE,
    })
    .toArray();

  if (activeChildren.length > 0 && confirmedOrphans !== true) {
    return { orphans: activeChildren };
  }

  const deprecatedDate = new Date();
  const historyNote = `Substituído por ${replacedById} em ${deprecatedDate.toISOString()}. Curador: ${username}`;

  await optimisticUpdate(col, id, version, {
    $set: {
      status: CONCEPT_STATUS.DEPRECATED,
      replacedBy: new ObjectId(replacedById),
      deprecatedDate,
      historyNote,
    },
  });

  await AuditService.log(db, {
    conceptId: concept._id,
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
  const col = getConceptCollection(db);
  const concept = await col.findOne({ _id: new ObjectId(id) });
  if (!concept) return null;

  validateLabelUniqueness(concept, labelData);
  validateSinglePrefLabelPerLanguage(concept, labelData);

  const newLabel = createLabel(labelData);
  const arrayName = labelArrayName(labelData.type);

  await optimisticUpdate(col, id, version, { $push: { [arrayName]: newLabel } });

  await AuditService.log(db, {
    conceptId: concept._id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: arrayName,
    previousValue: null,
    newValue: newLabel.literalForm,
    responsible: username,
  });

  return { ok: true, labelId: newLabel._id, version: version + 1 };
}

/**
 * Update an existing label inside a concept.
 * Supports partial updates — only fields present in labelData are changed.
 * Returns the updated label document.
 */
export async function updateLabel(db, id, version, labelId, labelData, username) {
  const col = getConceptCollection(db);
  const concept = await col.findOne({ _id: new ObjectId(id) });
  if (!concept) return null;

  const found = findLabelInConcept(concept, labelId);
  if (!found) return null;

  const { label: existing, arrayName } = found;

  validateLabelUniqueness(concept, { ...existing, ...labelData }, labelId);
  if (labelData.type === 'pref' || existing.type === 'pref') {
    validateSinglePrefLabelPerLanguage(concept, { ...existing, ...labelData }, labelId);
  }

  const updatableFields = [
    'literalForm', 'language', 'type', 'accessLevel', 'sourcePeople',
    'sourceRegion', 'source', 'validatingOrg', 'validationDate',
    'holderPeople', 'collectorResearcher', 'priorInformedConsent', 'bibliographicSource',
  ];

  const $set = {};
  const auditEntries = [];

  for (const field of updatableFields) {
    if (labelData[field] === undefined) continue;
    $set[`${arrayName}.$.${field}`] = labelData[field];
    auditEntries.push({
      conceptId: concept._id,
      conceptLiteralForm: shortPrefLabel(concept),
      field: `${arrayName}.${field}`,
      previousValue: existing[field] ?? null,
      newValue: labelData[field],
      responsible: username,
    });
  }

  $set[`${arrayName}.$.updatedAt`] = new Date();

  await col.updateOne(
    { _id: new ObjectId(id), version, [`${arrayName}._id`]: new ObjectId(labelId) },
    { $inc: { version: 1 }, $set: { ...($set), updatedAt: new Date() } },
  ).then((result) => {
    if (result.matchedCount === 0) {
      const err = new Error('Conceito foi modificado por outro usuário. Recarregue antes de salvar.');
      err.code = 409;
      throw err;
    }
  });

  await Promise.all(auditEntries.map((entry) => AuditService.log(db, entry)));

  const updated = await col.findOne({ _id: new ObjectId(id) });
  return findLabelInConcept(updated, labelId)?.label ?? null;
}

/**
 * Remove a label from a concept.
 * Prevents removal of the sole prefLabel.
 */
export async function removeLabel(db, id, version, labelId, username) {
  const col = getConceptCollection(db);
  const concept = await col.findOne({ _id: new ObjectId(id) });
  if (!concept) return null;

  const found = findLabelInConcept(concept, labelId);
  if (!found) return null;

  const { label, arrayName } = found;

  if (label.type === 'pref' && concept.prefLabels.length === 1) {
    const err = new Error('Não é possível remover o único prefLabel');
    err.code = 400;
    throw err;
  }

  await optimisticUpdate(col, id, version, {
    $pull: { [arrayName]: { _id: new ObjectId(labelId) } },
  });

  await AuditService.log(db, {
    conceptId: concept._id,
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
  const col = getConceptCollection(db);
  const concept = await col.findOne({ _id: new ObjectId(id) });
  if (!concept) return null;

  const found = findLabelInConcept(concept, labelId);
  if (!found) return null;

  const { arrayName } = found;

  await col.updateOne(
    { _id: new ObjectId(id), version, [`${arrayName}._id`]: new ObjectId(labelId) },
    {
      $inc: { version: 1 },
      $set: { [`${arrayName}.$.audioPath`]: audioPath, updatedAt: new Date() },
    },
  ).then((result) => {
    if (result.matchedCount === 0) {
      const err = new Error('Conceito foi modificado por outro usuário. Recarregue antes de salvar.');
      err.code = 409;
      throw err;
    }
  });

  await AuditService.log(db, {
    conceptId: concept._id,
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
  const col = getConceptCollection(db);

  const [concept, target] = await Promise.all([
    col.findOne({ _id: new ObjectId(id) }),
    col.findOne({ _id: new ObjectId(targetId) }),
  ]);
  if (!concept || !target) return null;

  const idStr = id.toString();
  const targetIdStr = targetId.toString();
  if (
    idStr === targetIdStr ||
    (target.ancestors ?? []).some((a) => a.toString() === idStr)
  ) {
    const err = new Error('Relação criaria ciclo hierárquico.');
    err.code = 400;
    throw err;
  }

  // The new ancestors for `concept` are all of target's ancestors plus target itself.
  const newAncestors = [...(target.ancestors ?? []), new ObjectId(targetId)];

  await optimisticUpdate(col, id, version, {
    $push: { broader: new ObjectId(targetId) },
    $set: { ancestors: newAncestors },
  });

  // Add concept as a narrower child of target (no version lock needed here).
  await col.updateOne(
    { _id: new ObjectId(targetId) },
    { $addToSet: { narrower: new ObjectId(id) }, $set: { updatedAt: new Date() } },
  );

  // Cascade ancestor updates to all descendants via BFS bulk write.
  const updatedConcept = await col.findOne({ _id: new ObjectId(id) });
  const descendantIds = await collectDescendants(col, updatedConcept);

  if (descendantIds.length > 0) {
    const bulkOps = descendantIds.map((descId) => ({
      updateOne: {
        filter: { _id: descId },
        update: {
          $set: {
            ancestors: [...newAncestors, new ObjectId(id)],
            updatedAt: new Date(),
          },
        },
      },
    }));
    await col.bulkWrite(bulkOps);
  }

  await AuditService.log(db, {
    conceptId: concept._id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: 'broader',
    previousValue: null,
    newValue: targetId.toString(),
    responsible: username,
  });

  return { ok: true };
}

/**
 * Remove a broader (parent) concept, recalculating ancestors and cascading.
 */
export async function removeBroader(db, id, version, targetId, username) {
  const col = getConceptCollection(db);

  const [concept, target] = await Promise.all([
    col.findOne({ _id: new ObjectId(id) }),
    col.findOne({ _id: new ObjectId(targetId) }),
  ]);
  if (!concept || !target) return null;

  // Recalculate ancestors from the remaining broader parents after removal.
  const remainingBroader = (concept.broader ?? []).filter(
    (bid) => bid.toString() !== targetId.toString(),
  );

  let newAncestors = [];
  if (remainingBroader.length > 0) {
    const parentDocs = await col
      .find(
        { _id: { $in: remainingBroader } },
        { projection: { ancestors: 1 } },
      )
      .toArray();

    const ancestorSets = parentDocs.map((p) =>
      [...(p.ancestors ?? []).map((a) => a.toString()), p._id.toString()],
    );

    // Union of all ancestor paths from remaining parents.
    const unionSet = new Set(ancestorSets.flat());
    newAncestors = [...unionSet].map((sid) => new ObjectId(sid));
  }

  await optimisticUpdate(col, id, version, {
    $pull: { broader: new ObjectId(targetId) },
    $set: { ancestors: newAncestors },
  });

  await col.updateOne(
    { _id: new ObjectId(targetId) },
    { $pull: { narrower: new ObjectId(id) }, $set: { updatedAt: new Date() } },
  );

  // Cascade updated ancestors to all descendants.
  const updatedConcept = await col.findOne({ _id: new ObjectId(id) });
  const descendantIds = await collectDescendants(col, updatedConcept);

  if (descendantIds.length > 0) {
    const bulkOps = descendantIds.map((descId) => ({
      updateOne: {
        filter: { _id: descId },
        update: {
          $set: {
            ancestors: [...newAncestors, new ObjectId(id)],
            updatedAt: new Date(),
          },
        },
      },
    }));
    await col.bulkWrite(bulkOps);
  }

  await AuditService.log(db, {
    conceptId: concept._id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: 'broader',
    previousValue: targetId.toString(),
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
  const col = getConceptCollection(db);

  const [concept, target] = await Promise.all([
    col.findOne({ _id: new ObjectId(id) }),
    col.findOne({ _id: new ObjectId(targetId) }),
  ]);
  if (!concept || !target) return null;

  await optimisticUpdate(col, id, version, {
    $addToSet: { related: new ObjectId(targetId) },
  });

  await col.updateOne(
    { _id: new ObjectId(targetId) },
    { $addToSet: { related: new ObjectId(id) }, $set: { updatedAt: new Date() } },
  );

  await AuditService.log(db, {
    conceptId: concept._id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: 'related',
    previousValue: null,
    newValue: targetId.toString(),
    responsible: username,
  });

  return { ok: true, version: version + 1 };
}

/**
 * Remove a symmetric associative relationship between two concepts.
 */
export async function removeRelated(db, id, version, targetId, username) {
  const col = getConceptCollection(db);

  const [concept, target] = await Promise.all([
    col.findOne({ _id: new ObjectId(id) }),
    col.findOne({ _id: new ObjectId(targetId) }),
  ]);
  if (!concept || !target) return null;

  await optimisticUpdate(col, id, version, {
    $pull: { related: new ObjectId(targetId) },
  });

  await col.updateOne(
    { _id: new ObjectId(targetId) },
    { $pull: { related: new ObjectId(id) }, $set: { updatedAt: new Date() } },
  );

  await AuditService.log(db, {
    conceptId: concept._id,
    conceptLiteralForm: shortPrefLabel(concept),
    field: 'related',
    previousValue: targetId.toString(),
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

export default { findMany, findById, updateNotes, activate, deprecate, addLabel, updateLabel, updateLabelAccessLevel, removeLabel, saveAudio, removeAudio, addBroader, removeBroader, addRelated, removeRelated };
