<!--
Sync Impact Report:
Version: 1.0.0 (initial ratification)
Modified Principles: N/A (initial creation)
Added Sections: All core principles (I-V), Quality Standards, Development Workflow, Governance
Removed Sections: Template placeholders
Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check section will reference these principles
  ✅ spec-template.md - No changes needed (principles already implicit in guidelines)
  ✅ tasks-template.md - TDD principles already aligned
Follow-up TODOs: None
-->

# EtnoTermos Constitution

## Core Principles

### I. Test-First Development (NON-NEGOTIABLE)

**Mandatory TDD cycle**: All implementation MUST follow Red-Green-Refactor strictly enforced.

- Contract tests and integration tests MUST be written first and MUST fail before any implementation
- Tests define the contract - implementation satisfies the contract
- No code may be written without a failing test that requires it
- Test coverage MUST be ≥80% for services, models, and API routes
- Exception: Infrastructure setup tasks (Docker, config files) may precede tests

**Rationale**: EtnoTermos manages controlled vocabulary for research integrity. Untested code risks data corruption, relationship inconsistencies, and Z39.19 compliance violations that undermine scientific credibility.

### II. Standards Compliance (ANSI/NISO Z39.19-2005)

**Z39.19 compliance is non-negotiable** for all vocabulary management features.

- Term selection, form, and relationships MUST follow Z39.19 Sections 6, 7, and 8
- Relationship reciprocity (BT↔NT, RT↔RT, USE↔UF) MUST be automatically enforced
- Authority control MUST prevent multiple preferred terms for same concept
- Scope notes and definitions MUST follow Z39.19 Section 10 guidelines
- Vocabulary display MUST support alphabetical and hierarchical formats (Z39.19 Section 11)

**Validation gates**:
- Data model design MUST map to Z39.19 relationship types
- Service layer MUST implement validation utilities for Z39.19 rules
- User interface MUST guide users toward Z39.19-compliant term creation

**Rationale**: Z39.19 compliance ensures interoperability with library systems, professional credibility, and long-term vocabulary sustainability. Non-compliance renders the system incompatible with academic and institutional requirements.

### III. etnoDB Visual Integration

**Visual identity MUST be identical to etnoDB** - the two systems must appear as one integrated platform.

- Color theme: Tailwind "forest" (forest-50 to forest-900) matching etnoDB exactly
- Typography: Same font families, sizes, and weights as etnoDB
- Components: Buttons, cards, forms, tables must use identical styles
- Layouts: Page structure, navigation, spacing must mirror etnoDB patterns
- Technology stack: HTMX + Alpine.js + Tailwind CSS + EJS (same as etnoDB)

**Validation**: Visual regression testing or manual comparison checklist before major releases.

**Rationale**: EtnoTermos provides controlled vocabulary for etnoDB fields. Users must experience seamless navigation between systems without visual discontinuity that would suggest separate, disconnected tools.

### IV. CARE Principles for Indigenous Data Governance

**Traditional knowledge MUST be managed with cultural sensitivity** following CARE Principles:

- **Collective Benefit**: Features must support community benefit (not just individual research gain)
- **Authority to Control**: Source attribution must clearly identify knowledge holders
- **Responsibility**: System must support ethical obligations to communities
- **Ethics**: Respect for cultural protocols, privacy for sensitive knowledge

**Implementation requirements**:
- Source model MUST support attribution to traditional knowledge holders
- Private notes MUST restrict access to author and administrators only
- Export functions MUST include acknowledgment of traditional knowledge sources
- UI MUST provide cultural sensitivity guidance during data entry

**Rationale**: Traditional ethnobotanical knowledge belongs to communities. Mismanagement risks cultural harm, legal violations, and loss of community trust essential for collaborative research.

### V. Simplicity and Maintainability

**Start simple, evolve deliberately**. Complexity requires explicit justification.

- **YAGNI (You Aren't Gonna Need It)**: Build only what spec.md requires now
- **Avoid premature abstraction**: Three instances before creating a utility/helper
- **No speculative features**: "Future enhancement" comments forbidden - use backlog instead
- **Prefer boring technology**: Standard patterns over clever solutions
- **Clear over clever**: Explicit code over terse magic

**Complexity gates** (document in plan.md Complexity Tracking if violated):
- Repository pattern requires justification (when is direct DB access insufficient?)
- Service layer abstraction requires justification (when is route→model insufficient?)
- Custom framework/library requires justification (when are established tools insufficient?)

**Rationale**: EtnoTermos is maintained by graduate students and researchers, not full-time engineers. Over-engineered systems become unmaintainable, accumulate technical debt, and fail to serve their academic mission.

## Quality Standards

### Code Quality

- **Linting**: ESLint + Prettier with standard rules (no disabled rules without justification)
- **Type safety**: Use JSDoc type annotations for critical functions (models, services, validation)
- **Error handling**: Distinguish operational errors (4xx) from programmer errors (5xx)
- **Logging**: Structured JSON logs with request IDs, sanitized data (no PII in logs)

### Performance Requirements

- Search response time: p95 <500ms for queries with 200k term corpus
- Graph visualization: Render networks up to 1000 visible nodes
- Concurrent users: Support 5-10 simultaneous users without degradation
- Database indexes: Text search indexes on term names, definitions; compound indexes on relationships

### Security Baseline

- **Input validation**: JSON schema validation for all API inputs
- **Output encoding**: Escape all user-generated content in EJS templates
- **Access control**: Public interface read-only; admin interface protected (network-level or API key)
- **Dependency scanning**: Monthly npm audit, address HIGH/CRITICAL within 2 weeks
- **No secrets in code**: Environment variables for all credentials, .env in .gitignore

## Development Workflow

### Feature Development Sequence

1. **Specification** (`/specify`): Define what users need, clarify ambiguities
2. **Planning** (`/plan`): Research tech decisions, design data model, create API contracts
3. **Task Generation** (`/tasks`): Break plan into dependency-ordered, testable tasks
4. **Analysis** (`/analyze`): Validate consistency before implementation (optional but recommended)
5. **Implementation** (`/implement` or manual): Execute tasks following TDD discipline

### Git Workflow

- **Single branch**: All commits to `main` branch (no feature branches per CLAUDE.md user instruction)
- **Commit discipline**: Commit after each completed task with clear message
- **Commit message format**: `type: description` (feat, fix, test, refactor, docs, chore)
- **Pull requests**: Not required for single-developer workflow, but encouraged for review if collaborators exist

### Review Gates

Before marking feature complete:
- [ ] All contract tests pass
- [ ] All integration tests pass
- [ ] Test coverage ≥80%
- [ ] Performance requirements validated (search <500ms, graph rendering)
- [ ] Z39.19 validation utilities confirm compliance
- [ ] Visual consistency with etnoDB verified (manual checklist)
- [ ] CARE Principles compliance verified (attribution fields, cultural guidance)
- [ ] Security baseline met (input validation, output encoding, no secrets)
- [ ] Documentation updated (README, API docs, quickstart)

## Governance

### Constitution Authority

This constitution supersedes project conventions, verbal agreements, and ad-hoc practices. When constitution conflicts with existing code or documentation, constitution takes precedence.

**Amendment procedure**:
1. Propose amendment with rationale and impact analysis
2. Document in Sync Impact Report (version bump, affected templates)
3. Update constitution.md with new version
4. Propagate changes to templates (plan, spec, tasks)
5. Update CLAUDE.md or other agent guidance files
6. Commit with message: `docs: amend constitution to vX.Y.Z (summary)`

**Version semantics**:
- **MAJOR**: Backward-incompatible principle removal or redefinition (e.g., removing TDD requirement)
- **MINOR**: New principle added or material expansion (e.g., adding observability principle)
- **PATCH**: Clarifications, wording improvements, non-semantic refinements

### Compliance Verification

**Plan phase** (`/plan`):
- Constitution Check section MUST evaluate design against all principles
- Violations MUST be documented in Complexity Tracking with justification
- Unjustifiable violations block progression to task generation

**Implementation phase** (`/implement`):
- TDD discipline enforced: tests before code
- Z39.19 validation utilities must pass for vocabulary features
- Visual consistency spot-checks during frontend development

**Review phase**:
- All PRs (if used) MUST verify constitution compliance
- Feature completion checklist (above) gates release

### Deviations and Exceptions

**When principles conflict** (rare):
1. Document conflict in plan.md or issue
2. Escalate to project lead (repo owner)
3. Choose principle priority based on project mission: Research integrity > User experience > Developer convenience

**Emergency exceptions**:
- Critical security fixes may skip tests temporarily (tests required within 48 hours)
- Production outages may require immediate fixes (post-mortem and test coverage required within 1 week)
- Exceptions MUST be documented in commit message and tracked in issues

---

**Version**: 1.0.0
**Ratified**: 2026-01-07
**Last Amended**: 2026-01-07
