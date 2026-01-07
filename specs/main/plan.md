
# Implementation Plan: Ethnobotanical Terms Database and Management System

**Branch**: `main` | **Date**: 2026-01-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/main/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

EtnoTermos is a comprehensive ethnobotanical terminology management system designed for researchers, students, and traditional community leaders. **Visually and functionally integrated with etnoDB**, the system provides structured vocabulary management following ANSI/NISO Z39.19-2005 standards, supporting up to 200,000 terms with complex many-to-many relationships, six note types, and interactive graph visualization. Core capabilities include CRUD operations, advanced search via MongoDB text indexes, CSV export (with future SKOS/RDF support), and API access for etnoDB integration. The system features a dual-port architecture: a public interface for data presentation and search (no authentication required), and a separate admin interface for data entry and curation (protected by access control). **It shares the MongoDB "etnodb" database with etnoDB** (separate collection) and provides **controlled vocabulary for etnoDB fields** (comunidades.tipo, plantas.tipoUso).

## Technical Context

**Language/Version**: Node.js 20 LTS (Alpine Linux)
**Primary Dependencies**: Express.js (web framework), MongoDB Driver (official), EJS (templates), HTMX + Alpine.js (frontend interactivity), Tailwind CSS ("forest" theme matching etnoDB), Cytoscape.js (graph visualization)
**Storage**: MongoDB 7.0+ database "etnodb" (shared with etnoDB), collection "etnotermos"
**Testing**: Jest (unit/integration), Supertest (API), mongodb-memory-server
**Target Platform**: Docker containers (Alpine Linux), compatible with etnoDB infrastructure
**Project Type**: web (server-side rendered with HTMX)
**Architecture**: Dual-port system - Public context (port 4000, read-only) + Admin context (port 4001, full CRUD)
**Visual Integration**: Identical UI/UX to etnoDB - same colors (forest theme), fonts, components, layouts
**Performance Goals**: Support 200,000 terms, <500ms search response, handle 5-10 concurrent users, graph rendering for networks up to 1000 visible nodes
**Constraints**: Small concurrent user base ("almost never" simultaneous edits), conflict resolution via merge-and-notify, Docker-based deployment, must maintain visual consistency with etnoDB
**Scale/Scope**: ~200,000 terms, 6 note types per term, many-to-many relationships, API for etnoDB integration, CSV export (SKOS/RDF in future phases)
**etnoDB Integration**: Manages controlled vocabulary for etnoDB fields, shares database, provides validation API

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: Constitution ratified v1.0.0 (2026-01-07) - See `.specify/memory/constitution.md`

**Initial Assessment** (against Constitution v1.0.0):
- ✅ **Principle I (TDD)**: Tests written before implementation (contract tests T017-T029, integration tests T030-T040)
- ✅ **Principle II (Z39.19)**: Data model maps to Z39.19 relationship types (Term, Relationship, Note models), validation utilities planned (T049)
- ✅ **Principle III (etnoDB Visual Integration)**: Technology stack matches etnoDB (HTMX+Alpine.js+Tailwind+EJS), forest theme specified
- ✅ **Principle IV (CARE Principles)**: Source model supports attribution, private notes implemented, cultural guidance planned (T114)
- ✅ **Principle V (Simplicity)**: Direct MongoDB access (no ORM), service layer justified for Z39.19 validation complexity, standard tech stack

**Complexity Justification**:
- Service layer abstraction: REQUIRED for Z39.19 relationship reciprocity validation, circular hierarchy detection, authority control enforcement
- Dual-port architecture: REQUIRED for security separation (public read-only vs admin full CRUD)

**Post-Design Re-evaluation** (after Phase 1):
- ✅ All constitutional principles satisfied
- ✅ TDD approach enforced in task ordering (Phase 3.2 tests before Phase 3.3 implementation)
- ✅ Z39.19 validation gates defined in data model and service layer
- ✅ Visual consistency validation planned (manual checklist)
- ✅ No unjustified complexity introduced

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
backend/
├── src/
│   ├── contexts/
│   │   ├── public/           # Public context (port 4000, read-only)
│   │   │   ├── routes/       # Express routes
│   │   │   ├── views/        # EJS templates with etnoDB visual theme
│   │   │   └── server.js     # Public server entry point
│   │   └── admin/            # Admin context (port 4001, full CRUD)
│   │       ├── routes/       # Express routes
│   │       ├── views/        # EJS templates with etnoDB visual theme
│   │       └── server.js     # Admin server entry point
│   ├── models/               # MongoDB schemas (Term, Note, Relationship, Source, Collection, AuditLog)
│   ├── services/             # Business logic (term, relationship, search, export, validation)
│   ├── lib/
│   │   ├── search/           # MongoDB text search utilities
│   │   ├── export/           # CSV/SKOS/RDF exporters
│   │   └── validation/       # Z39.19 compliance validators
│   ├── shared/               # Shared utilities, database connection, logger
│   └── config/               # Configuration management
├── tests/
│   ├── integration/          # End-to-end tests
│   └── unit/                 # Service/model unit tests
└── scripts/                  # Database initialization and seeding

frontend/
└── src/
    ├── public/               # Public interface assets
    │   └── styles/           # Tailwind CSS (forest theme)
    ├── admin/                # Admin interface assets
    │   └── styles/           # Tailwind CSS (forest theme)
    └── shared/               # Shared CSS and assets
        └── styles/           # Colors, components matching etnoDB
            └── main.css      # Forest theme colors and base styles

docker/
├── etnotermos.Dockerfile     # Single Alpine container with both contexts
└── docker-compose.yml        # etnotermos + MongoDB "etnodb" (can run alongside etnoDB)

tailwind.config.js            # Forest theme configuration (matching etnoDB)
```

**Structure Decision**: Server-side rendered web application following etnoDB's architecture pattern. Single Node.js 20 backend with two Express servers (public port 4000, admin port 4001) running in one Docker container. EJS templates with HTMX for dynamic interactions and Alpine.js for client-side reactivity. Tailwind CSS with "forest" color theme providing visual consistency with etnoDB. MongoDB connection to shared "etnodb" database using separate "etnotermos" collection. Structure mirrors etnoDB's three-context pattern (Acquisition, Curation, Presentation) adapted for vocabulary management (here: Public browsing, Admin CRUD).

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType gemini`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:

The /tasks command will:

1. Load `.specify/templates/tasks-template.md` as base structure
2. Parse Phase 1 artifacts to generate tasks:
   - **From contracts/openapi.yaml**: Extract all endpoints (public + admin) → generate contract test tasks for each endpoint
   - **From data-model.md**: Extract 6 entities (Term, Note, Relationship, Source, Collection, AuditLog) → generate Mongoose schema tasks
   - **From spec.md acceptance scenarios**: Extract acceptance scenarios → generate integration test tasks
   - **From functional requirements**: FR-001 through FR-032 → generate validation middleware tasks

3. Task categorization:
   - **Infrastructure** [P]: Docker setup (public + admin services), MongoDB indexes and text search configuration
   - **Contract Tests** [P]: One test per endpoint category (public: terms read, search, export; admin: terms CRUD, relationships, notes, sources, collections)
   - **Models** [P]: Mongoose schemas with Z39.19 validation rules
   - **Services**: Business logic with Z39.19 compliance (term service, relationship service, search service, export service)
   - **API Middleware** [P]: Validation middleware, error handling, rate limiting, basic access control for admin
   - **API Routes**: Public routes (read-only) + Admin routes (full CRUD) to satisfy contract tests
   - **Frontend Components** [P]: Public: term display, graph visualization, search; Admin: term CRUD forms, dashboard, data management
   - **Integration Tests**: Map to acceptance scenarios
   - **Documentation**: API docs generation, quickstart validation

**Ordering Strategy**:

1. **TDD Phases**:
   - Phase A: Infrastructure + Contract tests (all fail initially) [P]
   - Phase B: Models + Model unit tests [P after Phase A]
   - Phase C: Services + Service unit tests (depend on models)
   - Phase D: Middleware + Middleware tests [P after Phase B]
   - Phase E: Public API Routes + Admin API Routes (depend on services + middleware) [P]
   - Phase F: Public Frontend + Admin Frontend [P after Phase E for API integration]
   - Phase G: Integration tests (depend on full backend + frontend)
   - Phase H: Documentation + Deployment

2. **Parallelization markers**:
   - [P]: Tasks within same phase that don't share files/dependencies
   - Example: All 6 model schemas can be implemented in parallel
   - Example: All middleware (validation, rate-limit, error, access control) can be parallel
   - Example: Public API and Admin API routes can be developed in parallel
   - Example: Public frontend and Admin frontend can be developed in parallel

3. **Dependency chains** (sequential):
   - MongoDB indexes and text search config → Models
   - Models → Services
   - Services + Middleware → Public Routes + Admin Routes
   - Public Routes → Public Frontend
   - Admin Routes → Admin Frontend
   - Both Frontends → Integration tests

**Estimated Output**:
- ~55-65 numbered, dependency-ordered tasks in tasks.md
- Breakdown: 6 infrastructure (dual services), 10 contract tests (public + admin), 6 models (entities), 8 services, 5 middleware, 18 routes (public + admin), 14 frontend components (public + admin), integration tests, 3 documentation

**Key Task Examples**:
- Task 1: Setup Docker Compose with dual backend/frontend services + MongoDB [P]
- Task 2: Create MongoDB text search index configuration script [P]
- Task 3: Write contract test for public GET /api/v1/terms [P]
- Task 4: Write contract test for admin POST /api/v1/terms [P]
- Task 12: Implement Term Mongoose schema with Z39.19 validation [P]
- Task 22: Implement TermService with relationship reciprocity logic
- Task 30: Implement validation middleware [P]
- Task 35: Implement public GET /api/v1/terms route (read-only)
- Task 40: Implement admin POST /api/v1/terms route (CRUD)
- Task 50: Implement public TermList React component [P]
- Task 55: Implement admin TermForm React component [P]
- Task 60: Implement Cytoscape graph visualization component [P]
- Task 70: Integration test for full CRUD workflow

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Progress Tracking

*This checklist is updated during execution flow*

**Phase Status**:

- [x] Phase 0: Research complete (/plan command) - research.md updated 2026-01-05
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/openapi.yaml, quickstart.md, CLAUDE.md all verified/updated
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - Detailed strategy documented above
- [ ] Phase 3: Tasks generated (/tasks command) - **NEXT STEP: Run `/tasks`**
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS (no violations, industry best practices applied)
- [x] Post-Design Constitution Check: PASS (architecture clean, no unnecessary complexity)
- [x] All NEEDS CLARIFICATION resolved (via spec clarification sessions 2025-10-05, 2025-10-15 + research phase)
- [x] Complexity deviations documented (N/A - no violations)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*

**Plan Completed**: 2026-01-05
**Constitution Ratified**: 2026-01-07
**Next Command**: `/tasks` to generate tasks.md
