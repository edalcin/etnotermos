import { createConcept, insertConcept } from '../models/Concept.js';
import {
  ACQ_STATUS,
  createAcquisitionLog,
  insertAcquisitionLog,
  findLastAcquisitionLog,
} from '../models/AcquisitionLog.js';
import { REFERENCE_TERMS } from '../data/referenceTerms.js';

const MONITORED_FIELDS = [
  'comunidades.tipo',
  'comunidades.plantas.nomeCientifico',
  'comunidades.plantas.nomeVernacular',
  'comunidades.plantas.tipoUso',
  'comunidades.atividadesEconomicas',
];

/** Normalizes a value that may be a scalar, an array, null, or undefined into an array. */
function toArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/** Records a raw value (trim + lowercase) under `field`, tracking which communities it came from. */
function collect(grouped, values, communityName) {
  for (const raw of values) {
    if (typeof raw !== 'string') continue;
    const normalized = raw.trim().toLowerCase();
    if (!normalized) continue;
    if (!grouped.has(normalized)) grouped.set(normalized, new Set());
    if (communityName) grouped.get(normalized).add(communityName);
  }
}

/**
 * Walks every `biocultdb_records` document (SAME SQLite file, shared unit —
 * ADR-005) in a single pass, grouping distinct normalized values per
 * monitored field alongside the community names they appeared in.
 *
 * Values are read tolerantly (scalar OR array) — mirroring MongoDB's
 * `$unwind` passthrough behavior on non-array fields — since upstream
 * BioCultDB documents are not guaranteed to have array-typed leaf fields.
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {Map<string, {_id: string, comunidades: string[]}[]>}
 */
function collectFieldValues(db) {
  const rows = db.prepare(`SELECT id, doc FROM biocultdb_records`).all();

  const grouped = new Map(MONITORED_FIELDS.map((f) => [f, new Map()]));

  for (const row of rows) {
    const record = JSON.parse(row.doc);
    if (record.comunidades == null) continue;
    if (!Array.isArray(record.comunidades)) {
      throw new Error(
        `Malformed document in biocultdb_records (id: ${row.id}): 'comunidades' must be an array`
      );
    }

    for (const com of record.comunidades) {
      const communityName = com?.nome;

      collect(grouped.get('comunidades.tipo'), toArray(com?.tipo), communityName);
      collect(
        grouped.get('comunidades.atividadesEconomicas'),
        toArray(com?.atividadesEconomicas),
        communityName
      );

      const plantas = Array.isArray(com?.plantas) ? com.plantas : [];
      for (const planta of plantas) {
        collect(
          grouped.get('comunidades.plantas.nomeVernacular'),
          toArray(planta?.nomeVernacular),
          communityName
        );
        collect(grouped.get('comunidades.plantas.tipoUso'), toArray(planta?.tipoUso), communityName);
        collect(
          grouped.get('comunidades.plantas.nomeCientifico'),
          toArray(planta?.nomeCientifico),
          communityName
        );
      }
    }
  }

  const result = new Map();
  for (const [field, values] of grouped) {
    result.set(
      field,
      [...values.entries()].map(([_id, communities]) => ({ _id, comunidades: [...communities] }))
    );
  }
  return result;
}

/**
 * Upserts a single value into the etnotermos concept table.
 * Returns 'created' or 'existing'.
 */
function upsertConcept(db, field, normalizedValue, comunidades) {
  const cleanCommunities = comunidades.filter(Boolean);

  const existingRow = db
    .prepare(
      `SELECT doc FROM etnotermos e
       WHERE EXISTS (
         SELECT 1 FROM json_each(json_extract(e.doc,'$.prefLabels')) je
         WHERE json_extract(je.value,'$.literalForm') = ? AND json_extract(je.value,'$.type') = 'pref'
       )`
    )
    .get(normalizedValue);

  if (!existingRow) {
    const concept = createConcept({
      status: 'candidate',
      sourceFields: [field],
      sourceCommunities: cleanCommunities,
      prefLabels: [
        {
          literalForm: normalizedValue,
          language: 'pt',
          type: 'pref',
          accessLevel: 'public',
        },
      ],
    });
    insertConcept(db, concept);
    return 'created';
  }

  const existing = JSON.parse(existingRow.doc);
  const sourceFields = new Set(existing.sourceFields ?? []);
  sourceFields.add(field);
  const sourceCommunities = new Set(existing.sourceCommunities ?? []);
  cleanCommunities.forEach((c) => sourceCommunities.add(c));

  existing.sourceFields = [...sourceFields];
  existing.sourceCommunities = [...sourceCommunities];
  existing.updatedAt = new Date().toISOString();

  db.prepare(`UPDATE etnotermos SET doc = ?, updated_at = ? WHERE id = ?`).run(
    JSON.stringify(existing),
    existing.updatedAt,
    existing.id
  );
  return 'existing';
}

/**
 * Runs a full acquisition cycle from BioCultDB → etnotermos (same SQLite file).
 * Walks all monitored fields, discovers distinct values, and upserts each as a
 * candidate concept — then does the same for every static REFERENCE_TERMS list
 * (domain vocabulary independent of what has been typed into biocultdb_records
 * yet), so curators see the full domain vocabulary, not only observed values.
 * Always persists an AcquisitionLog document, even on failure.
 */
/** Yields control back to the event loop so a long-running acquisition cycle doesn't
 *  block the admin HTTP server (better-sqlite3 calls are synchronous) for its whole
 *  duration — interleaved every YIELD_EVERY upserts. */
const YIELD_EVERY = 40;
function yieldToEventLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

export async function run(db) {
  const startedAt = Date.now();
  const executedAt = new Date().toISOString();
  const fieldsProcessed = [];
  const errors = [];
  let conceptsCreated = 0;
  let conceptsExisting = 0;
  let processedCount = 0;

  try {
    const fieldValues = collectFieldValues(db);

    for (const field of MONITORED_FIELDS) {
      const rows = fieldValues.get(field) ?? [];
      let fieldCreated = 0;
      let fieldExisting = 0;

      for (const row of rows) {
        const normalizedValue = row._id;
        if (!normalizedValue || !normalizedValue.trim()) continue;

        const outcome = upsertConcept(db, field, normalizedValue, row.comunidades ?? []);
        if (outcome === 'created') {
          fieldCreated++;
          conceptsCreated++;
        } else {
          fieldExisting++;
          conceptsExisting++;
        }

        if (++processedCount % YIELD_EVERY === 0) await yieldToEventLoop();
      }

      fieldsProcessed.push({ field, created: fieldCreated, existing: fieldExisting });
    }

    for (const [field, terms] of Object.entries(REFERENCE_TERMS)) {
      let entry = fieldsProcessed.find((f) => f.field === field);
      if (!entry) {
        entry = { field, created: 0, existing: 0 };
        fieldsProcessed.push(entry);
      }

      for (const raw of terms) {
        const normalizedValue = raw.trim().toLowerCase();
        if (!normalizedValue) continue;

        const outcome = upsertConcept(db, field, normalizedValue, []);
        if (outcome === 'created') {
          entry.created++;
          conceptsCreated++;
        } else {
          entry.existing++;
          conceptsExisting++;
        }

        if (++processedCount % YIELD_EVERY === 0) await yieldToEventLoop();
      }
    }

    db.prepare(
      `UPDATE etnotermos_acquisition_log
       SET doc = json_set(doc,'$.hasUnresolved', json('false'))
       WHERE json_extract(doc,'$.hasUnresolved') = 1`
    ).run();

    if (conceptsCreated === 0 && conceptsExisting === 0) {
      return null;
    }

    const log = createAcquisitionLog({
      executedAt,
      status: ACQ_STATUS.SUCCESS,
      fieldsProcessed,
      conceptsCreated,
      conceptsExisting,
      errors,
      hasUnresolved: false,
      durationMs: Date.now() - startedAt,
    });

    insertAcquisitionLog(db, log);
    return log;
  } catch (err) {
    const log = createAcquisitionLog({
      executedAt,
      status: ACQ_STATUS.FAILURE,
      errorMessage: err.message,
      fieldsProcessed,
      conceptsCreated,
      conceptsExisting,
      errors: [err.message],
      hasUnresolved: true,
      durationMs: Date.now() - startedAt,
    });

    insertAcquisitionLog(db, log);
    return log;
  }
}

/**
 * Returns the most recent acquisition log and a null scheduledNext placeholder.
 * The caller (route handler) is responsible for computing the next scheduled run
 * from the active cron expression.
 */
export async function getLastRunStatus(db) {
  const lastRun = findLastAcquisitionLog(db);
  return { lastRun: lastRun || null, scheduledNext: null };
}

export default { run, getLastRunStatus };
