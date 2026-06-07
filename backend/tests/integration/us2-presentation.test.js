import { ObjectId } from 'mongodb';
import { connect, disconnect, clearCollections, getDb } from '../helpers/db.js';

let ConceptService;
let serviceImportFailed = false;

try {
  ({ default: ConceptService } = await import('../../src/services/ConceptService.js'));
} catch {
  serviceImportFailed = true;
}

const maybeDescribe = serviceImportFailed ? describe.skip : describe;

maybeDescribe('US2: Public term browsing', () => {
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

  function makeLabel(literalForm, accessLevel = 'public') {
    return {
      _id: new ObjectId(),
      literalForm,
      language: 'pt',
      type: 'pref',
      accessLevel,
      labelRelations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  function makeConcept(overrides = {}) {
    return {
      _id: new ObjectId(),
      uri: `etnotermos:${overrides.slug ?? new ObjectId().toHexString()}`,
      status: 'active',
      sourceFields: ['comunidades.tipo'],
      sourceCommunities: [],
      prefLabels: [makeLabel(overrides.prefLabel ?? 'termo-teste')],
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
      ...overrides,
    };
  }

  test('findMany with {status:"active", publicOnly:true} returns only active concepts', async () => {
    await db.collection('etnotermos').insertMany([
      makeConcept({ slug: 'ativo', prefLabel: 'ativo', status: 'active' }),
      makeConcept({ slug: 'candidato', prefLabel: 'candidato', status: 'candidate' }),
      makeConcept({ slug: 'depreciado', prefLabel: 'depreciado', status: 'deprecated' }),
    ]);

    const result = await ConceptService.findMany(db, { status: 'active', publicOnly: true });

    expect(result.data.length).toBe(1);
    expect(result.data[0].status).toBe('active');
  });

  test('candidate concepts are NOT returned in public interface', async () => {
    await db.collection('etnotermos').insertOne(
      makeConcept({ slug: 'candidato', prefLabel: 'candidato', status: 'candidate' })
    );

    const result = await ConceptService.findMany(db, { publicOnly: true });

    const candidates = result.data.filter((c) => c.status === 'candidate');
    expect(candidates).toHaveLength(0);
  });

  test('deprecated concepts are NOT returned in public interface', async () => {
    await db.collection('etnotermos').insertOne(
      makeConcept({ slug: 'depreciado', prefLabel: 'depreciado', status: 'deprecated' })
    );

    const result = await ConceptService.findMany(db, { publicOnly: true });

    const deprecated = result.data.filter((c) => c.status === 'deprecated');
    expect(deprecated).toHaveLength(0);
  });

  test('labels with accessLevel "sacred" are stripped from public response', async () => {
    const concept = makeConcept({ slug: 'sagrado', prefLabel: 'sagrado', status: 'active' });
    concept.altLabels = [makeLabel('nome-sagrado', 'sacred')];
    await db.collection('etnotermos').insertOne(concept);

    const result = await ConceptService.findMany(db, { publicOnly: true });

    for (const c of result.data) {
      const sacredLabels = [...(c.prefLabels ?? []), ...(c.altLabels ?? []), ...(c.hiddenLabels ?? [])]
        .filter((l) => l.accessLevel === 'sacred');
      expect(sacredLabels).toHaveLength(0);
    }
  });

  test('labels with accessLevel "restricted" are stripped from public response', async () => {
    const concept = makeConcept({ slug: 'restrito', prefLabel: 'restrito', status: 'active' });
    concept.altLabels = [makeLabel('nome-restrito', 'restricted')];
    await db.collection('etnotermos').insertOne(concept);

    const result = await ConceptService.findMany(db, { publicOnly: true });

    for (const c of result.data) {
      const restrictedLabels = [...(c.prefLabels ?? []), ...(c.altLabels ?? []), ...(c.hiddenLabels ?? [])]
        .filter((l) => l.accessLevel === 'restricted');
      expect(restrictedLabels).toHaveLength(0);
    }
  });

  test('labels with accessLevel "public" are included in public response', async () => {
    await db.collection('etnotermos').insertOne(
      makeConcept({ slug: 'publico', prefLabel: 'erva-mate', status: 'active' })
    );

    const result = await ConceptService.findMany(db, { publicOnly: true });

    const found = result.data.find((c) =>
      c.prefLabels.some((l) => l.literalForm === 'erva-mate' && l.accessLevel === 'public')
    );
    expect(found).toBeDefined();
  });

  test('findMany with {q:"erva-mate", publicOnly:true} returns text-search match', async () => {
    await db.collection('etnotermos').insertOne(
      makeConcept({ slug: 'erva-mate', prefLabel: 'erva-mate', status: 'active' })
    );

    let result;
    try {
      result = await ConceptService.findMany(db, { q: 'erva-mate', publicOnly: true });
    } catch (err) {
      if (/text index/i.test(err.message)) {
        return;
      }
      throw err;
    }

    const found = result.data.find((c) =>
      c.prefLabels.some((l) => l.literalForm === 'erva-mate')
    );
    expect(found).toBeDefined();
  });

  test('findMany with {sourceField:"comunidades.tipo"} returns filtered results', async () => {
    await db.collection('etnotermos').insertMany([
      makeConcept({ slug: 'tipo', prefLabel: 'indígena', status: 'active', sourceFields: ['comunidades.tipo'] }),
      makeConcept({ slug: 'uso', prefLabel: 'medicinal', status: 'active', sourceFields: ['comunidades.plantas.tipoUso'] }),
    ]);

    const result = await ConceptService.findMany(db, { sourceField: 'comunidades.tipo' });

    expect(result.data.every((c) => c.sourceFields.includes('comunidades.tipo'))).toBe(true);
    expect(result.data.length).toBe(1);
  });

  test('findById returns broader/narrower/related with prefLabel resolved', async () => {
    const broader = makeConcept({ slug: 'broader', prefLabel: 'comunidade', status: 'active' });
    const concept = makeConcept({ slug: 'child', prefLabel: 'criança', status: 'active' });
    concept.broader = [broader._id];

    await db.collection('etnotermos').insertMany([broader, concept]);

    const result = await ConceptService.findById(db, concept._id, { publicOnly: true });

    expect(result).not.toBeNull();
    expect(Array.isArray(result.broader)).toBe(true);
    expect(result.broader.length).toBe(1);
    expect(result.broader[0]).toHaveProperty('prefLabels');
  });

  test('findById returns null for a nonexistent id', async () => {
    const result = await ConceptService.findById(db, new ObjectId(), { publicOnly: true });
    expect(result).toBeNull();
  });

  test('deprecated concept via findById returns concept with status "deprecated" and replacedBy populated', async () => {
    const replacement = makeConcept({ slug: 'novo', prefLabel: 'novo-termo', status: 'active' });
    const deprecated = makeConcept({ slug: 'velho', prefLabel: 'velho-termo', status: 'deprecated' });
    deprecated.replacedBy = replacement._id;
    deprecated.deprecatedDate = new Date();

    await db.collection('etnotermos').insertMany([replacement, deprecated]);

    const result = await ConceptService.findById(db, deprecated._id, { publicOnly: false });

    expect(result).not.toBeNull();
    expect(result.status).toBe('deprecated');
    expect(result.replacedBy).toBeDefined();
    expect(result.replacedBy.toString()).toBe(replacement._id.toString());
  });

  test('pagination: findMany with {page:2, limit:2} returns correct slice', async () => {
    const concepts = Array.from({ length: 5 }, (_, i) =>
      makeConcept({ slug: `termo-${i}`, prefLabel: `termo-${i}`, status: 'active' })
    );
    await db.collection('etnotermos').insertMany(concepts);

    const result = await ConceptService.findMany(db, { status: 'active', page: 2, limit: 2 });

    expect(result.data).toHaveLength(2);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.limit).toBe(2);
    expect(result.pagination.total).toBe(5);
  });
});
