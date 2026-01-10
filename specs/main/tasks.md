# Tasks: Ethnobotanical Terms Database and Management System

**Feature**: EtnoTermos main
**Branch**: main
**Input**: Design documents from `/specs/main/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/openapi.yaml

**Generated**: 2026-01-05
**Updated**: 2026-01-06 (etnoDB integration)
**Status**: Ready for execution

## etnoDB Integration

**CRITICAL**: This system is visually and functionally integrated with etnoDB:
- **Shared Database**: MongoDB "etnodb" (collection "etnotermos")
- **Visual Identity**: Must match etnoDB's "forest" theme colors, fonts, and components exactly
- **Technology Stack**: HTMX + Alpine.js + Tailwind CSS + EJS (matching etnoDB)
- **Ports**: 4000 (public), 4001 (admin) - avoiding etnoDB's 3001/3002/3003
- **Controlled Vocabulary**: Manages terms for etnoDB fields (comunidades.tipo, plantas.tipoUso)

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

Based on plan.md project structure (etnoDB-compatible):
- Backend: `backend/src/`, `backend/tests/`
- Contexts: `backend/src/contexts/{public,admin}/`
- Views: `backend/src/contexts/{public,admin}/views/` (EJS templates)
- Frontend: `frontend/src/` (Tailwind CSS assets only)
- Shared Styles: `frontend/src/shared/styles/` (forest theme)
- Docker: `docker/`
- Config: `tailwind.config.js` (forest theme)

---

## Phase 3.1: Infrastructure & Setup

**Goal**: Establish project structure, dependencies, and development environment (etnoDB-compatible)

- [ ] **T001** [P] Create backend directory structure: `backend/src/{contexts/{public,admin},models,services,lib/{search,export,validation},shared,config}` and `backend/tests/{integration,unit}`

- [ ] **T002** [P] Initialize backend Node.js 20 LTS project, create `backend/package.json` with dependencies: express, ejs, mongodb (official driver), cors, helmet, dotenv, jest, supertest, mongodb-memory-server

- [ ] **T003** [P] Create frontend directory structure: `frontend/src/{public/styles,admin/styles,shared/styles}`

- [ ] **T004** [P] Initialize frontend with Tailwind CSS, create `frontend/package.json` with dependencies: tailwindcss, postcss, autoprefixer, tailwindcss-cli

- [ ] **T005** [P] Create Tailwind configuration in `tailwind.config.js`: define "forest" color theme matching etnoDB (forest-50 to forest-900), configure content paths for EJS templates

- [ ] **T006** [P] Create main Tailwind CSS file in `frontend/src/shared/styles/main.css`: import Tailwind directives, define base styles (body, headings), component classes (btn, btn-primary, card, form-input), using forest colors

- [ ] **T007** [P] Setup ESLint and Prettier for backend with consistent rules

- [ ] **T008** [P] Create Docker Compose configuration in `docker/docker-compose.yml` with services: etnotermos (Node 20 Alpine, ports 4000/4001), mongodb (volume mounted, database "etnodb")

- [ ] **T009** [P] Create Dockerfile in `docker/etnotermos.Dockerfile`: Node 20 alpine base, multi-stage build, install dependencies, build Tailwind CSS, copy backend code, expose ports 4000 and 4001, CMD to start both contexts

- [ ] **T010** [P] Create MongoDB initialization script in `backend/scripts/init-mongo.sh` for creating "etnodb" database and "etnotermos" collection with indexes

- [ ] **T011** [P] Create MongoDB index creation script in `backend/scripts/create-indexes.js` (will be populated in Phase 3.3)

- [ ] **T012** Create backend configuration management in `backend/src/config/index.js`: load environment variables (PUBLIC_PORT=4000, ADMIN_PORT=4001, MONGO_URI with database "etnodb"), validation, export config object

- [ ] **T013** Create MongoDB text search configuration in `backend/src/lib/search/config.js`: configure text indexes on "etnotermos" collection, search options, multilingual support

- [ ] **T014** Create MongoDB connection setup in `backend/src/shared/database.js`: MongoDB client connection to "etnodb" database, retry logic, connection event handlers, export db and collection references

- [ ] **T015** Create public context server in `backend/src/contexts/public/server.js`: initialize Express app, configure EJS views, setup CORS, serve static assets, register routes, start on port 4000

- [ ] **T016** Create admin context server in `backend/src/contexts/admin/server.js`: initialize Express app, configure EJS views, setup CORS, admin auth middleware, register routes, start on port 4001

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE IMPLEMENTATION

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation in Phase 3.3+**

### Contract Tests (OpenAPI Validation)

- [ ] **T017** [P] Setup OpenAPI validator in `backend/tests/contract/setup.ts`: load openapi.yaml, configure validator with supertest

- [ ] **T018** [P] Contract test for public GET /api/v1/terms (list) in `backend/tests/contract/public.terms.list.test.ts`: validate pagination params, response schema, 200 status

- [ ] **T019** [P] Contract test for public GET /api/v1/terms/:id in `backend/tests/contract/public.terms.get.test.ts`: validate term response schema, 404 for missing term

- [ ] **T020** [P] Contract test for admin POST /api/v1/terms in `backend/tests/contract/admin.terms.create.test.ts`: validate request body schema, 201 response with created term

- [ ] **T021** [P] Contract test for admin PUT /api/v1/terms/:id in `backend/tests/contract/admin.terms.update.test.ts`: validate update request, version conflict detection, 200 response

- [ ] **T022** [P] Contract test for admin DELETE /api/v1/terms/:id in `backend/tests/contract/admin.terms.delete.test.ts`: validate deletion, dependency warning response

- [ ] **T023** [P] Contract test for admin POST /api/v1/relationships in `backend/tests/contract/admin.relationships.create.test.ts`: validate relationship creation, reciprocal type generation

- [ ] **T024** [P] Contract test for public GET /api/v1/relationships/:termId in `backend/tests/contract/public.relationships.get.test.ts`: validate relationship queries by term

- [ ] **T025** [P] Contract test for admin POST /api/v1/notes in `backend/tests/contract/admin.notes.create.test.ts`: validate note creation with type validation

- [ ] **T026** [P] Contract test for public GET /api/v1/search in `backend/tests/contract/public.search.test.ts`: validate search query params, pagination, response format

- [ ] **T027** [P] Contract test for public GET /api/v1/export/csv in `backend/tests/contract/public.export.test.ts`: validate export query params, CSV response format

- [ ] **T028** [P] Contract test for admin GET /api/v1/admin/dashboard in `backend/tests/contract/admin.dashboard.test.ts`: validate access control, statistics response

### Integration Tests (Acceptance Scenarios)

- [ ] **T030** [P] Integration test for Acceptance Scenario 1 in `backend/tests/integration/scenario-01-create-term.test.ts`: Create term with definitions, cultural context, and bibliographic sources → Verify storage with metadata, sources, and relationship links

- [ ] **T031** [P] Integration test for Acceptance Scenario 2 in `backend/tests/integration/scenario-02-delete-warning.test.ts`: Attempt to delete parent term in hierarchy → Verify warning about dependent child terms and confirmation requirement

- [ ] **T032** [P] Integration test for Acceptance Scenario 3 in `backend/tests/integration/scenario-03-search.test.ts`: Search for plant name or usage context → Verify relevant terms returned with relationships and notes

- [ ] **T033** [P] Integration test for Acceptance Scenario 4 in `backend/tests/integration/scenario-04-relationships.test.ts`: Establish many-to-many relationships → Verify bidirectional connections navigable from both terms

- [ ] **T034** [P] Integration test for Acceptance Scenario 5 in `backend/tests/integration/scenario-05-notes.test.ts`: View term with multiple note types → Verify all note types organized and presented clearly

- [ ] **T035** [P] Integration test for Acceptance Scenario 6 in `backend/tests/integration/scenario-06-admin.test.ts`: Admin access to admin interface → Verify analytics dashboard and data management capabilities

- [ ] **T036** [P] Integration test for Acceptance Scenario 7 in `backend/tests/integration/scenario-07-export.test.ts`: Request data export → Verify CSV file generation with proper encoding and formatting

- [ ] **T037** [P] Integration test for Acceptance Scenario 8 in `backend/tests/integration/scenario-08-public-access.test.ts`: Public user accesses read-only interface → Verify data presentation and search capabilities

- [ ] **T038** [P] Integration test for Acceptance Scenario 9 in `backend/tests/integration/scenario-09-care-principles.test.ts`: Data entry with traditional knowledge → Verify proper attribution fields and cultural sensitivity guidelines

- [ ] **T039** [P] Integration test for Acceptance Scenario 10 in `backend/tests/integration/scenario-10-api-access.test.ts`: External system requests data via public API → Verify read-only access and data retrieval

- [ ] **T040** [P] Integration test for edge case: circular relationships in `backend/tests/integration/edge-case-01-circular-relationships.test.ts`: Attempt to create A→B→A hierarchy → Verify system prevents circular reference with clear error message

- [ ] **T041** [P] Integration test for edge case: bulk deletion in `backend/tests/integration/edge-case-02-bulk-deletion.test.ts`: Create term with 50 dependent relationships → Attempt bulk delete → Verify warning lists all dependencies and requires confirmation

- [ ] **T042** [P] Integration test for edge case: special characters in `backend/tests/integration/edge-case-03-special-chars.test.ts`: Create/search terms with diacritics (á, ã, ç), indigenous characters → Verify proper UTF-8 handling, search finds terms correctly

- [ ] **T043** [P] Integration test for edge case: duplicate terms in `backend/tests/integration/edge-case-04-duplicates.test.ts`: Import CSV with duplicate preferred terms → Verify conflict detection, resolution options presented

- [ ] **T044** [P] Integration test for edge case: source cascade in `backend/tests/integration/edge-case-05-source-cascade.test.ts`: Create source referenced by 20 terms → Attempt delete → Verify warning shows term count, requires confirmation or orphan handling

- [ ] **T045** [P] Integration test for edge case: admin auth in `backend/tests/integration/edge-case-06-admin-auth.test.ts`: Attempt admin operations without auth → Verify 401 responses, no data leakage in errors

---

## Phase 3.3: Data Models (ONLY after tests are failing)

**Goal**: Implement Mongoose schemas with ANSI/NISO Z39.19 validation

- [ ] **T046** [P] Implement Source model in `backend/src/models/Source.ts`: Mongoose schema with type enum (bibliographic, interview, field_notes, herbarium_sample), flexible fields object, timestamps, indexes on type

- [ ] **T047** [P] Implement Collection model in `backend/src/models/Collection.ts`: Mongoose schema with name (unique), description, timestamps

- [ ] **T048** [P] Implement Term model in `backend/src/models/Term.ts`: Mongoose schema with prefLabel (required), altLabels, hiddenLabels, definition, scopeNote, historyNote, example, qualifier, termType enum, status enum (active, deprecated, replaced), useFor refs, useTerm ref, replacedBy ref (for deprecated terms), deprecationNote, deprecationDate, facets object, sourceIds refs, collectionIds refs, version field for optimistic locking, timestamps, compound indexes, text index on names/definition

- [ ] **T049** [P] Implement Note model in `backend/src/models/Note.ts`: Mongoose schema with termId ref (required), type enum (scope, cataloger, historical, bibliographic, definition, example, private), content, sourceIds refs, timestamps, index on termId

- [ ] **T050** [P] Implement Relationship model in `backend/src/models/Relationship.ts`: Mongoose schema with sourceTermId ref (required), targetTermId ref (required), type enum (USE, UF, BT, NT, BTG, NTG, BTP, NTP, BTI, NTI, RT), reciprocalType (computed), isReciprocal boolean, timestamps, validatedAt, compound indexes on (sourceTermId, type), (targetTermId, type)

- [ ] **T051** [P] Implement AuditLog model in `backend/src/models/AuditLog.ts`: Mongoose schema with entityType (Term/Note/Relationship), entityId ref, action enum (create, update, delete), changes object, timestamp, metadata object, indexes on entityId and timestamp

- [ ] **T052** Update MongoDB index creation script `backend/scripts/create-indexes.ts`: programmatically create all indexes defined in models (including text search indexes), connection and error handling

---

## Phase 3.4: Business Logic Services

**Goal**: Implement core business logic with Z39.19 compliance and validation

- [ ] **T049** Create validation utilities in `backend/src/lib/validation/z39-19.ts`: functions for validating relationship reciprocity (BT↔NT, RT↔RT, USE↔UF), circular hierarchy detection, authority control (one preferred term per concept), homograph qualifier validation

- [ ] **T050** Create TermService in `backend/src/services/TermService.ts`: CRUD operations, validation using z39-19 utils, version checking for optimistic locking, merge logic for conflict resolution, audit log creation on changes

- [ ] **T051** Create RelationshipService in `backend/src/services/RelationshipService.ts`: create relationship with automatic reciprocal generation, validate reciprocity, prevent circular hierarchies, query relationships by term/type, update relationship validation status

- [ ] **T052** Create NoteService in `backend/src/services/NoteService.ts`: CRUD for notes, validate note type enum, associate with sources, query notes by term and type

- [ ] **T053** Create SourceService in `backend/src/services/SourceService.ts`: CRUD for sources, validate source type and fields structure, query sources by term usage

- [ ] **T054** Create CollectionService in `backend/src/services/CollectionService.ts`: CRUD for collections, manage term-collection associations, query terms by collection

- [ ] **T055** Create SearchService in `backend/src/services/SearchService.ts`: perform MongoDB text search with filters (collections, relationship types), return results with relevance ranking, support multilingual search

- [ ] **T056** Create ExportService in `backend/src/services/ExportService.ts`: export terms to CSV with UTF-8 encoding, Z39.19 standard columns (term_id, preferred_name, language, alternate_names, scope_note, definition, broader_terms, narrower_terms, related_terms, use_for, collections, sources, timestamps), pipe-separated relationships

- [ ] **T057** Create DashboardService in `backend/src/services/DashboardService.ts`: aggregate statistics (term counts by status, relationship type distribution, collection sizes), query recent changes from audit log

- [ ] **T058** Add term deprecation support to TermService in `backend/src/services/TermService.ts`: deprecateTerm method (set status=deprecated, record replacedBy term ID, create audit log), mergeTerms method (merge two terms, deprecate source, redirect relationships to target)

---

## Phase 3.5: API Middleware

**Goal**: Implement cross-cutting concerns (auth, validation, error handling)

- [ ] **T059** [P] Create admin access control middleware in `backend/src/api/middleware/adminAuth.ts`: verify API key or basic auth for admin API, handle unauthorized access with 401

- [ ] **T060** [P] Create validation middleware in `backend/src/api/middleware/validate.ts`: JSON Schema validation for request bodies, query params, path params using Fastify's built-in validator

- [ ] **T061** [P] Create error handling middleware in `backend/src/api/middleware/errorHandler.ts`: catch all errors, format error responses, log errors, distinguish between operational (4xx) and programmer (5xx) errors

- [ ] **T062** [P] Create rate limiting middleware in `backend/src/api/middleware/rateLimit.ts`: implement 100 requests/minute per IP, use in-memory store (Redis future enhancement), return 429 on limit exceeded

- [ ] **T063** [P] Create audit logging middleware in `backend/src/api/middleware/auditLog.ts`: intercept write operations (POST/PUT/DELETE) on admin API, extract changes, create audit log entries asynchronously

---

## Phase 3.6: API Routes & Controllers

**Goal**: Implement REST endpoints to satisfy contract tests (public + admin APIs)

### Public API (Read-Only)

- [ ] **T064** Create public terms router in `backend/src/api/public/terms.ts`: register read-only routes (GET /terms, GET /terms/:id), apply validation and rate limiting middleware

- [ ] **T065** Create public terms controller in `backend/src/api/controllers/PublicTermsController.ts`: listTerms (pagination, filtering), getTerm

- [ ] **T066** Create public relationships router in `backend/src/api/public/relationships.ts`: register route (GET /relationships/:termId)

- [ ] **T067** Create public relationships controller in `backend/src/api/controllers/PublicRelationshipsController.ts`: getRelationshipsByTerm

### Admin API (Full CRUD)

- [ ] **T068** Create admin terms router in `backend/src/api/admin/terms.ts`: register CRUD routes (POST /terms, PUT /terms/:id, DELETE /terms/:id), apply admin auth, validation and audit logging middleware

- [ ] **T069** Create admin terms controller in `backend/src/api/controllers/AdminTermsController.ts`: createTerm (validate, call TermService), updateTerm (optimistic locking, conflict handling), deleteTerm (check dependencies, warn if needed)

- [ ] **T070** Create admin relationships router in `backend/src/api/admin/relationships.ts`: register routes (POST /relationships, DELETE /relationships/:id)

- [ ] **T071** Create admin relationships controller in `backend/src/api/controllers/AdminRelationshipsController.ts`: createRelationship (validate, generate reciprocal, call RelationshipService), deleteRelationship (remove reciprocal)

- [ ] **T072** Create admin notes router in `backend/src/api/admin/notes.ts`: register routes (POST /notes, PUT /notes/:id, DELETE /notes/:id), apply admin auth

- [ ] **T073** Create admin notes controller in `backend/src/api/controllers/AdminNotesController.ts`: createNote, updateNote, deleteNote

- [ ] **T074** Create admin sources router in `backend/src/api/admin/sources.ts`: register CRUD routes, apply admin auth

- [ ] **T075** Create admin sources controller in `backend/src/api/controllers/AdminSourcesController.ts`: CRUD operations, check source usage before deletion

- [ ] **T076** Create admin collections router in `backend/src/api/admin/collections.ts`: register CRUD routes, apply admin auth

- [ ] **T077** Create admin collections controller in `backend/src/api/controllers/AdminCollectionsController.ts`: CRUD operations, get terms by collection

- [ ] **T078** Create public search router in `backend/src/api/public/search.ts`: register route (GET /search)

- [ ] **T079** Create public search controller in `backend/src/api/controllers/PublicSearchController.ts`: search terms using SearchService (MongoDB text search), apply pagination, filter by collections/types, return enriched results with relationship counts

- [ ] **T080** Create public export router in `backend/src/api/public/export.ts`: register routes (GET /export/csv, future: GET /export/skos, GET /export/rdf)

- [ ] **T081** Create public export controller in `backend/src/api/controllers/PublicExportController.ts`: exportCSV (query terms with filters, call ExportService, stream CSV response with proper headers)

- [ ] **T082** Create admin dashboard router in `backend/src/api/admin/dashboard.ts`: register routes (GET /admin/dashboard, GET /admin/audit-logs), apply admin auth

- [ ] **T083** Create admin dashboard controller in `backend/src/api/controllers/AdminDashboardController.ts`: getDashboard (call DashboardService), getAuditLogs (pagination, filtering)

- [ ] **T084** Create admin term deprecation routes in `backend/src/api/admin/terms.ts`: POST /terms/:id/deprecate (mark term as deprecated, specify replacement), POST /terms/:sourceId/merge/:targetId (merge two terms)

- [ ] **T085** Add deprecation methods to AdminTermsController in `backend/src/api/controllers/AdminTermsController.ts`: deprecateTerm (call TermService.deprecateTerm), mergeTerms (call TermService.mergeTerms, update all references)

- [ ] **T086** Create etnoDB integration routes in `backend/src/api/public/ethnodb.ts`: GET /ethnodb/validate/:termId (validate term exists and is active), GET /ethnodb/vocabulary/:field (get controlled vocabulary for etnoDB field - comunidades.tipo or plantas.tipoUso), GET /ethnodb/terms/search (query terms with filters for dropdown population)

- [ ] **T087** Create etnoDB integration controller in `backend/src/api/controllers/EtnoDBController.ts`: validateTerm (check term exists, not deprecated), getVocabulary (return terms for specific field with hierarchy), searchTerms (lightweight search for autocomplete)

- [ ] **T088** Integration test for etnoDB API in `backend/tests/integration/scenario-13-ethnodb-api.test.ts`: Query /ethnodb/vocabulary/comunidades.tipo → Verify 29 community types returned → Validate term existence → Verify term validation returns active status

- [ ] **T089** Register all routers in public and admin servers: `backend/src/server-public.ts` (terms, relationships, search, export, ethnodb) and `backend/src/server-admin.ts` (terms, relationships, notes, sources, collections, dashboard) under /api/v1 prefix

---

## Phase 3.7: Frontend Implementation (EJS Templates + HTMX)

**Goal**: Build server-side rendered pages with etnoDB visual identity

### Public Context Views (Port 4000 - Read-only)

- [ ] **T084** [P] Create public layout template in `backend/src/contexts/public/views/layout.ejs`: HTML structure, head with Tailwind CSS link, header with navigation (forest theme), main content area, footer, HTMX and Alpine.js scripts

- [ ] **T085** [P] Create public home page in `backend/src/contexts/public/views/index.ejs`: welcome message matching etnoDB style, search bar, quick stats cards (forest-600 accents), featured terms list

- [ ] **T086** [P] Create term list view in `backend/src/contexts/public/views/terms/list.ejs`: paginated term cards with forest theme, search filters using HTMX, infinite scroll or pagination controls, Alpine.js for filter dropdowns

- [ ] **T087** [P] Create term detail view in `backend/src/contexts/public/views/terms/detail.ejs`: full term display with tabs (notes, relationships, sources), Cytoscape graph visualization, breadcrumb navigation, forest color scheme

- [ ] **T088** [P] Create search page in `backend/src/contexts/public/views/search.ejs`: search bar with HTMX live search, advanced filters (collections, note types), results container updated via HTMX, highlight matching terms

- [ ] **T089** [P] Create graph visualization page in `backend/src/contexts/public/views/graph.ejs`: full-screen Cytoscape.js graph, pan/zoom controls using Alpine.js, layout selector, filter by relationship type, forest-themed nodes

- [ ] **T090** [P] Create partial for term card in `backend/src/contexts/public/views/partials/term-card.ejs`: reusable card component with forest styling, term name, definition snippet, relationship counts, HTMX link to detail page

### Admin Context Views (Port 4001 - Full CRUD)

- [ ] **T091** [P] Create admin layout template in `backend/src/contexts/admin/views/layout.ejs`: similar to public but with admin nav menu (Dashboard, Terms, Sources, Collections), admin-specific forest theme accents

- [ ] **T092** [P] Create admin dashboard in `backend/src/contexts/admin/views/dashboard.ejs`: statistics cards (forest-themed), term counts by status, recent changes table, chart placeholders (optional: Google Charts like etnoDB)

- [ ] **T093** [P] Create term management list in `backend/src/contexts/admin/views/terms/manage.ejs`: table with all terms, status badges (forest colors), HTMX edit/delete buttons, filter by status, "Create New Term" button

- [ ] **T094** [P] Create term form view in `backend/src/contexts/admin/views/terms/form.ejs`: comprehensive form matching etnoDB form styles, multi-language name inputs, note type textareas, source/collection multi-select, Z39.19 validation messages, HTMX form submission

- [ ] **T095** [P] Create relationship management view in `backend/src/contexts/admin/views/relationships/manage.ejs`: add/remove relationships, relationship type selector (BT/NT/RT etc.), validation display, HTMX updates

- [ ] **T096** [P] Create source management views in `backend/src/contexts/admin/views/sources/{list,form}.ejs`: source CRUD interface, citation format display, terms using source list

- [ ] **T097** [P] Create collection management views in `backend/src/contexts/admin/views/collections/{list,form}.ejs`: collection CRUD interface, terms in collection count, tag-like display with forest colors

### Shared Partials & Components

- [ ] **T098** [P] Create header partial in `backend/src/contexts/public/views/partials/header.ejs`: etnoDB-style navigation, logo area, search bar integration, consistent across public/admin

- [ ] **T099** [P] Create footer partial in `backend/src/contexts/public/views/partials/footer.ejs`: etnoDB-style footer with links, C.A.R.E. principles acknowledgment

- [ ] **T100** [P] Create loading indicator partial in `backend/src/contexts/public/views/partials/loading.ejs`: HTMX loading spinner with forest colors, reusable via hx-indicator

- [ ] **T101** [P] Create error message partial in `backend/src/contexts/public/views/partials/error.ejs`: forest-themed error display, used in HTMX error responses

### Alpine.js Components (Client-side Interactivity)

- [ ] **T102** [P] Create Alpine component for search filters in public pages: dropdown state management, filter application, HTMX trigger on filter change

- [ ] **T103** [P] Create Alpine component for graph controls: layout switching, zoom controls, relationship type filters

- [ ] **T104** [P] Create Alpine component for term form: dynamic note field addition, validation feedback, multi-select handling

- [ ] **T105** [P] Create admin deprecation UI in `backend/src/contexts/admin/views/terms/deprecate.ejs`: deprecate term form (select replacement term, add deprecation note), merge terms form (select source and target, preview relationship transfer), forest-themed confirmation dialogs

### Routes & Controllers

- [ ] **T106** Create public routes in `backend/src/contexts/public/routes/index.js`: GET / (home), GET /terms (list), GET /terms/:id (detail), GET /search, GET /graph, render EJS templates with data from services

- [ ] **T107** Create admin routes in `backend/src/contexts/admin/routes/index.js`: GET /dashboard, GET /terms/manage, GET /terms/new, POST /terms, GET /terms/:id/edit, PUT /terms/:id, DELETE /terms/:id, GET /terms/:id/deprecate, POST /terms/:id/deprecate, POST /terms/:sourceId/merge/:targetId, render EJS templates, handle HTMX responses

- [ ] **T108** Integration test for term deprecation in `backend/tests/integration/scenario-12-deprecation.test.ts`: Create term A and B → Deprecate A in favor of B → Verify A marked deprecated, replacedBy points to B, audit log created, deprecated term shown in search with warning

---

## Phase 3.8: Integration & Polish

**Goal**: Complete end-to-end functionality and optimize performance

- [X] **T111** Optimize MongoDB text search indexes in `backend/src/lib/search/optimize.js`: analyze query patterns, add compound indexes for common filters, configure index weights for relevance tuning

- [ ] **T112** Implement conflict resolution in `backend/src/services/TermService.js` updateTerm method: detect version mismatch, attempt three-way merge for disjoint fields, log conflicts, notify admin on merge failure

- [X] **T113** Add comprehensive logging in `backend/src/lib/logger.js`: Winston logger, structured JSON logs, log levels (debug, info, warn, error), include request IDs, sanitize sensitive data

- [ ] **T114** Implement CARE Principles features: Ensure attribution fields in Source model, add cultural sensitivity guidelines to admin interface documentation, create export acknowledgment templates

- [X] **T115** Create database seed script in `backend/scripts/seed.js`: populate with sample terms, relationships, sources, collections for testing and demonstration

- [X] **T116** Create controlled vocabulary seed script in `backend/scripts/seed-controlled-vocab.js`: populate comunidades.tipo with 29 community types from Brazilian Decree 8.750/2016 (povos indígenas, quilombolas, comunidades tradicionais, etc.), populate plantas.tipoUso with hierarchical use types (medicinal, alimentício, ritualístico, material, etc.), create appropriate relationships and collections

- [ ] **T117** Performance optimization: Add pagination cursor support to list endpoints, implement field projection for large responses, optimize MongoDB queries with explain analysis, add indexes based on slow query log

- [ ] **T118** Implement 200k term limit monitoring in DashboardService: add term count alert when approaching 180k terms (90% of limit), dashboard widget showing term count trend, optional email notification for admins

- [ ] **T119** Security audit: Enable Helmet.js security headers, configure CORS whitelist for frontend domain, implement CSRF protection for state-changing operations, sanitize user inputs, add security headers to Nginx config

- [X] **T120** Create health check endpoint in `backend/src/api/routes/health.js`: check MongoDB connection, memory usage, return 200 with status object

- [ ] **T121** Setup frontend environment configuration in `frontend/src/config.js`: API base URL from env vars, feature flags, build-time vs runtime config

- [ ] **T122** Optimize frontend bundle: code splitting by route, lazy load graph visualization component, tree-shaking, analyze bundle size, compression

- [X] **T123** [P] Implement CSV import parser in `backend/src/lib/import/csvParser.js`: parse CSV with headers (term_id, preferred_name, alternate_names, scope_note, broader_terms, narrower_terms, related_terms, use_for), validate required fields, handle UTF-8 encoding

- [ ] **T124** [P] Implement SKOS import parser in `backend/src/lib/import/skosParser.js`: parse SKOS RDF/XML format, map skos:prefLabel to prefLabel, skos:broader to BT relationships, skos:related to RT relationships (future enhancement, may defer)

- [X] **T125** Create ImportService in `backend/src/services/ImportService.js`: validate imported terms against Z39.19 rules, detect conflicts with existing terms (duplicate IDs, conflicting preferred terms), provide conflict resolution options (skip, overwrite, merge)

- [X] **T126** Create admin bulk import routes in `backend/src/api/admin/import.js`: POST /admin/import/upload (upload file), POST /admin/import/execute (execute import with conflict resolution), GET /admin/import/template (download template)

- [X] **T127** Create admin import controller in `backend/src/api/controllers/AdminImportController.js`: uploadAndPreview (multipart/form-data), executeImport (call ImportService validation), downloadTemplate, getImportHistory

- [X] **T128** Create admin import UI in `backend/src/contexts/admin/views/import/upload.ejs`: file upload form with forest theme, CSV format instructions, import preview table showing conflicts, conflict resolution options (skip/overwrite/merge), confirm button

- [ ] **T129** Integration test for bulk import in `backend/tests/integration/scenario-11-bulk-import.test.js`: Upload CSV with 50 terms → Validate parsing → Resolve conflicts → Verify terms created with correct relationships and audit logs

---

## Phase 3.9: Documentation & Deployment

**Goal**: Finalize documentation and deployment automation

- [ ] **T128** [P] Generate OpenAPI documentation in `backend/docs/openapi.yaml`: complete all endpoint schemas, request/response examples, authentication requirements, error codes

- [ ] **T129** [P] Create API documentation site: use Redoc or Swagger UI to render openapi.yaml, deploy to /api/docs endpoint

- [X] **T130** [P] Write developer quickstart in `README.md`: prerequisites, local setup with Docker Compose, running tests, environment variables, common issues, troubleshooting, and contribution guidelines

- [X] **T131** [P] Create deployment guide in `docs/deployment.md`: production Docker setup, environment configuration, SSL/TLS setup with Nginx, backup strategy, monitoring setup, security hardening, troubleshooting

- [ ] **T132** [P] Create GitHub Actions workflow in `.github/workflows/ci-cd.yml`: run tests on pull request, lint checks, build Docker images, push to GitHub Container Registry, deploy to staging on main branch push

- [ ] **T133** [P] Setup monitoring and alerting: configure logging aggregation (optional: ELK stack), setup application metrics (Prometheus), create alerting rules for errors and performance

- [ ] **T134** [P] Create user documentation in `docs/user-guide.md`: system overview, common workflows (create term, search, visualize graph, export data), role-specific guides (researcher, student, community leader, admin)

- [X] **T135** [P] Create CARE Principles compliance document in `docs/care-compliance.md`: document how system implements Collective Benefit, Authority to Control, Responsibility, and Ethics principles with detailed audit of each principle

- [ ] **T136** Run full integration test suite: execute all acceptance scenario tests (T030-T040, T127), verify all pass, generate test coverage report (target 80% overall)

- [ ] **T137** Run performance testing: load test with 50k terms, measure search response times (<500ms target), test graph rendering with 1000 nodes, verify pagination performance

- [ ] **T138** Security penetration testing: run OWASP ZAP or similar tool, test authentication bypass, SQL/NoSQL injection, XSS vulnerabilities, CSRF, rate limiting, fix any findings

- [ ] **T139** Validate quickstart.md: execute all curl commands in quickstart.md against running system, verify responses match documentation, update if needed

- [ ] **T140** Final cleanup: remove console.logs, unused imports, commented code, verify all TODOs resolved, run linter and fix issues, format code consistently

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

- [ ] All 156 tasks completed
- [ ] All contract tests pass (T017-T029)
- [ ] All integration tests pass (T030-T045 including edge cases, T088, T108, T129)
- [ ] All 13 acceptance scenarios + 6 edge cases validated (T136)
- [ ] Test coverage ≥80% (T136)
- [ ] Performance targets met: <500ms search, 1000 nodes rendered (T137)
- [ ] Security audit clean (T138)
- [ ] Quickstart validated (T139)
- [ ] Documentation complete (T128-T135)
- [ ] Docker Compose starts all services
- [ ] CI/CD pipeline passing (T132)

---

## Estimated Effort

**Total Tasks**: 156
**Estimated Duration**: 10-14 weeks (single developer)

**Breakdown by Phase**:
- Phase 3.1 (Infrastructure): 16 tasks, ~1 week
- Phase 3.2 (Tests): 30 tasks (+6 edge case tests), ~2.5 weeks
- Phase 3.3 (Models): 8 tasks (+1 for private note type fix), ~3 days
- Phase 3.4 (Services): 11 tasks (+1 for deprecation), ~1 week
- Phase 3.5 (Middleware): 6 tasks, ~2 days
- Phase 3.6 (API): 25 tasks (+2 deprecation, +3 etnoDB), ~2 weeks
- Phase 3.7 (Frontend): 30 tasks (+3 for deprecation UI), ~2.5 weeks
- Phase 3.8 (Integration): 19 tasks (+7 bulk import, +1 controlled vocab, +1 200k monitoring), ~2 weeks
- Phase 3.9 (Documentation): 13 tasks, ~1 week

**Parallelization potential**: With 2-3 developers, could reduce to 7-10 weeks by executing parallel tasks simultaneously.

---

**Status**: Ready for execution (Updated for all CRITICAL issues resolved)
**Next Step**: Begin with T001 (Create backend directory structure)

**Integration Notes**:
- All tasks updated to reflect HTMX+Alpine.js+EJS stack (matching etnoDB)
- Ports changed to 4000/4001 (avoiding etnoDB's 3001/3002/3003)
- Visual identity must match etnoDB's "forest" theme exactly
- Database "etnodb" shared, collection "etnotermos" separate
- New FR-034 through FR-040 added for etnoDB integration requirements
