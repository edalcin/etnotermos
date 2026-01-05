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
| **Search** | MongoDB Text Search w/ Indexes | Native MongoDB text search with properly configured indexes provides adequate performance for 200k terms without additional infrastructure complexity. Supports multilingual search and field weighting. |
| **Graph Visualization** | Cytoscape.js | Purpose-built for network graphs with better performance for 1000+ nodes. Built-in pan/zoom, graph algorithms, and hierarchical layouts. Preferred over D3.js for knowledge graphs. |
| **Testing** | Jest, Supertest, React Testing Library | Standard comprehensive testing suite for Node.js/React stack. mongodb-memory-server for isolated integration tests. |
| **Deployment** | Docker w/ Docker Compose | The initial prompt specified Docker deployment. Compose orchestrates backend services (public API + admin API), frontend services (public + admin), and MongoDB consistently across environments. |
| **CI/CD** | GitHub Actions | User prompt specified GitHub Actions for on-demand deployment. Automated testing, building, and deployment workflow. |

## Architectural Decisions

### Project Structure
- **Monorepo**: The project will be structured as a monorepo containing both the `backend` and `frontend` applications, plus `docker/` for container configs. This simplifies dependency management and enables shared TypeScript types.
- **API Paradigm**: RESTful API was chosen (clarified in Session 2025-10-15) for widespread adoption, simplicity, and compatibility. OpenAPI 3.0 specification for contract-first development.
- **Dual-Port Architecture**: The system exposes two separate ports:
  - **Public Port (3000)**: Read-only access for data presentation, search, and visualization. No authentication required.
  - **Admin Port (3001)**: Full CRUD operations for data entry and curation. Protected by basic authentication or access control.
- **Separation**: `backend/` and `frontend/` directories, each with `src/` and `tests/` folders. Clear separation of concerns with dedicated Docker containers for public and admin interfaces.

### Data Modeling Strategy
- **Hybrid Relationship Model**: Term documents embed relationship arrays for fast traversal, plus separate Relationship collection for bidirectional queries and audit trails
- **MongoDB Text Indexes**: Text indexes on term names, definitions, and notes for fast full-text search without additional infrastructure
- **Optimistic Locking**: Version field (`__v`) in documents for conflict detection. Rare concurrent edits trigger merge-and-notify flow (per Session 2025-10-05 clarification)

### ANSI/NISO Z39.19 Compliance
- **Validation Middleware**: API-level enforcement of Z39.19 rules:
  - Reciprocal relationships (BT ↔ NT, RT ↔ RT, USE ↔ UF) - FR-030
  - Circular hierarchy prevention - FR-010
  - Authority control (one preferred term per concept) - FR-027
  - Homograph disambiguation with qualifiers - FR-028
- **Reference Implementation**: TemaTres-inspired patterns adapted for modern stack

### Security & Authorization
- **No Authentication Required**: Public interface (port 3000) is read-only and open to all
- **Admin Access Control**: Admin interface (port 3001) protected by basic authentication or network-level access control
- **API Security**: Rate limiting (100 req/min), Helmet.js security headers, CORS configuration, input validation via JSON Schema

### Export Strategy
- **Phase 1: CSV** (prioritized in Session 2025-10-15): UTF-8, Z39.19 standard columns, pipe-separated relationships. Universal compatibility.
- **Future Phases**: SKOS (RDF/XML), Dublin Core, JSON-LD for semantic web interoperability

### Graph Visualization Approach
- **Initial View**: 2D interactive network diagram with pan/zoom (prioritized in Session 2025-10-15)
- **Performance**: Lazy loading (visible nodes only), level-of-detail rendering, max 1000 nodes per viewport
- **Layouts**: Force-directed (default), hierarchical (breadthfirst/dagre), radial for term-centric views
- **Interactions**: Click to expand relationships, hover for term preview, context menu for actions

### CARE Principles Implementation (FR-020)
Culturally sensitive data management per GIDA-Global CARE framework:
- **Collective Benefit**: Attribution fields in source metadata, export acknowledgment templates
- **Responsibility**: Audit logs for all data changes, source provenance tracking
- **Ethics**: Cultural sensitivity guidelines in admin interface documentation

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
1. `backend-public`: Fastify API for public access (port 3000, read-only endpoints)
2. `backend-admin`: Fastify API for admin access (port 3001, full CRUD operations)
3. `frontend-public`: Nginx serving public React build (port 80)
4. `frontend-admin`: Nginx serving admin React build (port 8080)
5. `mongodb`: Primary data store with named volume
6. `mongo-init`: One-shot container for index creation

**GitHub Actions Workflow**:
1. Run test suite (unit, integration, contract)
2. Build Docker images for all services
3. Push to GitHub Container Registry
4. SSH deployment to target server
5. Smoke tests on deployed environment

## Key Technical References

- **ANSI/NISO Z39.19-2005**: https://www.niso.org/publications/ansiniso-z3919-2005-r2010
- **CARE Principles**: https://www.gida-global.org/care
- **TemaTres** (inspiration): https://vocabularyserver.com/
- **Fastify**: https://fastify.dev/
- **MongoDB Text Search**: https://www.mongodb.com/docs/manual/text-search/
- **Cytoscape.js**: https://js.cytoscape.org/
- **MongoDB Graph Patterns**: https://www.mongodb.com/developer/products/mongodb/mongodb-graph-databases/

## Open Questions: None

All technical clarifications resolved through specification clarifications (Sessions 2025-10-05, 2025-10-15) and this research phase.

**Status**: ✅ Research complete. Ready for Phase 1 (Design & Contracts).
