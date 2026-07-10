# Guia de Desenvolvimento — BioCultTermos v2.0

## Pré-requisitos

- Node.js 20 LTS
- MongoDB 7.0+ (ou use o do BioCultDB se já estiver rodando)
- Git

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
# MongoDB — mesmo banco do BioCultDB
MONGODB_URI=mongodb://localhost:27017/etnodb

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

### 3. Subir MongoDB local (se necessário)

```bash
docker run -d -p 27017:27017 --name mongo-dev mongo:7.0-alpine
```

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
├── docker/
│   ├── etnotermos.Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example
│   └── create-admin-user.js    # Script interativo para gerar docker/.env
├── docs/                        # Documentação
├── specs/
│   └── 001-quero-refatorar-toda/  # Spec, plano, contratos, data model
└── tests/
```

---

## Variáveis de Ambiente

| Variável | Obrigatório | Padrão | Descrição |
|---|---|---|---|
| `MONGODB_URI` | Sim | — | URI completa do MongoDB |
| `MONGO_URI` | Sim (alternativa) | — | Alias aceito para MONGODB_URI |
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
BioCultDB (coleção etnodb)
    ↓ AcquisitionService.run()
etnotermos (coleção etnotermos) — status: "candidate"
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
  broader: [ObjectId],
  narrower: [ObjectId],
  related: [ObjectId],
  ancestors: [ObjectId],   // Array of Ancestors para O(1) em hierarquias
  version: 1               // Optimistic locking (conflito → HTTP 409)
}
```

---

## MongoDB — Coleções

| Coleção | Descrição |
|---|---|
| `etnotermos` | Conceitos SKOS-XL |
| `etnotermos_acquisition_log` | Log das execuções de aquisição |
| `etnotermos_audit_log` | Auditoria de alterações por campo |
| `etnodb` | Fonte (read-only pelo AcquisitionService) |

```bash
# Acesso direto ao MongoDB
mongosh mongodb://localhost:27017/etnodb

# Ver conceitos
db.etnotermos.find({ status: "candidate" }).limit(10)

# Contar por status
db.etnotermos.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }])
```

---

## Problemas Comuns

**Erro `ADMIN_USERS is not set or invalid`**
→ Adicione `ADMIN_USERNAME` + `ADMIN_PASSWORD` no `.env`

**Erro `EACCES: permission denied, mkdir '/data'`**
→ Erro corrigido na v2.0 — verifique se está usando a imagem mais recente

**Senha do MongoDB com `!` `*` `@` `#` na URI**
→ Faça URL-encode: `!`→`%21`, `*`→`%2A`, `@`→`%40`, `#`→`%23`

**CSS não aparece**
→ Execute `npm run build:css` em `frontend/` e reinicie o servidor

**Testes falhando com erro de MongoDB**
→ Os testes usam `mongodb-memory-server` — não precisa de MongoDB externo. Execute `npm install` novamente.

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
