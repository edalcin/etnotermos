# Guia de Desenvolvimento - EtnoTermos

Este guia fornece instruções técnicas para desenvolvedores que desejam contribuir com o projeto EtnoTermos.

## 📋 Pré-requisitos

- Node.js 20 LTS ou superior
- MongoDB 7.0 ou superior
- Docker e Docker Compose (opcional, mas recomendado)
- Git

## 🚀 Quickstart para Desenvolvedores

### Configuração do Ambiente Local

1. **Clone o repositório:**

```bash
git clone https://github.com/edalcin/etnotermos.git
cd etnotermos
```

2. **Configure as variáveis de ambiente:**

Crie um arquivo `.env` na pasta `backend/`:

```bash
# MongoDB
MONGO_URI=mongodb://localhost:27017/etnodb

# Server Ports
PUBLIC_PORT=4000
ADMIN_PORT=4001

# Admin Authentication (opcional)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=seu_senha_segura

# Node Environment
NODE_ENV=development
```

3. **Instale as dependências:**

```bash
# Backend
cd backend
npm install

# Frontend (Tailwind CSS)
cd ../frontend
npm install
```

4. **Inicie o MongoDB:**

Usando Docker:
```bash
docker run -d -p 27017:27017 --name etnotermos-mongo mongo:7.0
```

Ou use uma instância local/remota e ajuste o `MONGO_URI`.

5. **Crie os índices do banco de dados:**

```bash
cd backend
node scripts/create-indexes.js
```

6. **Popule o banco com dados de exemplo (opcional):**

```bash
# Dados gerais
node scripts/seed.js

# Vocabulário controlado para etnoDB
node scripts/seed-controlled-vocab.js
```

7. **Compile o CSS (Frontend):**

```bash
cd frontend
npm run build:css
```

Para desenvolvimento com watch mode:
```bash
npm run watch:css
```

8. **Inicie os servidores:**

Em terminais separados:

```bash
# Servidor Público (porta 4000)
cd backend
npm run dev:public

# Servidor Admin (porta 4001)
cd backend
npm run dev:admin
```

9. **Acesse a aplicação:**

- Interface Pública (read-only): http://localhost:4000
- Interface Admin (CRUD): http://localhost:4001
- Health Check: http://localhost:4000/health

### Usando Docker Compose (Alternativa Recomendada)

1. **Inicie todos os serviços:**

```bash
docker-compose -f docker/docker-compose.yml up -d
```

2. **Acesse a aplicação:**

- Interface Pública: http://localhost:4000
- Interface Admin: http://localhost:4001

3. **Veja os logs:**

```bash
docker-compose -f docker/docker-compose.yml logs -f etnotermos
```

4. **Pare os serviços:**

```bash
docker-compose -f docker/docker-compose.yml down
```

## 🧪 Executando Testes

```bash
cd backend

# Rodar todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch

# Testes de integração específicos
npm test -- integration/scenario-01-create-term.test.js
```

## 📁 Estrutura do Projeto

```
etnotermos/
├── backend/               # Backend Node.js + Express
│   ├── src/
│   │   ├── contexts/      # Public (4000) e Admin (4001)
│   │   │   ├── public/    # Servidor público (read-only)
│   │   │   └── admin/     # Servidor admin (CRUD)
│   │   ├── models/        # Schemas MongoDB
│   │   ├── services/      # Lógica de negócio
│   │   ├── api/           # Routes e controllers
│   │   ├── lib/           # Bibliotecas (search, export, validation)
│   │   └── shared/        # Database connection, utils
│   ├── tests/             # Testes (contract, integration, unit)
│   └── scripts/           # Scripts de inicialização
├── frontend/              # Frontend (Tailwind CSS)
│   └── src/
│       ├── public/        # Assets públicos
│       ├── admin/         # Assets admin
│       └── shared/        # Styles compartilhados (forest theme)
├── docker/                # Docker configs
│   ├── docker-compose.yml
│   └── etnotermos.Dockerfile
├── specs/                 # Especificações e documentação
└── docs/                  # Documentação adicional
```

## 🛠️ Scripts Úteis

### Backend

```bash
npm run dev:public         # Iniciar servidor público (watch mode)
npm run dev:admin          # Iniciar servidor admin (watch mode)
npm start:public           # Iniciar servidor público (produção)
npm start:admin            # Iniciar servidor admin (produção)
npm test                   # Executar testes
npm run lint               # Verificar código com ESLint
npm run format             # Formatar código com Prettier
```

### Frontend

```bash
npm run build:css          # Compilar Tailwind CSS
npm run watch:css          # Watch mode para CSS
```

## 🗄️ Comandos Comuns do MongoDB

```bash
# Conectar ao MongoDB
mongosh mongodb://localhost:27017/etnodb

# Ver collections
show collections

# Consultar termos
db.etnotermos.find().limit(5)

# Contar termos
db.etnotermos.countDocuments()

# Verificar índices
db.etnotermos.getIndexes()
```

## 📤 Importação de Dados via CSV

### Via Interface Web

1. Acesse a interface admin: http://localhost:4001
2. Navegue para "Importação em Lote"
3. Baixe o modelo CSV
4. Preencha com seus dados
5. Faça upload e resolva conflitos
6. Execute a importação

### Via API

```bash
curl -X POST http://localhost:4001/api/v1/admin/import/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@termos.csv"
```

## 🔧 Problemas Comuns

### Erro de conexão com MongoDB

- Verifique se o MongoDB está rodando: `docker ps` ou `mongosh`
- Confirme o `MONGO_URI` no arquivo `.env`

### Porta já em uso

- Altere `PUBLIC_PORT` ou `ADMIN_PORT` no `.env`
- Ou encerre o processo usando a porta: `npx kill-port 4000`

### Testes falhando

- Execute `npm install` novamente
- Verifique se não há MongoDB em execução na porta de teste

### CSS não atualiza

- Execute `npm run build:css` na pasta `frontend/`
- Limpe o cache do navegador (Ctrl+Shift+R)

## 🤝 Contribuindo

1. Crie uma branch para sua feature
2. Faça commit seguindo [Conventional Commits](https://www.conventionalcommits.org/)
3. Execute os testes antes de fazer push
4. Abra um Pull Request descrevendo as mudanças

**Nota**: Este projeto comita sempre na branch `main` (sem feature branches), conforme configurado em `CLAUDE.md`.

## 🎨 Stack Tecnológica

### Backend
- **Runtime**: Node.js 20 LTS (Alpine Linux)
- **Framework**: Express.js
- **Database**: MongoDB 7.0+ (MongoDB Driver oficial)
- **Template Engine**: EJS (server-side rendering)
- **Testing**: Jest, Supertest, mongodb-memory-server

### Frontend
- **Stack**: HTMX + Alpine.js + Tailwind CSS (mesma stack do etnoDB)
- **Tema**: "forest" (verde florestal) - identidade visual compartilhada com etnoDB
- **Visualização de Grafos**: Cytoscape.js

### Deploy
- **Containerização**: Docker (Alpine Linux)
- **Orquestração**: Docker Compose
- **CI/CD**: GitHub Actions

## 🏗️ Arquitetura

### Sistema de Duas Portas (Dual-Port)

- **Interface Pública (porta 4000)**: Read-only para consulta de termos, busca e visualização de relacionamentos. Sem autenticação.
- **Interface Admin (porta 4001)**: CRUD completo para gestão de vocabulário e curadoria de termos. Com controle de acesso.

### Database

- **Database**: "etnodb" (compartilhado com etnoDB)
- **Collection**: "etnotermos" (separada da collection "etnodb" do etnoDB)
- **Connection**: Mesma instância MongoDB, portas e credenciais

## 🎯 Princípios de Desenvolvimento

1. **Conformidade ANSI/NISO Z39.19-2005**: Toda gestão de termos segue padrões de vocabulários controlados
2. **Integração Visual com etnoDB**: UI/UX idêntica - cores, fontes, componentes, layouts
3. **Database Compartilhado**: Collection "etnotermos" no database "etnodb" do MongoDB
4. **Vocabulário Controlado**: Gerencia termos usados em campos do etnoDB (comunidades.tipo, plantas.tipoUso)
5. **Separação de Contextos**: Acesso público read-only vs admin CRUD completo
6. **Sem Autenticação Pública**: Interface pública completamente aberta
7. **Controle de Acesso Admin**: Interface admin protegida (nível de rede ou autenticação básica)
8. **Princípios CARE**: Gestão culturalmente sensível de conhecimento tradicional
9. **Test-Driven Development**: Testes de integração → Testes unitários → Implementação

## 🤖 Desenvolvimento Assistido por IA

Este projeto utiliza o Claude para automatizar tarefas de desenvolvimento e garantir a qualidade do código:

- **Revisão de Código**: Em cada pull request, o Claude analisa as alterações e fornece feedback sobre qualidade, potenciais bugs e conformidade com as convenções do projeto.
- **Assistente de Código**: Desenvolvedores podem interagir com o Claude em issues e pull requests para obter ajuda com implementação, refatoração e outras tarefas.

Para mais detalhes, consulte os arquivos de fluxo de trabalho em `.github/workflows`.

## 📚 Documentação Adicional

- [Especificação completa](../specs/main/spec.md)
- [Modelo de dados](../specs/main/data-model.md)
- [Diretrizes de construção do vocabulário (Z39.19)](../specs/main/vocabulary-guidelines.md)
- [Guia de deployment em produção](./deployment.md)
- [Instalação no UNRAID](./instalacao-unraid.md)
- [Exemplo de registro (JSON)](./examples/term-record-example.json)

## 🔗 Referências Técnicas

- [ANSI/NISO Z39.19-2005 (R2010)](./ANSI-NISO%20Z39.19-2005%20(R2010).pdf) - Guidelines for the Construction, Format, and Management of Monolingual Controlled Vocabularies
- [TemaTres Vocabulary Server](https://github.com/tematres/TemaTres-Vocabulary-Server) (inspiração inicial)
- [CARE Principles for Indigenous Data Governance](https://www.gida-global.org/care)
- [SKOS - Simple Knowledge Organization System](https://www.w3.org/2004/02/skos/)
