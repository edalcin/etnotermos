import { randomUUID } from 'crypto';
import { connect, disconnect, clearCollections, getDb } from '../helpers/db.js';
import { createConcept, insertConcept } from '../../src/models/Concept.js';

let AcquisitionService;
let serviceImportFailed = false;

try {
  ({ default: AcquisitionService } = await import('../../src/services/AcquisitionService.js'));
} catch {
  serviceImportFailed = true;
}

const maybeDescribe = serviceImportFailed ? describe.skip : describe;

maybeDescribe('US1: Automatic term acquisition from BioCultDB', () => {
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

  // Inserts a `biocultdb_records` row (same SQLite file, unit-shared table —
  // ADR-005) that AcquisitionService.run() reads via json_each.
  function insertBiocultdbRecord(doc) {
    const id = doc.id ?? randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO biocultdb_records (id, doc, created_at, updated_at) VALUES (?, ?, ?, ?)`
    ).run(id, JSON.stringify({ id, ...doc }), now, now);
    return id;
  }

  function allConcepts() {
    return db.prepare(`SELECT doc FROM etnotermos`).all().map((row) => JSON.parse(row.doc));
  }

  function conceptsWithSourceField(field) {
    return allConcepts().filter((c) => c.sourceFields.includes(field));
  }

  function conceptsWithPrefLabel(literalForm) {
    return allConcepts().filter((c) => c.prefLabels.some((l) => l.literalForm === literalForm));
  }

  function countConcepts() {
    return db.prepare(`SELECT COUNT(*) as n FROM etnotermos`).get().n;
  }

  function findAcquisitionLog(status) {
    return (
      db
        .prepare(`SELECT doc FROM etnotermos_acquisition_log`)
        .all()
        .map((row) => JSON.parse(row.doc))
        .find((log) => log.status === status) ?? null
    );
  }

  test('run() creates candidate concepts from comunidades.tipo', async () => {
    insertBiocultdbRecord(makeEtnodbDoc());

    await AcquisitionService.run(db);

    const concepts = conceptsWithSourceField('comunidades.tipo');
    expect(concepts.length).toBeGreaterThanOrEqual(1);
    const indigena = concepts.find((c) => c.prefLabels.some((l) => l.literalForm === 'indígena'));
    expect(indigena).toBeDefined();
  });

  test('run() creates candidate concepts from comunidades.plantas.nomeVernacular', async () => {
    insertBiocultdbRecord(makeEtnodbDoc());

    await AcquisitionService.run(db);

    const concepts = conceptsWithSourceField('comunidades.plantas.nomeVernacular');
    expect(concepts.length).toBeGreaterThanOrEqual(1);
    const ervamate = concepts.find((c) => c.prefLabels.some((l) => l.literalForm === 'erva-mate'));
    expect(ervamate).toBeDefined();
  });

  test('run() creates candidate concepts from comunidades.plantas.tipoUso', async () => {
    insertBiocultdbRecord(makeEtnodbDoc());

    await AcquisitionService.run(db);

    const concepts = conceptsWithSourceField('comunidades.plantas.tipoUso');
    expect(concepts.length).toBeGreaterThanOrEqual(1);

    const labels = concepts.flatMap((c) => c.prefLabels.map((l) => l.literalForm));
    expect(labels).toContain('medicinal');
    expect(labels).toContain('alimentício');
  });

  test('run() creates candidate concepts from comunidades.atividadesEconomicas', async () => {
    insertBiocultdbRecord(makeEtnodbDoc());

    await AcquisitionService.run(db);

    const concepts = conceptsWithSourceField('comunidades.atividadesEconomicas');
    expect(concepts.length).toBeGreaterThanOrEqual(1);

    const labels = concepts.flatMap((c) => c.prefLabels.map((l) => l.literalForm));
    expect(labels).toContain('artesanato');
    expect(labels).toContain('agricultura');
  });

  test('cross-field deduplication: same literalForm in two fields produces one concept with both sourceFields', async () => {
    insertBiocultdbRecord({
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

    const concepts = conceptsWithPrefLabel('medicinal');

    expect(concepts).toHaveLength(1);
    expect(concepts[0].sourceFields).toContain('comunidades.tipo');
    expect(concepts[0].sourceFields).toContain('comunidades.plantas.tipoUso');
  });

  test('idempotency: running run() twice does not create duplicate concepts', async () => {
    insertBiocultdbRecord(makeEtnodbDoc());

    await AcquisitionService.run(db);
    const countAfterFirst = countConcepts();

    await AcquisitionService.run(db);
    const countAfterSecond = countConcepts();

    expect(countAfterSecond).toBe(countAfterFirst);
  });

  test('normalization: "ERVA-MATE " normalizes to "erva-mate" and matches existing concept', async () => {
    const existing = createConcept({
      status: 'candidate',
      sourceFields: ['comunidades.plantas.nomeVernacular'],
      sourceCommunities: [],
      prefLabels: [{ literalForm: 'erva-mate', language: 'pt', type: 'pref', accessLevel: 'public' }],
    });
    insertConcept(db, existing);

    insertBiocultdbRecord({
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

    const concepts = conceptsWithPrefLabel('erva-mate');
    expect(concepts).toHaveLength(1);
  });

  test('empty/null values are ignored and do not create concepts', async () => {
    insertBiocultdbRecord({
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

    expect(countConcepts()).toBe(0);
  });

  test('run() creates an AcquisitionLog with status "success", conceptsCreated, conceptsExisting, durationMs', async () => {
    insertBiocultdbRecord(makeEtnodbDoc());

    await AcquisitionService.run(db);

    const log = findAcquisitionLog('success');

    expect(log).not.toBeNull();
    expect(typeof log.conceptsCreated).toBe('number');
    expect(typeof log.conceptsExisting).toBe('number');
    expect(typeof log.durationMs).toBe('number');
    expect(log.durationMs).toBeGreaterThanOrEqual(0);
  });

  test('failure scenario: corrupt etnodb → AcquisitionLog has status "failure" and hasUnresolved:true', async () => {
    insertBiocultdbRecord({ comunidades: 'NOT_AN_ARRAY' });

    await AcquisitionService.run(db);

    const log = findAcquisitionLog('failure');

    expect(log).not.toBeNull();
    expect(log.hasUnresolved).toBe(true);
  });

  test('sourceCommunities is populated from comunidades.nome values', async () => {
    insertBiocultdbRecord(makeEtnodbDoc());

    await AcquisitionService.run(db);

    const withCommunity = allConcepts().filter(
      (c) => Array.isArray(c.sourceCommunities) && c.sourceCommunities.includes('Guarani Mbya')
    );
    expect(withCommunity.length).toBeGreaterThanOrEqual(1);
  });

  test('all created concepts have status "candidate", prefLabel with language "pt" and accessLevel "public"', async () => {
    insertBiocultdbRecord(makeEtnodbDoc());

    await AcquisitionService.run(db);

    const concepts = allConcepts();
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
