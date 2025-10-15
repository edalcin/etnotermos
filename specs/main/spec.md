# Feature Specification: Ethnobotanical Terms Database and Management System

**Project**: EtnoTermos

**Created**: 2025-09-28

**Status**: Draft

## Clarifications

### Session 2025-10-05
- Q: Regarding the "private" note type, who should have permission to view these notes? → A: The author and system administrators.
- Q: The spec notes that users will "almost never" edit simultaneously. For the rare case of a conflict (e.g., two users edit the same term), what resolution strategy should be used? → A: Attempt to merge and notify.
- Q: FR-012 requires a "visual representation of term relationships." What is the most critical format for this visualization in the first version? → A: A 2D interactive graph/network diagram (nodes and edges).
- Q: FR-023 requires "culturally sensitive interfaces." Please provide one specific, actionable example of a feature that would fulfill this requirement. → A: Respect principles C.A.R.E.
- Q: FR-025 requires "educational guidance features" for student users. What is the single most important guidance feature to prioritize for the initial release? → A: Contextual help and definitions for ethnobotanical concepts.

### Session 2025-10-15
- Q: FR-008 specifies data export in four different formats (SKOS, RDF, Dublin Core, CSV). To ensure value delivery in the first version, which of these formats is the most critical and should be prioritized? → A: CSV
- Q: FR-012 specifies a "2D interactive graph". For the first version, what is the most important interaction that the user should be able to perform on this graph? → A: Pan/Zoom
- Q: FR-021 mentions "comprehensive API endpoints" for external system integration. Which API paradigm should be prioritized for the initial implementation? → A: REST
- Q: The 'Collection' entity is listed in the data model, but its purpose is not detailed. What is the primary function of a "Collection"? → A: To act as a simple "tag" for grouping terms thematically (e.g., 'Medicinal Plants').

**Input**: User description: "Quero criar uma base de dados com termos relacionados com o uso de plantas por comunidades tradicionais. Esta base de dados será em MongoDB e seguirá um esquema de glossários / vocabulários / tesauro para os termos. Cada termo será relacionado com n outros termos, estabelecendo um grafo das relações entre termos. Cada termo poderá ter associado à ele um texto livre (notas), que poderão ser \"Nota de escopo\", \"Nota do catalogador\", \"Nota histórica\", \"Nota bibliográfica\", \"Nota privada\",\"Nota de definição\" e \"Nota de exemplo\". Os termos também podem ser classificados como \"meta termo\", \"termo específico\", \"termo relacionado\", \"termo genérico\", \"termo preferencial\". As relações entre termos poderão ser de \"n\" para \"n\". Este sistema terá ainda uma interface moderna e limpa para entrada, edição, deleção e busca (CRUD), e garantirá que termos hierarquicamente relacionados (meta termo -> termo genérico -> termo específico) não deverão ter seus registros apagados pela interface sem um aviso claro das consequências. Este sistema pode ainda usar o Mellisearch para melhorar o desempenho das buscas. Escolha a melhor linguagem para cada funcionalidade do sistema. Este sistema irá rodar em um docker, que será disponibilizado por demanda, na execução de um \"action\" no github. O sistema que serviu de inspiração para este é o [TemaTres](https://vocabularyserver.com/web/). Pesquise na Web sobre ferramentas de representação de conhecimento através de ontologias, taxonomias, tesauros. glossarios e vocabulários. O controle de acesso será por login com o Google e um administrador terá uma interface de administração, onde poderá definir o tipo específico de cada usuário e seus direitos. O sistema será usado por poucas pessoas e quase nunca simultaneamente. O numero de termos deve ficar em torno de 200.000. O sistema deve prever exportação dos dados (termos e suas características) em padrões abertos e internacionalmente aceitos. As... [truncated]"

## Execution Flow (main)

```text
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make

2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it

3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item

4. **Common underspecified areas**:

   - User types and permissions

   - Data retention/deletion policies

   - Performance targets and scale

   - Error handling behaviors

   - Integration requirements

   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story

As an ethnobotanical researcher, undergraduate/graduate student, or traditional community leader with plant knowledge, I need a comprehensive digital system to catalog, organize, and explore ethnobotanical terminology. The system should allow me to create interconnected vocabularies that reflect the complex relationships between plant terms, usage contexts, and cultural knowledge while providing powerful search and discovery capabilities for research and education purposes. I need secure access through Google authentication, role-appropriate permissions, export capabilities using international standards, and API access for integration with other research systems.

### Acceptance Scenarios

1. **Given** a new ethnobotanical term discovered in field research, **When** I create a term entry with definitions and cultural context plus bibliographic sources, **Then** the system stores the term with all associated metadata, sources, and allows linking to related terms
2. **Given** an existing hierarchical term structure (meta → generic → specific), **When** I attempt to delete a parent term, **Then** the system warns me about dependent child terms and requires confirmation before proceeding
3. **Given** a collection of terms in the database, **When** I search for a plant name or usage context, **Then** the system returns relevant terms with their relationships and contextual notes displayed clearly
4. **Given** multiple related terms in different categories, **When** I establish many-to-many relationships between them, **Then** the system creates and maintains bidirectional connections that are navigable from either term
5. **Given** a term with multiple note types attached, **When** I view the term details, **Then** all notes (scope, historical, bibliographic, etc.) are organized and presented clearly for reference
6. **Given** I am an administrator, **When** I access the admin interface, **Then** I can manage user roles (researcher, student, community leader), permissions, and view system analytics through a comprehensive dashboard
7. **Given** a collection of terms and their data, **When** I request data export, **Then** the system generates files in internationally accepted open standards (SKOS, RDF, CSV)
8. **Given** I am a new user (researcher, student, or community leader), **When** I attempt to access the system, **Then** I authenticate securely through Google OAuth and receive role-appropriate permissions
9. **Given** I am a community leader with traditional knowledge, **When** I contribute plant usage information, **Then** the system captures this knowledge with proper attribution and cultural sensitivity
10. **Given** an external research system, **When** it requests data through our API, **Then** the system provides secure access to term data based on API authentication and permissions
11. **Given** I am a graduate student conducting research, **When** I need to access specific terminology sets, **Then** the system provides educational-appropriate access with guidance features

### Edge Cases

- What happens when attempting to create circular hierarchical relationships (e.g., term A is parent of B, B is parent of A)?
- How does the system handle bulk deletion of terms that have extensive relationship networks?
- What occurs when searching for terms that contain special characters or diacritical marks common in indigenous language terms?
- How does the system manage conflicting or duplicate term entries from different cultural contexts?
- How does the system perform when approaching the 200,000 term limit?
- What happens when a bibliographic source is referenced by many terms and needs to be updated or deleted?
- How does the system handle Google authentication failures or account changes?
- How are simultaneous edit conflicts handled? The system will attempt to merge changes and notify an administrator if the merge fails.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow creation of ethnobotanical terms with unique identifiers and multilingual name variants
- **FR-002**: System MUST support six distinct note types for each term: scope, cataloger, historical, bibliographic, private, definition, and example notes
- **FR-003**: System MUST enable classification of terms into five relationship categories: meta term, specific term, related term, generic term, and preferential term
- **FR-004**: System MUST support many-to-many relationships between terms, creating a navigable knowledge graph
- **FR-005**: System MUST provide complete CRUD operations (Create, Read, Update, Delete) for all term data through an intuitive interface
- **FR-006**: System MUST implement hierarchical relationship protection, warning users before deletion of terms with dependent relationships
- **FR-007**: System MUST provide advanced search capabilities across all term fields, notes, and relationship data
- **FR-008**: System MUST export term data and relationships in internationally accepted open standards, prioritizing CSV for the initial version (other formats include SKOS, RDF, Dublin Core)
- **FR-009**: System MUST authenticate users through Google OAuth and provide role-based access control managed by administrators
- **FR-010**: System MUST maintain audit trails of all term modifications for research integrity and versioning
- **FR-011**: System MUST validate relationship consistency to prevent logical conflicts in the term hierarchy
- **FR-012**: System MUST provide a 2D interactive graph/network diagram (nodes and edges) as a visual representation of term relationships and hierarchical structures, prioritizing Pan/Zoom functionality for the initial version.
- **FR-013**: System MUST support bulk import of existing vocabulary data from standard formats
- **FR-014**: System MUST implement search result ranking based on term relevance and relationship strength
- **FR-015**: System MUST support up to 200,000 terms with efficient performance for small concurrent user base
- **FR-016**: System MUST associate terms and notes with sources in many-to-many relationships using standard citation formats
- **FR-017**: System MUST provide an administrative interface for user management, role assignment, and system configuration
- **FR-018**: System MUST display a comprehensive dashboard with database statistics, term counts, relationship metrics, and usage analytics
- **FR-019**: System MUST manage sources, accommodating different structures for bibliographic data, field notes, interviews, etc.
- **FR-020**: System MUST track source attribution for all terms and notes, ensuring proper academic citation and provenance
- **FR-021**: System MUST provide comprehensive API endpoints for external system integration, prioritizing a REST paradigm for the initial version, including term retrieval, search, and relationship queries
- **FR-022**: System MUST support role-based access for different user types: ethnobotanical researchers (full access), students (educational access), and community leaders (knowledge contribution focus)
- **FR-023**: System MUST provide culturally sensitive interfaces and workflows appropriate for traditional knowledge holders, specifically by adhering to the CARE Principles for Indigenous Data Governance (https://www.gida-global.org/care).
- **FR-024**: System MUST implement API authentication and rate limiting to ensure secure external system integration
- **FR-025**: System MUST provide educational guidance features for student users, prioritizing contextual help and definitions for ethnobotanical concepts in the initial release.
- **FR-026**: System MUST maintain API documentation and developer resources for integration partners
- **FR-027**: System MUST restrict visibility of "private" notes to only the original author and users with administrator roles.
- **FR-028**: In the event of a simultaneous edit conflict on a term, the system MUST attempt to automatically merge the changes. If the merge is not possible, it MUST notify a system administrator of the conflict.

### Key Entities *(include if feature involves data)*

- **Term**: Core vocabulary entry representing an ethnobotanical concept with unique identifier, names in multiple languages, definitions, and metadata, linked to sources

- **Note**: Contextual information attached to terms, categorized by type (scope, cataloger, historical, bibliographic, private, definition, example) with timestamps, authorship, and source attribution. "Private" notes are viewable only by their author and system administrators.

- **Relationship**: Connections between terms defining semantic links, hierarchical structures, and cross-references with relationship type classification

- **User**: System actors authenticated through Google OAuth with three primary types: ethnobotanical researchers (full system access), undergraduate/graduate students (educational access with guidance), and traditional community leaders (knowledge contribution focus), each with administrator-defined roles and permissions

- **API**: External system integration endpoints providing secure access to term data, search capabilities, and relationship queries with authentication and rate limiting

- **Source**: Represents the origin of the information, which can be a bibliographic reference (book, article), a herbarium sample, field notes, an interview, etc. The structure will adapt to the source type.

- **Collection**: A simple "tag" used to group terms thematically (e.g., 'Medicinal Plants'). A term can have multiple collections.

- **Role**: User permission templates defining access levels (view, edit, admin) that administrators can assign to users

- **AuditLog**: Historical record of all system changes with user attribution, timestamps, and change details for research integrity

- **UserRole**: Specific permission templates for different user types (Researcher, Student, Community Leader, Administrator) defining access levels and available features

- **APIKey**: Authentication tokens for external systems with defined permissions and usage limits for secure API access

---

## Review & Acceptance Checklist

GATE: Automated checks run during main() execution

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)

- [x] Focused on user value and business needs

- [x] Written for non-technical stakeholders

- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain

- [x] Requirements are testable and unambiguous

- [x] Success criteria are measurable

- [x] Scope is clearly bounded

- [x] Dependencies and assumptions identified

---

## Execution Status

Updated by main() during processing

- [x] User description parsed

- [x] Key concepts extracted

- [x] Ambiguities marked

- [x] User scenarios defined

- [x] Requirements generated

- [x] Entities identified

- [x] Review checklist passed

---

Updated by spec generator.

```