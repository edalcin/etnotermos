
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

EtnoTermos is a comprehensive ethnobotanical terminology management system designed for researchers, students, and traditional community leaders. The system provides structured vocabulary management following ANSI/NISO Z39.19-2005 standards, supporting up to 200,000 terms with complex many-to-many relationships, six note types, and interactive graph visualization. Core capabilities include CRUD operations, advanced search, CSV export (with future SKOS/RDF support), REST API access, and culturally sensitive workflows adhering to CARE Principles for Indigenous Data Governance. Authentication via Google OAuth with role-based permissions ensures secure, collaborative knowledge building.

## Technical Context

**Language/Version**: Node.js 18+ (backend), React 18+ (frontend)
**Primary Dependencies**: Express.js/Fastify for REST API, MongoDB driver, Meilisearch client, Passport.js (Google OAuth), D3.js/Cytoscape.js (graph visualization)
**Storage**: MongoDB (primary data store), Meilisearch (search index)
**Testing**: Jest (unit/integration), Supertest (API), React Testing Library (frontend)
**Target Platform**: Docker containers, GitHub Actions deployment, Linux server
**Project Type**: web (frontend + backend)
**Performance Goals**: Support 200,000 terms, <500ms search response, handle 5-10 concurrent users, graph rendering for networks up to 1000 visible nodes
**Constraints**: Small concurrent user base ("almost never" simultaneous edits), conflict resolution via merge-and-notify, Docker-based deployment
**Scale/Scope**: ~200,000 terms, 6 note types per term, many-to-many relationships, 4 user roles (admin, researcher, student, community leader), REST API with documentation, CSV export (SKOS/RDF/Dublin Core in future phases)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: Constitution not yet ratified (template placeholder exists at `.specify/memory/constitution.md`)

**Initial Assessment**: No constitutional gates defined yet. Proceeding with industry best practices:
- Test-driven development approach (tests before implementation)
- Clear separation of concerns (backend/frontend, models/services/controllers)
- API-first design with OpenAPI contracts
- Modular architecture for maintainability
- Docker containerization for deployment consistency

**Action**: Complexity Tracking section will remain empty as no constitutional violations exist to justify.

**Post-Design Re-evaluation** (after Phase 1):
- ✅ Architecture follows best practices: Clean separation (backend/frontend), API-first design, TDD approach
- ✅ No unnecessary complexity introduced: Monorepo structure appropriate for scale, technology choices justified in research.md
- ✅ Design patterns align with industry standards: REST API, JWT auth, hybrid MongoDB relationship model
- ✅ No constitutional violations detected

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
│   ├── models/           # MongoDB schemas (Term, Note, Relationship, Source, Collection, AuditLog, User)
│   ├── services/         # Business logic (term service, relationship service, search service, auth service)
│   ├── api/
│   │   ├── routes/       # Express/Fastify route handlers
│   │   ├── middleware/   # Auth, validation, error handling
│   │   └── controllers/  # Request/response handling
│   ├── lib/
│   │   ├── meilisearch/  # Search index management
│   │   ├── export/       # CSV/SKOS/RDF exporters
│   │   └── validation/   # Z39.19 compliance validators
│   └── config/           # Configuration management
├── tests/
│   ├── contract/         # OpenAPI contract tests
│   ├── integration/      # End-to-end API tests
│   └── unit/             # Service/model unit tests
└── docs/
    └── openapi.yaml      # REST API specification

frontend/
├── src/
│   ├── components/
│   │   ├── term/         # Term CRUD components
│   │   ├── graph/        # D3/Cytoscape graph visualization
│   │   ├── search/       # Search interface
│   │   ├── admin/        # Admin dashboard
│   │   └── common/       # Shared UI components
│   ├── pages/            # Route-level pages
│   ├── services/         # API client, auth context
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Helper functions
├── tests/
│   ├── integration/      # E2E tests with API
│   └── unit/             # Component tests
└── public/               # Static assets

docker/
├── backend.Dockerfile
├── frontend.Dockerfile
└── docker-compose.yml    # Local dev + MongoDB + Meilisearch

.github/
└── workflows/
    └── deploy.yml        # GitHub Actions deployment
```

**Structure Decision**: Web application architecture with separate backend (Node.js REST API) and frontend (React SPA). Backend handles all data operations, search indexing, exports, and Google OAuth. Frontend provides CRUD interface, graph visualization, and admin dashboard. Docker Compose orchestrates all services (app, MongoDB, Meilisearch) for consistent deployment.

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
   - **From contracts/openapi.yaml**: Extract all endpoints → generate contract test tasks for each endpoint
   - **From data-model.md**: Extract 6 entities (Term, Note, Relationship, Source, Collection, AuditLog, User) → generate Mongoose schema tasks
   - **From spec.md acceptance scenarios**: Extract 11 scenarios → generate integration test tasks
   - **From functional requirements**: FR-001 through FR-032 → generate validation middleware tasks

3. Task categorization:
   - **Infrastructure** [P]: Docker setup, MongoDB indexes, Meilisearch configuration
   - **Contract Tests** [P]: One test per endpoint category (terms, relationships, notes, sources, collections, auth, admin)
   - **Models** [P]: Mongoose schemas with Z39.19 validation rules
   - **Services**: Business logic with Z39.19 compliance (term service, relationship service, search sync, auth service, export service)
   - **API Middleware** [P]: Auth middleware, validation middleware, error handling, rate limiting
   - **API Routes**: Controller implementation to satisfy contract tests
   - **Frontend Components** [P]: Term CRUD, graph visualization, search, admin dashboard
   - **Integration Tests**: Map to 11 acceptance scenarios
   - **Documentation**: API docs generation, quickstart validation

**Ordering Strategy**:

1. **TDD Phases**:
   - Phase A: Infrastructure + Contract tests (all fail initially) [P]
   - Phase B: Models + Model unit tests [P after Phase A]
   - Phase C: Services + Service unit tests (depend on models)
   - Phase D: Middleware + Middleware tests [P after Phase B]
   - Phase E: Routes + Make contract tests pass (depend on services + middleware)
   - Phase F: Frontend components + Component tests [P after Phase E for API integration]
   - Phase G: Integration tests (depend on full backend + frontend)
   - Phase H: Documentation + Deployment

2. **Parallelization markers**:
   - [P]: Tasks within same phase that don't share files/dependencies
   - Example: All 6 model schemas can be implemented in parallel
   - Example: All middleware (auth, validation, rate-limit, error) can be parallel

3. **Dependency chains** (sequential):
   - MongoDB indexes → Models
   - Models → Services
   - Services + Middleware → Routes
   - Routes → Frontend
   - Frontend → Integration tests

**Estimated Output**:
- ~50-60 numbered, dependency-ordered tasks in tasks.md
- Breakdown: 5 infrastructure, 8 contract tests, 7 models (6 entities + User), 10 services, 6 middleware, 15 routes, 12 frontend components, 11 integration tests, 3 documentation

**Key Task Examples**:
- Task 1: Setup Docker Compose with MongoDB + Meilisearch [P]
- Task 2: Create MongoDB index creation script [P]
- Task 3: Write contract test for GET /api/v1/terms [P]
- Task 10: Implement Term Mongoose schema with Z39.19 validation [P]
- Task 20: Implement TermService with relationship reciprocity logic
- Task 30: Implement auth middleware with JWT validation [P]
- Task 40: Implement POST /api/v1/terms route (satisfies Task 3 contract)
- Task 50: Implement TermList React component with pagination [P]
- Task 55: Implement Cytoscape graph visualization component [P]
- Task 60: Integration test for acceptance scenario 1 (create term with sources)

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
*Constitution not yet ratified - Following industry best practices. See `.specify/memory/constitution.md` for template.*

**Plan Completed**: 2026-01-05
**Next Command**: `/tasks` to generate tasks.md
