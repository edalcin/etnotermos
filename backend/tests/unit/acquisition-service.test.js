import { ObjectId } from 'mongodb';
import { connect, disconnect, clearCollections, getDb } from '../helpers/db.js';
import * as AcquisitionService from '../../src/services/AcquisitionService.js';

function makeEtnodbDoc(overrides = {}) {
  return {
    _id: new ObjectId(),
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
      await db.collection('etnodb').insertOne({
        _id: new ObjectId(),
        comunidades: [{ nome: 'X', tipo: '  ARTESANATO  ', plantas: [], atividadesEconomicas: [] }],
      });

      await AcquisitionService.run(db);

      const concept = await db
        .collection('etnotermos')
        .findOne({ 'prefLabels.literalForm': 'artesanato' });
      expect(concept).not.toBeNull();
    });

    test('null and empty values are ignored', async () => {
      await db.collection('etnodb').insertOne({
        _id: new ObjectId(),
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

      const count = await db.collection('etnotermos').countDocuments();
      expect(count).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Cross-field deduplication
  // ---------------------------------------------------------------------------

  describe('cross-field deduplication', () => {
    test('same literalForm from two fields → single concept with both sourceFields', async () => {
      await db.collection('etnodb').insertOne({
        _id: new ObjectId(),
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

      const concepts = await db
        .collection('etnotermos')
        .find({ 'prefLabels.literalForm': 'medicinal' })
        .toArray();

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
      await db.collection('etnodb').insertOne(makeEtnodbDoc());

      await AcquisitionService.run(db);
      const countAfterFirst = await db.collection('etnotermos').countDocuments();

      await AcquisitionService.run(db);
      const countAfterSecond = await db.collection('etnotermos').countDocuments();

      expect(countAfterSecond).toBe(countAfterFirst);
    });

    test('second run adds new sourceField to existing concept', async () => {
      await db.collection('etnodb').insertOne({
        _id: new ObjectId(),
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

      await db.collection('etnodb').insertOne({
        _id: new ObjectId(),
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

      const concept = await db
        .collection('etnotermos')
        .findOne({ 'prefLabels.literalForm': 'medicinal' });

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
      await db.collection('etnodb').insertOne({
        _id: new ObjectId(),
        comunidades: 'NOT_AN_ARRAY',
      });

      await AcquisitionService.run(db);

      const log = await db
        .collection('etnotermos_acquisition_log')
        .findOne({ status: 'failure' });

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
      await db.collection('etnodb').insertOne(makeEtnodbDoc());

      await AcquisitionService.run(db);

      const log = await db
        .collection('etnotermos_acquisition_log')
        .findOne({ status: 'success' });

      expect(log).not.toBeNull();
      expect(typeof log.conceptsCreated).toBe('number');
      expect(typeof log.durationMs).toBe('number');
    });

    test('no-op run (empty source) does not write a log', async () => {
      await AcquisitionService.run(db);

      const count = await db.collection('etnotermos_acquisition_log').countDocuments();
      expect(count).toBe(0);
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
      await db.collection('etnodb').insertOne(makeEtnodbDoc());
      await AcquisitionService.run(db);

      const result = await AcquisitionService.getLastRunStatus(db);
      expect(result.lastRun).not.toBeNull();
      expect(result.lastRun).toHaveProperty('status');
    });
  });
});
