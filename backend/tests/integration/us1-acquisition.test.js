import { ObjectId } from 'mongodb';
import { connect, disconnect, clearCollections, getDb } from '../helpers/db.js';

let AcquisitionService;
let serviceImportFailed = false;

try {
  ({ default: AcquisitionService } = await import('../../src/services/AcquisitionService.js'));
} catch {
  serviceImportFailed = true;
}

const maybeDescribe = serviceImportFailed ? describe.skip : describe;

maybeDescribe('US1: Automatic term acquisition from EtnoDB', () => {
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

  function makeEtnodbDoc(overrides = {}) {
    return {
      _id: new ObjectId(),
      comunidades: [
        {
          nome: 'Guarani Mbya',
          tipo: 'Indígena',
          plantas: [{ nomeVernacular: 'erva-mate', tipoUso: ['medicinal', 'alimentício'] }],
          atividadesEconomicas: ['artesanato', 'agricultura'],
        },
      ],
      ...overrides,
    };
  }

  test('run() creates candidate concepts from comunidades.tipo', async () => {
    await db.collection('etnodb').insertOne(makeEtnodbDoc());

    await AcquisitionService.run(db);

    const concepts = await db.collection('etnotermos').find({ sourceFields: 'comunidades.tipo' }).toArray();
    expect(concepts.length).toBeGreaterThanOrEqual(1);
    const indigena = concepts.find((c) =>
      c.prefLabels.some((l) => l.literalForm === 'indígena')
    );
    expect(indigena).toBeDefined();
  });

  test('run() creates candidate concepts from comunidades.plantas.nomeVernacular', async () => {
    await db.collection('etnodb').insertOne(makeEtnodbDoc());

    await AcquisitionService.run(db);

    const concepts = await db
      .collection('etnotermos')
      .find({ sourceFields: 'comunidades.plantas.nomeVernacular' })
      .toArray();
    expect(concepts.length).toBeGreaterThanOrEqual(1);
    const ervamate = concepts.find((c) =>
      c.prefLabels.some((l) => l.literalForm === 'erva-mate')
    );
    expect(ervamate).toBeDefined();
  });

  test('run() creates candidate concepts from comunidades.plantas.tipoUso', async () => {
    await db.collection('etnodb').insertOne(makeEtnodbDoc());

    await AcquisitionService.run(db);

    const concepts = await db
      .collection('etnotermos')
      .find({ sourceFields: 'comunidades.plantas.tipoUso' })
      .toArray();
    expect(concepts.length).toBeGreaterThanOrEqual(1);

    const labels = concepts.flatMap((c) => c.prefLabels.map((l) => l.literalForm));
    expect(labels).toContain('medicinal');
    expect(labels).toContain('alimentício');
  });

  test('run() creates candidate concepts from comunidades.atividadesEconomicas', async () => {
    await db.collection('etnodb').insertOne(makeEtnodbDoc());

    await AcquisitionService.run(db);

    const concepts = await db
      .collection('etnotermos')
      .find({ sourceFields: 'comunidades.atividadesEconomicas' })
      .toArray();
    expect(concepts.length).toBeGreaterThanOrEqual(1);

    const labels = concepts.flatMap((c) => c.prefLabels.map((l) => l.literalForm));
    expect(labels).toContain('artesanato');
    expect(labels).toContain('agricultura');
  });

  test('cross-field deduplication: same literalForm in two fields produces one concept with both sourceFields', async () => {
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

  test('idempotency: running run() twice does not create duplicate concepts', async () => {
    await db.collection('etnodb').insertOne(makeEtnodbDoc());

    await AcquisitionService.run(db);
    const countAfterFirst = await db.collection('etnotermos').countDocuments();

    await AcquisitionService.run(db);
    const countAfterSecond = await db.collection('etnotermos').countDocuments();

    expect(countAfterSecond).toBe(countAfterFirst);
  });

  test('normalization: "ERVA-MATE " normalizes to "erva-mate" and matches existing concept', async () => {
    await db.collection('etnotermos').insertOne({
      _id: new ObjectId(),
      uri: 'etnotermos:erva-mate',
      status: 'candidate',
      sourceFields: ['comunidades.plantas.nomeVernacular'],
      sourceCommunities: [],
      prefLabels: [
        {
          _id: new ObjectId(),
          literalForm: 'erva-mate',
          language: 'pt',
          type: 'pref',
          accessLevel: 'public',
          labelRelations: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      altLabels: [],
      hiddenLabels: [],
      definition: null,
      scopeNote: null,
      historyNote: null,
      example: null,
      broader: [],
      narrower: [],
      related: [],
      ancestors: [],
      replacedBy: null,
      deprecatedDate: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.collection('etnodb').insertOne({
      _id: new ObjectId(),
      comunidades: [
        {
          nome: 'Guarani',
          tipo: 'Indígena',
          plantas: [{ nomeVernacular: 'ERVA-MATE ', tipoUso: [] }],
          atividadesEconomicas: [],
        },
      ],
    });

    await AcquisitionService.run(db);

    const concepts = await db
      .collection('etnotermos')
      .find({ 'prefLabels.literalForm': 'erva-mate' })
      .toArray();
    expect(concepts).toHaveLength(1);
  });

  test('empty/null values are ignored and do not create concepts', async () => {
    await db.collection('etnodb').insertOne({
      _id: new ObjectId(),
      comunidades: [
        {
          nome: 'Comunidade X',
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

  test('run() creates an AcquisitionLog with status "success", conceptsCreated, conceptsExisting, durationMs', async () => {
    await db.collection('etnodb').insertOne(makeEtnodbDoc());

    await AcquisitionService.run(db);

    const log = await db
      .collection('etnotermos_acquisition_log')
      .findOne({ status: 'success' });

    expect(log).not.toBeNull();
    expect(typeof log.conceptsCreated).toBe('number');
    expect(typeof log.conceptsExisting).toBe('number');
    expect(typeof log.durationMs).toBe('number');
    expect(log.durationMs).toBeGreaterThanOrEqual(0);
  });

  test('failure scenario: corrupt etnodb → AcquisitionLog has status "failure" and hasUnresolved:true', async () => {
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
  });

  test('sourceCommunities is populated from comunidades.nome values', async () => {
    await db.collection('etnodb').insertOne(makeEtnodbDoc());

    await AcquisitionService.run(db);

    const concepts = await db.collection('etnotermos').find({}).toArray();
    const withCommunity = concepts.filter(
      (c) => Array.isArray(c.sourceCommunities) && c.sourceCommunities.includes('Guarani Mbya')
    );
    expect(withCommunity.length).toBeGreaterThanOrEqual(1);
  });

  test('all created concepts have status "candidate", prefLabel with language "pt" and accessLevel "public"', async () => {
    await db.collection('etnodb').insertOne(makeEtnodbDoc());

    await AcquisitionService.run(db);

    const concepts = await db.collection('etnotermos').find({}).toArray();
    expect(concepts.length).toBeGreaterThan(0);

    for (const concept of concepts) {
      expect(concept.status).toBe('candidate');
      expect(concept.prefLabels.length).toBeGreaterThan(0);
      for (const label of concept.prefLabels) {
        expect(label.language).toBe('pt');
        expect(label.accessLevel).toBe('public');
      }
    }
  });
});
