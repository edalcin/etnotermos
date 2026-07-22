# Guia de Desenvolvimento — BioCultTermos v2.0

## Pré-requisitos

- Node.js 20 LTS
- Git
- Python 3 e um compilador C++ (build tools) — necessários porque `better-sqlite3` compila um addon nativo via node-gyp. No Linux: `build-essential`; no macOS: Xcode Command Line Tools (`xcode-select --install`); no Windows: Visual Studio Build Tools (workload "Desktop development with C++").

---

## Configuração do Ambiente Local

### 1. Clonar e instalar

```bash
git clone https://github.com/edalcin/BioCultTermos.git
cd BioCultTermos

# Backend
cd backend && npm install && cd ..

# Frontend (Tailwind CSS)
cd frontend && npm install && cd ..
```

### 2. Criar `backend/.env`

```bash
# SQLite — mesmo arquivo compartilhado com o BioCultDB (ADR-005)
SQLITE_DB_PATH=./data/unidade.sqlite

# Portas
PUBLIC_PORT=4000
ADMIN_PORT=4001

# Autenticação admin (escolha uma das opções abaixo)

# Opção A — simples (recomendado para desenvolvimento)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=senha123

# Opção B — produção (JSON com hash bcrypt pré-gerado)
# ADMIN_USERS=[{"username":"admin","passwordHash":"$2b$10$..."}]

NODE_ENV=development
```

### 3. Banco de dados

Não é necessário subir nenhum serviço externo. O arquivo SQLite indicado em `SQLITE_DB_PATH` é criado automaticamente (com WAL e as tabelas necessárias) na primeira conexão — veja `backend/src/shared/database.js`.

### 4. Compilar CSS

```bash
cd frontend
npm run watch:css   # watch mode durante desenvolvimento
# ou
npm run build:css   # build único
```

### 5. Iniciar servidores

Em terminais separados:

```bash
# Terminal 1 — Interface Pública (porta 4000)
cd backend && npm run dev:public

# Terminal 2 — Interface Admin (porta 4001)
cd backend && npm run dev:admin
```

Acesso:
- Pública (read-only, sem login): http://localhost:4000
- Admin (curadoria, CRUD): http://localhost:4001
- Health check: http://localhost:4000/health

---

## Testes

```bash
cd backend

# Todos os testes
npm test

# Com coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Suite específica
npm test -- tests/unit/concept-service.test.js
```

**Suítes disponíveis:**

| Pasta | Descrição |
|---|---|
| `tests/contract/` | Contratos HTTP (admin-concepts, admin-acquisition, public-api) |
| `tests/integration/` | Fluxos de usuário ponta a ponta (US1–US4) |
| `tests/unit/` | ConceptService, AcquisitionService, validação SKOS-XL |

---

## Estrutura do Projeto

```
BioCultTermos/
├── backend/
│   └── src/
│       ├── contexts/
│       │   ├── public/          # Porta 4000 — read-only, sem auth
│       │   │   ├── routes/
│       │   │   ├── views/       # EJS templates
│       │   │   └── server.js
│       │   └── admin/           # Porta 4001 — CRUD, bcrypt auth
│       │       ├── routes/
│       │       ├── views/
│       │       └── server.js
│       ├── models/              # Concept, AcquisitionLog, AuditEntry
│       ├── services/            # ConceptService, AcquisitionService, AuditService
│       ├── lib/
│       │   ├── auth/            # basicAuth.js
│       │   ├── scheduler/       # acquisitionCron.js
│       │   └── skosxl/          # validation.js
│       ├── shared/              # database.js
│       └── config/              # index.js
├── frontend/
│   └── src/
│       ├── public/styles/       # Tailwind CSS — interface pública
│       ├── admin/styles/        # Tailwind CSS — interface admin
│       └── shared/styles/       # Tema forest compartilhado
├── docs/                        # Documentação
├── specs/
│   └── 001-quero-refatorar-toda/  # Spec, plano, contratos, data model
└── tests/
```

---

## Variáveis de Ambiente

| Variável | Obrigatório | Padrão | Descrição |
|---|---|---|---|
| `SQLITE_DB_PATH` | Sim | `./data/unidade.sqlite` | Caminho do arquivo SQLite (compartilhado com o BioCultDB, ADR-005) |
| `ADMIN_USERNAME` | Sim* | — | Usuário admin (Opção A) |
| `ADMIN_PASSWORD` | Sim* | — | Senha admin em texto plano, hash gerado no boot (Opção A) |
| `ADMIN_USERS` | Sim* | — | JSON array com hashes pré-gerados (Opção B, produção) |
| `PUBLIC_PORT` | Não | `4000` | Porta da interface pública |
| `ADMIN_PORT` | Não | `4001` | Porta da interface admin |
| `AUDIO_STORAGE_PATH` | Não | `/data/audio` | Path para arquivos de áudio |
| `ACQUISITION_CRON_SCHEDULE` | Não | `0 3 * * *` | Cron da aquisição automática |
| `LOG_LEVEL` | Não | `info` | `debug` \| `info` \| `warn` \| `error` |
| `NODE_ENV` | Não | `development` | `development` \| `production` |

*Uma das opções A ou B é obrigatória para o servidor admin.

---

## Fluxo de Dados (SKOS-XL)

```
BioCultDB (tabela biocultdb_records)
    ↓ AcquisitionService.run()
etnotermos (tabela etnotermos) — status: "candidate"
    ↓ Curador via interface admin
etnotermos — status: "active"
    ↓ Interface pública (porta 4000)
Pesquisadores / público
```

Campos adquiridos do BioCultDB:
- `comunidades.tipo`
- `comunidades.plantas.nomeVernacular`
- `comunidades.plantas.tipoUso`
- `comunidades.atividadesEconomicas`

---

## Modelo de Conceito SKOS-XL

```javascript
{
  uri: "etnotermos:tipo-comunidade/indigena",
  status: "candidate | active | deprecated",
  sourceFields: ["comunidades.tipo"],
  prefLabels: [{
    literalForm: "indígena",
    language: "pt",
    type: "pref",           // pref | alt | hidden
    accessLevel: "public",  // public | restricted | sacred
    audioPath: null,
    labelRelations: []
  }],
  altLabels: [],
  hiddenLabels: [],
  definition: "",
  scopeNote: "",
  broader: [string],     // UUID v4
  narrower: [string],    // UUID v4
  related: [string],     // UUID v4
  ancestors: [string],   // UUID v4 — Array of Ancestors para O(1) em hierarquias
  version: 1               // Optimistic locking (conflito → HTTP 409)
}
```

---

## SQLite — Tabelas

| Tabela | Descrição |
|---|---|
| `etnotermos` | Conceitos SKOS-XL |
| `etnotermos_acquisition_log` | Log das execuções de aquisição |
| `etnotermos_audit_log` | Auditoria de alterações por campo |
| `etnotermos_fts` | Índice full-text (FTS5) sobre prefLabels/altLabels/definition/scopeNote |
| `biocultdb_records` | Fonte (read-only pelo AcquisitionService, tabela do BioCultDB no mesmo arquivo) |

```bash
# Acesso direto ao arquivo SQLite
sqlite3 ./data/unidade.sqlite

-- Ver conceitos
SELECT id, status FROM etnotermos WHERE status = 'candidate' LIMIT 10;

-- Contar por status
SELECT status, COUNT(*) AS n FROM etnotermos GROUP BY status;

-- Busca full-text (FTS5)
SELECT id, bm25(etnotermos_fts) AS rank FROM etnotermos_fts
WHERE etnotermos_fts MATCH 'indígena' ORDER BY rank LIMIT 10;
```

---

## Problemas Comuns

**Erro `ADMIN_USERS is not set or invalid`**
→ Adicione `ADMIN_USERNAME` + `ADMIN_PASSWORD` no `.env`

**Erro `EACCES: permission denied, mkdir '/data'`**
→ Erro corrigido na v2.0 — verifique se está usando a imagem mais recente

**CSS não aparece**
→ Execute `npm run build:css` em `frontend/` e reinicie o servidor

**Testes falhando com erro de SQLite**
→ Os testes usam SQLite `:memory:` — cada suíte sobe um banco em memória isolado, não precisa de nenhum banco externo. Execute `npm install` novamente.

---

## Contribuindo

Commits sempre no branch `main` (sem feature branches).

Seguir [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `chore:` manutenção

```bash
git add .
git commit -m "feat: descrição da mudança"
git push origin main
```

---

**Dúvidas**: [GitHub Issues](https://github.com/edalcin/BioCultTermos/issues)
