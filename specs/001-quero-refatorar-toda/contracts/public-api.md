# Contract: Public API (Porta 4000)

**Context**: Apresentação — somente leitura, sem autenticação  
**Base URL**: `http://host:4000`

---

## GET /

**Descrição**: Homepage — navegação e busca de conceitos  
**Response**: HTML (EJS renderizado)  
**Content-Type**: `text/html`

**Estado inicial**: Exibe grupos semânticos disponíveis (`sourceFields`) e contador de conceitos ativos

---

## GET /concepts

**Descrição**: Lista e busca de conceitos ativos  
**Query Parameters**:

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `q` | string | não | Busca textual em prefLabels e altLabels |
| `sourceField` | string | não | Filtro por grupo semântico |
| `page` | integer | não | Página (default: 1) |
| `limit` | integer | não | Itens por página (default: 20, max: 100) |

**Response 200** (HTML — HTMX partial ou página completa):
```html
<!-- Lista de cards de conceitos -->
<!-- Cada card: prefLabel pt, idioma, povo de origem (se público), sourceFields, status -->
```

**Response 200** (JSON — se `Accept: application/json`):
```json
{
  "data": [
    {
      "_id": "string",
      "prefLabel": { "literalForm": "string", "language": "string" },
      "altLabels": [{ "literalForm": "string", "language": "string", "sourcePeople": "string" }],
      "sourceFields": ["string"],
      "status": "active"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

**Regras de visibilidade**:
- Apenas `status: "active"` retornado
- Labels com `accessLevel: "sacred"` ou `"restricted"` omitidos dos resultados
- Labels com `accessLevel: "public"` incluídos

---

## GET /concepts/:id

**Descrição**: Detalhe de um conceito  
**Path Parameters**: `id` — ObjectId do conceito

**Response 200** (HTML):
```html
<!-- Conceito completo:
     - prefLabel (idioma, povo de origem se público)
     - altLabels (com metadados visíveis)
     - áudio de pronúncia (player HTML5 se audioPath presente)
     - notas documentais: definition, scopeNote, historyNote, example
     - relações: broader/narrower/related (links navegáveis)
     - grupo semântico (sourceFields)
-->
```

**Response 200** (JSON — se `Accept: application/json`):
```json
{
  "_id": "string",
  "uri": "string",
  "status": "active",
  "sourceFields": ["string"],
  "prefLabels": [
    {
      "_id": "string",
      "literalForm": "string",
      "language": "string",
      "sourcePeople": "string",
      "sourceRegion": "string",
      "accessLevel": "public",
      "audioUrl": "string | null"
    }
  ],
  "altLabels": [/* same shape, accessLevel=public only */],
  "definition": "string",
  "scopeNote": "string",
  "historyNote": "string",
  "example": "string",
  "broader": [{ "_id": "string", "prefLabel": "string" }],
  "narrower": [{ "_id": "string", "prefLabel": "string" }],
  "related": [{ "_id": "string", "prefLabel": "string" }]
}
```

**Response 404**: Conceito não encontrado ou status ≠ "active"  
**Response 410** (Gone): Conceito deprecated — retorna HTML com aviso + link para `replacedBy`

---

## GET /audio/:filename

**Descrição**: Serve arquivo de áudio de pronúncia  
**Path Parameters**: `filename` — nome do arquivo (ex: `{conceptId}-{labelId}.mp3`)  
**Response 200**: stream do arquivo de áudio  
**Response 404**: arquivo não encontrado  

**Nota de segurança**: Validar `filename` contra path traversal (`../` proibido); servir apenas de `AUDIO_STORAGE_PATH`

---

## GET /health

**Descrição**: Health check  
**Response 200**:
```json
{ "status": "ok", "mongodb": "connected" }
```
**Response 503**: MongoDB indisponível

---

## Contrato de Erros (todas as rotas públicas)

| Código | Situação |
|--------|----------|
| 400 | Query params inválidos |
| 404 | Recurso não encontrado |
| 410 | Conceito deprecado |
| 500 | Erro interno |
| 503 | MongoDB indisponível |
