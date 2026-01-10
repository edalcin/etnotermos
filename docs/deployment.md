# EtnoTermos - Guia de Implantação em Produção

Este guia fornece instruções para implantar o EtnoTermos em um ambiente de produção.

## Arquitetura de Produção

```
┌─────────────────────────────────────────────────┐
│              Load Balancer / Nginx              │
│        (SSL/TLS, HTTPS, Rate Limiting)         │
└────────────────────┬───────────────────────────┘
                     │
         ┌───────────┴──────────┐
         │                      │
    ┌────▼────┐           ┌────▼────┐
    │ Public  │           │  Admin  │
    │ Context │           │ Context │
    │ (4000)  │           │ (4001)  │
    └────┬────┘           └────┬────┘
         │                     │
         └──────────┬──────────┘
                    │
              ┌─────▼─────┐
              │  MongoDB  │
              │  (27017)  │
              └───────────┘
```

## Pré-requisitos

### Hardware Recomendado

- **CPU**: 2-4 cores
- **RAM**: 4-8 GB
- **Armazenamento**: 20-50 GB SSD (depende do volume de termos)
- **Rede**: Conexão estável com banda suficiente

### Software Necessário

- Docker 24.0+
- Docker Compose 2.0+
- Git
- Nginx (ou outro proxy reverso)
- Certbot (para certificados SSL gratuitos)

## Opções de Implantação

### Opção 1: Docker Compose (Recomendado)

#### 1.1 Preparar o Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Instalar Nginx
sudo apt install nginx -y

# Instalar Certbot para SSL
sudo apt install certbot python3-certbot-nginx -y
```

#### 1.2 Clonar o Repositório

```bash
cd /opt
sudo git clone https://github.com/edalcin/etnotermos.git
cd etnotermos
```

#### 1.3 Configurar Variáveis de Ambiente

Crie o arquivo `.env` em `backend/`:

```bash
# MongoDB
MONGO_URI=mongodb://mongodb:27017/etnodb
MONGO_INITDB_ROOT_USERNAME=etnotermos
MONGO_INITDB_ROOT_PASSWORD=senha_forte_mongodb_aqui

# Server Ports (internos do container)
PUBLIC_PORT=4000
ADMIN_PORT=4001

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=senha_forte_admin_aqui

# Node Environment
NODE_ENV=production

# Security
HELMET_CSP_ENABLED=true
CORS_ORIGIN=https://seu-dominio.com.br

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua_senha_app

# Logging
LOG_LEVEL=info
```

#### 1.4 Configurar MongoDB com Autenticação

Edite `docker/docker-compose.yml` para adicionar autenticação:

```yaml
services:
  mongodb:
    image: mongo:7.0
    container_name: etnotermos-mongo
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_INITDB_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_INITDB_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: etnodb
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    ports:
      - "127.0.0.1:27017:27017"  # Bind apenas localhost
    networks:
      - etnotermos-network

  etnotermos:
    build:
      context: ..
      dockerfile: docker/etnotermos.Dockerfile
    container_name: etnotermos-app
    restart: always
    env_file:
      - ../backend/.env
    ports:
      - "127.0.0.1:4000:4000"  # Public (bind localhost)
      - "127.0.0.1:4001:4001"  # Admin (bind localhost)
    depends_on:
      - mongodb
    networks:
      - etnotermos-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  mongodb_data:
    driver: local

networks:
  etnotermos-network:
    driver: bridge
```

Crie `docker/mongo-init.js`:

```javascript
db = db.getSiblingDB('etnodb');

db.createUser({
  user: 'etnotermos',
  pwd: 'senha_forte_mongodb_aqui',
  roles: [
    {
      role: 'readWrite',
      db: 'etnodb'
    }
  ]
});
```

#### 1.5 Iniciar os Serviços

```bash
cd docker
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Verificar status
docker-compose ps
```

#### 1.6 Inicializar o Banco de Dados

```bash
# Entrar no container
docker exec -it etnotermos-app bash

# Criar índices
node scripts/create-indexes.js

# Popular com vocabulário controlado
node scripts/seed-controlled-vocab.js

# (Opcional) Dados de exemplo
node scripts/seed.js

exit
```

### Opção 2: Configuração Manual (Sem Docker)

#### 2.1 Instalar Dependências

```bash
# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar MongoDB 7.0
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 2.2 Configurar a Aplicação

```bash
cd /opt/etnotermos

# Instalar dependências backend
cd backend
npm install --production

# Instalar dependências frontend
cd ../frontend
npm install
npm run build:css

# Copiar CSS compilado para backend
cp -r dist/css ../backend/public/css
```

#### 2.3 Configurar Serviços Systemd

Crie `/etc/systemd/system/etnotermos-public.service`:

```ini
[Unit]
Description=EtnoTermos Public Server
After=network.target mongodb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/etnotermos/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/contexts/public/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Crie `/etc/systemd/system/etnotermos-admin.service`:

```ini
[Unit]
Description=EtnoTermos Admin Server
After=network.target mongodb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/etnotermos/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/contexts/admin/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Ativar e iniciar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable etnotermos-public etnotermos-admin
sudo systemctl start etnotermos-public etnotermos-admin

# Verificar status
sudo systemctl status etnotermos-public
sudo systemctl status etnotermos-admin
```

## Configuração do Nginx como Proxy Reverso

### 3.1 Criar Configuração do Nginx

Crie `/etc/nginx/sites-available/etnotermos`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=admin_limit:10m rate=50r/m;

# Public Server
server {
    listen 80;
    listen [::]:80;
    server_name etnotermos.seu-dominio.com.br;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name etnotermos.seu-dominio.com.br;

    # SSL Configuration (Certbot will add these)
    # ssl_certificate /etc/letsencrypt/live/etnotermos.seu-dominio.com.br/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/etnotermos.seu-dominio.com.br/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Static files
    location /css/ {
        alias /opt/etnotermos/frontend/dist/css/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /images/ {
        alias /opt/etnotermos/frontend/src/public/assets/images/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_req_status 429;

        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Main application
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin Server (Restrição de IP opcional)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.etnotermos.seu-dominio.com.br;

    # SSL Configuration (Certbot will add these)

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Optional: Restrict to specific IPs
    # allow 192.168.1.0/24;
    # allow 10.0.0.0/8;
    # deny all;

    # Admin API rate limiting
    location /api/ {
        limit_req zone=admin_limit burst=10 nodelay;
        limit_req_status 429;

        proxy_pass http://127.0.0.1:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Admin interface
    location / {
        proxy_pass http://127.0.0.1:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3.2 Ativar Site e Obter SSL

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/etnotermos /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Obter certificado SSL (substitua os domínios)
sudo certbot --nginx -d etnotermos.seu-dominio.com.br -d admin.etnotermos.seu-dominio.com.br

# Recarregar Nginx
sudo systemctl reload nginx
```

## Backup e Recuperação

### 4.1 Backup Automático do MongoDB

Crie `/opt/scripts/backup-mongodb.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/opt/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MONGO_URI="mongodb://etnotermos:senha@localhost:27017/etnodb"

mkdir -p $BACKUP_DIR

# Backup com mongodump
mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/backup_$TIMESTAMP"

# Comprimir
cd $BACKUP_DIR
tar -czf "backup_$TIMESTAMP.tar.gz" "backup_$TIMESTAMP"
rm -rf "backup_$TIMESTAMP"

# Manter apenas últimos 30 dias
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: backup_$TIMESTAMP.tar.gz"
```

Configure cron job:

```bash
sudo chmod +x /opt/scripts/backup-mongodb.sh
sudo crontab -e

# Adicionar linha (backup diário às 2h)
0 2 * * * /opt/scripts/backup-mongodb.sh >> /var/log/etnotermos-backup.log 2>&1
```

### 4.2 Restaurar Backup

```bash
# Descompactar
cd /opt/backups/mongodb
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz

# Restaurar
mongorestore --uri="mongodb://etnotermos:senha@localhost:27017/etnodb" --drop backup_YYYYMMDD_HHMMSS/etnodb
```

## Monitoramento

### 5.1 Health Checks

```bash
# Verificar saúde da aplicação
curl http://localhost:4000/health

# Verificar saúde do MongoDB
curl http://localhost:4000/health | jq '.checks.mongodb'
```

### 5.2 Logs

```bash
# Logs da aplicação (Docker)
docker-compose logs -f etnotermos

# Logs da aplicação (Systemd)
sudo journalctl -u etnotermos-public -f
sudo journalctl -u etnotermos-admin -f

# Logs do MongoDB
sudo journalctl -u mongod -f

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 5.3 Alertas (Opcional)

Configure Prometheus + Grafana ou use serviços como:
- UptimeRobot (gratuito para monitoramento básico)
- Datadog
- New Relic

## Segurança

### 6.1 Firewall

```bash
# UFW (Ubuntu Firewall)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 6.2 Fail2Ban (Proteção contra Brute Force)

```bash
sudo apt install fail2ban -y

# Configurar filtro para admin
sudo nano /etc/fail2ban/jail.local
```

Adicionar:

```ini
[nginx-admin]
enabled = true
port = http,https
filter = nginx-admin
logpath = /var/log/nginx/access.log
maxretry = 3
bantime = 3600
```

### 6.3 Atualizações Regulares

```bash
# Agendar atualizações automáticas de segurança
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Troubleshooting

### Aplicação não inicia

```bash
# Verificar portas
sudo netstat -tulpn | grep :4000
sudo netstat -tulpn | grep :4001

# Verificar logs
docker-compose logs etnotermos

# Verificar variáveis de ambiente
docker exec etnotermos-app env | grep MONGO
```

### MongoDB desconectado

```bash
# Verificar status
sudo systemctl status mongod

# Verificar conexão
mongosh mongodb://localhost:27017/etnodb

# Verificar uso de disco
df -h
```

### SSL não funciona

```bash
# Renovar certificado
sudo certbot renew

# Verificar configuração
sudo nginx -t

# Verificar permissões
sudo ls -la /etc/letsencrypt/live/
```

## Manutenção

### Atualizar Aplicação

```bash
cd /opt/etnotermos
sudo git pull origin main

# Docker
cd docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Manual
cd backend
npm install --production
cd ../frontend
npm run build:css
sudo systemctl restart etnotermos-public etnotermos-admin
```

### Otimizar MongoDB

```bash
# Compactar coleções (executa offline)
mongosh mongodb://localhost:27017/etnodb

use etnodb
db.etnotermos.compact()
db.relationships.compact()
```

---

**Suporte**: Para problemas, abra uma issue em https://github.com/edalcin/etnotermos/issues
