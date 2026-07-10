# Tasks: Refatoração BioCultTermos — SKOS-XL + Integração BioCultDB

**Feature**: 001-quero-refatorar-toda  
**Input**: `specs/001-quero-refatorar-toda/`  
**Date**: 2026-06-06  
**Stack**: Node.js 20 LTS, Express.js, MongoDB Driver 6.x, HTMX 2.x, Alpine.js 3.x, Tailwind CSS 3.x, EJS 3.x, multer, node-cron, bcrypt, Jest 29, Supertest, mongodb-memory-server

---

## Phase 3.1: Setup & Infraestrutura

- [X] T001 Criar estrutura de diretórios e `backend/package.json` com todas as dependências declaradas em Technical Context
  - Criar: `backend/src/contexts/public/routes/`, `backend/src/contexts/public/views/`, `backend/src/contexts/public/`, `backend/src/contexts/admin/routes/`, `backend/src/contexts/admin/views/concepts/`, `backend/src/contexts/admin/views/acquisition/`, `backend/src/models/`, `backend/src/services/`, `backend/src/lib/skosxl/`, `backend/src/lib/auth/`, `backend/src/lib/scheduler/`, `backend/src/shared/`, `backend/src/config/`, `backend/tests/contract/`, `backend/tests/integration/`, `backend/tests/unit/`, `scripts/`, `frontend/src/styles/`, `docker/`
  - `backend/package.json`: `express`, `mongodb`, `ejs`, `multer`, `node-cron`, `bcrypt`, `htmx.org`, `alpinejs`; devDeps: `jest`, `supertest`, `mongodb-memory-server`, `tailwindcss`, `nodemon`
  - `backend/package.json` scripts: `dev:public`, `dev:admin`, `test`, `test:unit`, `test:integration`, `test:contract`
  - `frontend/package.json`: `tailwindcss`; scripts: `build:css`, `watch:css`

- [X] T002 Implementar `backend/src/config/index.js` — gerenciamento de variáveis de ambiente
  - Exportar: `MONGODB_URI` (obrigatório), `PUBLIC_PORT` (default 4000), `ADMIN_PORT` (default 4001), `ADMIN_USERS` (JSON.parse, obrigatório), `AUDIO_STORAGE_PATH` (obrigatório), `ACQUISITION_CRON_SCHEDULE` (default `0 3 * * *`), `LOG_LEVEL` (default `info`), `NODE_ENV`
  - Falhar com erro claro se variável obrigatória ausente
  - Criar `.env.example` (nunca `.env` real — nunca commitar credenciais)

- [X] T003 Implementar `backend/src/shared/database.js` — conexão MongoDB compartilhada
  - Exportar `connect()` e `getDb()` usando MongoDB Driver 6.x
  - Conectar ao banco `etnodb` (database name extraído de `MONGODB_URI`)
  - Singleton: reutilizar conexão existente se já conectado
  - Depende de: T002

- [X] T004 Configurar Jest + mongodb-memory-server em `backend/jest.config.js` e `backend/tests/helpers/db.js`
  - `jest.config.js`: `testEnvironment: node`, timeout 30s, `globalSetup`/`globalTeardown` para mongodb-memory-server
  - `tests/helpers/db.js`: exportar `connect()`, `disconnect()`, `clearCollections()` para uso em testes
  - `tests/helpers/app-public.js` e `tests/helpers/app-admin.js`: exportar instâncias Express configuradas para Supertest (sem iniciar servidor real)

- [X] T005 [P] Configurar Tailwind CSS com tema forest em `frontend/src/styles/main.css` e `frontend/tailwind.config.js`
  - `tailwind.config.js`: estender tema com cor `forest` (600: #16a34a, 700: #15803d, 50/100/200 correspondentes)
  - `main.css`: `@tailwind base; @tailwind components; @tailwind utilities;` + utilitários de componente (botão, card, badge) reutilizáveis via `@apply`
  - Script `build:css`: compilar para `backend/src/contexts/public/views/public/styles.css` e `backend/src/contexts/admin/views/admin/styles.css`

- [X] T006 [P] Criar `docker/etnotermos.Dockerfile` e `docker/docker-compose.yml`
  - `Dockerfile`: Node.js 20 Alpine; multi-stage (build Tailwind → prod); expor portas 4000 e 4001; `CMD` inicia ambos os servidores
  - `docker-compose.yml`: serviço `etnotermos`; variáveis de ambiente via `.env`; volume para `AUDIO_STORAGE_PATH`; sem serviço MongoDB próprio (usa instância compartilhada do BioCultDB)

- [X] T007 Criar `scripts/db-init.js` — criação de índices MongoDB
  - Criar coleções `etnotermos`, `etnotermos_acquisition_log`, `etnotermos_audit_log`
  - Criar todos os índices especificados em `data-model.md`: `text_labels`, `idx_status`, `idx_sourceFields`, `idx_broader`, `idx_narrower`, `idx_ancestors`, `idx_version`, `idx_replacedBy`, índices das coleções de log
  - Script idempotente: `createIndex` com `{ background: true }` não falha se índice já existe
  - Depende de: T003

---

## Phase 3.2: Testes de Contrato (TDD) ⚠️ ESCREVER ANTES DA IMPLEMENTAÇÃO — DEVEM FALHAR

**CRÍTICO: Estes testes DEVEM ser escritos e DEVEM FALHAR antes de qualquer implementação (T015+)**

- [X] T008 [P] Testes de contrato da API Pública em `backend/tests/contract/public-api.test.js`
  - Usar Supertest + express app (sem servidor real)
  - Cobrir todos os endpoints de `contracts/public-api.md`:
    - `GET /` → 200 HTML
    - `GET /concepts` → 200 com `data[]`, `total`, `page`; sem conceitos `status:"candidate"` ou labels `accessLevel:"sacred"`
    - `GET /concepts/:id` → 200 JSON shape completo; 404 para inexistente; 410 para deprecated com `replacedBy`
    - `GET /audio/:filename` → 200 stream; 404 arquivo inexistente; 400 para path traversal (`../`)
    - `GET /health` → 200 `{ status:"ok", mongodb:"connected" }`
  - Todos os testes devem FALHAR inicialmente (servidor não implementado)
  - Depende de: T004

- [X] T009 [P] Testes de contrato da API Admin (conceitos/labels) em `backend/tests/contract/admin-concepts-api.test.js`
  - Cobrir todos os endpoints de `contracts/admin-concepts-api.md`:
    - `GET /` → 200 HTML dashboard com contagem de candidatos e alerta de falha de aquisição
    - `GET /concepts` → 200; filtros `status`, `sourceField`, `q`, `orphaned`
    - `PUT /concepts/:id` → 200 com version incrementado; 409 conflito de versão; 404
    - `POST /concepts/:id/activate` → 200 `{ok:true, status:"active"}`; 400 se não candidate; 409
    - `POST /concepts/:id/deprecate` → fluxo com e sem `confirmedOrphans`; 400 sem `replacedById`; 409
    - `POST /concepts/:id/labels` → 201 com `labelId`; 400 violação de unicidade `(literalForm+language+type)`; 409
    - `PUT /concepts/:id/labels/:labelId` → 200; 404; 409
    - `DELETE /concepts/:id/labels/:labelId` → 200; 400 tentativa de remover único prefLabel; 409
    - `POST /concepts/:id/labels/:labelId/audio` → 201; 400 tipo inválido; 400 tamanho > 10MB; 409
    - `POST /concepts/:id/broader` → 200; 400 ciclo hierárquico; 409
    - `POST /concepts/:id/related` → 200; 409
    - `DELETE` equivalentes → 200
  - Verificar que rotas retornam 401 sem auth e 403 com credenciais erradas
  - Depende de: T004

- [X] T010 [P] Testes de contrato da API Admin (aquisição/auditoria) em `backend/tests/contract/admin-acquisition-api.test.js`
  - Cobrir todos os endpoints de `contracts/admin-acquisition-api.md`:
    - `POST /acquisition/run` → 202 `{ok:true}`; apenas com auth
    - `GET /acquisition/status` → 200 `{lastRun, scheduledNext}`; shape com `lastRun: null` se sem execuções
    - `GET /acquisition/logs` → 200 com paginação; filtro `status`
    - `GET /acquisition/logs/:id` → 200 HTML; 404
    - `GET /audit` → 200; filtros `conceptId`, `responsible`, `page`; shape `{data[], total, page}`
  - Depende de: T004

- [X] T011 [P] Teste de integração US1 — Aquisição automática em `backend/tests/integration/us1-acquisition.test.js`
  - Cenário: executar `AcquisitionService.run()` com banco BioCultDB mock contendo valores nos campos monitorados
  - Verificar: conceitos criados com `status:"candidate"`, `sourceFields[]` corretos, `sourceCommunities[]` corretos
  - Verificar deduplicação cross-field: mesmo literalForm em dois campos → 1 conceito com ambos no `sourceFields`
  - Verificar idempotência: segunda execução não cria duplicatas, apenas $addToSet
  - Verificar normalização: `toLower() + trim()`, nulos/vazios ignorados
  - Verificar AcquisitionLog criado com `status:"success"`, `conceptsCreated`, `conceptsExisting`, `durationMs`
  - Verificar falha: erro de conexão → AcquisitionLog `status:"failure"`, `hasUnresolved:true`
  - Depende de: T004

- [X] T012 [P] Teste de integração US2 — Apresentação pública em `backend/tests/integration/us2-presentation.test.js`
  - Cenário: banco com conceitos `active`, `candidate` e `deprecated`; labels com `accessLevel` variando
  - Verificar: `GET /concepts` retorna apenas `active`; labels `sacred`/`restricted` omitidos
  - Verificar busca textual: `GET /concepts?q=ayahuasca` retorna matches de prefLabel/altLabel
  - Verificar filtro por sourceField: `GET /concepts?sourceField=comunidades.tipo`
  - Verificar detalhe: `GET /concepts/:id` retorna broader/narrower/related com prefLabel resolvido
  - Verificar 410 + link replacedBy para conceitos deprecated
  - Depende de: T004

- [X] T013 [P] Teste de integração US3 — Curadoria SKOS-XL em `backend/tests/integration/us3-curation.test.js`
  - Cenário: curador autenticado enriquecendo conceito candidato
  - Verificar: ativar conceito candidato → visível na API pública
  - Verificar: adicionar altLabel com `sourcePeople`, `accessLevel:"restricted"` → salvo; não aparece em GET /concepts (público)
  - Verificar: adicionar broader → narrower recíproco criado; `ancestors` atualizado em cascata
  - Verificar: ciclo hierárquico rejeitado com 400
  - Verificar: deprecar conceito com replacedById → `status:"deprecated"`, replacedBy salvo; 410 na API pública
  - Verificar: optimistic locking — dois clientes editam mesmo conceito → segundo retorna 409
  - Verificar: AuditEntry criado para cada alteração com `responsible` do usuário autenticado
  - Depende de: T004

- [X] T014 [P] Teste de integração US4 — Governança CARE em `backend/tests/integration/us4-care.test.js`
  - Cenário: labels com diferentes `accessLevel`
  - Verificar: label `accessLevel:"public"` → aparece na API pública
  - Verificar: label `accessLevel:"restricted"` → omitido da API pública; visível na API admin (autenticado)
  - Verificar: label `accessLevel:"sacred"` → omitido da API pública; visível na API admin (autenticado)
  - Verificar: upload de áudio em label → `audioPath` salvo; `GET /audio/:filename` serve o arquivo
  - Verificar: campos CARE salvos: `holderPeople`, `collectorResearcher`, `priorInformedConsent`, `bibliographicSource`
  - Depende de: T004

---

## Phase 3.3: Models — implementar para fazer os testes passarem

- [X] T015 [P] Implementar `backend/src/models/Concept.js` — schema SKOS-XL
  - Exportar `LabelRelationSchema`, `LabelSchema`, `ConceptSchema` (conforme `data-model.md`)
  - Exportar funções helper: `createConcept(data)`, `getConceptCollection(db)` (retorna Collection MongoDB)
  - Validações inline: `status` enum, `accessLevel` enum, unicidade `(literalForm+language+type)` verificada no service
  - Campo `version` inicializado em `1` na criação
  - Depende de: T003

- [X] T016 [P] Implementar `backend/src/models/AcquisitionLog.js`
  - Exportar `AcquisitionLogSchema` e `getAcquisitionLogCollection(db)`
  - Campos conforme `data-model.md`: `executedAt`, `status`, `errorMessage`, `fieldsProcessed`, `conceptsCreated`, `conceptsExisting`, `errors[]`, `hasUnresolved`, `durationMs`
  - Depende de: T003

- [X] T017 [P] Implementar `backend/src/models/AuditEntry.js`
  - Exportar `AuditEntrySchema` e `getAuditEntryCollection(db)`
  - Campos: `conceptId`, `conceptLiteralForm`, `field`, `previousValue`, `newValue`, `responsible`, `timestamp`
  - Imutável: sem funções de update/delete
  - Depende de: T003

---

## Phase 3.4: Bibliotecas Core

- [X] T018 [P] Implementar `backend/src/lib/skosxl/validation.js` — validações SKOS-XL
  - `validateLabelUniqueness(concept, newLabel)` — verifica `(literalForm+language+type)` único no Concept; lança erro com mensagem clara se violado
  - `validateNoCycle(concept, targetId, ancestorsOfTarget)` — verifica que `targetId` não está em `concept.ancestors`; retorna `true` se safe, `false` se ciclo
  - `validateSinglePrefLabelPerLanguage(concept, newLabel)` — no máximo 1 prefLabel por idioma
  - `validateDeprecation(concept)` — verifica que `replacedBy` está presente ao deprecar
  - Depende de: T015

- [X] T019 [P] Implementar `backend/src/lib/auth/basicAuth.js` — middleware HTTP Basic Auth multi-usuário
  - Parsear header `Authorization: Basic base64(user:pass)`
  - Carregar `ADMIN_USERS` de `config/index.js` (array de `{username, passwordHash}`)
  - `bcrypt.compare()` para verificar senha; retornar 401 se header ausente, 403 se credenciais inválidas
  - Definir `req.user = { username }` para uso em AuditEntry
  - Exportar middleware `requireAuth`
  - Depende de: T002

- [X] T020 [P] Implementar `backend/src/lib/logger.js` — logging estruturado
  - Exportar objeto `logger` com `info()`, `warn()`, `error()`, `debug()`
  - Output JSON com `timestamp`, `level`, `message`, campos extras
  - Nível controlado por `LOG_LEVEL` env var
  - Depende de: T002

---

## Phase 3.5: Services

- [X] T021 Implementar `backend/src/services/ConceptService.js` — CRUD + hierarquias + optimistic locking
  - `findMany({ status, sourceField, q, page, limit })` — busca com filtros; texto via `$text`; filtra labels por accessLevel se `publicOnly:true`
  - `findById(id, { publicOnly })` — retorna conceito com broader/narrower/related resolvidos (prefLabel do nome); filtra labels sagrados/restritos se publicOnly
  - `updateNotes(id, version, { definition, scopeNote, historyNote, example }, username)` — optimistic locking; cria AuditEntry por campo alterado
  - `activate(id, version, username)` — `candidate → active`; 400 se não candidate; cria AuditEntry
  - `deprecate(id, version, { replacedById, confirmedOrphans }, username)` — verifica órfãos ativos; se `confirmedOrphans:true` prossegue; atualiza `historyNote` automaticamente; cria AuditEntry
  - `addLabel(id, version, labelData, username)` — valida unicidade via `skosxl/validation.js`; embedded push; cria AuditEntry
  - `updateLabel(id, version, labelId, labelData, username)` — atualiza label embedded; cria AuditEntry
  - `removeLabel(id, version, labelId, username)` — impede remoção de único prefLabel; cria AuditEntry
  - `saveAudio(id, version, labelId, audioPath, username)` — salva audioPath relativo; cria AuditEntry
  - `removeAudio(id, version, labelId, username)` — limpa audioPath; cria AuditEntry
  - `addBroader(id, version, targetId, username)` — valida sem ciclo; atualiza ancestors em cascata (algoritmo de `data-model.md`); cria narrower recíproco; cria AuditEntry
  - `removeBroader(id, version, targetId, username)` — remove narrower recíproco; atualiza ancestors em cascata; cria AuditEntry
  - `addRelated(id, version, targetId, username)` — cria bidirecional; cria AuditEntry
  - `removeRelated(id, version, targetId, username)` — remove bidirecional; cria AuditEntry
  - Depende de: T015, T018, T022

- [X] T022 Implementar `backend/src/services/AuditService.js`
  - `log(entry)` — insert em `etnotermos_audit_log` (nunca update/delete)
  - `findMany({ conceptId, responsible, page, limit })` — busca com filtros, ordem cronológica reversa
  - Depende de: T017

- [X] T023 Implementar `backend/src/services/AcquisitionService.js` — sync BioCultDB → etnotermos
  - `run()` — idempotente; executável manualmente e pelo cron
  - Para cada campo em `MONITORED_FIELDS` = `['comunidades.tipo', 'comunidades.plantas.nomeVernacular', 'comunidades.plantas.tipoUso', 'comunidades.atividadesEconomicas']`:
    - Aggregate na coleção `etnodb` para obter valores distintos + comunidades associadas (conforme queries em `data-model.md`)
    - Normalizar: `toLowerCase() + trim()`, ignorar nulos/vazios
    - Para cada valor: se não existe → criar Concept `status:"candidate"` com prefLabel `{literalForm, language:"pt", type:"pref", accessLevel:"public"}`; se existe → `$addToSet` em `sourceFields` e `sourceCommunities`
  - Registrar `AcquisitionLog` ao final; `status:"failure"` + `hasUnresolved:true` se exceção
  - Em execução bem-sucedida: `hasUnresolved:false` em todos os logs com `hasUnresolved:true`
  - Exportar `run()` e `getLastRunStatus()`
  - Depende de: T015, T016, T022

- [X] T024 Implementar `backend/src/lib/scheduler/acquisitionCron.js`
  - Inicializar `node-cron` com `ACQUISITION_CRON_SCHEDULE`
  - Chamar `AcquisitionService.run()` no horário agendado
  - Exportar `start()` e `stop()`
  - Depende de: T023

---

## Phase 3.6: Contexto Público (Porta 4000)

- [X] T025 Implementar `backend/src/contexts/public/server.js` — servidor Express porta 4000
  - Configurar EJS como view engine, diretório de views, static files (CSS compilado)
  - Registrar rotas: `/`, `/concepts`, `/audio`
  - Registrar `GET /health`
  - Middleware de erro global; sem auth
  - Depende de: T020, T021

- [X] T026 Implementar rotas públicas em `backend/src/contexts/public/routes/index.js` e `concepts.js`
  - `GET /` → renderizar `index.ejs` com grupos semânticos (distinct sourceFields de conceitos active) e total de conceitos
  - `GET /concepts` → chamar `ConceptService.findMany({ status:"active", publicOnly:true, ... })` com paginação; suporte a HTMX partial swap (header `HX-Request`)
  - `GET /concepts/:id` → chamar `ConceptService.findById(id, { publicOnly:true })`; 404/410 conforme contrato
  - `GET /health` → verificar conexão MongoDB; 200/503
  - Depende de: T025

- [X] T027 Implementar `backend/src/contexts/public/routes/audio.js` — servir arquivos de áudio
  - `GET /audio/:filename` — validar que `filename` não contém `..` ou `/`; montar path como `path.join(AUDIO_STORAGE_PATH, filename)`; stream o arquivo; 404 se inexistente; 400 se path traversal detectado
  - Depende de: T025

---

## Phase 3.7: Contexto Admin (Porta 4001)

- [X] T028 Implementar `backend/src/contexts/admin/server.js` — servidor Express porta 4001
  - Aplicar middleware `requireAuth` globalmente (todas as rotas exigem Basic Auth)
  - Configurar EJS view engine, static files
  - Registrar rotas: `/`, `/concepts`, `/acquisition`, `/audit`
  - Middleware de erro global retornando 401/403/409 conforme contrato
  - Inicializar `acquisitionCron.start()` na startup
  - Depende de: T019, T020, T021, T022, T024

- [X] T029 Implementar rotas admin de conceitos em `backend/src/contexts/admin/routes/index.js` e `concepts.js`
  - `GET /` → dashboard: contagem por status, alerta `hasUnresolved`, links para listas
  - `GET /concepts` → lista com filtros; suporte HTMX partial; badge por status; candidatos destacados
  - `GET /concepts/:id` → formulário de edição com `version` como hidden field
  - `PUT /concepts/:id` → chamar `ConceptService.updateNotes()`; retornar HTML atualizado (HTMX swap) ou JSON
  - `POST /concepts/:id/activate` → chamar `ConceptService.activate()`
  - `POST /concepts/:id/deprecate` → fluxo com confirmação de órfãos (primeiro request sem `confirmedOrphans` retorna HTML de confirmação)
  - Depende de: T028

- [X] T030 Implementar rotas de labels e áudio em `backend/src/contexts/admin/routes/labels.js`
  - Configurar multer diskStorage com `AUDIO_STORAGE_PATH`; filtro de tipo (`audio/mpeg`, `audio/wav`); limite 10MB; nomenclatura `{conceptId}-{labelId}.{ext}`
  - `POST /concepts/:id/labels` → `ConceptService.addLabel()`
  - `PUT /concepts/:id/labels/:labelId` → `ConceptService.updateLabel()`
  - `DELETE /concepts/:id/labels/:labelId` → `ConceptService.removeLabel()`
  - `POST /concepts/:id/labels/:labelId/audio` → multer upload → `ConceptService.saveAudio()`
  - `DELETE /concepts/:id/labels/:labelId/audio` → `ConceptService.removeAudio()`
  - Depende de: T028

- [X] T031 Implementar rotas de relações em `backend/src/contexts/admin/routes/relations.js`
  - `POST /concepts/:id/broader` → `ConceptService.addBroader()`
  - `DELETE /concepts/:id/broader/:targetId` → `ConceptService.removeBroader()`
  - `POST /concepts/:id/related` → `ConceptService.addRelated()`
  - `DELETE /concepts/:id/related/:targetId` → `ConceptService.removeRelated()`
  - Depende de: T028

- [X] T032 Implementar rotas de aquisição e auditoria em `backend/src/contexts/admin/routes/acquisition.js`
  - `POST /acquisition/run` → `AcquisitionService.run()` não-bloqueante (async sem await); retornar 202
  - `GET /acquisition/status` → `AcquisitionService.getLastRunStatus()`; calcular `scheduledNext` da expressão cron
  - `GET /acquisition/logs` → busca com paginação e filtro `status`; suporte JSON e HTML
  - `GET /acquisition/logs/:id` → detalhe com `errors[]` expandido; 404 se não encontrado
  - `GET /audit` → `AuditService.findMany()`; suporte JSON e HTML
  - Depende de: T028

---

## Phase 3.8: Views EJS

- [X] T033 [P] Implementar views do contexto público
  - `backend/src/contexts/public/views/layout.ejs` — HTML base com tema forest, HTMX CDN, Alpine.js CDN, CSS compilado; meta viewport e lang="pt-BR"
  - `backend/src/contexts/public/views/index.ejs` — cards de grupos semânticos (`sourceFields`) com contador; caixa de busca com HTMX (`hx-get="/concepts"`, `hx-target="#results"`, `hx-trigger="keyup changed delay:300ms"`)
  - `backend/src/contexts/public/views/concept-detail.ejs` — prefLabel destacado como protagonista; altLabels organizados por `accessLevel:public`; player HTML5 `<audio>` se `audioPath`; breadcrumb de broader; lista de narrower/related com links; notas SKOS
  - Tema visual idêntico ao BioCultDB: forest-600 primary, forest-50 backgrounds, mesmos padrões de botão/card
  - Depende de: T026, T027

- [X] T034 [P] Implementar views do contexto admin — conceitos
  - `backend/src/contexts/admin/views/layout.ejs` — base admin com Basic Auth implícito; HTMX; Alpine.js; indicador de usuário logado (`req.user.username`)
  - `backend/src/contexts/admin/views/dashboard.ejs` — cards de contagem por status (candidate/active/deprecated); alerta vermelho se `hasUnresolved:true`; botão "Executar Aquisição" com HTMX POST
  - `backend/src/contexts/admin/views/concepts/list.ejs` — tabela filtros (status, sourceField, busca); badge colorido por status (candidato = amarelo, ativo = verde, deprecated = cinza); HTMX para filtros sem reload
  - `backend/src/contexts/admin/views/concepts/edit.ejs` — formulário completo: notas SKOS (definition/scopeNote/historyNote/example); seção de labels com cards por tipo (pref/alt/hidden); form inline para adicionar label; player de áudio; form de upload; seção de relações broader/narrower/related; botões Ativar/Deprecar com confirmação Alpine.js; `version` hidden; 409 exibido inline
  - Depende de: T029, T030, T031

- [X] T035 [P] Implementar views do contexto admin — aquisição e auditoria
  - `backend/src/contexts/admin/views/acquisition/logs.ejs` — tabela cronológica de AcquisitionLogs; status ícone (✓/✗); expandir `errors[]` inline com Alpine.js; HTMX polling para `GET /acquisition/status` enquanto aquisição em andamento
  - Tabela de auditoria inline no dashboard ou página separada: concept / field / previousValue → newValue / responsible / timestamp
  - Depende de: T032

---

## Phase 3.9: Limpeza do Legado Z39.19 (FR-033)

- [X] T036 Remover todos os arquivos legados Z39.19 listados em `research.md` (Decisão 7)
  - **Deletar**:
    - `backend/src/models/Term.js`, `Source.js`, `Collection.js`, `Note.js`, `Relationship.js`, `AuditLog.js`, `Language.js`
    - `backend/src/lib/validation/z39-19.js`, `backend/src/lib/search/optimize.js`, `backend/src/lib/search/config.js`, `backend/src/lib/import/csvParser.js`
    - `backend/src/services/TermService.js`, `RelationshipService.js`, `NoteService.js`, `SourceService.js`, `CollectionService.js`, `LanguageService.js`, `ImportService.js`, `ExportService.js`, `DashboardService.js`, `SearchService.js`
    - `backend/src/api/admin/` (todos os arquivos de rotas legadas)
    - `backend/src/api/controllers/Admin*.js` e `Public*.js` (todos os controllers legados)
    - `backend/src/api/public/` (todas as rotas públicas legadas)
    - `backend/src/api/middleware/adminAuth.js`, `auditLog.js`
  - **Mover**: `docs/ANSI-NISO Z39.19-2005 (R2010).pdf` → `docs/archive/`
  - **Atualizar**: `backend/src/start.js` para inicializar os dois novos servidores (public + admin); remover referências legadas
  - **Verificar**: `npm test` passa sem referências a arquivos deletados
  - Depende de: T025, T028 (servidores novos devem existir antes de remover os antigos)

---

## Phase 3.10: Polish

- [X] T037 [P] Testes unitários `ConceptService` em `backend/tests/unit/concept-service.test.js`
  - Testar cada método com mongodb-memory-server
  - Focar em: optimistic locking (matchedCount check), cascade ancestors, reciprocidade broader/narrower, filtragem accessLevel, AuditEntry criado por alteração
  - Depende de: T021

- [X] T038 [P] Testes unitários `AcquisitionService` em `backend/tests/unit/acquisition-service.test.js`
  - Testar: deduplicação cross-field, normalização toLower/trim, idempotência, criação de AcquisitionLog de falha
  - Mock da coleção `etnodb` com dados fixture representativos dos 4 campos monitorados
  - Depende de: T023

- [X] T039 [P] Testes unitários `skosxl/validation.js` em `backend/tests/unit/skosxl-validation.test.js`
  - Testar cada função de validação: unicidade de label, detecção de ciclo, prefLabel único por idioma, presença de replacedBy
  - Edge cases: arrays vazios, undefined, ObjectId string vs ObjectId
  - Depende de: T018

- [X] T040 Executar checklist de validação do `quickstart.md` e garantir `npm test` 100% verde
  - Executar `npm test` — todos os 3 arquivos de contrato + 4 de integração + 3 unitários devem passar
  - Verificar cobertura ≥ 80% em services, models, lib
  - Seguir checklist manual de `quickstart.md`: §6 (porta 4000), §7 (porta 4001), §8 (aquisição + auditoria)
  - Atualizar `plan.md` Progress Tracking: Phase 4 (Implementation) e Phase 5 (Validation) como concluídas
  - Depende de: T037, T038, T039

---

## Grafo de Dependências

```
T001 → T002 → T003 → T004 → T008..T014
                   → T007
                   → T015 → T018 → T021 → T025 → T026 → T033
                          → T022              → T027
                   → T016 → T023 → T024 → T028 → T029 → T034
                          → T017 → T022       → T030
                                              → T031
                                              → T032 → T035
              → T019 → T028
              → T020 → T025
                     → T028

T025, T028 → T036 (legado removido apenas após novos servidores implementados)
T021 → T037; T023 → T038; T018 → T039; T037+T038+T039 → T040

T005, T006 — independentes, podem rodar em paralelo com qualquer fase
```

---

## Exemplos de Execução em Paralelo

```
# Grupo 1 — Setup independente (rodar junto com T001-T004):
Task: "T005: Configurar Tailwind CSS em frontend/src/styles/main.css e frontend/tailwind.config.js"
Task: "T006: Criar docker/etnotermos.Dockerfile e docker/docker-compose.yml"

# Grupo 2 — Testes de contrato e integração (após T004):
Task: "T008: Contract tests public API em backend/tests/contract/public-api.test.js"
Task: "T009: Contract tests admin concepts API em backend/tests/contract/admin-concepts-api.test.js"
Task: "T010: Contract tests admin acquisition API em backend/tests/contract/admin-acquisition-api.test.js"
Task: "T011: Integration test US1 acquisition em backend/tests/integration/us1-acquisition.test.js"
Task: "T012: Integration test US2 presentation em backend/tests/integration/us2-presentation.test.js"
Task: "T013: Integration test US3 curation em backend/tests/integration/us3-curation.test.js"
Task: "T014: Integration test US4 CARE em backend/tests/integration/us4-care.test.js"

# Grupo 3 — Models (após T003, paralelos entre si):
Task: "T015: Concept model em backend/src/models/Concept.js"
Task: "T016: AcquisitionLog model em backend/src/models/AcquisitionLog.js"
Task: "T017: AuditEntry model em backend/src/models/AuditEntry.js"

# Grupo 4 — Bibliotecas (após T002, parcialmente paralelas):
Task: "T018: SKOS-XL validation em backend/src/lib/skosxl/validation.js"
Task: "T019: Basic Auth middleware em backend/src/lib/auth/basicAuth.js"
Task: "T020: Logger em backend/src/lib/logger.js"

# Grupo 5 — Views (após respectivas rotas, paralelas entre si):
Task: "T033: Views contexto público (layout.ejs, index.ejs, concept-detail.ejs)"
Task: "T034: Views admin conceitos (layout.ejs, dashboard.ejs, concepts/list.ejs, concepts/edit.ejs)"
Task: "T035: Views admin aquisição (acquisition/logs.ejs)"

# Grupo 6 — Testes unitários polish (após services):
Task: "T037: Unit tests ConceptService em backend/tests/unit/concept-service.test.js"
Task: "T038: Unit tests AcquisitionService em backend/tests/unit/acquisition-service.test.js"
Task: "T039: Unit tests skosxl/validation em backend/tests/unit/skosxl-validation.test.js"
```

---

## Checklist de Validação

- [x] Todos os contratos têm testes (T008 → public-api.md; T009 → admin-concepts-api.md; T010 → admin-acquisition-api.md)
- [x] Todas as entidades têm models (T015 → Concept; T016 → AcquisitionLog; T017 → AuditEntry)
- [x] Todos os testes vêm antes da implementação (T008–T014 antes de T015–T035)
- [x] Tarefas [P] são genuinamente independentes (arquivos diferentes, sem conflito de escrita)
- [x] Cada tarefa especifica caminho de arquivo exato
- [x] Nenhuma tarefa [P] modifica o mesmo arquivo que outra tarefa [P]
- [x] Limpeza do legado (T036) ocorre após novos servidores estarem implementados
- [x] Cobertura total: 4 user stories → 4 integration tests; 3 contratos → 3 contract tests; 3 services → 3 unit test suites

---

## Notas

- Tarefas **[P]** = arquivos diferentes, sem dependência de conteúdo — paralelizáveis
- TDD estrito: T008–T014 devem FALHAR antes de iniciar T015
- Após T036 (limpeza): verificar `npm test` para confirmar ausência de imports quebrados
- `AUDIO_STORAGE_PATH` deve ser diretório existente ao testar upload (T030); criar dir temp em testes
- Optimistic locking testado explicitamente em T009 e T013 — não assumir que funciona sem teste
- Todas as alterações via admin → AuditEntry criado — verificado em T037 (unit) e T013 (integration)
