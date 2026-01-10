# Instalação do EtnoTermos no UNRAID

Este guia fornece instruções passo a passo para instalar o **EtnoTermos** no UNRAID via interface web, sem necessidade de linha de comando.

## 📋 Pré-requisitos

- Servidor UNRAID em funcionamento
- Acesso à interface web do UNRAID
- Espaço em disco disponível (recomendado: mínimo 10 GB)
- Memória RAM disponível (recomendado: mínimo 2 GB para a aplicação)

## 🚀 Instalação

### Pré-requisito: MongoDB

**IMPORTANTE**: O EtnoTermos requer um banco de dados MongoDB em execução. Este guia assume que você **já possui um container MongoDB instalado** no seu UNRAID.

#### Se você ainda não tem o MongoDB instalado:

<details>
<summary>Clique aqui para ver as instruções de instalação do MongoDB</summary>

1. No painel do UNRAID, clique em **Docker**
2. Clique no botão **Add Container**
3. Preencha os campos conforme abaixo:

**Configurações Básicas:**
- **Name:** `mongodb` (ou qualquer nome de sua preferência)
- **Overview:** Banco de dados MongoDB
- **Repository:** `mongo:7.0-alpine`
- **Network Type:** `Bridge`
- **Console shell command:** `Shell`

**Mapeamento de Portas:**
- Clique em **"Add another Path, Port, Variable, Label or Device"**
- Selecione **Port**
  - **Name:** MongoDB Port
  - **Container Port:** `27017`
  - **Host Port:** `27017`
  - **Connection Type:** `TCP`

**Mapeamento de Volumes (Persistência de Dados):**
- Clique em **"Add another Path, Port, Variable, Label or Device"**
- Selecione **Path**
  - **Name:** MongoDB Data
  - **Container Path:** `/data/db`
  - **Host Path:** `/mnt/user/appdata/mongodb/data`
  - **Access Mode:** `Read/Write`

4. Clique em **Apply** para criar o container do MongoDB
5. Aguarde o download da imagem e inicialização do container
6. Verifique se o container está com status **Started** (ícone verde)

</details>

#### Obter a String de Conexão do MongoDB

Antes de instalar o EtnoTermos, você precisa saber a string de conexão do seu MongoDB. O formato típico é:

```
mongodb://[IP-DO-HOST]:27017/etnodb
```

Onde:
- `[IP-DO-HOST]`: Geralmente é `172.17.0.1` (IP padrão do host Docker no UNRAID)
- `27017`: Porta padrão do MongoDB
- `etnodb`: Nome do banco de dados que será usado pelo EtnoTermos

**Exemplos de strings de conexão:**
- Container MongoDB no mesmo UNRAID: `mongodb://172.17.0.1:27017/etnodb`
- Container MongoDB com nome específico: `mongodb://mongodb:27017/etnodb` (requer link entre containers)
- MongoDB em outro servidor: `mongodb://192.168.1.100:27017/etnodb`

### Instalação do EtnoTermos

Agora vamos instalar a aplicação EtnoTermos que se conectará ao MongoDB existente.

#### Passo 1: Adicionar Container do EtnoTermos

1. No painel do UNRAID, clique em **Docker**
2. Clique no botão **Add Container**
3. Preencha os campos conforme abaixo:

**Configurações Básicas:**
- **Name:** `etnotermos-app`
- **Overview:** Sistema de Gestão de Terminologia Etnobotânica
- **Repository:** `ghcr.io/edalcin/etnotermos:latest`
  - *Nota: Esta imagem será disponibilizada no GitHub Container Registry. Enquanto isso, você pode usar `edalcin/etnotermos:latest` se estiver disponível no Docker Hub, ou construir localmente conforme a seção "Construção Manual" abaixo.*
- **Network Type:** `Bridge`
- **Console shell command:** `Shell`

**Mapeamento de Portas:**
- **Porta Pública (Interface de Consulta):**
  - Clique em **"Add another Path, Port, Variable, Label or Device"**
  - Selecione **Port**
    - **Name:** Public Port
    - **Container Port:** `4000`
    - **Host Port:** `4000`
    - **Connection Type:** `TCP`

- **Porta Admin (Interface Administrativa):**
  - Clique em **"Add another Path, Port, Variable, Label or Device"**
  - Selecione **Port**
    - **Name:** Admin Port
    - **Container Port:** `4001`
    - **Host Port:** `4001`
    - **Connection Type:** `TCP`

**Variáveis de Ambiente:**

> **⚠️ ATENÇÃO**: A variável mais importante é a `MONGO_URI`. Certifique-se de configurá-la corretamente com a string de conexão do seu MongoDB existente.

- **MongoDB URI (OBRIGATÓRIO):**
  - Clique em **"Add another Path, Port, Variable, Label or Device"**
  - Selecione **Variable**
  - **Name:** MongoDB Connection String
  - **Key:** `MONGO_URI`
  - **Value:** `mongodb://172.17.0.1:27017/etnodb`
  - **Descrição:** String de conexão do MongoDB. **Ajuste conforme sua instalação:**
    - Se MongoDB está no mesmo UNRAID: `mongodb://172.17.0.1:27017/etnodb`
    - Se MongoDB tem nome específico (ex: `mongodb`): `mongodb://mongodb:27017/etnodb`
    - Se MongoDB está em outro servidor: `mongodb://IP_DO_SERVIDOR:27017/etnodb`
    - Se MongoDB tem autenticação: `mongodb://usuario:senha@IP:27017/etnodb?authSource=etnodb`
    - **⚠️ IMPORTANTE - Caracteres especiais em senhas**: Se a senha contiver caracteres especiais, eles **devem ser codificados em URL** (URL-encoded):
      - `!` → `%21`
      - `@` → `%40`
      - `#` → `%23`
      - `$` → `%24`
      - `%` → `%25`
      - `^` → `%5E`
      - `&` → `%26`
      - `*` → `%2A`
      - `(` → `%28`
      - `)` → `%29`
      - Exemplo: senha `abc!123*` deve ser escrita como `abc%21123%2A`
      - Formato completo: `mongodb://usuario:senhacodificada@IP:27017/etnodb?authSource=etnodb`

- **Node Environment:**
  - Clique em **"Add another Path, Port, Variable, Label or Device"**
  - Selecione **Variable**
  - **Name:** Node Environment
  - **Key:** `NODE_ENV`
  - **Value:** `production`

- **Public Port:**
  - Clique em **"Add another Path, Port, Variable, Label or Device"**
  - Selecione **Variable**
  - **Name:** Public Port Number
  - **Key:** `PUBLIC_PORT`
  - **Value:** `4000`

- **Admin Port:**
  - Clique em **"Add another Path, Port, Variable, Label or Device"**
  - Selecione **Variable**
  - **Name:** Admin Port Number
  - **Key:** `ADMIN_PORT`
  - **Value:** `4001`

- **(Opcional) Admin Username:**
  - Clique em **"Add another Path, Port, Variable, Label or Device"**
  - Selecione **Variable**
  - **Name:** Admin Username
  - **Key:** `ADMIN_USERNAME`
  - **Value:** `admin` (ou outro usuário de sua preferência)

- **(Opcional) Admin Password:**
  - Clique em **"Add another Path, Port, Variable, Label or Device"**
  - Selecione **Variable**
  - **Name:** Admin Password
  - **Key:** `ADMIN_PASSWORD`
  - **Value:** `sua_senha_segura_aqui`

**Configurações Adicionais:**

- **Restart Policy:**
  - Em **Show more settings...**, localize:
  - **Restart Policy:** Selecione `unless-stopped` para garantir que o container reinicie automaticamente

- **(Opcional) Link com MongoDB:**
  - Se o seu container MongoDB tem um nome específico (ex: `mongodb`), você pode criar um link direto
  - Em **Extra Parameters** (em "Show more settings..."), adicione:
    ```
    --link mongodb:mongodb
    ```
  - Se usar esta opção, altere o `MONGO_URI` para `mongodb://mongodb:27017/etnodb`

4. Clique em **Apply** para criar o container do EtnoTermos
5. Aguarde o download da imagem e inicialização

#### Passo 2: Verificar Instalação

1. No painel **Docker**, verifique se o container `etnotermos-app` está com status **Started** (ícone verde)
2. Clique no ícone do container e selecione **Logs**
3. Verifique se não há erros e procure por mensagens de sucesso como:
   ```
   Public server listening on port 4000
   Admin server listening on port 4001
   MongoDB connected successfully
   ```

**Se houver erro de conexão com MongoDB:**
- Verifique se o container MongoDB está rodando
- Confirme se a `MONGO_URI` está correta
- Teste a conectividade entre os containers

### Configuração Inicial

#### Passo 3: Acessar as Interfaces Web

Após a inicialização bem-sucedida:

1. **Interface Pública (Consulta - Read-Only):**
   - Abra seu navegador e acesse: `http://[IP-DO-UNRAID]:4000`
   - Esta interface permite visualizar e pesquisar termos, sem necessidade de autenticação

2. **Interface Admin (Gestão - CRUD Completo):**
   - Abra seu navegador e acesse: `http://[IP-DO-UNRAID]:4001`
   - Se você configurou autenticação, faça login com as credenciais definidas

*Substitua `[IP-DO-UNRAID]` pelo endereço IP do seu servidor UNRAID na rede local (ex: `192.168.1.100`)*

#### Passo 4: Inicializar o Banco de Dados

Para popular o banco de dados com os índices e dados iniciais, execute os comandos via console do container:

1. No painel **Docker**, clique no ícone do container `etnotermos-app`
2. Selecione **Console** e escolha **>_ /bin/sh**
3. No console que abrir, execute os seguintes comandos:

```bash
# Navegar para a pasta backend
cd /app/backend

# Criar índices no MongoDB
node scripts/create-indexes.js

# Popular com vocabulário controlado para etnoDB
node scripts/seed-controlled-vocab.js

# (Opcional) Popular com dados de exemplo
node scripts/seed.js

# Sair do console
exit
```

4. Após executar estes comandos, a aplicação estará pronta para uso

#### Passo 5: Verificar Funcionamento

1. Acesse a interface pública: `http://[IP-DO-UNRAID]:4000`
2. Você deverá ver:
   - Página inicial com opções de navegação
   - Barra de busca funcional
   - Lista de termos (se dados de exemplo foram carregados)

3. Acesse a interface admin: `http://[IP-DO-UNRAID]:4001`
4. Faça login (se configurou autenticação)
5. Você deverá ter acesso a:
   - Criação e edição de termos
   - Gestão de relacionamentos
   - Importação/exportação de dados
   - Dashboard administrativo

## 🔧 Construção Manual da Imagem (Alternativa)

Se a imagem pré-construída não estiver disponível ou você preferir construir localmente:

### Opção A: Usando Docker via Terminal SSH

1. Ative SSH no UNRAID (Settings → Management Access → Enable SSH)
2. Conecte-se via SSH: `ssh root@[IP-DO-UNRAID]`
3. Execute:

```bash
# Navegar para um diretório temporário
cd /tmp

# Clonar o repositório
git clone https://github.com/edalcin/etnotermos.git
cd etnotermos

# Construir a imagem
docker build -t etnotermos:latest -f docker/etnotermos.Dockerfile .

# Voltar para o diretório anterior
cd ..
rm -rf etnotermos
```

4. Agora você pode usar `etnotermos:latest` como **Repository** ao criar o container via interface web

### Opção B: Usando Docker Compose via SSH

1. Conecte-se via SSH ao UNRAID
2. Execute:

```bash
cd /mnt/user/appdata/etnotermos
git clone https://github.com/edalcin/etnotermos.git .
cd docker
docker-compose up -d
```

3. Os containers serão criados automaticamente com todas as configurações

## 🛡️ Segurança e Acesso Externo

### Acesso via Proxy Reverso (Recomendado)

Se você usa **Nginx Proxy Manager**, **Swag** ou outro proxy reverso no UNRAID:

1. Crie dois proxy hosts:
   - **etnotermos.seudominio.com** → `http://[IP-UNRAID]:4000` (interface pública)
   - **admin.etnotermos.seudominio.com** → `http://[IP-UNRAID]:4001` (interface admin)

2. Configure certificados SSL gratuitos com Let's Encrypt
3. Habilite autenticação básica adicional no proxy para a interface admin (segurança extra)

### Configuração de Firewall

- **Porta 4000**: Pode ser exposta para rede local ou internet (interface pública, read-only)
- **Porta 4001**: Deve ser restrita apenas à rede local ou protegida com VPN (interface admin com permissões de escrita)

## 🔄 Atualização

Para atualizar o EtnoTermos para uma nova versão:

1. No painel **Docker**, clique no ícone do container `etnotermos-app`
2. Selecione **Force Update**
3. Aguarde o download da nova imagem e reinicialização
4. Verifique os logs para garantir que tudo iniciou corretamente

Ou via SSH:

```bash
docker stop etnotermos-app
docker rm etnotermos-app
docker pull ghcr.io/edalcin/etnotermos:latest
# Recrie o container via interface web ou docker-compose
```

## 🔙 Backup

### Backup Automático do MongoDB

Recomenda-se configurar backups regulares do banco de dados MongoDB:

#### Usando User Scripts no UNRAID

1. Instale o plugin **User Scripts** (Community Applications)
2. Crie um novo script com o conteúdo:

```bash
#!/bin/bash

BACKUP_DIR="/mnt/user/backups/etnotermos"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MONGODB_CONTAINER="mongodb"  # ⚠️ Ajuste com o nome do seu container MongoDB

mkdir -p $BACKUP_DIR

# Fazer backup do MongoDB
docker exec $MONGODB_CONTAINER mongodump --out=/tmp/backup_$TIMESTAMP --db=etnodb

# Copiar backup para o host
docker cp $MONGODB_CONTAINER:/tmp/backup_$TIMESTAMP $BACKUP_DIR/

# Comprimir
cd $BACKUP_DIR
tar -czf backup_$TIMESTAMP.tar.gz backup_$TIMESTAMP
rm -rf backup_$TIMESTAMP

# Limpar backups antigos (manter 30 dias)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete

echo "Backup concluído: backup_$TIMESTAMP.tar.gz"
```

> **⚠️ IMPORTANTE**: Substitua `MONGODB_CONTAINER="mongodb"` pelo nome real do seu container MongoDB

3. Configure para executar diariamente (ex: 2h da manhã)

### Restaurar Backup

Para restaurar um backup:

```bash
# Via SSH no UNRAID
cd /mnt/user/backups/etnotermos
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz

# Substitua "mongodb" pelo nome do seu container MongoDB
MONGODB_CONTAINER="mongodb"

# Copiar para o container
docker cp backup_YYYYMMDD_HHMMSS $MONGODB_CONTAINER:/tmp/

# Restaurar
docker exec $MONGODB_CONTAINER mongorestore --db=etnodb --drop /tmp/backup_YYYYMMDD_HHMMSS/etnodb
```

## ❓ Solução de Problemas

### Container não inicia

1. **Verificar logs:**
   - No painel Docker, clique no container → **Logs**
   - Procure por mensagens de erro

2. **Verificar portas:**
   - Certifique-se de que as portas 4000 e 4001 não estão sendo usadas por outros containers
   - No terminal: `netstat -tulpn | grep -E '4000|4001'`

3. **Verificar conexão com MongoDB:**
   - Verifique se o container `etnotermos-mongodb` está rodando
   - Teste a conexão: `docker exec etnotermos-mongodb mongosh --eval "db.adminCommand('ping')"`

### Erro "Cannot connect to MongoDB" ou "Internal Server Error"

1. **Verificar caracteres especiais na senha:**
   - **CAUSA COMUM**: Senhas com caracteres especiais (`!`, `*`, `@`, `#`, etc.) não codificados
   - **SOLUÇÃO**: Codifique os caracteres especiais conforme a tabela acima
   - Exemplo correto: `qWtnJsbAs!85zg*6` → `qWtnJsbAs%2185zg%2A6`
   - String correta: `mongodb://etnodb:qWtnJsbAs%2185zg%2A6@192.168.1.10:27017/etnodb?authSource=etnodb`

2. **Verificar IP do host:**
   - Se usar `172.17.0.1`, teste: `ping 172.17.0.1` dentro do container
   - Ou use `--link` conforme descrito na seção 2.1

3. **Usar nome do container:**
   - Altere `MONGO_URI` para `mongodb://etnotermos-mongodb:27017/etnodb`
   - Adicione `--link etnotermos-mongodb:mongodb` em Extra Parameters

4. **Verificar logs do container:**
   - Docker → Container → Logs
   - Procure por erros de autenticação ou conexão
   - Mensagens como "MongoServerError: Authentication failed" indicam problema com credenciais

### Interface não carrega

1. **Verificar se CSS foi compilado:**
   - Entre no console do container: `docker exec -it etnotermos-app /bin/sh`
   - Verifique: `ls -la /app/backend/src/contexts/public/views/assets/css/`
   - Deve haver arquivos CSS compilados

2. **Limpar cache do navegador:**
   - Pressione `Ctrl+Shift+R` ou `Cmd+Shift+R` para forçar reload

3. **Verificar logs:**
   - Procure por erros relacionados a arquivos estáticos ou rotas não encontradas

## 📚 Recursos Adicionais

- **Documentação completa**: [README.md](../README.md)
- **Guia de deployment**: [deployment.md](./deployment.md)
- **Modelo de dados**: [specs/main/data-model.md](../specs/main/data-model.md)
- **Repositório GitHub**: https://github.com/edalcin/etnotermos

## 💬 Suporte

Para problemas, dúvidas ou sugestões:
- Abra uma **issue** no GitHub: https://github.com/edalcin/etnotermos/issues
- Consulte a documentação completa no repositório

---

**Desenvolvido para preservar e organizar o conhecimento etnobotânico das comunidades tradicionais do Brasil** 🌿
