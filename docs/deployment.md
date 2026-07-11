# Guia de Deployment em Produção — BioCultTermos v2.0

---

## Opção 1 — Docker Compose (Recomendado)

### 1.1 Preparar o servidor

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# Nginx + Certbot
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 1.2 Clonar e configurar

```bash
cd /opt
git clone https://github.com/edalcin/BioCultTermos.git
cd BioCultTermos
```

Gerar o `docker/.env`:

```bash
node docker/create-admin-user.js
```

O script pergunta usuário e senha do admin, e grava `docker/.env` automaticamente. O caminho do arquivo SQLite (`SQLITE_DB_PATH`) pode ser ajustado manualmente no arquivo gerado.

Ou crie manualmente:

```bash
cp docker/.env.example docker/.env
# editar docker/.env com seus valores
```

Exemplo de `docker/.env`:

```
SQLITE_DB_PATH=/data/unidade.sqlite
ADMIN_USERNAME=curador1
ADMIN_PASSWORD=senha_segura_aqui
ACQUISITION_CRON_SCHEDULE=0 3 * * *
LOG_LEVEL=info
```

> Para produção com múltiplos usuários use `ADMIN_USERS` (JSON com hashes bcrypt):
> ```
> ADMIN_USERS=[{"username":"curador1","passwordHash":"$2b$10$..."},{"username":"curador2","passwordHash":"$2b$10$..."}]
> ```

### 1.3 Iniciar

```bash
cd docker
docker-compose up -d

# Acompanhar logs
docker-compose logs -f
```

### 1.4 Verificar inicialização

```bash
docker-compose logs etnotermos | tail -20
```

Esperar ver:
```
BioCultTermos PUBLIC interface running on port 4000
BioCultTermos ADMIN interface running on port 4001
```

---

## Opção 2 — Direto no servidor (sem Docker)

### 2.1 Instalar Node.js e dependências de build

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Toolchain de build para addons nativos (better-sqlite3)
sudo apt install -y python3 build-essential
```

### 2.2 Instalar dependências e compilar CSS

```bash
cd /opt/BioCultTermos

cd backend && npm install --omit=dev && cd ..
cd frontend && npm install && npm run build:css && cd ..
```

### 2.3 Variáveis de ambiente

Criar `/opt/BioCultTermos/backend/.env`:

```
SQLITE_DB_PATH=/opt/BioCultTermos/data/unidade.sqlite
ADMIN_USERNAME=curador1
ADMIN_PASSWORD=senha_segura
NODE_ENV=production
PUBLIC_PORT=4000
ADMIN_PORT=4001
```

### 2.4 Serviços systemd

`/etc/systemd/system/BioCultTermos-public.service`:

```ini
[Unit]
Description=BioCultTermos Public Server (porta 4000)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/BioCultTermos/backend
EnvironmentFile=/opt/BioCultTermos/backend/.env
ExecStart=/usr/bin/node src/contexts/public/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/BioCultTermos-admin.service`:

```ini
[Unit]
Description=BioCultTermos Admin Server (porta 4001)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/BioCultTermos/backend
EnvironmentFile=/opt/BioCultTermos/backend/.env
ExecStart=/usr/bin/node src/contexts/admin/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now BioCultTermos-public BioCultTermos-admin
```

---

## Nginx como Proxy Reverso

`/etc/nginx/sites-available/BioCultTermos`:

```nginx
limit_req_zone $binary_remote_addr zone=public:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=admin:10m   rate=30r/m;

# Interface pública
server {
    listen 80;
    server_name BioCultTermos.seu-dominio.com.br;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name BioCultTermos.seu-dominio.com.br;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        limit_req zone=public burst=20 nodelay;
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Interface admin
server {
    listen 443 ssl http2;
    server_name admin.BioCultTermos.seu-dominio.com.br;

    # Restringir a IPs da rede local (recomendado)
    # allow 192.168.1.0/24;
    # deny all;

    location / {
        limit_req zone=admin burst=10 nodelay;
        proxy_pass http://127.0.0.1:4001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/BioCultTermos /etc/nginx/sites-enabled/
sudo certbot --nginx -d BioCultTermos.seu-dominio.com.br -d admin.BioCultTermos.seu-dominio.com.br
sudo systemctl reload nginx
```

---

## Atualização

### Via Docker

```bash
cd /opt/BioCultTermos
git pull origin main
cd docker
docker-compose pull   # Se usar imagem do ghcr.io
# ou
docker-compose build  # Se construir localmente
docker-compose up -d
```

### Via systemd

```bash
cd /opt/BioCultTermos
git pull origin main
cd backend && npm install --omit=dev && cd ..
cd frontend && npm run build:css && cd ..
sudo systemctl restart BioCultTermos-public BioCultTermos-admin
```

---

## Backup do SQLite

O banco é um único arquivo `.sqlite` por unidade federada (`SQLITE_DB_PATH`, ex.: `/data/unidade.sqlite`). Dois métodos:

### Método 1 — Copiar o arquivo (app parado)

Mais simples; parar os serviços evita copiar o arquivo em meio a uma escrita (WAL).

```bash
sudo systemctl stop BioCultTermos-public BioCultTermos-admin   # ou: docker-compose stop
cp /data/unidade.sqlite /opt/backups/BioCultTermos/unidade-$(date +%F).sqlite
sudo systemctl start BioCultTermos-public BioCultTermos-admin  # ou: docker-compose start
```

### Método 2 — `VACUUM INTO` (online, sem downtime)

O SQLite gera uma cópia consistente sem parar a aplicação, mesmo com WAL ativo:

```bash
sqlite3 unidade.sqlite "VACUUM INTO '/backups/unidade-$(date +%F).sqlite'"
```

`/opt/scripts/backup-BioCultTermos.sh`:

```bash
#!/bin/bash
DB_PATH="${SQLITE_DB_PATH:-/data/unidade.sqlite}"
BACKUP_DIR="/opt/backups/BioCultTermos"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

sqlite3 "$DB_PATH" "VACUUM INTO '$BACKUP_DIR/unidade_$TIMESTAMP.sqlite'"
gzip "$BACKUP_DIR/unidade_$TIMESTAMP.sqlite"
find "$BACKUP_DIR" -name "unidade_*.sqlite.gz" -mtime +30 -delete

echo "Backup: $BACKUP_DIR/unidade_$TIMESTAMP.sqlite.gz"
```

```bash
sudo chmod +x /opt/scripts/backup-BioCultTermos.sh
# Cron diário às 2h
echo "0 2 * * * root /opt/scripts/backup-BioCultTermos.sh" | sudo tee /etc/cron.d/BioCultTermos-backup
```

### Restaurar

Parar os serviços, substituir o arquivo pelo backup e reiniciar:

```bash
sudo systemctl stop BioCultTermos-public BioCultTermos-admin   # ou: docker-compose stop
gunzip -c /opt/backups/BioCultTermos/unidade_YYYYMMDD_HHMMSS.sqlite.gz > /data/unidade.sqlite
sudo systemctl start BioCultTermos-public BioCultTermos-admin  # ou: docker-compose start
```

---

## Monitoramento

```bash
# Health check
curl http://localhost:4000/health

# Logs (Docker)
docker-compose -f docker/docker-compose.yml logs -f

# Logs (systemd)
sudo journalctl -u BioCultTermos-public -f
sudo journalctl -u BioCultTermos-admin -f
```

---

## Segurança

```bash
# Firewall (UFW)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Porta admin (4001) nunca deve ser exposta diretamente — apenas via proxy reverso
# com restrição de IP ou VPN
```

---

**Dúvidas**: [GitHub Issues](https://github.com/edalcin/BioCultTermos/issues)
