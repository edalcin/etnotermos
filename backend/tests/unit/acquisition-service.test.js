import { randomUUID } from 'crypto';
import { connect, disconnect, clearCollections, getDb } from '../helpers/db.js';
import * as AcquisitionService from '../../src/services/AcquisitionService.js';

function makeEtnodbDoc(overrides = {}) {
  return {
    comunidades: [
      {
        nome: 'Guarani Mbya',
        tipo: 'Indígena',
        plantas: [{ nomeVernacular: 'erva-mate', tipoUso: ['medicinal', 'alimentício'] }],
        atividadesEconomicas: ['artesanato'],
      },
    ],
    ...overrides,
  };
}

function insertBiocultdbRecord(db, doc) {
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO biocultdb_records (id, doc, created_at, updated_at) VALUES (?, ?, ?, ?)'
  ).run(randomUUID(), JSON.stringify(doc), now, now);
}

function findConceptByPrefLabel(db, literalForm) {
  const row = db
    .prepare(
      `SELECT doc FROM etnotermos WHERE EXISTS (
         SELECT 1 FROM json_each(json_extract(doc,'$.prefLabels')) je
         WHERE json_extract(je.value,'$.literalForm') = ?
       )`
    )
    .get(literalForm);
  return row ? JSON.parse(row.doc) : null;
}

function findConceptsByPrefLabel(db, literalForm) {
  return db
    .prepare(
      `SELECT doc FROM etnotermos WHERE EXISTS (
         SELECT 1 FROM json_each(json_extract(doc,'$.prefLabels')) je
         WHERE json_extract(je.value,'$.literalForm') = ?
       )`
    )
    .all(literalForm)
    .map((r) => JSON.parse(r.doc));
}

function countEtnotermos(db) {
  return db.prepare('SELECT COUNT(*) as n FROM etnotermos').get().n;
}

function countAcquisitionLogs(db) {
  return db.prepare('SELECT COUNT(*) as n FROM etnotermos_acquisition_log').get().n;
}

function findAcquisitionLogByStatus(db, status) {
  const row = db
    .prepare(`SELECT doc FROM etnotermos_acquisition_log WHERE json_extract(doc,'$.status') = ?`)
    .get(status);
  return row ? JSON.parse(row.doc) : null;
}

describe('AcquisitionService — unit tests', () => {
  let db;

  beforeAll(async () => {
    await connect();
    db = getDb();
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  // ---------------------------------------------------------------------------
  // Normalization
  // ---------------------------------------------------------------------------

  describe('normalization', () => {
    test('toLower + trim applied to all field values', async () => {
      insertBiocultdbRecord(db, {
        comunidades: [{ nome: 'X', tipo: '  ARTESANATO  ', plantas: [], atividadesEconomicas: [] }],
      });

      await AcquisitionService.run(db);

      const concept = findConceptByPrefLabel(db, 'artesanato');
      expect(concept).not.toBeNull();
    });

    test('null and empty values are ignored', async () => {
      insertBiocultdbRecord(db, {
        comunidades: [
          {
            nome: 'Y',
            tipo: null,
            plantas: [{ nomeVernacular: null, tipoUso: [null, ''] }],
            atividadesEconomicas: [null, ''],
          },
        ],
      });

      await AcquisitionService.run(db);

      expect(countEtnotermos(db)).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Cross-field deduplication
  // ---------------------------------------------------------------------------

  describe('cross-field deduplication', () => {
    test('same literalForm from two fields → single concept with both sourceFields', async () => {
      insertBiocultdbRecord(db, {
        comunidades: [
          {
            nome: 'Krenak',
            tipo: 'medicinal',
            plantas: [{ nomeVernacular: 'cipó', tipoUso: ['medicinal'] }],
            atividadesEconomicas: [],
          },
        ],
      });

      await AcquisitionService.run(db);

      const concepts = findConceptsByPrefLabel(db, 'medicinal');

      expect(concepts).toHaveLength(1);
      expect(concepts[0].sourceFields).toContain('comunidades.tipo');
      expect(concepts[0].sourceFields).toContain('comunidades.plantas.tipoUso');
    });
  });

  // ---------------------------------------------------------------------------
  // Idempotency
  // ---------------------------------------------------------------------------

  describe('idempotency', () => {
    test('running twice does not create duplicate concepts', async () => {
      insertBiocultdbRecord(db, makeEtnodbDoc());

      await AcquisitionService.run(db);
      const countAfterFirst = countEtnotermos(db);

      await AcquisitionService.run(db);
      const countAfterSecond = countEtnotermos(db);

      expect(countAfterSecond).toBe(countAfterFirst);
    });

    test('second run adds new sourceField to existing concept', async () => {
      insertBiocultdbRecord(db, {
        comunidades: [
          {
            nome: 'Guarani',
            tipo: 'medicinal',
            plantas: [],
            atividadesEconomicas: [],
          },
        ],
      });

      await AcquisitionService.run(db);

      insertBiocultdbRecord(db, {
        comunidades: [
          {
            nome: 'Krenak',
            tipo: 'artesanato',
            plantas: [{ nomeVernacular: 'cipó', tipoUso: ['medicinal'] }],
            atividadesEconomicas: [],
          },
        ],
      });

      await AcquisitionService.run(db);

      const concept = findConceptByPrefLabel(db, 'medicinal');

      expect(concept).not.toBeNull();
      expect(concept.sourceFields).toContain('comunidades.tipo');
      expect(concept.sourceFields).toContain('comunidades.plantas.tipoUso');
    });
  });

  // ---------------------------------------------------------------------------
  // Failure log
  // ---------------------------------------------------------------------------

  describe('failure logging', () => {
    test('corrupt comunidades field → AcquisitionLog with status:failure and hasUnresolved:true', async () => {
      insertBiocultdbRecord(db, {
        comunidades: 'NOT_AN_ARRAY',
      });

      await AcquisitionService.run(db);

      const log = findAcquisitionLogByStatus(db, 'failure');

      expect(log).not.toBeNull();
      expect(log.hasUnresolved).toBe(true);
      expect(log.errorMessage).toMatch(/comunidades/i);
    });
  });

  // ---------------------------------------------------------------------------
  // Success log
  // ---------------------------------------------------------------------------

  describe('success logging', () => {
    test('successful run with data creates AcquisitionLog', async () => {
      insertBiocultdbRecord(db, makeEtnodbDoc());

      await AcquisitionService.run(db);

      const log = findAcquisitionLogByStatus(db, 'success');

      expect(log).not.toBeNull();
      expect(typeof log.conceptsCreated).toBe('number');
      expect(typeof log.durationMs).toBe('number');
    });

    test('no-op run (empty source) does not write a log', async () => {
      await AcquisitionService.run(db);

      expect(countAcquisitionLogs(db)).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getLastRunStatus
  // ---------------------------------------------------------------------------

  describe('getLastRunStatus', () => {
    test('returns lastRun:null when no logs exist', async () => {
      const result = await AcquisitionService.getLastRunStatus(db);
      expect(result.lastRun).toBeNull();
    });

    test('returns most recent log when logs exist', async () => {
      insertBiocultdbRecord(db, makeEtnodbDoc());
      await AcquisitionService.run(db);

      const result = await AcquisitionService.getLastRunStatus(db);
      expect(result.lastRun).not.toBeNull();
      expect(result.lastRun).toHaveProperty('status');
    });
  });
});
