# Instalação do BioCultTermos v2.0 no UNRAID

> **⚠️ Descontinuado.** Este documento descreve o modelo de deploy standalone anterior (pré-julho/2026).
> O repositório BioCultTermos está congelado como produto e **não gera mais Dockerfile/imagem própria**
> — ver "Módulo Compartilhado via Git Submodule" no `README.md` e ADR-007 em `Arquitetura-BioCultural`.
> Deploy real acontece dentro de cada instância hospedeira (hoje: `BioCultDB/docker/Dockerfile.unidade`).
> Mantido só como referência histórica.

Guia passo a passo via interface web do UNRAID. Sem linha de comando necessária.

---

## Pré-requisitos

- UNRAID com Docker habilitado
- IP do servidor UNRAID na sua rede (ex: `192.168.1.100`)
- Um volume persistente em `/mnt/user/appdata/` para o arquivo do banco SQLite e os áudios (configurado no Passo 2)

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
| `SQLITE_DB_PATH` | `/data/db/unidade.sqlite` | Caminho do arquivo SQLite dentro do container. Deve ficar dentro do volume persistente **SQLite Database** configurado abaixo. |
| `ADMIN_USERNAME` | `curador1` | Nome do usuário admin |
| `ADMIN_PASSWORD` | `sua_senha_aqui` | Senha do admin (mín. 6 caracteres) |
| `NODE_ENV` | `production` | |

> **Sobre a senha:** o sistema faz o hash bcrypt automaticamente na inicialização. A senha em texto plano fica apenas na variável de ambiente do container (não é gravada em disco).

#### Opcionais

| Key | Value | Descrição |
|---|---|---|
| `ACQUISITION_CRON_SCHEDULE` | `0 3 * * *` | Horário de aquisição automática (padrão: 3h da manhã) |
| `LOG_LEVEL` | `info` | Nível de log (`debug`, `info`, `warn`, `error`) |

### Volumes (banco SQLite e armazenamento de áudio)

Clique em **"Add another Path, Port, Variable..."** → **Path** — adicione as duas entradas abaixo. Ambas garantem que os dados sobrevivem a updates e restarts do container:

| Name | Container Path | Host Path |
|---|---|---|
| SQLite Database | `/data/db` | `/mnt/user/appdata/etnotermos/data` |
| Audio Storage | `/data/audio` | `/mnt/user/appdata/BioCultTermos/audio` |

> O arquivo apontado por `SQLITE_DB_PATH` (`/data/db/unidade.sqlite`) fica dentro do volume **SQLite Database**. Sem esse mapeamento, o banco seria perdido a cada atualização do container.

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
   ```

**Se aparecer erro `ADMIN_USERS is not set or invalid`:**
- Verifique se `ADMIN_USERNAME` e `ADMIN_PASSWORD` foram adicionadas corretamente
- Edite o container e confirme as variáveis

**Se aparecer erro `SQLITE_DB_PATH is not set` ou falha ao abrir o banco:**
- Verifique se a variável `SQLITE_DB_PATH` aponta para um caminho dentro do volume **SQLite Database** (`/data/db/...`)
- Confirme que o volume `/data/db` → `/mnt/user/appdata/etnotermos/data` foi mapeado corretamente no container
- Verifique se o diretório do host tem permissão de escrita para o usuário do container

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

### Erro ao abrir o arquivo SQLite (permissão negada)

Se o log mostrar erro de permissão ao abrir `/data/db/unidade.sqlite`:

1. Confirme que o diretório host `/mnt/user/appdata/etnotermos/data` existe e pertence ao usuário `nobody:users` (padrão UNRAID):
   ```bash
   # SSH no UNRAID
   chown -R nobody:users /mnt/user/appdata/etnotermos
   ```
2. Reinicie o container `etnotermos`

### Container inicia mas admin não autentica

- Confirme que `ADMIN_USERNAME` e `ADMIN_PASSWORD` estão configurados
- Verifique os logs — deve aparecer a mensagem de inicialização sem erros de config
- Tente reiniciar o container após editar as variáveis

---

## Backup do banco SQLite

Como o arquivo `.sqlite` fica em um volume mapeado (`/mnt/user/appdata/etnotermos/data/unidade.sqlite`), o backup é uma cópia de arquivo — sem dump/restore de banco de dados.

Usando **User Scripts** (plugin Community Applications):

```bash
#!/bin/bash
BACKUP_DIR="/mnt/user/backups/BioCultTermos"
DATA_FILE="/mnt/user/appdata/etnotermos/data/unidade.sqlite"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Parar o container garante um arquivo consistente (sem WAL pendente)
docker stop etnotermos
cp "$DATA_FILE" "$BACKUP_DIR/unidade_$TIMESTAMP.sqlite"
cp "$DATA_FILE-wal" "$BACKUP_DIR/unidade_$TIMESTAMP.sqlite-wal" 2>/dev/null
docker start etnotermos

gzip "$BACKUP_DIR/unidade_$TIMESTAMP.sqlite"
find $BACKUP_DIR -name "unidade_*.sqlite.gz" -mtime +30 -delete
echo "Backup: $BACKUP_DIR/unidade_$TIMESTAMP.sqlite.gz"
```

> **Backup sem downtime:** para evitar parar o container, use o backup online do SQLite via `VACUUM INTO`, que gera uma cópia consistente sem interromper o serviço:
> ```bash
> docker exec etnotermos node -e "require('better-sqlite3')('/data/db/unidade.sqlite').exec(\"VACUUM INTO '/data/db/backup_$(date +%Y%m%d_%H%M%S).sqlite'\")"
> ```

Configure para rodar diariamente às 2h.

---

**Dúvidas ou problemas**: [GitHub Issues](https://github.com/edalcin/BioCultTermos/issues)
