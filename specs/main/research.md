# Phase 0: Research & Decisions

**Date**: 2026-01-05
**Status**: Complete

This document records the technology stack and architectural decisions made during the planning phase.

## Technology Stack

Based on the feature specification and the initial user prompt, the following technology stack has been chosen:

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend API** | Node.js 18+ w/ TypeScript, Fastify | Fastify offers 2-3x better performance than Express with built-in schema validation via JSON Schema. Critical for handling 200k terms efficiently. Native async/await and better TypeScript support. |
| **Database** | MongoDB w/ Mongoose | The initial prompt specified a document database. MongoDB is a natural fit for the hierarchical and semi-structured nature of ethnobotanical data. Mongoose provides schema validation and relationship management. |
| **Frontend** | React 18+ w/ TypeScript | A powerful and popular library for building modern, responsive Single-Page Applications (SPAs) as required by the spec. React 18 concurrent features improve performance. |
| **Search** | Meilisearch | User prompt explicitly mentioned Meilisearch for improved search performance. Provides typo tolerance, faceted search, instant results, and better language support than MongoDB text search. Essential for 200k terms. |
| **Graph Visualization** | Cytoscape.js | Purpose-built for network graphs with better performance for 1000+ nodes. Built-in pan/zoom, graph algorithms, and hierarchical layouts. Preferred over D3.js for knowledge graphs. |
| **Authentication** | Passport.js w/ Google OAuth 2.0 | De facto standard for Node.js authentication. Handles OAuth complexity, supports JWT/session strategies. |
| **Testing** | Jest, Supertest, React Testing Library | Standard comprehensive testing suite for Node.js/React stack. mongodb-memory-server for isolated integration tests. |
| **Deployment** | Docker w/ Docker Compose | The initial prompt specified Docker deployment. Compose orchestrates backend, frontend, MongoDB, and Meilisearch services consistently across environments. |
| **CI/CD** | GitHub Actions | User prompt specified GitHub Actions for on-demand deployment. Automated testing, building, and deployment workflow. |

## Architectural Decisions

### Project Structure
- **Monorepo**: The project will be structured as a monorepo containing both the `backend` and `frontend` applications, plus `docker/` for container configs. This simplifies dependency management and enables shared TypeScript types.
- **API Paradigm**: RESTful API was chosen (clarified in Session 2025-10-15) for widespread adoption, simplicity, and compatibility. OpenAPI 3.0 specification for contract-first development.
- **Separation**: `backend/` and `frontend/` directories, each with `src/` and `tests/` folders. Clear separation of concerns with dedicated Docker containers.

### Data Modeling Strategy
- **Hybrid Relationship Model**: Term documents embed relationship arrays for fast traversal, plus separate Relationship collection for bidirectional queries and audit trails
- **Denormalized Search Index**: Meilisearch indexes flattened term data (all names, notes, collections) for instant search without joins
- **Optimistic Locking**: Version field (`__v`) in documents for conflict detection. Rare concurrent edits trigger merge-and-notify flow (per Session 2025-10-05 clarification)

### ANSI/NISO Z39.19 Compliance
- **Validation Middleware**: API-level enforcement of Z39.19 rules:
  - Reciprocal relationships (BT ↔ NT, RT ↔ RT, USE ↔ UF) - FR-030
  - Circular hierarchy prevention - FR-010
  - Authority control (one preferred term per concept) - FR-027
  - Homograph disambiguation with qualifiers - FR-028
- **Reference Implementation**: TemaTres-inspired patterns adapted for modern stack

### Security & Authorization
- **JWT-based Auth**: Google OAuth issues JWT tokens (24h expiration) stored in httpOnly cookies
- **RBAC Middleware**: Four roles (admin, researcher, student, community leader) with route-level guards
- **Private Notes**: Author + admin access only (per Session 2025-10-05 clarification)
- **API Security**: Rate limiting (100 req/min), Helmet.js security headers, CORS whitelist, input validation via JSON Schema

### Export Strategy
- **Phase 1: CSV** (prioritized in Session 2025-10-15): UTF-8, Z39.19 standard columns, pipe-separated relationships. Universal compatibility.
- **Future Phases**: SKOS (RDF/XML), Dublin Core, JSON-LD for semantic web interoperability

### Graph Visualization Approach
- **Initial View**: 2D interactive network diagram with pan/zoom (prioritized in Session 2025-10-15)
- **Performance**: Lazy loading (visible nodes only), level-of-detail rendering, max 1000 nodes per viewport
- **Layouts**: Force-directed (default), hierarchical (breadthfirst/dagre), radial for term-centric views
- **Interactions**: Click to expand relationships, hover for term preview, context menu for actions

### CARE Principles Implementation (FR-020)
Culturally sensitive workflows per GIDA-Global CARE framework (clarified in Session 2025-10-05):
- **Collective Benefit**: Attribution fields, export acknowledgment templates, usage analytics for contributors
- **Authority to Control**: Community leader role, private notes, opt-in API sharing
- **Responsibility**: Audit logs for traditional knowledge changes, source provenance tracking
- **Ethics**: Informed consent workflows, cultural sensitivity warnings, API access review

### Performance Optimization
- **Database Indexes**: Text search, relationship traversal, collection filtering, temporal queries
- **API Responses**: Pagination (50/page), field projection, relationship depth limits (3 levels)
- **Frontend**: Virtual scrolling for term lists, debounced search (300ms), React.memo for graph nodes
- **Future**: Redis caching for frequently accessed terms (deferred to post-MVP)

### Development Workflow
- **TDD Approach**: Contract tests (OpenAPI validation) → Integration tests → Unit tests → Implementation
- **Single Branch**: All commits to main (per CLAUDE.md project instruction)
- **Conventional Commits**: `feat:`, `fix:`, `test:`, `docs:` prefixes
- **Pre-commit Hooks**: Test execution, linting

### Deployment Architecture
**Docker Compose Services**:
1. `backend`: Fastify API (port 3000)
2. `frontend`: Nginx serving React build (port 80)
3. `mongodb`: Primary data store with named volume
4. `meilisearch`: Search engine with data persistence
5. `mongo-init`: One-shot container for index creation

**GitHub Actions Workflow**:
1. Run test suite (unit, integration, contract)
2. Build Docker images
3. Push to GitHub Container Registry
4. SSH deployment to target server
5. Smoke tests on deployed environment

## Key Technical References

- **ANSI/NISO Z39.19-2005**: https://www.niso.org/publications/ansiniso-z3919-2005-r2010
- **CARE Principles**: https://www.gida-global.org/care
- **TemaTres** (inspiration): https://vocabularyserver.com/
- **Fastify**: https://fastify.dev/
- **Meilisearch**: https://www.meilisearch.com/docs
- **Cytoscape.js**: https://js.cytoscape.org/
- **MongoDB Graph Patterns**: https://www.mongodb.com/developer/products/mongodb/mongodb-graph-databases/

## Open Questions: None

All technical clarifications resolved through specification clarifications (Sessions 2025-10-05, 2025-10-15) and this research phase.

**Status**: ✅ Research complete. Ready for Phase 1 (Design & Contracts).
