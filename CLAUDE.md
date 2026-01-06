# etnotermos Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-06

## Integração com etnoDB

**etnotermos** é um sistema integrado visualmente com o **etnoDB**, compartilhando identidade visual, banco de dados e termos controlados.

### Banco de Dados Compartilhado
- **Database**: MongoDB "etnodb" (compartilhado com etnoDB)
- **Collection**: "etnotermos" (separada da collection "etnodb" do etnoDB)
- **Connection**: Mesma instância MongoDB, portas e credenciais

### Termos Gerenciados
O etnotermos gerencia vocabulário controlado para campos do etnoDB:
- **comunidades.tipo**: 29 categorias de comunidades tradicionais (Decreto 8.750/2016)
- **comunidades.plantas.tipoUso**: Tipos de uso de plantas (medicinal, alimentício, ritualístico, etc.)
- Seguindo diretrizes Z39.19 em `/specs/main/vocabulary-guidelines.pt-BR.md`

### Identidade Visual Unificada
**CRÍTICO**: Toda interface do etnotermos deve seguir exatamente o padrão visual do etnoDB:
- **Cores**: Tema "forest" (verde florestal) do Tailwind CSS
  - Primary: forest-600 (#16a34a)
  - Hover: forest-700 (#15803d)
  - Backgrounds: forest-50/100/200
- **Fontes**: Mesmas famílias tipográficas do etnoDB
- **Componentes**: Mesmos padrões de botões, cards, formulários
- **Layout**: Estrutura de páginas consistente com etnoDB
- **Resultado**: Os dois sistemas devem parecer **um único sistema integrado**

## Active Technologies
- **Backend**: Node.js 20 LTS (Alpine Linux), Express.js, MongoDB Driver (official)
- **Frontend**: HTMX + Alpine.js + Tailwind CSS (mesma stack do etnoDB)
- **Template Engine**: EJS (server-side rendering)
- **Database**: MongoDB 7.0+ (instância compartilhada "etnodb")
- **Graph Visualization**: Cytoscape.js (para visualização de relacionamentos entre termos)
- **Testing**: Jest, Supertest, mongodb-memory-server
- **Deployment**: Docker (Alpine Linux, compatível com etnoDB)

## Architecture

**Dual-Port System** (integrado ao ecossistema etnoDB):
- **Public Interface** (port 4000): Read-only interface for term browsing, search, and relationship visualization. No authentication required.
- **Admin Interface** (port 4001): Full CRUD interface for vocabulary management and term curation. Access control required.

**Database**: Collection "etnotermos" dentro do database "etnodb" (mesma instância usada pelo etnoDB)

## Project Structure

```
backend/
├── src/
│   ├── contexts/
│   │   ├── public/          # Public context (port 4000, read-only)
│   │   │   ├── routes/      # Express routes
│   │   │   ├── views/       # EJS templates
│   │   │   └── server.js    # Public server
│   │   └── admin/           # Admin context (port 4001, full CRUD)
│   │       ├── routes/      # Express routes
│   │       ├── views/       # EJS templates
│   │       └── server.js    # Admin server
│   ├── models/              # MongoDB schemas (Term, Note, Relationship, Source, Collection, AuditLog)
│   ├── services/            # Business logic (term, relationship, search, export services)
│   ├── lib/
│   │   ├── search/          # MongoDB text search utilities
│   │   ├── export/          # CSV/SKOS/RDF exporters
│   │   └── validation/      # Z39.19 compliance validators
│   ├── shared/              # Shared utilities and database connection
│   └── config/              # Configuration management
├── tests/
│   ├── integration/         # End-to-end tests
│   └── unit/                # Service/model unit tests
└── scripts/                 # Database initialization and seeding

frontend/
└── src/
    ├── public/              # Public interface assets
    │   └── styles/          # Tailwind CSS
    ├── admin/               # Admin interface assets
    │   └── styles/          # Tailwind CSS
    └── shared/              # Shared CSS and assets
        └── styles/          # Cores "forest" e componentes base

docker/
├── etnotermos.Dockerfile    # Single container com ambos contextos
└── docker-compose.yml       # Orquestração (compatível com etnoDB)
```

## Commands

### Development
```bash
# Backend (ambos os contextos)
cd backend
npm install
npm run dev:public    # Start public context (port 4000)
npm run dev:admin     # Start admin context (port 4001)
npm test

# Frontend (build CSS com Tailwind)
cd frontend
npm install
npm run build:css     # Build Tailwind CSS
npm run watch:css     # Watch mode para desenvolvimento
```

### Docker
```bash
docker-compose up -d    # Start etnotermos + MongoDB
docker-compose down     # Stop all services
```

## Code Style

- **JavaScript**: ES2022+, Node.js 20 LTS
- **Linting**: ESLint with standard conventions
- **Formatting**: Prettier
- **Testing**: TDD approach - write tests before implementation
- **Templates**: EJS with semantic HTML
- **CSS**: Tailwind CSS utility classes (tema "forest" do etnoDB)

## Key Principles

1. **ANSI/NISO Z39.19-2005 Compliance**: All term management follows controlled vocabulary standards
2. **Visual Integration with etnoDB**: Identical UI/UX - colors, fonts, components, layouts
3. **Shared Database**: Collection "etnotermos" in MongoDB "etnodb" database
4. **Controlled Vocabulary Source**: Manages terms used in etnoDB fields (comunidades.tipo, plantas.tipoUso)
5. **Separation of Concerns**: Public read-only access vs admin full CRUD access
6. **No Authentication for Public**: Public interface is completely open
7. **Admin Access Control**: Admin interface protected (network-level or basic auth)
8. **CARE Principles**: Culturally sensitive data management for traditional knowledge
9. **Test-Driven Development**: Integration tests → Unit tests → Implementation

## Recent Changes
- 2026-01-06: Integrated with etnoDB - shared database, visual identity, and controlled terms
- 2026-01-06: Changed stack to HTMX+Alpine.js+EJS (matching etnoDB)
- 2026-01-06: Updated ports to 4000/4001 to avoid conflict with etnoDB (3001/3002/3003)
- 2026-01-05: Updated architecture to dual-port system (public + admin)
- 2026-01-05: Removed Meilisearch dependency in favor of MongoDB text search
- 2025-09-28: Initial project structure

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
