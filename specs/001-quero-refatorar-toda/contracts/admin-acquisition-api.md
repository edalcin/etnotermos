# Contract: Admin Acquisition & Audit API (Porta 4001)

**Context**: Curadoria — Aquisição do EtnoDB e Trilha de Auditoria  
**Base URL**: `http://host:4001`  
**Auth**: HTTP Basic Auth (mesmo que admin-concepts-api.md)

---

## POST /acquisition/run

**Descrição**: Dispara manualmente a sincronização com o EtnoDB (equivalente ao job agendado)  
**Body**: vazio  
**Response 202** (Accepted): `{ "ok": true, "message": "Aquisição iniciada em background." }`  

**Comportamento**:
1. Inicia `AcquisitionService.run()` de forma não-bloqueante (async)
2. Registra `AcquisitionLog` ao concluir
3. Se falha: `hasUnresolved: true` no log; alerta aparece no dashboard
4. Se sucesso: atualiza `hasUnresolved: false` em todos os logs anteriores com `hasUnresolved: true`

**Campos monitorados** (ver FR-001/data-model.md):
- `comunidades.tipo`
- `comunidades.plantas.nomeVernacular`
- `comunidades.plantas.tipoUso`
- `comunidades.atividadesEconomicas`

**Normalização**: valores convertidos para lowercase antes de deduplicar (FR-004)  
**Deduplicação cross-field**: mesmo `literalForm` (lowercase) já existente → adiciona novo `sourceField` ao array, sem criar conceito duplicado (FR-003)

---

## GET /acquisition/status

**Descrição**: Status da última execução (usado por HTMX polling no dashboard)  
**Response 200**:
```json
{
  "lastRun": {
    "executedAt": "2026-06-06T03:00:00Z",
    "status": "success",
    "conceptsCreated": 12,
    "conceptsExisting": 304,
    "durationMs": 1240,
    "hasUnresolved": false
  },
  "scheduledNext": "2026-06-07T03:00:00Z"
}
```

**Response 200** (sem execuções ainda):
```json
{ "lastRun": null, "scheduledNext": "2026-06-07T03:00:00Z" }
```

---

## GET /acquisition/logs

**Descrição**: Lista histórico de execuções da aquisição  
**Query Parameters**:

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | integer | Página (default: 1) |
| `limit` | integer | Itens por página (default: 20) |
| `status` | string | Filtro: "success" \| "failure" |

**Response 200** (HTML): tabela com data, status, criados, existentes, duração  
**Response 200** (JSON — se `Accept: application/json`):
```json
{
  "data": [
    {
      "_id": "string",
      "executedAt": "ISO date",
      "status": "success",
      "conceptsCreated": 5,
      "conceptsExisting": 120,
      "errors": [],
      "durationMs": 890,
      "hasUnresolved": false
    }
  ],
  "total": 30,
  "page": 1
}
```

---

## GET /acquisition/logs/:id

**Descrição**: Detalhes de uma execução específica  
**Response 200** (HTML): detalhe com `errors[]` expandido e campos processados  
**Response 404**: log não encontrado

---

## GET /audit

**Descrição**: Lista trilha de auditoria  
**Query Parameters**:

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `conceptId` | string | Filtro por conceito específico |
| `responsible` | string | Filtro por username do curador |
| `page` | integer | Página (default: 1) |

**Response 200** (HTML): tabela cronológica reversa com conceito, campo, responsável, data  
**Response 200** (JSON — se `Accept: application/json`):
```json
{
  "data": [
    {
      "_id": "string",
      "conceptId": "string",
      "conceptLiteralForm": "string",
      "field": "status",
      "previousValue": "candidate",
      "newValue": "active",
      "responsible": "curador1",
      "timestamp": "ISO date"
    }
  ],
  "total": 150,
  "page": 1
}
```

---

## Comportamento da Aquisição — Algoritmo Detalhado

```
Para cada campo monitorado em MONITORED_FIELDS:
  1. Executar aggregate no etnodb para obter valores distintos + comunidades associadas
  2. Normalizar: toLower() + trim() + remover nulos/vazios/somente espaços
  3. Para cada valor normalizado:
     a. Buscar em etnotermos por: prefLabels.literalForm = valor (case-insensitive)
     b. Se NÃO existe:
        - Criar Concept com status="candidate"
        - prefLabel: { literalForm: valor, language: "pt", type: "pref", accessLevel: "public" }
        - sourceFields: [campo]
        - sourceCommunities: [comunidades encontradas]
     c. Se JÁ existe:
        - Se campo não está em concept.sourceFields → $addToSet sourceFields
        - Se comunidades novas → $addToSet sourceCommunities
        - Não alterar status, labels ou version
4. Registrar AcquisitionLog com resultado
5. Se qualquer exception → status="failure", errorMessage=stack, hasUnresolved=true
```

---

## Variáveis de Ambiente Relevantes

| Variável | Descrição | Default |
|----------|-----------|---------|
| `ACQUISITION_CRON_SCHEDULE` | Expressão cron para agendamento | `0 3 * * *` (todo dia às 03:00) |
| `MONGODB_URI` | URI de conexão MongoDB | — (obrigatório) |
| `AUDIO_STORAGE_PATH` | Diretório base para arquivos de áudio | — (obrigatório se upload usado) |
| `ADMIN_USERS` | JSON array de credenciais `[{username, passwordHash}]` | — (obrigatório) |
