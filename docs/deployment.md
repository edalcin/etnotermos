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

O script pergunta usuário, senha e URI do MongoDB, e grava `docker/.env` automaticamente.

Ou crie manualmente:

```bash
cp docker/.env.example docker/.env
# editar docker/.env com seus valores
```

Exemplo de `docker/.env`:

```
MONGODB_URI=mongodb://172.17.0.1:27017/etnodb
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
MongoDB connected
```

---

## Opção 2 — Direto no servidor (sem Docker)

### 2.1 Instalar Node.js e MongoDB

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# MongoDB 7.0
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
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
MONGODB_URI=mongodb://localhost:27017/etnodb
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
After=network.target mongod.service

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
After=network.target mongod.service

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

## Backup do MongoDB

`/opt/scripts/backup-BioCultTermos.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/BioCultTermos"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017}"

mkdir -p $BACKUP_DIR

mongodump --uri="$MONGODB_URI" --db=etnodb --out="$BACKUP_DIR/bkp_$TIMESTAMP"
tar -czf "$BACKUP_DIR/bkp_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "bkp_$TIMESTAMP"
rm -rf "$BACKUP_DIR/bkp_$TIMESTAMP"
find "$BACKUP_DIR" -name "bkp_*.tar.gz" -mtime +30 -delete

echo "Backup: $BACKUP_DIR/bkp_$TIMESTAMP.tar.gz"
```

```bash
sudo chmod +x /opt/scripts/backup-BioCultTermos.sh
# Cron diário às 2h
echo "0 2 * * * root /opt/scripts/backup-BioCultTermos.sh" | sudo tee /etc/cron.d/BioCultTermos-backup
```

### Restaurar

```bash
cd /opt/backups/BioCultTermos
tar -xzf bkp_YYYYMMDD_HHMMSS.tar.gz
mongorestore --uri="mongodb://localhost:27017" --db=etnodb --drop bkp_YYYYMMDD_HHMMSS/etnodb
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
