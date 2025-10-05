# Phase 0: Research & Discovery

This document summarizes the initial research and key technical decisions based on the feature specification.

## 1. Vocabulary and Data Standards

- **SKOS (Simple Knowledge Organization System)**: This is the primary standard to follow for representing the thesaurus structure. It provides a model for expressing the relationships between terms (broader, narrower, related). Our data model will be heavily influenced by SKOS concepts.
- **Dublin Core**: To be used for metadata attached to terms and other resources, ensuring interoperability.
- **RDF (Resource Description Framework)**: The export functionality will support RDF, which is the underlying data model for SKOS.
- **CSV**: A simple and universally supported format for data export, useful for users who want to work with the data in spreadsheets.

## 2. Database Technology

- **MongoDB**: The specification requires MongoDB. A document-based model is a good fit for the semi-structured nature of the vocabulary data. We will use nested documents and references to model the relationships between entities.
- **Meilisearch**: The spec suggests Meilisearch for performance. This is a good choice for providing fast, typo-tolerant search. We will need to implement a mechanism to keep the Meilisearch index synchronized with the MongoDB database.

## 3. Graph Visualization

- **2D Interactive Graph**: The clarification process confirmed the need for an interactive graph. We will use a JavaScript library like [D3.js](https://d3js.org/), [vis.js](https://visjs.org/), or [Cytoscape.js](https://js.cytoscape.org/) to render the graph of term relationships. The choice of library will be finalized based on a quick prototype during implementation.

## 4. Authentication

- **Google OAuth**: The requirement is to use Google for authentication. We will use a library like `passport.js` (if using Node.js/Express) to handle the OAuth 2.0 flow.

## 5. Cultural Sensitivity & Data Governance

- **CARE Principles for Indigenous Data Governance**: The clarification process identified the CARE principles as the framework for ensuring cultural sensitivity. This has several implications for the design:
    - **Collective Benefit**: The system should be designed to be useful for the communities providing the knowledge, not just for researchers.
    - **Authority to Control**: The roles and permissions system must be designed to give communities control over their data. The "private" notes feature is a first step in this direction.
    - **Responsibility**: The system must be transparent about how data is used. The audit log feature will be important here.
    - **Ethics**: The well-being of the communities must be a primary concern. This will influence UI/UX design choices.

## 6. Hosting and Deployment

- **Docker**: The application will be containerized using Docker. This will simplify deployment and ensure a consistent environment.
- **GitHub Actions**: The spec mentions deployment on demand via GitHub Actions. We will create a workflow that builds the Docker image and deploys it.

This research provides the foundation for the system design and task decomposition in the following phases.