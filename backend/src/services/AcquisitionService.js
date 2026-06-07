import { createConcept, getConceptCollection } from '../models/Concept.js';
import {
  ACQ_STATUS,
  createAcquisitionLog,
  getAcquisitionLogCollection,
} from '../models/AcquisitionLog.js';

const MONITORED_FIELDS = [
  'comunidades.tipo',
  'comunidades.plantas.nomeVernacular',
  'comunidades.plantas.tipoUso',
  'comunidades.atividadesEconomicas',
];

/**
 * Returns the MongoDB aggregate pipeline result for a given monitored field.
 * Each result document has { _id: normalizedValue, comunidades: [string] }.
 */
async function fetchDistinctValues(db, field) {
  const pipeline = buildPipelineForField(field);
  return db.collection('etnodb').aggregate(pipeline).toArray();
}

function buildPipelineForField(field) {
  const nestedPlantasFields = [
    'comunidades.plantas.nomeVernacular',
    'comunidades.plantas.tipoUso',
  ];

  if (nestedPlantasFields.includes(field)) {
    // e.g. 'comunidades.plantas.nomeVernacular' → last segment is the leaf
    const leafField = field.split('.').pop();
    return [
      { $unwind: '$comunidades' },
      { $unwind: '$comunidades.plantas' },
      { $unwind: `$comunidades.plantas.${leafField}` },
      {
        $group: {
          _id: { $toLower: { $trim: { input: `$comunidades.plantas.${leafField}` } } },
          comunidades: { $addToSet: '$comunidades.nome' },
        },
      },
      { $match: { _id: { $nin: [null, ''] } } },
    ];
  }

  if (field === 'comunidades.atividadesEconomicas') {
    return [
      { $unwind: '$comunidades' },
      { $unwind: '$comunidades.atividadesEconomicas' },
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$comunidades.atividadesEconomicas' } } },
          comunidades: { $addToSet: '$comunidades.nome' },
        },
      },
      { $match: { _id: { $nin: [null, ''] } } },
    ];
  }

  // Default: simple string field directly on comunidade (e.g. 'comunidades.tipo')
  const leafField = field.split('.').pop();
  return [
    { $unwind: '$comunidades' },
    {
      $group: {
        _id: { $toLower: { $trim: { input: `$comunidades.${leafField}` } } },
        comunidades: { $addToSet: '$comunidades.nome' },
      },
    },
    { $match: { _id: { $nin: [null, ''] } } },
  ];
}

/**
 * Upserts a single value into the etnotermos concept collection.
 * Returns 'created' or 'existing'.
 */
async function upsertConcept(col, field, normalizedValue, comunidades) {
  const existing = await col.findOne({
    prefLabels: { $elemMatch: { literalForm: normalizedValue, type: 'pref' } },
  });

  const cleanCommunities = comunidades.filter(Boolean);

  if (!existing) {
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
    await col.insertOne(concept);
    return 'created';
  }

  await col.updateOne(
    { _id: existing._id },
    {
      $addToSet: {
        sourceFields: field,
        sourceCommunities: { $each: cleanCommunities },
      },
      $set: { updatedAt: new Date() },
    }
  );
  return 'existing';
}

/**
 * Runs a full acquisition cycle from etnoDB → etnotermos.
 * Iterates over all monitored fields, discovers distinct values,
 * and upserts each as a candidate concept.
 * Always persists an AcquisitionLog document, even on failure.
 */
export async function run(db) {
  const col = getConceptCollection(db);
  const logCol = getAcquisitionLogCollection(db);

  const startedAt = Date.now();
  const executedAt = new Date();
  const fieldsProcessed = [];
  const errors = [];
  let conceptsCreated = 0;
  let conceptsExisting = 0;

  try {
    const malformed = await db.collection('etnodb').findOne({
      $and: [
        { comunidades: { $exists: true } },
        { comunidades: { $not: { $type: 'array' } } },
      ],
    });
    if (malformed) {
      throw new Error(
        `Malformed document in etnodb (_id: ${malformed._id}): 'comunidades' must be an array`,
      );
    }

    for (const field of MONITORED_FIELDS) {
      const rows = await fetchDistinctValues(db, field);
      let fieldCreated = 0;
      let fieldExisting = 0;

      for (const row of rows) {
        const normalizedValue = row._id;

        if (!normalizedValue || !normalizedValue.trim()) {
          continue;
        }

        const outcome = await upsertConcept(col, field, normalizedValue, row.comunidades ?? []);

        if (outcome === 'created') {
          fieldCreated++;
          conceptsCreated++;
        } else {
          fieldExisting++;
          conceptsExisting++;
        }
      }

      fieldsProcessed.push({ field, created: fieldCreated, existing: fieldExisting });
    }

    if (conceptsCreated === 0 && conceptsExisting === 0) {
      return null;
    }

    await logCol.updateMany({ hasUnresolved: true }, { $set: { hasUnresolved: false } });

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

    await logCol.insertOne(log);
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

    await logCol.insertOne(log);
    return log;
  }
}

/**
 * Returns the most recent acquisition log and a null scheduledNext placeholder.
 * The caller (route handler) is responsible for computing the next scheduled run
 * from the active cron expression.
 */
export async function getLastRunStatus(db) {
  const col = getAcquisitionLogCollection(db);
  const lastRun = await col.findOne({}, { sort: { executedAt: -1 } });
  return { lastRun: lastRun || null, scheduledNext: null };
}

export default { run, getLastRunStatus };
