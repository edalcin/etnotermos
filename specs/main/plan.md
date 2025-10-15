# Implementation Plan: Ethnobotanical Terms Database and Management System

**Branch**: `main` | **Date**: 2025-10-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/main/spec.md`

## Execution Flow (/plan command scope)

This plan follows the execution flow defined in the template. It will populate the technical context, generate design artifacts for Phase 0 and 1, and outline the approach for Phase 2.

## Summary

As an ethnobotanical researcher, student, or traditional community leader, I need a system to catalog, organize, and explore ethnobotanical terminology. The system should support interconnected vocabularies, powerful search, secure access via Google, role-based permissions, data export in standard formats, and an API for integration.

## Technical Context

**Language/Version**: Backend: Node.js (LTS) w/ TypeScript | Frontend: TypeScript
**Primary Dependencies**: Backend: Express.js, Mongoose | Frontend: React, Material-UI | Search: Meilisearch
**Storage**: MongoDB
**Testing**: Jest, Supertest (for API), React Testing Library
**Target Platform**: Docker container on a Linux environment, deployed via GitHub Actions.
**Project Type**: Web Application (Backend API + Frontend SPA)
**Performance Goals**: User deferred performance targets for now. The system should feel responsive for a small concurrent user base.
**Constraints**: The user base will have a small number of concurrent users who will "almost never" edit simultaneously.
**Scale/Scope**: The database will support up to 200,000 terms.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Simplicity**: The proposed tech stack is standard and well-documented, avoiding unnecessary complexity.
- **Test-First**: The plan includes generating contract tests and defining a quickstart guide based on user scenarios, enabling a TDD approach.
- **API First**: The design process prioritizes creating an OpenAPI contract before implementation.
- **Clarity**: The spec has been refined through a clarification session, reducing ambiguity.

**Result**: PASS

## Project Structure

### Documentation (this feature)

```
specs/main/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── openapi.yaml
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

**Structure Decision**: The project will be a monorepo with a `backend` and `frontend` directory. This structure clearly separates the two main components while keeping them in a single repository for easier management.

```
/
├── backend/
│   ├── src/
│   │   ├── api/         # Express routes and controllers
│   │   ├── models/      # Mongoose schemas
│   │   ├── services/    # Business logic
│   │   └── config/      # Environment variables, etc.
│   └── tests/
│       ├── integration/
│       └── unit/
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── pages/       # Top-level page components
│   │   ├── services/    # API client
│   │   └── hooks/       # Custom React hooks
│   └── tests/
└── docs/
    └── openapi.yaml     # A copy or symlink to the contract for documentation
```

## Phase 0: Outline & Research

The primary unknowns revolved around the technology stack. This has been addressed in the "Technical Context" section. The choices (Node.js, React, MongoDB) are based on the need for a modern, clean interface, Docker deployment, and the nature of the data (document-based).

**Output**: `research.md` will be generated to document these decisions.

## Phase 1: Design & Contracts

*Prerequisites: research.md complete*

1.  **Data Model**: Entities from `spec.md` will be translated into detailed JSON Schemas in `data-model.md`.
2.  **API Contracts**: Key API endpoints based on functional requirements will be defined in `contracts/openapi.yaml`.
3.  **Quickstart Guide**: A `quickstart.md` will be created with `curl` commands to demonstrate and test the primary user scenario via the API.

**Output**: `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

## Phase 2: Task Planning Approach

*This section describes what the /tasks command will do.*

**Task Generation Strategy**:
- Generate tasks from the OpenAPI specification for endpoint and controller creation.
- Generate tasks from `data-model.md` for Mongoose schema creation.
- Generate tasks from `quickstart.md` for creating integration tests.
- Group tasks by epic (e.g., "Term Management", "User Authentication", "Search").

**Ordering Strategy**:
1.  Setup backend project structure, dependencies, and DB connection.
2.  Implement User model and authentication endpoints.
3.  Implement `Source` and `Collection` models.
4.  Implement `Term` model and core CRUD endpoints.
5.  Implement frontend project structure.
6.  Implement user login UI.
7.  Implement term display and search UI.

## Progress Tracking

- [ ] Phase 0: Research complete
- [ ] Phase 1: Design complete
- [ ] Phase 2: Task planning complete
- [ ] Phase 3: Tasks generated
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [X] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PENDING
- [X] All critical NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented: NONE