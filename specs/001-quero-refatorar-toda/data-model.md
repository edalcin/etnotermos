# Data Model: Refatoração EtnoTermos — SKOS-XL + Integração EtnoDB

**Feature**: 001-quero-refatorar-toda  
**Date**: 2026-06-06  
**Status**: Complete

---

## Overview

Três coleções novas na database `etnodb` (compartilhada com EtnoDB):

| Coleção | Finalidade |
|---------|-----------|
| `etnotermos` | Conceitos SKOS-XL com Labels embedded |
| `etnotermos_acquisition_log` | Log de cada execução da aquisição |
| `etnotermos_audit_log` | Trilha de auditoria imutável |

A coleção `etnodb` (do EtnoDB) é **somente leitura** — nenhuma escrita por esta aplicação.

---

## Coleção: `etnotermos`

### Schema Completo

```javascript
{
  _id: ObjectId,                     // MongoDB auto-generated

  // ── Identidade ──────────────────────────────────────────────────
  uri: String,                       // "etnotermos:{slug}" — base para IRI futuro
  status: String,                    // "candidate" | "active" | "deprecated"
  sourceFields: [String],            // campos de origem: ["comunidades.tipo", ...]
  sourceCommunities: [String],       // comunidades donde veio o valor

  // ── Labels SKOS-XL (embedded) ───────────────────────────────────
  prefLabels:   [LabelSchema],       // exatamente 1 por idioma (unicidade: literalForm+language+type)
  altLabels:    [LabelSchema],
  hiddenLabels: [LabelSchema],

  // ── Notas SKOS ──────────────────────────────────────────────────
  definition:  String,               // skos:definition
  scopeNote:   String,               // skos:scopeNote
  historyNote: String,               // skos:historyNote
  example:     String,               // skos:example

  // ── Relações SKOS ───────────────────────────────────────────────
  broader:   [ObjectId],             // refs a Concept._id
  narrower:  [ObjectId],             // refs a Concept._id (mantidos para leitura rápida)
  related:   [ObjectId],             // refs a Concept._id
  ancestors: [ObjectId],             // Array of Ancestors: raiz → pai imediato (ordenado)

  // ── Depreciação ─────────────────────────────────────────────────
  replacedBy:      ObjectId | null,  // ref a Concept._id substituto
  deprecatedDate:  Date | null,

  // ── Controle de concorrência ────────────────────────────────────
  version: Number,                   // incrementado a cada write (optimistic locking)

  createdAt: Date,
  updatedAt: Date
}
```

### LabelSchema (embedded subdocument)

```javascript
{
  _id: ObjectId,               // identidade do rótulo (para labelRelation refs)

  // SKOS-XL obrigatórios
  literalForm: String,         // texto do rótulo
  language: String,            // ISO 639-3: "pt", "hux", "tup", "en", ...
  type: String,                // "pref" | "alt" | "hidden"

  // Metadados SKOS-XL opcionais
  sourcePeople:    String,     // povo de origem (ex: "Guarani Mbya")
  sourceRegion:    String,     // região geográfica
  accessLevel:     String,     // "public" | "restricted" | "sacred"
  source:          String,     // dct:source — referência bibliográfica
  validatingOrg:   String,     // organização validadora
  validationDate:  Date | null,
  audioPath:       String | null, // path relativo a AUDIO_STORAGE_PATH

  // Proveniência CARE
  holderPeople:          String,
  collectorResearcher:   String,
  priorInformedConsent:  Boolean | null,
  bibliographicSource:   String,

  // Relações entre rótulos (skosxl:labelRelation)
  labelRelations: [LabelRelationSchema],

  createdAt: Date,
  updatedAt: Date
}
```

### LabelRelationSchema (embedded em LabelSchema)

```javascript
{
  relatedLabelId: ObjectId,    // _id de outro Label no mesmo Concept
  relationType:   String       // "loanword" | "cognate" | "dialectal-variant"
}
```

### Regras de Validação

| Campo | Regra |
|-------|-------|
| `status` | enum: `["candidate", "active", "deprecated"]` |
| `sourceFields` | array de strings, mínimo 1 na criação |
| `prefLabels` | máximo 1 por combinação `(language)` |
| `LabelSchema.type` | enum: `["pref", "alt", "hidden"]` |
| `LabelSchema.accessLevel` | enum: `["public", "restricted", "sacred"]`; default: `"public"` |
| `LabelSchema.language` | string ISO 639-3, obrigatório |
| `LabelSchema.literalForm` | string não-vazia, max 500 chars |
| Unicidade de Label | `(literalForm + language + type)` único por Concept |
| `version` | integer ≥ 1; incrementado a cada `updateOne` |
| Ciclos hierárquicos | `ancestors` de Concept não deve conter `targetId` ao adicionar broader |
| `replacedBy` | obrigatório ao deprecar (`status → "deprecated"`) |

### Transições de Status

```
[aquisição]
    ↓
"candidate"  →  "active"  →  "deprecated"
              (curador)     (curador; replacedBy obrigatório)
```

- `candidate → active`: conceito torna-se visível na interface pública
- `active → deprecated`: visível somente com indicação; `replacedBy` referencia substituto
- `deprecated → *`: sem transição de volta (preservação histórica)

### Índices MongoDB

```javascript
// Texto: busca por literalForm em pref e alt labels
db.etnotermos.createIndex({
  "prefLabels.literalForm": "text",
  "altLabels.literalForm":  "text"
}, { name: "text_labels" })

// Filtro por status (apresentação + curadoria)
db.etnotermos.createIndex({ status: 1 }, { name: "idx_status" })

// Filtro por sourceField (grupo semântico)
db.etnotermos.createIndex({ sourceFields: 1 }, { name: "idx_sourceFields" })

// Navegação hierárquica
db.etnotermos.createIndex({ broader:   1 }, { name: "idx_broader"   })
db.etnotermos.createIndex({ narrower:  1 }, { name: "idx_narrower"  })
db.etnotermos.createIndex({ ancestors: 1 }, { name: "idx_ancestors" })

// Optimistic locking
db.etnotermos.createIndex({ _id: 1, version: 1 }, { name: "idx_version" })

// Depreciação
db.etnotermos.createIndex({ replacedBy: 1 }, { name: "idx_replacedBy", sparse: true })
```

---

## Coleção: `etnotermos_acquisition_log`

### Schema

```javascript
{
  _id: ObjectId,
  executedAt:      Date,         // timestamp de início
  status:          String,       // "success" | "failure"
  errorMessage:    String | null, // stack trace ou mensagem de erro
  fieldsProcessed: [String],     // campos processados nesta execução
  conceptsCreated: Number,       // novos conceitos criados
  conceptsExisting: Number,      // valores já existentes (ignorados)
  errors:          [String],     // erros individuais por valor (ex: tipo de valor inválido)
  hasUnresolved:   Boolean,      // true se status=failure AND nenhuma execução bem-sucedida depois
                                  // atualizado pelo próximo run bem-sucedido: hasUnresolved=false
  durationMs:      Number        // tempo de execução em milissegundos
}
```

### Índices

```javascript
db.etnotermos_acquisition_log.createIndex({ executedAt: -1 })
db.etnotermos_acquisition_log.createIndex({ hasUnresolved: 1, status: 1 })
```

---

## Coleção: `etnotermos_audit_log`

### Schema

```javascript
{
  _id: ObjectId,
  conceptId:          ObjectId,  // ref a etnotermos._id
  conceptLiteralForm: String,    // denormalizado para leitura (literalForm do prefLabel pt)
  field:              String,    // campo alterado (ex: "status", "prefLabels[0].accessLevel")
  previousValue:      Mixed,     // valor anterior (null se criação)
  newValue:           Mixed,     // valor novo
  responsible:        String,    // username do Basic Auth
  timestamp:          Date       // momento da alteração
}
```

**Imutabilidade**: Documentos nesta coleção NUNCA são atualizados ou excluídos. Apenas inserts.

### Índices

```javascript
db.etnotermos_audit_log.createIndex({ conceptId: 1, timestamp: -1 })
db.etnotermos_audit_log.createIndex({ responsible: 1, timestamp: -1 })
db.etnotermos_audit_log.createIndex({ timestamp: -1 })
```

---

## Padrão Array of Ancestors — Atualização em Cascata

Quando conceito A recebe novo `skos:broader` B:

```
1. Verificar que B._id não está em A.ancestors (evitar ciclo)
2. A.ancestors = [...B.ancestors, B._id]
3. Para cada C em A.narrower (descendentes diretos):
   C.ancestors = [...A.ancestors, A._id, ...C.ancestors.after(A._id)]
   → Recursivo até folhas
4. Adicionar A._id a B.narrower (reciprocidade)
5. B.ancestors não muda
```

Quando `skos:broader` é removido (A deixa de ter B como pai):
```
1. Remover B._id e todos os ancestrais de B de A.ancestors
2. Propagar remoção em cascata para descendentes de A
3. Remover A._id de B.narrower
```

---

## Padrão de Queries

### Apresentação: busca textual

```javascript
db.etnotermos.find({
  status: "active",
  $text: { $search: "ayahuasca" }
}, {
  score: { $meta: "textScore" },
  prefLabels: 1, altLabels: 1, status: 1, sourceFields: 1
}).sort({ score: { $meta: "textScore" } }).limit(20)
```

### Apresentação: filtro por grupo semântico

```javascript
db.etnotermos.find({
  status: "active",
  sourceFields: "comunidades.plantas.tipoUso"
})
```

### Curadoria: conceitos orphaned (sem broader, sem declaração como Top Term)

```javascript
db.etnotermos.find({
  status: { $in: ["active", "candidate"] },
  broader: { $size: 0 },
  isTopTerm: { $ne: true }
})
```

### Aquisição: distinct values por campo

```javascript
// Para campos simples (comunidades.tipo)
db.etnodb.distinct("comunidades.tipo", { "comunidades.tipo": { $ne: null } })

// Para campos array (comunidades.plantas.nomeVernacular)
db.etnodb.aggregate([
  { $unwind: "$comunidades" },
  { $unwind: "$comunidades.plantas" },
  { $unwind: "$comunidades.plantas.nomeVernacular" },
  { $group: {
    _id: { $toLower: "$comunidades.plantas.nomeVernacular" },
    comunidades: { $addToSet: "$comunidades.nome" }
  }},
  { $match: { _id: { $ne: "", $ne: null } } }
])
```

---

## Entidades Relacionadas (EtnoDB — somente leitura)

A coleção `etnodb` não é gerenciada por este sistema. Referência:

```javascript
// Campos monitorados
"comunidades.tipo"                   // String singular
"comunidades.plantas.nomeVernacular" // [String]
"comunidades.plantas.tipoUso"        // [String]
"comunidades.atividadesEconomicas"   // [String]

// Atribuição comunitária
"comunidades.nome"                   // String — usado em sourceCommunities
```

---

## Compatibilidade JSON-LD (Exportação Futura)

A estrutura embedded é compatível com serialização SKOS-XL em JSON-LD sem migração:

```jsonld
{
  "@context": {
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "skosxl": "http://www.w3.org/2008/05/skos-xl#",
    "dct": "http://purl.org/dc/terms/",
    "et": "https://etnotermos.jbrj.gov.br/"
  },
  "@id": "et:concept/{_id}",
  "@type": "skos:Concept",
  "skos:inScheme": "et:scheme/etnotermos",
  "skosxl:prefLabel": {
    "@id": "et:label/{label._id}",
    "@type": "skosxl:Label",
    "skosxl:literalForm": { "@value": "{literalForm}", "@language": "{language}" }
  }
}
```
