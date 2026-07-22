/**
 * Source Service
 *
 * Computes, at render time, which BioCultDB references (`biocultdb_records`,
 * same shared SQLite file, ADR-005) cite a given BioCultTermos concept — by
 * matching the concept's preferred labels against the same monitored JSON
 * fields AcquisitionService watches. Nothing is persisted: this is always a
 * fresh read, so newly acquired/approved references show up immediately.
 */
import { pathToFileURL } from 'node:url';

/** Field → EXISTS(...) SQL builder, mirroring BioCultDB's FIELD_REGISTRY scopes
 *  (backend/src/services/database.js). Each builder binds one `?` parameter. */
const MONITORED_FIELDS = {
  'comunidades.tipo': () =>
    `EXISTS(SELECT 1 FROM json_each(doc,'$.comunidades') com WHERE LOWER(json_extract(com.value,'$.tipo'))=LOWER(?))`,
  'comunidades.atividadesEconomicas': () =>
    `EXISTS(SELECT 1 FROM json_each(doc,'$.comunidades') com, json_each(com.value,'$.atividadesEconomicas') ae WHERE LOWER(ae.value)=LOWER(?))`,
  'comunidades.plantas.nomeCientifico': () =>
    `EXISTS(SELECT 1 FROM json_each(doc,'$.comunidades') com, json_each(com.value,'$.plantas') pl, json_each(pl.value,'$.nomeCientifico') pv WHERE LOWER(pv.value)=LOWER(?))`,
  'comunidades.plantas.nomeVernacular': () =>
    `EXISTS(SELECT 1 FROM json_each(doc,'$.comunidades') com, json_each(com.value,'$.plantas') pl, json_each(pl.value,'$.nomeVernacular') pv WHERE LOWER(pv.value)=LOWER(?))`,
  'comunidades.plantas.tipoUso': () =>
    `EXISTS(SELECT 1 FROM json_each(doc,'$.comunidades') com, json_each(com.value,'$.plantas') pl, json_each(pl.value,'$.tipoUso') pv WHERE LOWER(pv.value)=LOWER(?))`,
};

/** Formats a reference as an APA-style citation: "Author, & Author (Year). Title. [DOI]" */
export function formatApa(ref) {
  const autores = Array.isArray(ref.autores) ? ref.autores.filter(Boolean) : [];
  let autoresStr;
  if (autores.length === 0) autoresStr = '';
  else if (autores.length === 1) autoresStr = autores[0];
  else if (autores.length === 2) autoresStr = `${autores[0]} & ${autores[1]}`;
  else autoresStr = `${autores.slice(0, -1).join(', ')}, & ${autores[autores.length - 1]}`;

  const doiPart = ref.DOI
    ? ` ${ref.DOI.includes('://') ? ref.DOI : 'https://doi.org/' + ref.DOI}`
    : '';

  return `${autoresStr} (${ref.ano}). ${ref.titulo}.${doiPart}`;
}

/**
 * Finds approved BioCultDB references whose monitored fields cite any of
 * `concept`'s preferred label literal forms, restricted to the field scopes
 * declared in `concept.sourceFields`.
 * @param {import('better-sqlite3').Database} db
 * @param {object} concept - concept doc with prefLabels[] and sourceFields[]
 * @returns {{id: string, citation: string}[]} sorted by year desc, then title
 */
export function findSourcesForConcept(db, concept) {
  const literalForms = [
    ...new Set(
      (concept.prefLabels || [])
        .map((l) => l.literalForm)
        .filter((v) => typeof v === 'string' && v.trim().length > 0)
    ),
  ];
  const fields = (concept.sourceFields || []).filter((f) => MONITORED_FIELDS[f]);

  if (literalForms.length === 0 || fields.length === 0) return [];

  const conditions = [];
  const params = [];
  for (const field of fields) {
    for (const value of literalForms) {
      conditions.push(MONITORED_FIELDS[field]());
      params.push(value);
    }
  }

  const sql = `SELECT DISTINCT id, doc FROM biocultdb_records
               WHERE json_extract(doc,'$.status') = 'approved' AND (${conditions.join(' OR ')})`;
  const rows = db.prepare(sql).all(...params);

  return rows
    .map((row) => {
      const ref = JSON.parse(row.doc);
      return { id: row.id, ano: ref.ano, titulo: ref.titulo, citation: formatApa(ref) };
    })
    .sort((a, b) => (b.ano || 0) - (a.ano || 0) || (a.titulo || '').localeCompare(b.titulo || ''))
    .map(({ id, citation }) => ({ id, citation }));
}

export default { findSourcesForConcept, formatApa };

// ponytail: self-check, no test framework — run with `node SourceService.js`
async function demo() {
  const assert = await import('node:assert/strict');
  const { default: Database } = await import('better-sqlite3');
  const db = new Database(':memory:');
  db.exec(`CREATE TABLE biocultdb_records (id TEXT PRIMARY KEY, doc TEXT NOT NULL)`);

  const approved = {
    id: 'ref-1',
    titulo: 'Estudo etnobotânico da Jurema',
    autores: ['Silva, J.', 'Souza, M.'],
    ano: 2020,
    DOI: '10.1234/abc',
    status: 'approved',
    comunidades: [
      {
        nome: 'Comunidade X',
        tipo: 'ribeirinha',
        plantas: [{ nomeCientifico: ['Mimosa tenuiflora'], nomeVernacular: ['Jurema'], tipoUso: ['medicinal'] }],
      },
    ],
  };
  const pending = { ...approved, id: 'ref-2', status: 'pending' };

  db.prepare('INSERT INTO biocultdb_records (id, doc) VALUES (?, ?)').run(approved.id, JSON.stringify(approved));
  db.prepare('INSERT INTO biocultdb_records (id, doc) VALUES (?, ?)').run(pending.id, JSON.stringify(pending));

  const concept = {
    prefLabels: [{ literalForm: 'jurema' }],
    sourceFields: ['comunidades.plantas.nomeVernacular'],
  };

  const sources = findSourcesForConcept(db, concept);
  assert.default.equal(sources.length, 1, 'should match only the approved reference');
  assert.default.equal(sources[0].id, 'ref-1');
  assert.default.equal(
    sources[0].citation,
    'Silva, J. & Souza, M. (2020). Estudo etnobotânico da Jurema. https://doi.org/10.1234/abc'
  );

  const noMatch = findSourcesForConcept(db, { prefLabels: [{ literalForm: 'inexistente' }], sourceFields: ['comunidades.plantas.nomeVernacular'] });
  assert.default.equal(noMatch.length, 0, 'should not match unrelated terms');

  console.log('SourceService.demo() OK');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  demo().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
