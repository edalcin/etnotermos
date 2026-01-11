# Carga de Termos - EtnoTermos

## ✅ Resumo da Carga

**Data**: 11/01/2026
**Total de termos carregados**: 454 termos únicos
**Status**: Todos os termos ativos (`active`)
**Duplicados**: 3 termos duplicados foram removidos
**Total final**: 455 termos no banco de dados

## 📊 Estatísticas

### Distribuição por Letra Inicial
- **C**: 72 termos (maior categoria)
- **D**: 67 termos (segunda maior)
- **P**: 56 termos
- **I**: 33 termos
- **E**: 27 termos
- **F**: 27 termos
- **A**: 23 termos
- E outros...

### Categorias Principais (por palavras-chave)
- **Dor/Dores**: 36 termos
- **Infecção/Inflamação**: 20 termos
- **Problemas**: 20 termos
- **Cólicas**: 9 termos
- **Gripe/Resfriado**: 6 termos
- **Cicatrização**: 6 termos
- **Tosse**: 4 termos
- **Febre**: 3 termos

## 🛠️ Scripts Criados

### 1. `seed-tipos-uso.js`
Script principal para carregar os 454 termos de tipos de uso de plantas.

**Uso**:
```bash
cd backend
node scripts/seed-tipos-uso.js
```

**Funcionalidades**:
- Remove duplicados da lista usando Set
- Verifica termos já existentes no banco
- Insere apenas termos novos
- Cria logs de auditoria automáticos
- Gera relatório detalhado

### 2. `fix-language-and-indexes.js`
Script para corrigir campos de linguagem e criar índices do MongoDB.

**Uso**:
```bash
cd backend
node scripts/fix-language-and-indexes.js
```

**Funcionalidades**:
- Remove índices de texto antigos
- Corrige campos `language` incompatíveis
- Cria índice de texto em português
- Cria índices para status, collections, timestamps
- Cria índices para relacionamentos e audit logs

### 3. `remove-duplicates.js`
Script para remover termos duplicados (case-insensitive).

**Uso**:
```bash
cd backend
node scripts/remove-duplicates.js
```

**Funcionalidades**:
- Identifica duplicados ignorando maiúsculas/minúsculas
- Mantém a versão em minúsculas
- Remove versões duplicadas
- Gera relatório de remoções

### 4. `test-search.js`
Script para testar funcionalidade de busca.

**Uso**:
```bash
cd backend
node scripts/test-search.js
```

**Funcionalidades**:
- Lista total de termos
- Testa busca por texto
- Testa busca com filtros
- Verifica índices criados

### 5. `generate-report.js`
Script para gerar relatório completo sobre os termos carregados.

**Uso**:
```bash
cd backend
node scripts/generate-report.js
```

**Funcionalidades**:
- Total de termos
- Distribuição por status
- Distribuição por letra inicial (com gráfico)
- Últimos termos adicionados
- Categorias principais
- Logs de auditoria
- Índices criados

## 🔧 Correções Implementadas

### 1. Campo de Data "Invalid Date"
- **Problema**: Views usando `created`/`modified` em vez de `createdAt`/`updatedAt`
- **Arquivos corrigidos**:
  - `backend/src/contexts/admin/views/terms-list.ejs`
  - `backend/src/contexts/public/views/term-detail.ejs`

### 2. Erro ao Criar Relacionamento
- **Problema**: Tratamento inadequado de mensagens de erro
- **Arquivo corrigido**:
  - `backend/src/contexts/admin/views/relationship-form.ejs`

### 3. Logs de Auditoria
- **Problema**: Rota da API não existia
- **Arquivos criados**:
  - `backend/src/api/controllers/AdminAuditLogsController.js`
  - `backend/src/api/admin/audit-logs.js`
- **Arquivo modificado**:
  - `backend/src/contexts/admin/server.js` (registrada nova rota)

### 4. Índice de Busca
- **Problema**: Campo `language` com valor "pt-BR" incompatível com índice de texto
- **Solução**: Removidos valores incompatíveis e recriados índices

## 📝 Termos Carregados

Total de 454 termos relacionados a tipos de uso de plantas etnobotânicas, incluindo:

**Categorias médicas**: medicinal, antidepressivo, antidiabético, antiespasmódico, antigripal, antisséptico, antitérmico, antiviral, calmante, cicatrizante, digestivo, diurético, expectorante, laxante, sedativo, etc.

**Sintomas e condições**: dor de cabeça, dor de barriga, febre, gripe, tosse, asma, bronquite, diabetes, hipertensão, insônia, etc.

**Usos diversos**: alimentício, artesanal, cosmético, ritual, espiritual, ornamental, combustível, etc.

## 🚀 Como Usar

### 1. Iniciar os Servidores

**Servidor Admin** (porta 4001):
```bash
cd backend
npm run dev:admin
```

**Servidor Público** (porta 4000):
```bash
cd backend
npm run dev:public
```

### 2. Acessar as Interfaces

- **Interface Admin**: http://localhost:4001
  - Usuário: `admin`
  - Senha: `admin123`

- **Interface Pública**: http://localhost:4000

### 3. Testar a Busca

**Pelo navegador**:
- Acesse http://localhost:4000
- Use a caixa de busca na home page
- Ou acesse http://localhost:4000/search para busca avançada

**Pela API**:
```bash
curl "http://localhost:4000/api/v1/search?q=medicinal&limit=10"
```

## ✅ Verificação Pós-Carga

Execute o script de teste para verificar se tudo está funcionando:

```bash
cd backend
node scripts/test-search.js
```

Resultado esperado:
- ✅ 455 termos no banco
- ✅ Busca por "medicinal" retorna resultados
- ✅ Busca por "dor" retorna múltiplos resultados
- ✅ Busca com filtros funciona corretamente
- ✅ 7 índices criados

## 🔄 Recarregar Termos

Se precisar recarregar os termos:

1. Limpar termos existentes (opcional):
```javascript
// No MongoDB shell ou Compass
use etnodb
db.etnotermos.deleteMany({})
db['etnotermos-audit-logs'].deleteMany({})
```

2. Executar os scripts novamente:
```bash
cd backend
node scripts/seed-tipos-uso.js
node scripts/fix-language-and-indexes.js
node scripts/remove-duplicates.js
node scripts/generate-report.js
```

## 📚 Referências

- **Padrão Z39.19**: ANSI/NISO Z39.19-2005 - Guidelines for the Construction, Format, and Management of Monolingual Controlled Vocabularies
- **Princípios CARE**: Collective Benefit, Authority to Control, Responsibility, Ethics
- **Decreto 8.750/2016**: Categorias de comunidades tradicionais brasileiras

## 🐛 Problemas Conhecidos

1. ⚠️ Sem dados na interface: Execute os scripts de seed
2. ⚠️ Busca não funciona: Execute `fix-language-and-indexes.js`
3. ⚠️ Duplicados: Execute `remove-duplicates.js`

## 💡 Dicas

- Use a busca avançada para filtrar por status e coleções
- Todos os termos foram criados com status "active"
- Os logs de auditoria registram todas as operações
- O índice de texto suporta busca em português com diacríticos

---

**Autor**: Claude Code
**Versão**: 1.0
**Última atualização**: 11/01/2026
