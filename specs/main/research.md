# Phase 0: Research & Decisions

This document records the technology stack and architectural decisions made during the planning phase.

## Technology Stack

Based on the feature specification and the initial user prompt, the following technology stack has been chosen:

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend API** | Node.js w/ TypeScript, Express.js | A mature and widely-used stack for building REST APIs. TypeScript provides type safety, which is crucial for maintainability. |
| **Database** | MongoDB w/ Mongoose | The initial prompt specified a document database. MongoDB is a natural fit for the hierarchical and semi-structured nature of ethnobotanical data. Mongoose provides straightforward schema validation. |
| **Frontend** | React w/ TypeScript | A powerful and popular library for building modern, responsive Single-Page Applications (SPAs) as required by the spec. |
| **Search** | Meilisearch | The initial prompt suggested Meilisearch for its performance. It's a fast, open-source search engine that is easy to integrate. |
| **Testing** | Jest, Supertest, React Testing Library | A standard and comprehensive testing suite for a Node.js/React stack. |
| **Deployment** | Docker | The initial prompt specified Docker deployment, which provides consistency across development and production environments. |

## Architectural Decisions

- **Monorepo**: The project will be structured as a monorepo containing both the `backend` and `frontend` applications. This simplifies dependency management and cross-application imports.
- **API Paradigm**: A RESTful API was chosen for its widespread adoption, simplicity, and compatibility with a wide range of clients. This was clarified during the `/clarify` session.
- **Project Structure**: The project will be divided into `backend` and `frontend` directories, each with its own `src` and `tests` folders. This provides a clean separation of concerns.
