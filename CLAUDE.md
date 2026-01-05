# etnotermos Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-05

## Active Technologies
- **Backend**: Node.js 18+ with TypeScript, Fastify for REST API, MongoDB with Mongoose ODM
- **Frontend**: React 18+ with TypeScript (dual apps: public read-only + admin CRUD)
- **Database**: MongoDB (primary data store with text search indexes)
- **Graph Visualization**: Cytoscape.js
- **Testing**: Jest, Supertest, React Testing Library
- **Deployment**: Docker Compose (dual-port architecture)

## Architecture

**Dual-Port System**:
- **Public Interface** (port 3000): Read-only API and frontend for data presentation, search, and visualization. No authentication required.
- **Admin Interface** (port 3001): Full CRUD API and frontend for data entry and curation. Access control required.

## Project Structure

```
backend/
├── src/
│   ├── models/              # MongoDB schemas (Term, Note, Relationship, Source, Collection, AuditLog)
│   ├── services/            # Business logic (term, relationship, search, export services)
│   ├── api/
│   │   ├── public/          # Public API routes (read-only)
│   │   ├── admin/           # Admin API routes (full CRUD)
│   │   ├── middleware/      # Validation, error handling, rate limiting, access control
│   │   └── controllers/     # Request/response handling
│   ├── lib/
│   │   ├── search/          # MongoDB text search utilities
│   │   ├── export/          # CSV/SKOS/RDF exporters
│   │   └── validation/      # Z39.19 compliance validators
│   └── config/              # Configuration management
├── tests/
│   ├── contract/            # OpenAPI contract tests
│   ├── integration/         # End-to-end API tests
│   └── unit/                # Service/model unit tests
└── scripts/                 # Database initialization and seeding

frontend/
├── public/                  # Public-facing application (read-only)
│   ├── components/          # Term display, graph, search components
│   ├── pages/               # Public pages
│   ├── services/            # Public API client
│   └── hooks/               # React hooks
├── admin/                   # Admin application (full CRUD)
│   ├── components/          # Term CRUD forms, dashboard
│   ├── pages/               # Admin pages
│   ├── services/            # Admin API client
│   └── hooks/               # Admin-specific hooks
├── shared/                  # Shared assets and utilities
└── tests/                   # Component and integration tests

docker/
├── backend-public.Dockerfile
├── backend-admin.Dockerfile
├── frontend-public.Dockerfile
├── frontend-admin.Dockerfile
└── docker-compose.yml
```

## Commands

### Development
```bash
# Backend
cd backend
npm install
npm run dev:public    # Start public API (port 3000)
npm run dev:admin     # Start admin API (port 3001)
npm test

# Frontend
cd frontend
npm install
npm run dev:public    # Start public app (port 80)
npm run dev:admin     # Start admin app (port 8080)
npm test
```

### Docker
```bash
docker-compose up -d    # Start all services
docker-compose down     # Stop all services
```

## Code Style

- **TypeScript**: Strict mode, ES2022 target
- **Linting**: ESLint with standard conventions
- **Formatting**: Prettier
- **Testing**: TDD approach - write tests before implementation

## Key Principles

1. **ANSI/NISO Z39.19-2005 Compliance**: All term management follows controlled vocabulary standards
2. **Separation of Concerns**: Public read-only access vs admin full CRUD access
3. **No Authentication for Public**: Public interface is completely open
4. **Admin Access Control**: Admin interface protected by API key or basic auth
5. **CARE Principles**: Culturally sensitive data management for traditional knowledge
6. **Test-Driven Development**: Contract tests → Integration tests → Unit tests → Implementation

## Recent Changes
- 2026-01-05: Updated architecture to dual-port system (public + admin)
- 2026-01-05: Removed Meilisearch dependency in favor of MongoDB text search
- 2026-01-05: Removed Google OAuth in favor of simple admin access control
- 2025-09-28: Initial project structure with Node.js 18+, React 18+, MongoDB

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
