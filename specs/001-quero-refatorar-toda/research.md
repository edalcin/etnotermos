# Research: Refatoração EtnoTermos — SKOS-XL + Integração EtnoDB

**Feature**: 001-quero-refatorar-toda  
**Date**: 2026-06-06  
**Status**: Complete

---

## Decisão 1: SKOS-XL no MongoDB — Labels embedded vs. coleção separada

**Decisão**: Labels (`skosxl:Label`) como **subdocumentos embedded** dentro do documento Concept.

**Justificativa**:
- Labels são sempre lidos e escritos no contexto de seu Concept; nunca são acessados isoladamente
- Embedded garante atomic updates: alterar um label e seus metadados é uma única operação `$set`
- Elimina `$lookup` joins em cada leitura de conceito
- Volume esperado: ~5–15 labels por conceito × 1k–10k conceitos = gerenciável em documentos BSON (limite 16MB por documento está longe)
- `$graphLookup` para hierarquias opera sobre `_id` do Concept, não sobre Labels — embedding não afeta navegação hierárquica

**Alternativa considerada**: Labels em coleção separada `etnotermos_labels`
- Rejeitada: exigiria `$lookup` em toda leitura de conceito (write-rare, read-heavy); sem ganho de performance no volume esperado; aumenta complexidade de transações

**Referência**: MongoDB Documentation — "Embedded Data Models" (BSON limit 16MB; embedded suits one-to-few relationships)

---

## Decisão 2: Hierarquias — Array of Ancestors vs. parent-ref simples

**Decisão**: **Array of Ancestors** — cada Concept armazena array `ancestors` com todos os ObjectIds de seus ancestrais (raiz → pai imediato).

**Justificativa**:
- Busca "todos os descendentes de X" = uma única query `{ ancestors: conceptId }` com índice de array
- Busca "caminho completo até raiz" = array `ancestors` já disponível no documento, sem recursão
- `$graphLookup` do MongoDB pode complementar para queries mais complexas (grau de separação)
- Custo: `ancestors` deve ser atualizado em cascata quando conceito muda de pai — aceitável pois mudanças hierárquicas são raras e impactam pequenos subgrafos
- Detecção de ciclos: ao adicionar `broader`, verificar que `targetId` não está em `ancestors` do Concept fonte

**Alternativa considerada**: Referência de pai simples (`parent: ObjectId`)
- Rejeitada: exige recursão ou `$graphLookup` para qualquer query que precisar do caminho completo; FR-022 explicitamente pede Array of Ancestors

**Referência**: MongoDB Blog — "Model Tree Structures" / "Array of Ancestors" pattern

---

## Decisão 3: HTTP Basic Auth multi-usuário no Express.js

**Decisão**: Middleware customizado com credenciais lidas de variável de ambiente Docker `ADMIN_USERS` (formato JSON: `[{"username":"edu","password":"hash"}]`). Senhas armazenadas como bcrypt hash.

**Justificativa**:
- Sem dependência de biblioteca de auth de terceiros (simplicidade, superfície de ataque mínima)
- Credenciais nunca no código — somente em variáveis de ambiente
- `username` extraído do header `Authorization: Basic base64(user:pass)` fica disponível em `req.user` para `AuditEntry.responsible`
- `bcrypt.compare()` para verificação segura de senha

**Formato `ADMIN_USERS`**:
```json
[
  {"username": "curador1", "passwordHash": "$2b$10$..."},
  {"username": "curador2", "passwordHash": "$2b$10$..."}
]
```

**Alternativa considerada**: Biblioteca `express-basic-auth`
- Rejeitada: não retorna `username` de forma nativa para AuditEntry; pequena dependência para lógica simples

**Segurança**: HTTPS obrigatório em produção (TLS termina no reverse proxy do Unraid — fora do escopo desta aplicação). Basic Auth em HTTP é aceitável apenas em rede interna privada.

---

## Decisão 4: Upload de áudio — multer + volume Docker

**Decisão**: **multer** (middleware Express padrão para multipart/form-data) com `diskStorage` gravando em `process.env.AUDIO_STORAGE_PATH`.

**Justificativa**:
- multer é a solução padrão, amplamente mantida, sem alternativas simples
- `diskStorage` grava diretamente no filesystem — sem buffering em memória para arquivos grandes
- Path relativo salvo no banco: `{conceptId}/{labelId}.mp3` — permite reconstruir URL completa com `AUDIO_STORAGE_PATH`
- Docker Compose monta `AUDIO_STORAGE_PATH` como volume persistente

**Validação**:
- Tipos aceitos: `audio/mpeg` (mp3), `audio/wav`
- Tamanho máximo: 10MB por arquivo (voz de pronúncia, não música)
- Nomenclatura: `{conceptId}-{labelId}.{ext}` — sem espaços, sem caracteres especiais

---

## Decisão 5: Scheduled acquisition — node-cron

**Decisão**: **node-cron** para agendamento da aquisição periódica.

**Justificativa**:
- Biblioteca leve, sem daemons externos
- `AcquisitionService.run()` é idempotente — pode ser chamado manualmente (POST /acquisition/run) ou pelo cron
- Intervalo padrão: diário às 03:00 (configurável via `ACQUISITION_CRON_SCHEDULE`)
- Em caso de falha: `AcquisitionLog.status = "failure"`, flag `hasUnresolved: true` no último log — dashboard de curadoria consulta esse flag

**Alternativa considerada**: Agenda (job scheduler com MongoDB)
- Rejeitada: overhead desnecessário; node-cron é suficiente para 1 job simples

---

## Decisão 6: Optimistic Locking para edições concorrentes

**Decisão**: Campo `version: Number` em cada Concept. Toda operação de update em curadoria inclui `version` esperado; o MongoDB update usa `{ _id: id, version: expectedVersion }` como filtro; se `matchedCount === 0`, retorna 409 Conflict.

**Justificativa**:
- US3.8: "o segundo tenta salvar → sistema detecta conflito de versão e alerta sem perder nenhuma edição"
- Não bloqueia leitores (read-committed)
- Implementação trivial: `increment version on write, check on update`
- Resposta ao cliente: HTTP 409 com mensagem "Conceito foi modificado por outro usuário. Recarregue antes de salvar."

**Fluxo**:
1. GET /concepts/:id → retorna documento com `version`
2. PUT /concepts/:id → body inclui `version`; MongoDB filtra `{ _id, version }`
3. Se `matchedCount === 0` → 409; se `matchedCount === 1` → incrementa version

---

## Decisão 7: Limpeza do código legado Z39.19

**Decisão**: **Remoção completa** de todos os arquivos legados Z39.19 na fase de refatoração.

**Arquivos a remover** (FR-033):
```
backend/src/models/Term.js
backend/src/models/Source.js
backend/src/models/Collection.js
backend/src/models/Note.js
backend/src/models/Relationship.js
backend/src/models/AuditLog.js
backend/src/models/Language.js
backend/src/lib/validation/z39-19.js
backend/src/lib/search/optimize.js
backend/src/lib/search/config.js
backend/src/lib/import/csvParser.js
backend/src/services/TermService.js
backend/src/services/RelationshipService.js
backend/src/services/NoteService.js
backend/src/services/SourceService.js
backend/src/services/CollectionService.js
backend/src/services/LanguageService.js
backend/src/services/ImportService.js
backend/src/services/ExportService.js
backend/src/services/DashboardService.js  (reescrever)
backend/src/services/SearchService.js     (reescrever)
backend/src/api/admin/{collections,dashboard,notes,sources,relationships,audit-logs,terms,import,languages}.js
backend/src/api/controllers/Admin{Collections,Notes,Sources,Relationships,AuditLogs,Terms,Import,Dashboard,View}Controller.js
backend/src/api/controllers/Public{Export,Relationships,Terms,Search,View}Controller.js
backend/src/api/public/{export,relationships,search,terms}.js
backend/src/api/middleware/adminAuth.js   (substituir por basicAuth.js)
backend/src/api/middleware/validate.js    (manter/adaptar)
backend/src/api/middleware/rateLimit.js   (manter)
backend/src/api/middleware/auditLog.js    (substituir)
docs/ANSI-NISO Z39.19-2005 (R2010).pdf   → mover para docs/archive/
docs/skill/controlled-vocabulary-skill.md → atualizar para SKOS-XL
```

**Arquivos a manter/adaptar**:
```
backend/src/shared/database.js         (manter)
backend/src/config/index.js            (adaptar: novas env vars)
backend/src/lib/logger.js              (manter)
backend/src/api/routes/health.js       (manter)
backend/src/api/middleware/errorHandler.js (manter)
backend/src/start.js                   (adaptar: novos servidores)
frontend/src/styles/input.css          (manter)
```

**Justificativa**: Código legado usa paradigmas incompatíveis (Z39.19, collections/notes/sources separadas). Reutilizar aumentaria complexidade. Limpeza total é mais segura e resulta em codebase menor.

---

## Decisão 8: Atualização da Constituição após esta feature

**Recomendação**: Após conclusão desta feature, abrir issue/tarefa para:
1. Substituir Princípio II (Z39.19) por "SKOS-XL Compliance" na constitution.md
2. Atualizar review gates para SKOS-XL validation utilities
3. Versão bump: 1.0.0 → 1.1.0 (MINOR — novo padrão de vocabulário)

---

## Resumo das Decisões

| # | Tópico | Decisão |
|---|--------|---------|
| 1 | Labels no MongoDB | Embedded subdocuments no Concept |
| 2 | Hierarquias | Array of Ancestors pattern |
| 3 | Auth curadoria | Custom Basic Auth middleware + bcrypt + env vars |
| 4 | Upload áudio | multer + diskStorage + AUDIO_STORAGE_PATH |
| 5 | Agendamento | node-cron com AcquisitionService idempotente |
| 6 | Edições concorrentes | Optimistic locking via campo `version` |
| 7 | Legado Z39.19 | Remoção completa, sem migração de dados |
| 8 | Constituição | Atualizar para SKOS-XL pós-feature |
