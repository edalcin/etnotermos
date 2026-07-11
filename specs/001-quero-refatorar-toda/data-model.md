# Data Model: Refatoração BioCultTermos — SKOS-XL + Integração BioCultDB

**Feature**: 001-quero-refatorar-toda  
**Date**: 2026-06-06  
**Status**: Complete

---

## Overview

Três tabelas novas no mesmo arquivo SQLite compartilhado com o BioCultDB (`SQLITE_DB_PATH`, ADR-005 — Arquitetura-BioCultural):

| Tabela | Finalidade |
|---------|-----------|
| `etnotermos` | Conceitos SKOS-XL com Labels embedded (documento JSON1 na coluna `doc`) |
| `etnotermos_acquisition_log` | Log de cada execução da aquisição |
| `etnotermos_audit_log` | Trilha de auditoria imutável |

A tabela `biocultdb_records` (do BioCultDB, mesmo arquivo `.sqlite`) é **somente leitura** — nenhuma escrita por esta aplicação; é criada e mantida pelo `shared/database.js` do BioCultDB.

---

## Tabela: `etnotermos`

### Schema Completo

```sql
CREATE TABLE etnotermos (
  id         TEXT PRIMARY KEY,                                                       -- UUID v4 (string)
  doc        TEXT NOT NULL CHECK (json_valid(doc)),                                  -- documento JSON1 (shape abaixo)
  created_at TEXT NOT NULL,                                                          -- ISO 8601
  updated_at TEXT NOT NULL,                                                          -- ISO 8601
  status     TEXT    GENERATED ALWAYS AS (json_extract(doc,'$.status')) VIRTUAL,
  version    INTEGER GENERATED ALWAYS AS (CAST(json_extract(doc,'$.version') AS INTEGER)) VIRTUAL
);
```

`status` e `version` são **colunas geradas** (`GENERATED ALWAYS AS ... VIRTUAL`) a partir do JSON em `doc`, permitindo índice e filtro SQL direto sem `json_extract` repetido em cada query.

Shape do documento JSON armazenado na coluna `doc` (o `id` dentro do JSON é sempre igual ao `id` da coluna/PRIMARY KEY):

```jsonc
{
  "id": "uuid-v4-string",             // igual à coluna id (PRIMARY KEY)

  // ── Identidade ──────────────────────────────────────────────────
  "uri": "string",                    // "etnotermos:{slug}" — base para IRI futuro
  "status": "string",                 // "candidate" | "active" | "deprecated"
  "sourceFields": ["string"],         // campos de origem: ["comunidades.tipo", ...]
  "sourceCommunities": ["string"],    // comunidades donde veio o valor

  // ── Labels SKOS-XL (embedded no JSON) ────────────────────────────
  "prefLabels":   ["LabelSchema"],    // exatamente 1 por idioma (unicidade: literalForm+language+type)
  "altLabels":    ["LabelSchema"],
  "hiddenLabels": ["LabelSchema"],

  // ── Notas SKOS ──────────────────────────────────────────────────
  "definition":  "string | null",     // skos:definition
  "scopeNote":   "string | null",     // skos:scopeNote
  "historyNote": "string | null",     // skos:historyNote
  "example":     "string | null",     // skos:example

  // ── Relações SKOS ───────────────────────────────────────────────
  "broader":   ["uuid-string"],       // refs a etnotermos.id
  "narrower":  ["uuid-string"],       // refs a etnotermos.id (mantidos para leitura rápida)
  "related":   ["uuid-string"],       // refs a etnotermos.id
  "ancestors": ["uuid-string"],       // Array of Ancestors: raiz → pai imediato (ordenado)

  // ── Depreciação ─────────────────────────────────────────────────
  "replacedBy":     "uuid-string | null", // ref a etnotermos.id substituto
  "deprecatedDate": "string | null",      // ISO 8601

  // ── Controle de concorrência ────────────────────────────────────
  "version": "integer",               // incrementado a cada write (optimistic locking)

  "createdAt": "string",              // ISO 8601
  "updatedAt": "string"               // ISO 8601
}
```

### LabelSchema (objeto embedded no JSON, dentro de `prefLabels`/`altLabels`/`hiddenLabels`)

```jsonc
{
  "id": "uuid-v4-string",       // identidade do rótulo (para labelRelation refs)

  // SKOS-XL obrigatórios
  "literalForm": "string",      // texto do rótulo
  "language": "string",         // ISO 639-3: "pt", "hux", "tup", "en", ...
  "type": "string",             // "pref" | "alt" | "hidden"

  // Metadados SKOS-XL opcionais
  "sourcePeople":    "string | null",  // povo de origem (ex: "Guarani Mbya")
  "sourceRegion":    "string | null",  // região geográfica
  "accessLevel":     "string",         // "public" | "restricted" | "sacred"
  "source":          "string | null",  // dct:source — referência bibliográfica
  "validatingOrg":   "string | null",  // organização validadora
  "validationDate":  "string | null",  // ISO 8601
  "audioPath":       "string | null",  // path relativo a AUDIO_STORAGE_PATH

  // Proveniência CARE
  "holderPeople":          "string | null",
  "collectorResearcher":   "string | null",
  "priorInformedConsent":  "boolean | null",
  "bibliographicSource":   "string | null",

  // Relações entre rótulos (skosxl:labelRelation)
  "labelRelations": ["LabelRelationSchema"],

  "createdAt": "string",        // ISO 8601
  "updatedAt": "string"         // ISO 8601
}
```

### LabelRelationSchema (objeto embedded dentro de `LabelSchema.labelRelations`)

```jsonc
{
  "relatedLabelId": "uuid-v4-string", // id de outro Label no mesmo Concept
  "relationType":   "string"          // "loanword" | "cognate" | "dialectal-variant"
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
| `version` | integer ≥ 1; incrementado a cada escrita (`UPDATE`) |
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

### Índices SQLite

```sql
-- Texto: busca por literalForm em pref e alt labels — FTS5 virtual table
-- (join por id com etnotermos)
CREATE VIRTUAL TABLE etnotermos_fts USING fts5(
  id UNINDEXED,
  prefLabels,
  altLabels,
  definition,
  scopeNote,
  tokenize='unicode61 remove_diacritics 2'
);
-- Repovoada via DELETE+INSERT a cada escrita de conceito (FTS5 não suporta UPDATE parcial)

-- Filtro por status (apresentação + curadoria) — usa a coluna gerada `status`
CREATE INDEX idx_etnotermos_status ON etnotermos(status);
```

Os demais filtros do design original — `sourceFields`, `broader`, `narrower`, `ancestors`, `replacedBy` — operam sobre arrays dentro do JSON de `doc`; no volume esperado (~1k–10k conceitos, ver research.md) são resolvidos com `json_each()`/`EXISTS` em vez de um índice dedicado, por exemplo:

```sql
-- Filtro por sourceField (grupo semântico)
SELECT doc FROM etnotermos e
WHERE EXISTS (
  SELECT 1 FROM json_each(json_extract(e.doc,'$.sourceFields')) je WHERE je.value = ?
);

-- Navegação hierárquica / depreciação: mesmo padrão para broader, narrower,
-- ancestors e replacedBy (json_array_length / json_each conforme a query)
```

**Optimistic locking**: não depende de índice dedicado — o `UPDATE` já filtra por `WHERE id = ? AND version = ?` (PRIMARY KEY cobre `id`); `changes === 0` no resultado do `run()` indica conflito de versão (HTTP 409).

---

## Tabela: `etnotermos_acquisition_log`

### Schema

```sql
CREATE TABLE etnotermos_acquisition_log (
  id          TEXT PRIMARY KEY,                                                       -- UUID v4 (string)
  doc         TEXT NOT NULL CHECK (json_valid(doc)),                                  -- documento JSON1 (shape abaixo)
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  executed_at TEXT GENERATED ALWAYS AS (json_extract(doc,'$.executedAt')) VIRTUAL
);
```

Shape do JSON em `doc`:

```jsonc
{
  "id": "uuid-v4-string",
  "executedAt":       "string",         // ISO 8601 — timestamp de início
  "status":           "string",         // "success" | "failure"
  "errorMessage":     "string | null",  // stack trace ou mensagem de erro
  "fieldsProcessed":  ["string"],       // campos processados nesta execução
  "conceptsCreated":  "integer",        // novos conceitos criados
  "conceptsExisting": "integer",        // valores já existentes (ignorados)
  "errors":           ["string"],       // erros individuais por valor (ex: tipo de valor inválido)
  "hasUnresolved":    "boolean",        // true se status=failure AND nenhuma execução bem-sucedida depois
                                          // atualizado pelo próximo run bem-sucedido: hasUnresolved=false
  "durationMs":       "integer"         // tempo de execução em milissegundos
}
```

### Índices

```sql
CREATE INDEX idx_etnotermos_acquisition_log_executed_at ON etnotermos_acquisition_log(executed_at);
-- Filtro por hasUnresolved/status (dashboard de curadoria) resolvido via json_extract
-- sobre `doc`, dado o baixo volume de execuções de aquisição (uma por dia)
```

---

## Tabela: `etnotermos_audit_log`

### Schema

```sql
CREATE TABLE etnotermos_audit_log (
  id         TEXT PRIMARY KEY,                                                        -- UUID v4 (string)
  doc        TEXT NOT NULL CHECK (json_valid(doc)),                                    -- documento JSON1 (shape abaixo)
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  concept_id TEXT GENERATED ALWAYS AS (json_extract(doc,'$.conceptId')) VIRTUAL
);
```

Shape do JSON em `doc`:

```jsonc
{
  "id":                 "uuid-v4-string",
  "conceptId":          "uuid-v4-string", // ref a etnotermos.id
  "conceptLiteralForm": "string",         // denormalizado para leitura (literalForm do prefLabel pt)
  "field":              "string",         // campo alterado (ex: "status", "prefLabels[0].accessLevel")
  "previousValue":      "any",            // valor anterior (null se criação)
  "newValue":           "any",            // valor novo
  "responsible":        "string",         // username do Basic Auth
  "timestamp":          "string"          // ISO 8601 — momento da alteração
}
```

**Imutabilidade**: Linhas nesta tabela NUNCA são atualizadas ou excluídas. Apenas `INSERT`.

### Índices

```sql
CREATE INDEX idx_etnotermos_audit_log_concept ON etnotermos_audit_log(concept_id);
-- Ordenação por timestamp e filtro por responsible resolvidos via json_extract
-- sobre `doc` (auditoria é escrita frequente, leitura pouco frequente/pouco volumosa)
```

---

## Padrão Array of Ancestors — Atualização em Cascata

Quando conceito A recebe novo `skos:broader` B:

```
1. Verificar que B.id não está em A.ancestors (evitar ciclo)
2. A.ancestors = [...B.ancestors, B.id]
3. Para cada C em A.narrower (descendentes diretos):
   C.ancestors = [...A.ancestors, A.id, ...C.ancestors.after(A.id)]
   → Recursivo até folhas
4. Adicionar A.id a B.narrower (reciprocidade)
5. B.ancestors não muda
```

Quando `skos:broader` é removido (A deixa de ter B como pai):
```
1. Remover B.id e todos os ancestrais de B de A.ancestors
2. Propagar remoção em cascata para descendentes de A
3. Remover A.id de B.narrower
```

Cada escrita da cascata persiste o JSON completo via `UPDATE etnotermos SET doc = ?, updated_at = ? WHERE id = ?` (reserialização integral do documento — SQLite JSON1 não tem um "positional update" atômico para elementos de array).

---

## Padrão de Queries

### Apresentação: busca textual

```sql
-- FTS5 MATCH com ranking bm25
SELECT e.doc FROM etnotermos_fts f
JOIN etnotermos e ON e.id = f.id
WHERE etnotermos_fts MATCH '"ayahuasca"'
  AND json_extract(e.doc,'$.status') = 'active'
ORDER BY bm25(etnotermos_fts, 10.0, 5.0, 3.0, 2.0)
LIMIT 20;
```

A aplicação projeta apenas `prefLabels`, `altLabels`, `status`, `sourceFields` do JSON retornado antes de enviar ao cliente. Se a query FTS5 falhar (sintaxe MATCH inválida vinda do usuário), a camada de serviço faz fallback para um `LIKE` sobre `json_each(doc,'$.prefLabels')`.

### Apresentação: filtro por grupo semântico

```sql
SELECT doc FROM etnotermos e
WHERE json_extract(e.doc,'$.status') = 'active'
  AND EXISTS (
    SELECT 1 FROM json_each(json_extract(e.doc,'$.sourceFields')) je
    WHERE je.value = 'comunidades.plantas.tipoUso'
  );
```

### Curadoria: conceitos sem relações (candidatos a Top Term)

```sql
SELECT doc FROM etnotermos
WHERE status IN ('active', 'candidate')
  AND json_array_length(json_extract(doc,'$.broader')) = 0;
```

### Aquisição: valores distintos por campo

```sql
-- Campo de primeiro nível (comunidades[].tipo)
SELECT DISTINCT json_extract(c.value, '$.tipo') AS tipo
FROM biocultdb_records r, json_each(json_extract(r.doc, '$.comunidades')) c
WHERE json_extract(c.value, '$.tipo') IS NOT NULL;
```

Para campos aninhados em dois níveis de array (`comunidades[].plantas[].nomeVernacular[]`), a `AcquisitionService` carrega `SELECT id, doc FROM biocultdb_records` uma única vez e agrupa os valores em memória (normalizado + minúsculo, associado às comunidades de origem) — um `json_each` de três níveis em SQL puro seria mais custoso de manter que o ganho de mover a lógica para o banco, dado o volume esperado (ver research.md).

---

## Entidades Relacionadas (BioCultDB — somente leitura)

A tabela `biocultdb_records` não é gerenciada por este sistema. Referência (campos dentro do JSON `doc` de cada registro):

```jsonc
// Campos monitorados
"comunidades[].tipo"                     // string singular
"comunidades[].plantas[].nomeVernacular" // [string]
"comunidades[].plantas[].tipoUso"        // [string]
"comunidades[].atividadesEconomicas"     // [string]

// Atribuição comunitária
"comunidades[].nome"                     // string — usado em sourceCommunities
```

---

## Compatibilidade JSON-LD (Exportação Futura)

A estrutura de documento JSON (labels aninhados dentro do mesmo `doc`) é compatível com serialização SKOS-XL em JSON-LD sem migração:

```jsonld
{
  "@context": {
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "skosxl": "http://www.w3.org/2008/05/skos-xl#",
    "dct": "http://purl.org/dc/terms/",
    "et": "https://etnotermos.jbrj.gov.br/"
  },
  "@id": "et:concept/{id}",
  "@type": "skos:Concept",
  "skos:inScheme": "et:scheme/etnotermos",
  "skosxl:prefLabel": {
    "@id": "et:label/{label.id}",
    "@type": "skosxl:Label",
    "skosxl:literalForm": { "@value": "{literalForm}", "@language": "{language}" }
  }
}
```
