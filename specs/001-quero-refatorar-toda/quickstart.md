# Quickstart: BioCultTermos — SKOS-XL + BioCultDB

**Feature**: 001-quero-refatorar-toda  
**Date**: 2026-06-06

---

## Pré-requisitos

- Node.js 20 LTS
- MongoDB 7.0+ rodando localmente ou em rede (mesma instância do BioCultDB)
- Docker (opcional, para produção)
- npm ≥ 10

---

## 1. Configuração de Ambiente

Criar `backend/.env` (nunca commitar):

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/etnodb

# Servidor
PUBLIC_PORT=4000
ADMIN_PORT=4001

# Autenticação curadoria (JSON array)
ADMIN_USERS=[{"username":"curador1","passwordHash":"$2b$10$SUBSTITUIR_HASH_AQUI"}]

# Áudio
AUDIO_STORAGE_PATH=/data/audio

# Aquisição agendada (cron)
ACQUISITION_CRON_SCHEDULE=0 3 * * *

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

**Gerar hash de senha para ADMIN_USERS**:
```bash
node -e "const b=require('bcrypt'); b.hash('suasenha',10).then(h=>console.log(h))"
```

---

## 2. Instalação de Dependências

```bash
# Backend
cd backend
npm install

# Frontend (compilar Tailwind CSS)
cd ../frontend
npm install
npm run build:css
```

---

## 3. Inicialização do Banco de Dados

Criar coleções e índices:

```bash
cd backend
node scripts/db-init.js
```

O script cria:
- Coleção `etnotermos` com todos os índices
- Coleção `etnotermos_acquisition_log`
- Coleção `etnotermos_audit_log`

---

## 4. Primeira Aquisição de Termos

```bash
# Via CLI (importação inicial)
node scripts/acquire.js

# Ou após iniciar o servidor:
curl -X POST -u curador1:suasenha http://localhost:4001/acquisition/run
```

O processo importa valores distintos de:
- `comunidades.tipo`
- `comunidades.plantas.nomeVernacular`
- `comunidades.plantas.tipoUso`
- `comunidades.atividadesEconomicas`

Todos os conceitos criados recebem `status: "candidate"`.

---

## 5. Iniciar Servidores em Desenvolvimento

```bash
cd backend
npm run dev:public    # Inicia porto 4000
npm run dev:admin     # Inicia porto 4001
```

---

## 6. Validar Interface Pública

Abrir `http://localhost:4000`

Verificar:
- [ ] Homepage carrega sem erros
- [ ] Busca retorna conceitos com status "active" (ou lista vazia se nenhum foi ativado ainda)
- [ ] Filtro por grupo semântico funciona
- [ ] Detalhe de conceito exibe labels e notas
- [ ] Labels com `accessLevel: "sacred"` NÃO aparecem

---

## 7. Validar Interface de Curadoria

Abrir `http://localhost:4001` com credenciais `curador1:suasenha`

Verificar:
- [ ] Dashboard carrega; exibe contagem de candidatos
- [ ] Lista de conceitos mostra candidatos destacados
- [ ] Edição de conceito salva notas (`definition`, `scopeNote`)
- [ ] Adicionar label funciona; unicidade é validada
- [ ] Upload de áudio funciona (mp3/wav ≤10MB)
- [ ] Ativar conceito (`candidate → active`) torna-o visível no porto 4000
- [ ] Deprecar conceito exibe lista de órfãos (se houver filhos ativos)
- [ ] Adicionar `skos:broader` gera `skos:narrower` recíproco
- [ ] Tentativa de ciclo hierárquico é rejeitada com mensagem clara
- [ ] Edição concorrente (abrir mesmo conceito em duas abas) gera 409

---

## 8. Validar Aquisição e Auditoria

Verificar:
- [ ] `POST /acquisition/run` (autenticado) retorna 202
- [ ] `GET /acquisition/logs` exibe histórico
- [ ] Dashboard mostra alerta se última aquisição falhou
- [ ] `GET /audit` exibe alterações com username do curador

---

## 9. Testes Automatizados

```bash
cd backend
npm test                    # Todos os testes
npm run test:unit           # Apenas unit tests
npm run test:integration    # Apenas integration tests
npm run test:contract       # Apenas contract tests (devem falhar antes da implementação)
```

**Cobertura esperada**: ≥ 80% em serviços, modelos e rotas de API

---

## 10. Docker (Produção)

```bash
# Build
docker build -f docker/etnotermos.Dockerfile -t etnotermos:latest .

# Run (com volume de áudio e variáveis de ambiente)
docker run -d \
  -p 4000:4000 \
  -p 4001:4001 \
  -v /mnt/data/audio:/data/audio \
  -e MONGODB_URI=mongodb://mongo:27017/etnodb \
  -e ADMIN_USERS='[{"username":"curador1","passwordHash":"$2b$10$..."}]' \
  -e AUDIO_STORAGE_PATH=/data/audio \
  --name etnotermos \
  etnotermos:latest
```

---

## Troubleshooting

**MongoDB não conecta**:
```bash
# Verificar URI e se MongoDB está rodando
mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"
```

**Conceitos não aparecem na interface pública**:
- Verificar se algum conceito tem `status: "active"` (recém-importados são `"candidate"`)
- Ativar um conceito via curadoria primeiro

**Conflito de versão (409) inesperado**:
- Recarregar a página de edição antes de salvar
- Verificar se há processos duplicados escrevendo na mesma coleção

**Áudio não aparece**:
- Verificar se `AUDIO_STORAGE_PATH` está montado e tem permissão de leitura
- Verificar se `audioPath` está salvo no documento do label
