# Tasks: Ethnobotanical Terms Database and Management System

**Feature**: EtnoTermos main
**Branch**: main
**Input**: Design documents from `/specs/main/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/openapi.yaml

**Generated**: 2026-01-05
**Status**: Ready for execution

---

## Execution Flow

This task list follows Test-Driven Development (TDD) principles:
1. **Setup infrastructure** (Phase 3.1)
2. **Write failing tests** (Phase 3.2) - MUST complete before implementation
3. **Implement to make tests pass** (Phase 3.3-3.6)
4. **Polish and document** (Phase 3.7)

**Parallel Execution**: Tasks marked **[P]** can run in parallel (independent files, no shared dependencies)

---

## Path Conventions

Based on plan.md project structure:
- Backend: `backend/src/`, `backend/tests/`
- Frontend: `frontend/src/`, `frontend/tests/`
- Docker: `docker/`
- Contracts: `backend/docs/openapi.yaml`

---

## Phase 3.1: Infrastructure & Setup

**Goal**: Establish project structure, dependencies, and development environment

- [ ] **T001** [P] Create backend directory structure: `backend/src/{models,services,api/{routes,controllers,middleware},lib/{meilisearch,export,validation},config}` and `backend/tests/{contract,integration,unit}`

- [ ] **T002** [P] Initialize backend Node.js 18+ project with TypeScript, create `backend/package.json` with dependencies: fastify, @fastify/cors, @fastify/helmet, mongoose, meilisearch, passport, passport-google-oauth20, jsonwebtoken, bcrypt, jest, supertest, mongodb-memory-server, ts-node, typescript

- [ ] **T003** [P] Configure TypeScript for backend: create `backend/tsconfig.json` with strict mode, ES2022 target, commonjs module, paths for clean imports

- [ ] **T004** [P] Create frontend directory structure: `frontend/src/{components/{term,graph,search,admin,common},pages,services,hooks,utils}` and `frontend/tests/{integration,unit}`, `frontend/public`

- [ ] **T005** [P] Initialize frontend React 18+ project with TypeScript using Vite, create `frontend/package.json` with dependencies: react, react-dom, react-router-dom, cytoscape, axios, @tanstack/react-query, jest, @testing-library/react, @testing-library/jest-dom, vitest

- [ ] **T006** [P] Configure TypeScript for frontend: create `frontend/tsconfig.json` with React JSX support, ES2022 target, paths for clean imports

- [ ] **T007** [P] Setup ESLint and Prettier for both backend and frontend with consistent rules

- [ ] **T008** [P] Create Docker Compose configuration in `docker/docker-compose.yml` with services: backend (Fastify), frontend (Nginx), mongodb (with volume), meilisearch (with volume), mongo-init (index creation)

- [ ] **T009** [P] Create backend Dockerfile in `docker/backend.Dockerfile`: Node 18 alpine, multi-stage build, production optimizations

- [ ] **T010** [P] Create frontend Dockerfile in `docker/frontend.Dockerfile`: Node 18 for build, Nginx alpine for serving, copy build artifacts

- [ ] **T011** [P] Create MongoDB initialization script in `backend/scripts/init-mongo.sh` for creating databases and users

- [ ] **T012** [P] Create MongoDB index creation script in `backend/scripts/create-indexes.ts` (will be populated in Phase 3.3)

- [ ] **T013** Create backend configuration management in `backend/src/config/index.ts`: load environment variables (PORT, MONGO_URI, MEILISEARCH_HOST, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET), validation, export typed config object

- [ ] **T014** Create Meilisearch client initialization in `backend/src/lib/meilisearch/client.ts`: connect to Meilisearch, export configured client

- [ ] **T015** Create MongoDB connection setup in `backend/src/config/database.ts`: Mongoose connection with retry logic, connection event handlers

- [ ] **T016** Create backend server entry point in `backend/src/server.ts`: initialize Fastify app, register plugins (cors, helmet), connect to MongoDB, start server

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE IMPLEMENTATION

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation in Phase 3.3+**

### Contract Tests (OpenAPI Validation)

- [ ] **T017** [P] Setup OpenAPI validator in `backend/tests/contract/setup.ts`: load openapi.yaml, configure validator with supertest

- [ ] **T018** [P] Contract test for GET /api/v1/terms (list) in `backend/tests/contract/terms.list.test.ts`: validate pagination params, response schema, 200 status

- [ ] **T019** [P] Contract test for POST /api/v1/terms in `backend/tests/contract/terms.create.test.ts`: validate request body schema, 201 response with created term

- [ ] **T020** [P] Contract test for GET /api/v1/terms/:id in `backend/tests/contract/terms.get.test.ts`: validate term response schema, 404 for missing term

- [ ] **T021** [P] Contract test for PUT /api/v1/terms/:id in `backend/tests/contract/terms.update.test.ts`: validate update request, version conflict detection, 200 response

- [ ] **T022** [P] Contract test for DELETE /api/v1/terms/:id in `backend/tests/contract/terms.delete.test.ts`: validate deletion, dependency warning response

- [ ] **T023** [P] Contract test for POST /api/v1/relationships in `backend/tests/contract/relationships.create.test.ts`: validate relationship creation, reciprocal type generation

- [ ] **T024** [P] Contract test for GET /api/v1/relationships/:termId in `backend/tests/contract/relationships.get.test.ts`: validate relationship queries by term

- [ ] **T025** [P] Contract test for POST /api/v1/notes in `backend/tests/contract/notes.create.test.ts`: validate note creation with type validation

- [ ] **T026** [P] Contract test for GET /api/v1/search in `backend/tests/contract/search.test.ts`: validate search query params, pagination, response format

- [ ] **T027** [P] Contract test for GET /api/v1/export/csv in `backend/tests/contract/export.test.ts`: validate export query params, CSV response format

- [ ] **T028** [P] Contract test for POST /api/v1/auth/google in `backend/tests/contract/auth.test.ts`: validate OAuth callback, JWT response

- [ ] **T029** [P] Contract test for GET /api/v1/admin/dashboard in `backend/tests/contract/admin.test.ts`: validate admin-only access, statistics response

### Integration Tests (Acceptance Scenarios)

- [ ] **T030** [P] Integration test for Acceptance Scenario 1 in `backend/tests/integration/scenario-01-create-term.test.ts`: Create term with definitions, cultural context, and bibliographic sources → Verify storage with metadata, sources, and relationship links

- [ ] **T031** [P] Integration test for Acceptance Scenario 2 in `backend/tests/integration/scenario-02-delete-warning.test.ts`: Attempt to delete parent term in hierarchy → Verify warning about dependent child terms and confirmation requirement

- [ ] **T032** [P] Integration test for Acceptance Scenario 3 in `backend/tests/integration/scenario-03-search.test.ts`: Search for plant name or usage context → Verify relevant terms returned with relationships and notes

- [ ] **T033** [P] Integration test for Acceptance Scenario 4 in `backend/tests/integration/scenario-04-relationships.test.ts`: Establish many-to-many relationships → Verify bidirectional connections navigable from both terms

- [ ] **T034** [P] Integration test for Acceptance Scenario 5 in `backend/tests/integration/scenario-05-notes.test.ts`: View term with multiple note types → Verify all note types organized and presented clearly

- [ ] **T035** [P] Integration test for Acceptance Scenario 6 in `backend/tests/integration/scenario-06-admin.test.ts`: Admin access to admin interface → Verify user role management, permissions, and analytics dashboard

- [ ] **T036** [P] Integration test for Acceptance Scenario 7 in `backend/tests/integration/scenario-07-export.test.ts`: Request data export → Verify CSV file generation with proper encoding and formatting

- [ ] **T037** [P] Integration test for Acceptance Scenario 8 in `backend/tests/integration/scenario-08-auth.test.ts`: New user authentication via Google OAuth → Verify secure authentication and role-appropriate permissions

- [ ] **T038** [P] Integration test for Acceptance Scenario 9 in `backend/tests/integration/scenario-09-care-principles.test.ts`: Community leader contributes traditional knowledge → Verify proper attribution and cultural sensitivity

- [ ] **T039** [P] Integration test for Acceptance Scenario 10 in `backend/tests/integration/scenario-10-api-access.test.ts`: External system requests data via API → Verify secure access based on authentication and permissions

- [ ] **T040** [P] Integration test for Acceptance Scenario 11 in `backend/tests/integration/scenario-11-student-access.test.ts`: Graduate student accesses terminology sets → Verify educational access with guidance features

---

## Phase 3.3: Data Models (ONLY after tests are failing)

**Goal**: Implement Mongoose schemas with ANSI/NISO Z39.19 validation

- [ ] **T041** [P] Implement Source model in `backend/src/models/Source.ts`: Mongoose schema with type enum (bibliographic, interview, field_notes, herbarium_sample), flexible fields object, timestamps, indexes on type

- [ ] **T042** [P] Implement Collection model in `backend/src/models/Collection.ts`: Mongoose schema with name (unique), description, timestamps

- [ ] **T043** [P] Implement Term model in `backend/src/models/Term.ts`: Mongoose schema with prefLabel (required), altLabels, hiddenLabels, definition, scopeNote, historyNote, example, qualifier, termType enum, status enum, useFor refs, useTerm ref, facets object, sourceIds refs, collectionIds refs, version field for optimistic locking, timestamps, compound indexes, text index on names/definition

- [ ] **T044** [P] Implement Note model in `backend/src/models/Note.ts`: Mongoose schema with termId ref (required), type enum (scope, cataloger, historical, bibliographic, definition, example), content, sourceIds refs, timestamps, index on termId

- [ ] **T045** [P] Implement Relationship model in `backend/src/models/Relationship.ts`: Mongoose schema with sourceTermId ref (required), targetTermId ref (required), type enum (USE, UF, BT, NT, BTG, NTG, BTP, NTP, BTI, NTI, RT), reciprocalType (computed), isReciprocal boolean, timestamps, validatedAt, compound indexes on (sourceTermId, type), (targetTermId, type)

- [ ] **T046** [P] Implement AuditLog model in `backend/src/models/AuditLog.ts`: Mongoose schema with entityType (Term/Note/Relationship), entityId ref, action enum (create, update, delete), changes object, userId ref, timestamp, indexes on entityId and userId

- [ ] **T047** [P] Implement User model in `backend/src/models/User.ts`: Mongoose schema with googleId (unique), email, name, role enum (admin, researcher, student, community_leader), permissions object, timestamps

- [ ] **T048** Update MongoDB index creation script `backend/scripts/create-indexes.ts`: programmatically create all indexes defined in models, connection and error handling

---

## Phase 3.4: Business Logic Services

**Goal**: Implement core business logic with Z39.19 compliance and validation

- [ ] **T049** Create validation utilities in `backend/src/lib/validation/z39-19.ts`: functions for validating relationship reciprocity (BT↔NT, RT↔RT, USE↔UF), circular hierarchy detection, authority control (one preferred term per concept), homograph qualifier validation

- [ ] **T050** Create TermService in `backend/src/services/TermService.ts`: CRUD operations, validation using z39-19 utils, version checking for optimistic locking, merge logic for conflict resolution, audit log creation on changes

- [ ] **T051** Create RelationshipService in `backend/src/services/RelationshipService.ts`: create relationship with automatic reciprocal generation, validate reciprocity, prevent circular hierarchies, query relationships by term/type, update relationship validation status

- [ ] **T052** Create NoteService in `backend/src/services/NoteService.ts`: CRUD for notes, validate note type enum, associate with sources, query notes by term and type

- [ ] **T053** Create SourceService in `backend/src/services/SourceService.ts`: CRUD for sources, validate source type and fields structure, query sources by term usage

- [ ] **T054** Create CollectionService in `backend/src/services/CollectionService.ts`: CRUD for collections, manage term-collection associations, query terms by collection

- [ ] **T055** Create SearchService in `backend/src/services/SearchService.ts`: sync term data to Meilisearch (async via event), delete from index, perform search with filters (collections, relationship types), return results with relevance ranking

- [ ] **T056** Create ExportService in `backend/src/services/ExportService.ts`: export terms to CSV with UTF-8 encoding, Z39.19 standard columns (term_id, preferred_name, language, alternate_names, scope_note, definition, broader_terms, narrower_terms, related_terms, use_for, collections, sources, timestamps), pipe-separated relationships

- [ ] **T057** Create AuthService in `backend/src/services/AuthService.ts`: Google OAuth callback handling, user creation/update, JWT generation (24h expiration), JWT verification, role-based permission checking

- [ ] **T058** Create DashboardService in `backend/src/services/DashboardService.ts`: aggregate statistics (term counts by status, relationship type distribution, collection sizes, user activity), query recent changes from audit log

---

## Phase 3.5: API Middleware

**Goal**: Implement cross-cutting concerns (auth, validation, error handling)

- [ ] **T059** [P] Create authentication middleware in `backend/src/api/middleware/auth.ts`: verify JWT from cookie/header, attach user to request, handle missing/invalid tokens with 401

- [ ] **T060** [P] Create authorization middleware in `backend/src/api/middleware/authorize.ts`: check user role against required roles, handle insufficient permissions with 403, special handling for private notes (author + admin only)

- [ ] **T061** [P] Create validation middleware in `backend/src/api/middleware/validate.ts`: JSON Schema validation for request bodies, query params, path params using Fastify's built-in validator

- [ ] **T062** [P] Create error handling middleware in `backend/src/api/middleware/errorHandler.ts`: catch all errors, format error responses, log errors, distinguish between operational (4xx) and programmer (5xx) errors

- [ ] **T063** [P] Create rate limiting middleware in `backend/src/api/middleware/rateLimit.ts`: implement 100 requests/minute per user, use in-memory store (Redis future enhancement), return 429 on limit exceeded

- [ ] **T064** [P] Create audit logging middleware in `backend/src/api/middleware/auditLog.ts`: intercept write operations (POST/PUT/DELETE), extract changes, create audit log entries asynchronously

---

## Phase 3.6: API Routes & Controllers

**Goal**: Implement REST endpoints to satisfy contract tests

- [ ] **T065** Create terms router in `backend/src/api/routes/terms.ts`: register routes (GET /terms, POST /terms, GET /terms/:id, PUT /terms/:id, DELETE /terms/:id), apply auth and validation middleware

- [ ] **T066** Create terms controller in `backend/src/api/controllers/TermsController.ts`: listTerms (pagination, filtering), createTerm (validate, call TermService, trigger Meilisearch sync), getTerm, updateTerm (optimistic locking, conflict handling), deleteTerm (check dependencies, warn if needed)

- [ ] **T067** Create relationships router in `backend/src/api/routes/relationships.ts`: register routes (POST /relationships, GET /relationships/:termId, DELETE /relationships/:id)

- [ ] **T068** Create relationships controller in `backend/src/api/controllers/RelationshipsController.ts`: createRelationship (validate, generate reciprocal, call RelationshipService), getRelationshipsByTerm, deleteRelationship (remove reciprocal)

- [ ] **T069** Create notes router in `backend/src/api/routes/notes.ts`: register routes (POST /notes, GET /notes/:termId, PUT /notes/:id, DELETE /notes/:id)

- [ ] **T070** Create notes controller in `backend/src/api/controllers/NotesController.ts`: createNote, getNotesByTerm (filter by type, check private note permissions), updateNote, deleteNote

- [ ] **T071** Create sources router in `backend/src/api/routes/sources.ts`: register routes (POST /sources, GET /sources, GET /sources/:id, PUT /sources/:id, DELETE /sources/:id)

- [ ] **T072** Create sources controller in `backend/src/api/controllers/SourcesController.ts`: CRUD operations, check source usage before deletion

- [ ] **T073** Create collections router in `backend/src/api/routes/collections.ts`: register routes (POST /collections, GET /collections, GET /collections/:id, PUT /collections/:id, DELETE /collections/:id)

- [ ] **T074** Create collections controller in `backend/src/api/controllers/CollectionsController.ts`: CRUD operations, get terms by collection

- [ ] **T075** Create search router in `backend/src/api/routes/search.ts`: register route (GET /search)

- [ ] **T076** Create search controller in `backend/src/api/controllers/SearchController.ts`: search terms using SearchService, apply pagination, filter by collections/types, return enriched results with relationship counts

- [ ] **T077** Create export router in `backend/src/api/routes/export.ts`: register routes (GET /export/csv, future: GET /export/skos, GET /export/rdf)

- [ ] **T078** Create export controller in `backend/src/api/controllers/ExportController.ts`: exportCSV (query terms with filters, call ExportService, stream CSV response with proper headers), track export in audit log

- [ ] **T079** Create auth router in `backend/src/api/routes/auth.ts`: register routes (GET /auth/google, GET /auth/google/callback, POST /auth/logout, GET /auth/me)

- [ ] **T080** Create auth controller in `backend/src/api/controllers/AuthController.ts`: initiate Google OAuth, handle callback (call AuthService, set JWT cookie), logout (clear cookie), getCurrentUser

- [ ] **T081** Create admin router in `backend/src/api/routes/admin.ts`: register routes (GET /admin/dashboard, PUT /admin/users/:id/role, GET /admin/audit-logs)

- [ ] **T082** Create admin controller in `backend/src/api/controllers/AdminController.ts`: getDashboard (call DashboardService), updateUserRole (admin only), getAuditLogs (pagination, filtering)

- [ ] **T083** Register all routers in `backend/src/server.ts`: terms, relationships, notes, sources, collections, search, export, auth, admin under /api/v1 prefix

---

## Phase 3.7: Frontend Implementation

**Goal**: Build React components and pages for user interface

### Core Components (Term Management)

- [ ] **T084** [P] Create API client in `frontend/src/services/api.ts`: Axios instance with base URL, JWT token interceptor, error handling, typed methods for all endpoints

- [ ] **T085** [P] Create auth context in `frontend/src/services/AuthContext.tsx`: React Context for current user, login/logout functions, role checking helpers, persist JWT

- [ ] **T086** [P] Create TermCard component in `frontend/src/components/term/TermCard.tsx`: display term summary (prefLabel, altLabels, definition snippet), show relationship counts, click handler for details

- [ ] **T087** [P] Create TermDetail component in `frontend/src/components/term/TermDetail.tsx`: full term display with all fields, tabbed interface for notes (by type), source citations, relationship lists, edit/delete buttons (if authorized)

- [ ] **T088** [P] Create TermForm component in `frontend/src/components/term/TermForm.tsx`: form for creating/editing terms, multi-language name inputs, note type fields, source selection dropdown, collection tags, validation

- [ ] **T089** [P] Create TermList component in `frontend/src/components/term/TermList.tsx`: paginated term list using @tanstack/react-query, search input, filter by collection/status, virtual scrolling for performance

### Graph Visualization

- [ ] **T090** [P] Create GraphVisualization component in `frontend/src/components/graph/GraphVisualization.tsx`: initialize Cytoscape, render term nodes and relationship edges, pan/zoom controls, layout selector (force-directed, hierarchical), node click to expand relationships, context menu for term actions

- [ ] **T091** [P] Create GraphControls component in `frontend/src/components/graph/GraphControls.tsx`: layout selection, zoom controls, filter by relationship type, search within graph, reset view button

### Search Interface

- [ ] **T092** [P] Create SearchBar component in `frontend/src/components/search/SearchBar.tsx`: debounced search input (300ms), autocomplete suggestions, filter dropdowns (collections, note types), advanced search toggle

- [ ] **T093** [P] Create SearchResults component in `frontend/src/components/search/SearchResults.tsx`: display search results with highlighting, show relevance scores, pagination, filter sidebar, result count

### Admin Dashboard

- [ ] **T094** [P] Create Dashboard component in `frontend/src/components/admin/Dashboard.tsx`: statistics cards (term counts, relationship types, user activity), charts using chart library, recent changes list, system health indicators

- [ ] **T095** [P] Create UserManagement component in `frontend/src/components/admin/UserManagement.tsx`: user list with roles, role assignment dropdown, permissions display, activity history

### Common Components

- [ ] **T096** [P] Create Header component in `frontend/src/components/common/Header.tsx`: navigation menu, user profile dropdown, login/logout button, search bar integration

- [ ] **T097** [P] Create Layout component in `frontend/src/components/common/Layout.tsx`: consistent page layout with header, sidebar (optional), main content area, footer

- [ ] **T098** [P] Create LoadingSpinner component in `frontend/src/components/common/LoadingSpinner.tsx`: reusable loading indicator

- [ ] **T099** [P] Create ErrorBoundary component in `frontend/src/components/common/ErrorBoundary.tsx`: catch React errors, display user-friendly error message, log errors

### Pages

- [ ] **T100** [P] Create Home page in `frontend/src/pages/Home.tsx`: welcome message, quick stats, featured terms, call-to-action for new users

- [ ] **T101** [P] Create Terms page in `frontend/src/pages/Terms.tsx`: integrate TermList, filters, create new term button

- [ ] **T102** [P] Create TermDetailPage in `frontend/src/pages/TermDetailPage.tsx`: integrate TermDetail, relationship graph, breadcrumb navigation

- [ ] **T103** [P] Create GraphPage in `frontend/src/pages/GraphPage.tsx`: full-screen GraphVisualization with controls, export graph image button

- [ ] **T104** [P] Create SearchPage in `frontend/src/pages/SearchPage.tsx`: integrate SearchBar and SearchResults, saved searches feature

- [ ] **T105** [P] Create AdminPage in `frontend/src/pages/AdminPage.tsx`: integrate Dashboard and UserManagement, admin-only route guard

- [ ] **T106** [P] Create LoginPage in `frontend/src/pages/LoginPage.tsx`: Google OAuth login button, redirect after authentication

- [ ] **T107** Setup routing in `frontend/src/App.tsx`: React Router with routes (/, /terms, /terms/:id, /graph, /search, /admin, /login), protected routes using AuthContext, 404 page

### Frontend Tests

- [ ] **T108** [P] Unit test TermCard component in `frontend/tests/unit/TermCard.test.tsx`: render with props, click handler

- [ ] **T109** [P] Unit test SearchBar component in `frontend/tests/unit/SearchBar.test.tsx`: debouncing, filter selection

- [ ] **T110** [P] Integration test term CRUD flow in `frontend/tests/integration/term-crud.test.tsx`: create term, view in list, edit, delete with API mocking

---

## Phase 3.8: Integration & Polish

**Goal**: Complete end-to-end functionality and optimize performance

- [ ] **T111** Create Meilisearch sync handler in `backend/src/lib/meilisearch/sync.ts`: listen for term change events, update Meilisearch index asynchronously, handle sync failures with retry logic, log sync status

- [ ] **T112** Implement conflict resolution in `backend/src/services/TermService.ts` updateTerm method: detect version mismatch, attempt three-way merge for disjoint fields, log conflicts, notify admin on merge failure

- [ ] **T113** Add comprehensive logging in `backend/src/lib/logger.ts`: Winston or Pino logger, structured JSON logs, log levels (debug, info, warn, error), include request IDs, sanitize sensitive data

- [ ] **T114** Implement CARE Principles features: Add attribution fields to User model, create consent workflow for traditional knowledge contributions in `backend/src/services/CareService.ts`, add cultural sensitivity warnings to admin interface

- [ ] **T115** Create database seed script in `backend/scripts/seed.ts`: populate with sample terms, relationships, sources, collections for testing and demonstration

- [ ] **T116** Performance optimization: Add pagination cursor support to list endpoints, implement field projection for large responses, optimize MongoDB queries with explain analysis, add indexes based on slow query log

- [ ] **T117** Security audit: Enable Helmet.js security headers, configure CORS whitelist for frontend domain, implement CSRF protection for state-changing operations, sanitize user inputs, add security headers to Nginx config

- [ ] **T118** Create health check endpoint in `backend/src/api/routes/health.ts`: check MongoDB connection, Meilisearch availability, memory usage, return 200 with status object

- [ ] **T119** Setup frontend environment configuration in `frontend/src/config.ts`: API base URL from env vars, feature flags, build-time vs runtime config

- [ ] **T120** Optimize frontend bundle: code splitting by route, lazy load graph visualization component, tree-shaking, analyze bundle size, compression

---

## Phase 3.9: Documentation & Deployment

**Goal**: Finalize documentation and deployment automation

- [ ] **T121** [P] Generate OpenAPI documentation in `backend/docs/openapi.yaml`: complete all endpoint schemas, request/response examples, authentication requirements, error codes

- [ ] **T122** [P] Create API documentation site: use Redoc or Swagger UI to render openapi.yaml, deploy to /api/docs endpoint

- [ ] **T123** [P] Write developer quickstart in `README.md`: prerequisites, local setup with Docker Compose, running tests, environment variables, common issues

- [ ] **T124** [P] Create deployment guide in `docs/deployment.md`: production Docker setup, environment configuration, SSL/TLS setup, backup strategy, monitoring setup

- [ ] **T125** [P] Create GitHub Actions workflow in `.github/workflows/ci-cd.yml`: run tests on pull request, lint checks, build Docker images, push to GitHub Container Registry, deploy to staging on main branch push

- [ ] **T126** [P] Setup monitoring and alerting: configure logging aggregation (optional: ELK stack), setup application metrics (Prometheus), create alerting rules for errors and performance

- [ ] **T127** [P] Create user documentation in `docs/user-guide.md`: system overview, common workflows (create term, search, visualize graph, export data), role-specific guides (researcher, student, community leader, admin)

- [ ] **T128** [P] Create CARE Principles compliance document in `docs/care-compliance.md`: document how system implements Collective Benefit, Authority to Control, Responsibility, and Ethics principles

- [ ] **T129** Run full integration test suite: execute all acceptance scenario tests (T030-T040), verify all pass, generate test coverage report (target 80% overall)

- [ ] **T130** Run performance testing: load test with 50k terms, measure search response times (<500ms target), test graph rendering with 1000 nodes, verify pagination performance

- [ ] **T131** Security penetration testing: run OWASP ZAP or similar tool, test authentication bypass, SQL/NoSQL injection, XSS vulnerabilities, CSRF, rate limiting, fix any findings

- [ ] **T132** Validate quickstart.md: execute all curl commands in quickstart.md against running system, verify responses match documentation, update if needed

- [ ] **T133** Final cleanup: remove console.logs, unused imports, commented code, verify all TODOs resolved, run linter and fix issues, format code consistently

---

## Task Dependencies & Execution Order

### Sequential Chains (Must run in order)

1. **Infrastructure Chain**: T001 → T002-T007 [P] → T008-T016
2. **Model Chain**: T041-T047 [P] → T048
3. **Service Chain**: T049 → T050-T058 (some parallelizable)
4. **API Chain**: T059-T064 [P] → T065-T083
5. **Frontend Chain**: T084-T085 [P] → T086-T107 (many parallelizable)
6. **Integration Chain**: T111-T120
7. **Documentation Chain**: T121-T133

### Key Gates (Must complete before proceeding)

- **Gate 1**: Complete T001-T016 before any test writing
- **Gate 2**: Complete ALL tests (T017-T040) before any implementation (T041+)
- **Gate 3**: Complete models (T041-T048) before services (T049-T058)
- **Gate 4**: Complete services before API routes (T065-T083)
- **Gate 5**: Complete API before frontend integration (T084+)
- **Gate 6**: Complete frontend before integration tests (T110, T129)

### Parallel Execution Examples

**Infrastructure Setup** (can run simultaneously):
```
Task T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T012
# All are independent file creations
```

**Contract Tests** (can run simultaneously):
```
Task T018, T019, T020, T021, T022, T023, T024, T025, T026, T027, T028, T029
# Each tests different endpoint, no shared state
```

**Models** (can run simultaneously):
```
Task T041, T042, T043, T044, T045, T046, T047
# Each creates different model file
```

**Middleware** (can run simultaneously):
```
Task T059, T060, T061, T062, T063, T064
# Independent middleware files
```

**Frontend Components** (can run simultaneously):
```
Task T086, T087, T088, T089, T090, T091, T092, T093, T094, T095, T096, T097, T098, T099
# Independent component files
```

---

## Validation Checklist

Before marking Phase 3 complete, verify:

- [ ] All 133 tasks completed
- [ ] All contract tests pass (T017-T029)
- [ ] All integration tests pass (T030-T040)
- [ ] All 11 acceptance scenarios validated (T129)
- [ ] Test coverage ≥80% (T129)
- [ ] Performance targets met: <500ms search, 1000 nodes rendered (T130)
- [ ] Security audit clean (T131)
- [ ] Quickstart validated (T132)
- [ ] Documentation complete (T121-T128)
- [ ] Docker Compose starts all services
- [ ] CI/CD pipeline passing (T125)

---

## Estimated Effort

**Total Tasks**: 133
**Estimated Duration**: 8-12 weeks (single developer)

**Breakdown by Phase**:
- Phase 3.1 (Infrastructure): 16 tasks, ~1 week
- Phase 3.2 (Tests): 24 tasks, ~2 weeks
- Phase 3.3 (Models): 8 tasks, ~3 days
- Phase 3.4 (Services): 10 tasks, ~1 week
- Phase 3.5 (Middleware): 6 tasks, ~2 days
- Phase 3.6 (API): 19 tasks, ~1.5 weeks
- Phase 3.7 (Frontend): 27 tasks, ~2 weeks
- Phase 3.8 (Integration): 10 tasks, ~1 week
- Phase 3.9 (Documentation): 13 tasks, ~1 week

**Parallelization potential**: With 2-3 developers, could reduce to 6-8 weeks by executing parallel tasks simultaneously.

---

**Status**: Ready for execution
**Next Step**: Begin with T001 (Create backend directory structure)
