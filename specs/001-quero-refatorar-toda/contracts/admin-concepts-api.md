# Contract: Admin Concepts & Labels API (Porta 4001)

**Context**: Curadoria — requer HTTP Basic Auth  
**Base URL**: `http://host:4001`  
**Auth**: `Authorization: Basic base64(username:password)`  
**Credenciais**: Configuradas via `ADMIN_USERS` (JSON array de `{username, passwordHash}`)  
**Nota**: `req.user.username` disponível após auth — usado em AuditEntry

---

## GET /

**Descrição**: Dashboard de curadoria  
**Response 200** (HTML):
- Contagem de conceitos por status (candidate/active/deprecated)
- Alerta visível se último AcquisitionLog tem `status: "failure"` ou `hasUnresolved: true`
- Links para lista de conceitos, aquisição, auditoria

---

## GET /concepts

**Descrição**: Lista conceitos com todos os status  
**Query Parameters**:

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `status` | string | Filtro: "candidate" \| "active" \| "deprecated" \| "all" (default: "all") |
| `sourceField` | string | Filtro por grupo semântico |
| `q` | string | Busca textual |
| `orphaned` | boolean | Se true, apenas conceitos sem broader e sem isTopTerm |
| `page` | integer | Página (default: 1) |

**Response 200** (HTML): lista com indicadores visuais por status; badge "candidato" destacado; contagem de candidatos por grupo semântico

---

## GET /concepts/:id

**Descrição**: Formulário de edição de conceito  
**Response 200** (HTML): Formulário completo com todos os campos, labels, relações, notas; inclui `version` como hidden field

---

## PUT /concepts/:id

**Descrição**: Atualiza notas documentais do conceito  
**Content-Type**: `application/x-www-form-urlencoded` (HTMX form) ou `application/json`  
**Body**:
```json
{
  "version": 3,
  "definition": "string",
  "scopeNote": "string",
  "historyNote": "string",
  "example": "string"
}
```

**Response 200**: HTML atualizado (HTMX swap) ou `{ "ok": true, "version": 4 }`  
**Response 409** (Conflict): `{ "error": "Conceito foi modificado por outro usuário. Recarregue antes de salvar." }`  
**Response 404**: Conceito não encontrado  

**Efeito colateral**: Cria `AuditEntry` por campo alterado com `responsible: req.user.username`

---

## POST /concepts/:id/activate

**Descrição**: Promove conceito de "candidate" para "active"  
**Body**: `{ "version": 3 }`  
**Response 200**: `{ "ok": true, "status": "active" }`  
**Response 400**: conceito não está em "candidate"  
**Response 409**: conflito de versão  

---

## POST /concepts/:id/deprecate

**Descrição**: Depreca conceito; exige substituto  
**Body**:
```json
{
  "version": 3,
  "replacedById": "ObjectId string",
  "confirmedOrphans": true
}
```

**Fluxo**:
1. Se conceito tem filhos com `status: "active"` e `confirmedOrphans` ausente → Response 200 com lista de órfãos em HTML para confirmação
2. Se `confirmedOrphans: true` → prossegue; filhos ficam com `broader` sem aquele pai; cria historyNote automática

**Response 200**: `{ "ok": true, "status": "deprecated", "orphanCount": 0 }`  
**Response 400**: `replacedById` ausente ou inválido  
**Response 409**: conflito de versão  

---

## POST /concepts/:id/labels

**Descrição**: Adiciona label ao conceito  
**Content-Type**: `application/x-www-form-urlencoded` ou `application/json`  
**Body**:
```json
{
  "type": "alt",
  "literalForm": "string",
  "language": "pt",
  "sourcePeople": "string",
  "sourceRegion": "string",
  "accessLevel": "public",
  "source": "string",
  "validatingOrg": "string",
  "holderPeople": "string",
  "collectorResearcher": "string",
  "priorInformedConsent": true,
  "bibliographicSource": "string"
}
```

**Validação**: Unicidade `(literalForm + language + type)` no conceito  
**Response 201**: HTML do novo label card (HTMX) ou `{ "ok": true, "labelId": "ObjectId" }`  
**Response 400**: dados inválidos ou violação de unicidade  
**Response 409**: conflito de versão (inclui `version` no body da requisição)  

---

## PUT /concepts/:id/labels/:labelId

**Descrição**: Atualiza label existente  
**Body**: Mesmos campos de POST (parcial, apenas campos a alterar) + `version`  
**Response 200**: label atualizado  
**Response 404**: label não encontrado  
**Response 409**: conflito de versão  

---

## DELETE /concepts/:id/labels/:labelId

**Descrição**: Remove label do conceito  
**Query**: `?version=3` (obrigatório para optimistic locking)  
**Response 200**: `{ "ok": true }`  
**Response 400**: tentativa de remover único prefLabel (conceito ficaria sem rótulo preferido)  
**Response 409**: conflito de versão  

---

## POST /concepts/:id/labels/:labelId/audio

**Descrição**: Upload de arquivo de áudio para label  
**Content-Type**: `multipart/form-data`  
**Fields**: `audio` (file, required), `version` (integer, required)  
**Validação**: Tipos aceitos: `audio/mpeg`, `audio/wav`; tamanho máximo: 10MB  
**Response 201**: `{ "ok": true, "audioUrl": "/audio/filename.mp3" }`  
**Response 400**: tipo de arquivo inválido ou tamanho excedido  
**Response 409**: conflito de versão  

---

## DELETE /concepts/:id/labels/:labelId/audio

**Descrição**: Remove arquivo de áudio do label  
**Query**: `?version=3`  
**Response 200**: `{ "ok": true }`  

---

## POST /concepts/:id/broader

**Descrição**: Adiciona relação `skos:broader`; cria `skos:narrower` recíproco automaticamente  
**Body**: `{ "targetId": "ObjectId", "version": 3 }`  
**Validação**: Verificar que `targetId` não está em `ancestors` do conceito atual (ciclo)  
**Response 200**: `{ "ok": true }`  
**Response 400**: `{ "error": "Relação criaria ciclo hierárquico." }`  
**Response 409**: conflito de versão  

---

## DELETE /concepts/:id/broader/:targetId

**Descrição**: Remove relação `skos:broader`; remove `skos:narrower` recíproco  
**Query**: `?version=3`  
**Response 200**: `{ "ok": true }`  

---

## POST /concepts/:id/related

**Descrição**: Adiciona `skos:related`; bidirecional automático  
**Body**: `{ "targetId": "ObjectId", "version": 3 }`  
**Response 200**: `{ "ok": true }`  

---

## DELETE /concepts/:id/related/:targetId

**Descrição**: Remove `skos:related` bidirecional  
**Query**: `?version=3`  
**Response 200**: `{ "ok": true }`  

---

## Contrato de Erros (admin)

| Código | Situação |
|--------|----------|
| 400 | Body inválido, tipo de arquivo inválido, violação de regra de negócio |
| 401 | Sem autenticação Basic Auth |
| 403 | Credenciais inválidas |
| 404 | Recurso não encontrado |
| 409 | Conflito de versão (optimistic locking) |
| 422 | Violação de unicidade de Label |
| 500 | Erro interno |
