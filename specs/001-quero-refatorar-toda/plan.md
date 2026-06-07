# Implementation Plan: Refatoração EtnoTermos — SKOS-XL + Integração EtnoDB

**Branch**: `001-quero-refatorar-toda` | **Date**: 2026-06-06 | **Spec**: `specs/001-quero-refatorar-toda/spec.md`

---

## Summary

Refatoração completa do EtnoTermos: substituição do padrão Z39.19 por SKOS-XL (W3C), integração com EtnoDB via MongoDB compartilhado, e adoção do vocabulário vernacular como protagonista. O sistema passa a ter três contextos C4: **Aquisição** (sync automático de termos do EtnoDB), **Apresentação** (porto 4000, read-only público) e **Curadoria** (porto 4001, enriquecimento SKOS-XL com CARE). Todo código legado Z39.19 é eliminado.

---

## Technical Context

**Language/Version**: Node.js 20 LTS (ES2022+)
**Primary Dependencies**: Express.js, MongoDB Driver 6.x, HTMX 2.x, Alpine.js 3.x, Tailwind CSS 3.x (tema forest), EJS 3.x, multer, node-cron, bcrypt
**Storage**: MongoDB 7.0+ — banco `etnodb`, coleções `etnotermos`, `etnotermos_acquisition_log`, `etnotermos_audit_log`
**Testing**: Jest 29, Supertest, mongodb-memory-server
**Target Platform**: Docker Alpine Linux + Unraid (mesmo host que EtnoDB)
**Project Type**: web
**Performance Goals**: p95 <500ms busca textual; 5-10 usuários simultâneos sem degradação
**Constraints**: Docker image mínimo; sem dependências externas além do MongoDB compartilhado; `AUDIO_STORAGE_PATH` via variável de ambiente Docker
**Scale/Scope**: ~1.000–10.000 conceitos iniciais; corpus cresce com inserções no EtnoDB

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Observação |
|-----------|--------|------------|
| I. TDD (Red-Green-Refactor) | ✅ PASS | Testes de contrato → falham → implementação → verde |
| II. Standards Compliance (Z39.19) | ⚠️ DESVIO JUSTIFICADO | Ver Complexity Tracking — Z39.19 substituído por SKOS-XL |
| III. Visual Integration com EtnoDB | ✅ PASS | FR-015: tema forest idêntico; mesmos componentes HTMX+Alpine+EJS |
| IV. CARE Principles | ✅ PASS | accessLevel por rótulo, proveniência, PIC — feature de primeira classe |
| V. Simplicity & Maintainability | ✅ PASS | SKOS-XL embedded em MongoDB sem ORM, sem repositório desnecessário |

**Resultado**: PASS com desvio documentado. Progressão autorizada.

---

## Project Structure

### Documentation (this feature)

```
specs/001-quero-refatorar-toda/
├── plan.md              ← este arquivo
├── research.md          ← Phase 0 (gerado)
├── data-model.md        ← Phase 1 (gerado)
├── quickstart.md        ← Phase 1 (gerado)
├── contracts/           ← Phase 1 (gerado)
│   ├── public-api.md
│   ├── admin-concepts-api.md
│   └── admin-acquisition-api.md
└── tasks.md             ← Phase 2 (/tasks command)
```

### Source Code (repository root)

```
backend/
├── src/
│   ├── contexts/
│   │   ├── public/              # Porto 4000 — read-only
│   │   │   ├── routes/
│   │   │   │   ├── index.js
│   │   │   │   └── concepts.js
│   │   │   ├── views/
│   │   │   │   ├── layout.ejs
│   │   │   │   ├── index.ejs
│   │   │   │   └── concept-detail.ejs
│   │   │   └── server.js
│   │   └── admin/               # Porto 4001 — curadoria
│   │       ├── routes/
│   │       │   ├── index.js
│   │       │   ├── concepts.js
│   │       │   ├── labels.js
│   │       │   ├── relations.js
│   │       │   └── acquisition.js
│   │       ├── views/
│   │       │   ├── layout.ejs
│   │       │   ├── dashboard.ejs
│   │       │   ├── concepts/
│   │       │   │   ├── list.ejs
│   │       │   │   └── edit.ejs
│   │       │   └── acquisition/
│   │       │       └── logs.ejs
│   │       └── server.js
│   ├── models/
│   │   ├── Concept.js           # SKOS-XL Concept + Label schema
│   │   ├── AcquisitionLog.js
│   │   └── AuditEntry.js
│   ├── services/
│   │   ├── ConceptService.js    # CRUD + relações + ancestors
│   │   ├── AcquisitionService.js # Sync EtnoDB → etnotermos
│   │   └── AuditService.js
│   ├── lib/
│   │   ├── skosxl/
│   │   │   └── validation.js    # SKOS-XL rule enforcement
│   │   ├── auth/
│   │   │   └── basicAuth.js     # Multi-user Basic Auth middleware
│   │   ├── scheduler/
│   │   │   └── acquisitionCron.js
│   │   └── logger.js            # Structured JSON logging
│   ├── shared/
│   │   └── database.js          # MongoDB connection (shared)
│   └── config/
│       └── index.js             # Env vars: MONGODB_URI, AUDIO_STORAGE_PATH, ADMIN_USERS
├── tests/
│   ├── contract/                # Testes de contrato por rota (falham primeiro)
│   ├── integration/             # User story scenarios
│   └── unit/                   # Services, models, validators
└── package.json

frontend/
└── src/
    └── styles/
        └── main.css             # Tailwind CSS (tema forest)

docker/
├── etnotermos.Dockerfile
└── docker-compose.yml

scripts/
└── db-init.js                   # Criação de índices MongoDB
```

**Structure Decision**: Web application (backend + frontend separados). Backend: dual-server Express (public/admin). Frontend: Tailwind CSS compilado com `npm run build:css`. Sem SPA framework — HTMX + EJS server-side rendering.

---

## Phase 0: Research

*Concluída. Ver `research.md` para decisões e justificativas.*

Tópicos investigados:
1. SKOS-XL no MongoDB — embedding vs. referência para Labels
2. Array of Ancestors pattern para hierarquias sem recursão
3. HTTP Basic Auth multi-usuário no Express.js
4. Upload de arquivos com multer + volume Docker
5. Scheduled jobs com node-cron
6. Optimistic locking (controle de versão) para edições concorrentes
7. Estratégia de limpeza do código legado Z39.19

---

## Phase 1: Design & Contracts

*Concluída. Ver artefatos gerados:*

- **`data-model.md`**: Schemas MongoDB completos para `etnotermos`, `etnotermos_acquisition_log`, `etnotermos_audit_log`; índices; regras de validação; transições de estado
- **`contracts/public-api.md`**: Rotas públicas (porta 4000)
- **`contracts/admin-concepts-api.md`**: Rotas de curadoria — conceitos e labels (porta 4001)
- **`contracts/admin-acquisition-api.md`**: Rotas de aquisição e auditoria (porta 4001)
- **`quickstart.md`**: Passos para instalar, configurar e validar o sistema

---

## Phase 2: Task Planning Approach

*Esta seção descreve o que o comando `/tasks` fará — NÃO executar durante `/plan`*

**Estratégia de Geração de Tarefas**:

- Carregar `.specify/templates/tasks-template.md` como base
- Cada contrato de rota → 1 tarefa de teste de contrato [P]
- Cada entidade → 1 tarefa de criação de model + schema [P]
- Cada user story → 1 tarefa de teste de integração
- Tarefas de implementação para fazer os testes passarem (TDD)
- 1 tarefa de limpeza do código legado (remover arquivos Z39.19)
- 1 tarefa de setup de infraestrutura (Docker, scripts de índices, Tailwind)

**Ordem de Dependências**:
```
Infraestrutura (Docker, DB, config) 
  → Models + Schema validation 
  → Services (ConceptService, AcquisitionService) 
  → Auth middleware 
  → Rotas públicas 
  → Rotas admin 
  → Views EJS 
  → Tailwind + identidade visual
  → Limpeza legado
  → Testes E2E dos user stories
```

**Marcadores [P]** (paralelo): criação de models, testes de contrato independentes, views independentes.

**Estimativa**: 30–40 tarefas numeradas e ordenadas.

---

## Complexity Tracking

| Violação | Por que necessário | Alternativa mais simples rejeitada por |
|----------|--------------------|----------------------------------------|
| Substituição de Z39.19 por SKOS-XL (Princípio II da Constituição) | SKOS-XL é o padrão correto para vocabulários multilíngues com proveniência por rótulo — Z39.19 não suporta `accessLevel` por rótulo, atribuição étnica, nem áudio de pronúncia, tornando impossível implementar os Princípios CARE conforme especificado | Z39.19 torna o sistema inadequado para o propósito central: governança de dados indígenas. SKOS-XL é um padrão W3C com mapeamento retrocompatível para SKOS core, garantindo interoperabilidade internacional com GBIF, WFO, Flora do Brasil. A constituição deve ser atualizada para refletir SKOS-XL como o padrão de vocabulário após esta feature |
| Labels como subdocumentos embedded (não coleção separada) | Simplicidade: Labels são sempre acessados no contexto de seu Concept; queries sempre por Concept | Coleção separada exigiria joins ($lookup) em cada leitura, aumentando complexidade sem ganho de performance para o volume esperado (1k–10k conceitos, poucos labels por conceito) |

---

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command — approach described)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS (desvio Z39.19→SKOS-XL documentado)
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---

*Based on Constitution v1.0.0 — See `.specify/memory/constitution.md`*
