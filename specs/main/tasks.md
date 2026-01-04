# Implementation Tasks: Ethnobotanical Terms Database

This document breaks down the work required to implement the system based on the `plan.md`.

## Epic 1: Project Setup & Core Infrastructure

- [ ] 1.1: Initialize `backend` Node.js project with TypeScript.
- [ ] 1.2: Setup Express.js server and basic middleware (CORS, body-parser).
- [ ] 1.3: Configure MongoDB connection using Mongoose.
- [ ] 1.4: Implement Docker configuration (`Dockerfile`, `docker-compose.yml`) for the backend.
- [ ] 1.5: Initialize `frontend` React project with TypeScript.
- [ ] 1.6: Setup basic frontend structure (pages, components, services).


## Epic 3: Core Data Models

- [ ] 3.1: Create Source model/schema.
- [ ] 3.2: Create Collection model/schema.
- [ ] 3.3: Create Term model/schema.
- [ ] 3.4: Create Note model/schema.
- [ ] 3.5: Create Relationship model/schema.

## Epic 4: Term & Relationship Management API

- [ ] 4.1: Implement CRUD endpoints for `/terms` based on `openapi.yaml`.
- [ ] 4.2: Implement CRUD endpoints for `/relationships`.
- [ ] 4.3: Implement protection logic for deleting terms with dependents (FR-006).
- [ ] 4.4: Write integration tests for all new endpoints, following `quickstart.md` scenarios.

## Epic 5: Search Integration

- [ ] 5.1: Configure MongoDB text indexes on Term collection fields (prefLabel, altLabels, definition, scopeNote).
- [ ] 5.2: Create a `/search` endpoint that uses MongoDB text search with ranking and filtering.
- [ ] 5.3: Implement search result aggregation to include relationship data and source information.

## Epic 6: Frontend UI

- [ ] 6.1: Create a component to display a single term and its details.
- [ ] 6.2: Create a searchable, paginated list view for all terms.
- [ ] 6.3: Create forms for creating and editing terms.
- [ ] 6.4: Implement the interactive 2D graph visualization with Pan/Zoom (FR-012).

## Epic 7: Data Import/Export

- [ ] 7.1: Implement CSV export functionality (FR-008).
- [ ] 7.2: Implement bulk import functionality from a standard format (FR-013).