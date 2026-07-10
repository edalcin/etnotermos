# Instalação do BioCultTermos v2.0 no UNRAID

Guia passo a passo via interface web do UNRAID. Sem linha de comando necessária.

---

## Pré-requisitos

- UNRAID com Docker habilitado
- Container **MongoDB** já instalado e rodando (database `etnodb`)
- IP do servidor UNRAID na sua rede (ex: `192.168.1.100`)

> Se o MongoDB ainda não estiver instalado, veja a seção [Instalar MongoDB](#instalar-mongodb) no final deste guia.

---

## Passo 1 — Construir a imagem

O BioCultTermos precisa ser construído a partir do código-fonte.

1. No UNRAID, abra **Settings → Management Access** e habilite **SSH**
2. Conecte via SSH:
   ```bash
   ssh root@192.168.1.100
   ```
3. Execute:
   ```bash
   cd /mnt/user/appdata
   git clone https://github.com/edalcin/BioCultTermos.git
   cd BioCultTermos
   docker build -t etnotermos:latest -f docker/etnotermos.Dockerfile .
   ```
4. Aguarde o build (5–10 minutos na primeira vez)

---

## Passo 2 — Criar o container no UNRAID

1. No painel UNRAID, clique em **Docker → Add Container**
2. Preencha os campos:

### Configurações básicas

| Campo | Valor |
|---|---|
| **Name** | `etnotermos` |
| **Repository** | `etnotermos:latest` |
| **Network Type** | `Bridge` |
| **Restart Policy** | `unless-stopped` |

### Portas

Clique em **"Add another Path, Port, Variable..."** → **Port** — adicione duas entradas:

| Name | Container Port | Host Port |
|---|---|---|
| Public (Apresentação) | `4000` | `4000` |
| Admin (Curadoria) | `4001` | `4001` |

### Variáveis de ambiente

Clique em **"Add another Path, Port, Variable..."** → **Variable** — adicione cada variável abaixo:

#### Obrigatórias

| Key | Value | Descrição |
|---|---|---|
| `MONGODB_URI` | `mongodb://172.17.0.1:27017/etnodb` | IP padrão do host no UNRAID. Ajuste se necessário. |
| `ADMIN_USERNAME` | `curador1` | Nome do usuário admin |
| `ADMIN_PASSWORD` | `sua_senha_aqui` | Senha do admin (mín. 6 caracteres) |
| `NODE_ENV` | `production` | |

> **Sobre a senha:** o sistema faz o hash bcrypt automaticamente na inicialização. A senha em texto plano fica apenas na variável de ambiente do container (não é gravada em disco).

#### Opcionais

| Key | Value | Descrição |
|---|---|---|
| `ACQUISITION_CRON_SCHEDULE` | `0 3 * * *` | Horário de aquisição automática (padrão: 3h da manhã) |
| `LOG_LEVEL` | `info` | Nível de log (`debug`, `info`, `warn`, `error`) |

### Volume (armazenamento de áudio)

Clique em **"Add another Path, Port, Variable..."** → **Path**:

| Name | Container Path | Host Path |
|---|---|---|
| Audio Storage | `/data/audio` | `/mnt/user/appdata/BioCultTermos/audio` |

3. Clique em **Apply**

---

## Passo 3 — Verificar a inicialização

1. No painel **Docker**, clique no container `etnotermos` → **Logs**
2. Aguarde ver mensagens como:
   ```
   Starting BioCultTermos dual-context servers...
   Spawned public  server → http://localhost:4000 (initializing...)
   Spawned admin   server → http://localhost:4001 (initializing...)
   BioCultTermos PUBLIC interface running on port 4000
   BioCultTermos ADMIN interface running on port 4001
   MongoDB connected
   ```

**Se aparecer erro `ADMIN_USERS is not set or invalid`:**
- Verifique se `ADMIN_USERNAME` e `ADMIN_PASSWORD` foram adicionadas corretamente
- Edite o container e confirme as variáveis

**Se aparecer erro de conexão com MongoDB:**
- Verifique se o container MongoDB está rodando
- Tente usar o IP `172.17.0.1` — é o IP padrão do host Docker no UNRAID
- Ou use o nome do container MongoDB com `--link` (ver [Solução de Problemas](#solução-de-problemas))

---

## Passo 4 — Acessar as interfaces

Substitua `192.168.1.100` pelo IP do seu UNRAID:

| Interface | URL | Acesso |
|---|---|---|
| **Apresentação** (pública) | `http://192.168.1.100:4000` | Aberto, sem login |
| **Curadoria** (admin) | `http://192.168.1.100:4001` | Login com `ADMIN_USERNAME` / `ADMIN_PASSWORD` |

---

## Passo 5 — Disparar aquisição inicial

O BioCultTermos lê os dados do BioCultDB automaticamente, mas você pode forçar a primeira aquisição:

1. Acesse `http://192.168.1.100:4001`
2. Faça login
3. Clique em **Aquisição → Executar agora**
4. Os termos do BioCultDB aparecerão como "candidatos" para curadoria

---

## Atualização

Para atualizar para uma nova versão:

1. SSH no UNRAID:
   ```bash
   cd /mnt/user/appdata/BioCultTermos
   git pull origin main
   docker build -t etnotermos:latest -f docker/etnotermos.Dockerfile .
   ```
2. No painel Docker, pare e reinicie o container `etnotermos`

---

## Solução de Problemas

### Erro de conexão com MongoDB

O container Docker não alcança `172.17.0.1`? Tente:

1. **Usar nome do container** — em **Extra Parameters** no UNRAID, adicione:
   ```
   --link nome-do-seu-mongodb:mongodb
   ```
   E mude `MONGODB_URI` para:
   ```
   mongodb://mongodb:27017/etnodb
   ```

2. **Verificar IP correto** do host Docker:
   ```bash
   # SSH no UNRAID
   ip addr show docker0
   ```

### Senha com caracteres especiais no MongoDB URI

Se o MongoDB tem autenticação e a senha contém `!`, `@`, `#`, `$`, etc., encode os caracteres:

| Char | Encoded |
|---|---|
| `!` | `%21` |
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `*` | `%2A` |

Exemplo: `mongodb://usuario:senha%21secreta@172.17.0.1:27017/etnodb?authSource=admin`

### Container inicia mas admin não autentica

- Confirme que `ADMIN_USERNAME` e `ADMIN_PASSWORD` estão configurados
- Verifique os logs — deve aparecer a mensagem de inicialização sem erros de config
- Tente reiniciar o container após editar as variáveis

---

## Instalar MongoDB

Se ainda não tiver MongoDB no UNRAID:

1. Docker → **Add Container**
2. Preencha:

| Campo | Valor |
|---|---|
| **Name** | `mongodb` |
| **Repository** | `mongo:7.0-alpine` |
| **Network Type** | `Bridge` |

3. Adicione Port: Container `27017` → Host `27017`
4. Adicione Path: Container `/data/db` → Host `/mnt/user/appdata/mongodb/data`
5. Clique em **Apply**

---

## Backup do MongoDB

Usando **User Scripts** (plugin Community Applications):

```bash
#!/bin/bash
BACKUP_DIR="/mnt/user/backups/BioCultTermos"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MONGODB_CONTAINER="mongodb"   # ajuste com o nome do seu container

mkdir -p $BACKUP_DIR
docker exec $MONGODB_CONTAINER mongodump --out=/tmp/bkp_$TIMESTAMP --db=etnodb
docker cp $MONGODB_CONTAINER:/tmp/bkp_$TIMESTAMP $BACKUP_DIR/
tar -czf $BACKUP_DIR/bkp_$TIMESTAMP.tar.gz -C $BACKUP_DIR bkp_$TIMESTAMP
rm -rf $BACKUP_DIR/bkp_$TIMESTAMP
find $BACKUP_DIR -name "bkp_*.tar.gz" -mtime +30 -delete
echo "Backup: $BACKUP_DIR/bkp_$TIMESTAMP.tar.gz"
```

Configure para rodar diariamente às 2h.

---

**Dúvidas ou problemas**: [GitHub Issues](https://github.com/edalcin/BioCultTermos/issues)
