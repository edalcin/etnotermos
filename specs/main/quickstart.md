# EtnoTermos Quickstart Guide

**Date**: 2025-09-28
**Version**: 1.0.0
**Purpose**: Integration test validation and developer onboarding

This quickstart guide provides step-by-step instructions to set up, run, and validate the EtnoTermos system. It serves as both a developer onboarding tool and a comprehensive integration test for all system components.

## Prerequisites

### Required Software

- **Node.js**: 18.0.0 or later
- **Docker**: 20.10.0 or later
- **Docker Compose**: 2.0.0 or later
- **Git**: 2.30.0 or later

### Required Accounts

- **Google Cloud Console**: For OAuth setup
- **MongoDB Atlas** (optional): For production database

### System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space for containers and data
- **Network**: Internet access for dependency installation

## Quick Setup (5 minutes)

### 1. Clone and Environment Setup

```bash
# Clone repository
git clone https://github.com/edalcin/etnotermos.git
cd etnotermos

# Copy environment template
cp .env.example .env

# Install dependencies
npm run install:all
```

### 2. Configure Environment Variables

Edit `.env` file with your settings:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/etnotermos
MONGODB_TEST_URI=mongodb://localhost:27017/etnotermos_test

# Search Configuration
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=your-master-key

# Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret

# Application
NODE_ENV=development
API_PORT=3000
FRONTEND_PORT=3001
CORS_ORIGIN=http://localhost:3001

# Admin User (for initial setup)
ADMIN_EMAIL=admin@example.com
```

### 3. Start Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# Verify services are running
docker-compose ps
```

Expected output:

```
NAME                SERVICE             STATUS              PORTS
etnotermos-mongodb   mongodb             running             0.0.0.0:27017->27017/tcp
etnotermos-meilisearch meilisearch       running             0.0.0.0:7700->7700/tcp
etnotermos-backend   backend             running             0.0.0.0:3000->3000/tcp
etnotermos-frontend  frontend            running             0.0.0.0:3001->3001/tcp
```

### 4. Initialize Database

```bash
# Run database setup and seed data
npm run db:setup
npm run db:seed
```

This creates:

- Database indexes and collections
- Admin user account
- Sample ethnobotanical terms
- Test bibliographic sources
- Example relationships and notes

## Validation Tests

### Test 1: API Health Check

```bash
# Test backend health
curl http://localhost:3000/api/v1/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-09-28T10:00:00Z",
  "services": {
    "database": "connected",
    "search": "connected"
  }
}
```

### Test 2: Authentication Flow

```bash
# Test OAuth endpoint
curl http://localhost:3000/api/v1/auth/google

# Expected: Redirect to Google OAuth (302 status)

# Test with seeded admin token
export AUTH_TOKEN="your-admin-jwt-token"
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     http://localhost:3000/api/v1/auth/me

# Expected response:
{
  "id": "...",
  "email": "admin@example.com",
  "roles": [{"type": "admin", "level": "full"}]
}
```

### Test 3: Core Term Operations

```bash
# List terms
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     http://localhost:3000/api/v1/terms

# Expected: Array of seeded terms with pagination

# Get specific term
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     http://localhost:3000/api/v1/terms/SEED_TERM_ID?include=notes,relationships

# Create new term
curl -X POST \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": {
         "primary": "Cipó-cabeludo",
         "variants": ["Cipó cabeludo"],
         "languages": [
           {"code": "pt", "name": "Cipó-cabeludo"},
           {"code": "lat", "name": "Mikania hirsutissima"}
         ]
       },
       "definitions": [{
         "text": "Planta trepadeira da família Asteraceae, tradicionalmente usada para problemas respiratórios.",
         "language": "pt",
         "context": "Medicina tradicional brasileira"
       }],
       "categories": [{
         "type": "specific",
         "hierarchy": 2
       }],
       "culturalContext": {
         "communities": ["Quilombola"],
         "regions": ["Cerrado"],
         "usageContext": "Medicina tradicional"
       }
     }' \
     http://localhost:3000/api/v1/terms

# Expected: Created term with generated ID
```

### Test 4: Relationship Management

```bash
# Create relationship between terms
curl -X POST \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "toTermId": "TARGET_TERM_ID",
       "type": "broader",
       "properties": {
         "strength": 0.9,
         "context": "Taxonomic hierarchy",
         "confidence": "high"
       }
     }' \
     http://localhost:3000/api/v1/terms/SOURCE_TERM_ID/relationships

# Get term relationships
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     http://localhost:3000/api/v1/terms/TERM_ID/relationships?type=broader&direction=outgoing
```

### Test 5: Search Functionality

```bash
# Full-text search
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     "http://localhost:3000/api/v1/search?q=medicinal%20plant&limit=10"

# Faceted search
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     "http://localhost:3000/api/v1/search?q=*&filters[category]=specific&filters[region]=Cerrado&facets=community,category"

# Search suggestions
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     "http://localhost:3000/api/v1/search/suggest?q=cip"

# Expected: Array of autocomplete suggestions
```

### Test 6: Note Management

```bash
# Add note to term
curl -X POST \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "historical",
       "content": {
         "text": "Uso documentado desde o período colonial brasileiro.",
         "language": "pt"
       },
       "visibility": "public",
       "metadata": {
         "tags": ["história", "colonial"],
         "priority": 4
       }
     }' \
     http://localhost:3000/api/v1/terms/TERM_ID/notes

# Get term notes
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     http://localhost:3000/api/v1/terms/TERM_ID/notes?type=historical
```

### Test 7: Export Functionality

```bash
# Export as SKOS Turtle
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     "http://localhost:3000/api/v1/export/skos?format=turtle" \
     -o terms.ttl

# Export as CSV
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     "http://localhost:3000/api/v1/export/csv?fields=title,definition,category,community" \
     -o terms.csv

# Verify exports
file terms.ttl  # Should show: ASCII text
wc -l terms.csv # Should show number of exported terms
```

### Test 8: Administrative Functions

```bash
# Get dashboard statistics
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     http://localhost:3000/api/v1/admin/dashboard

# Expected response with system metrics:
{
  "statistics": {
    "totalTerms": 150,
    "totalUsers": 5,
    "totalRelationships": 200,
    "totalSources": 75
  },
  "recentActivity": [...],
  "culturalBreakdown": {...}
}

# List users (admin only)
curl -H "Authorization: Bearer $AUTH_TOKEN" \
     http://localhost:3000/api/v1/admin/users

# Create API key
curl -X POST \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Integration Key",
       "description": "For integration testing",
       "permissions": {
         "scopes": ["read:terms", "read:search"],
         "rateLimit": {"requests": 1000, "window": 3600000}
       }
     }' \
     http://localhost:3000/api/v1/admin/api-keys
```

### Test 9: Frontend Integration

```bash
# Access web interface
open http://localhost:3001

# Or test with curl
curl http://localhost:3001

# Expected: HTML page with React application
```

Navigate through the interface:

1. **Login**: Use Google OAuth or seeded admin account
2. **Browse Terms**: View term list with filters
3. **Search**: Try full-text search with various queries
4. **Term Details**: View term with relationships and notes
5. **Create Term**: Add new ethnobotanical term
6. **Admin Panel**: Access user management and statistics

### Test 10: Cultural Sensitivity Features

```bash
# Create term with cultural sensitivity
curl -X POST \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": {"primary": "Sacred Medicine Plant"},
       "definitions": [{
         "text": "Sacred plant used in traditional ceremonies",
         "context": "Traditional spiritual practices"
       }],
       "culturalContext": {
         "sensitivity": {
           "level": "sacred",
           "restrictions": "Ceremonial use only",
           "consentGiven": true
         }
       }
     }' \
     http://localhost:3000/api/v1/terms

# Verify access controls work
curl -H "Authorization: Bearer $STUDENT_TOKEN" \
     http://localhost:3000/api/v1/terms/SACRED_TERM_ID

# Expected: Limited access or filtered content
```

## Performance Validation

### Load Testing

```bash
# Install load testing tool
npm install -g autocannon

# Test term listing endpoint
autocannon -c 10 -d 30 \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  http://localhost:3000/api/v1/terms

# Test search endpoint
autocannon -c 5 -d 30 \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  "http://localhost:3000/api/v1/search?q=plant"

# Expected results:
# - Term listing: >100 req/sec, <200ms avg latency
# - Search: >50 req/sec, <1000ms avg latency
```

### Database Performance

```bash
# Check MongoDB indexes
docker exec etnotermos-mongodb mongosh --eval "
  use etnotermos;
  db.terms.getIndexes();
  db.terms.stats();
"

# Check Meilisearch status
curl http://localhost:7700/stats

# Expected: All indexes present, good performance metrics
```

## Troubleshooting

### Common Issues

**Services not starting:**

```bash
# Check Docker logs
docker-compose logs backend
docker-compose logs mongodb
docker-compose logs meilisearch

# Restart specific service
docker-compose restart backend
```

**Database connection issues:**

```bash
# Test MongoDB connection
docker exec etnotermos-mongodb mongosh --eval "db.runCommand('ping')"

# Check environment variables
grep MONGODB .env
```

**Authentication failures:**

```bash
# Verify Google OAuth setup
curl http://localhost:3000/api/v1/auth/google

# Check JWT token
echo $AUTH_TOKEN | base64 -d
```

**Search not working:**

```bash
# Check Meilisearch health
curl http://localhost:7700/health

# Rebuild search index
npm run search:rebuild
```

### Log Analysis

```bash
# Application logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f mongodb

# Search logs
docker-compose logs -f meilisearch

# System resource usage
docker stats
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check

# Security audit
npm audit
```

### Development Commands

```bash
# Start in development mode
npm run dev

# Watch for changes
npm run dev:watch

# Debug mode
npm run debug

# Database operations
npm run db:migrate
npm run db:seed
npm run db:reset
```

## Deployment Validation

### Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring and logging setup
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Cultural sensitivity review completed

### Health Checks

```bash
# All services healthy
curl https://api.etnotermos.org/health

# Database replication status
curl https://api.etnotermos.org/admin/health/database

# Search index status
curl https://api.etnotermos.org/admin/health/search

# SSL certificate validity
openssl s_client -connect api.etnotermos.org:443 -servername api.etnotermos.org
```

---

## Success Criteria

✅ **All tests pass** - API endpoints return expected responses
✅ **Authentication works** - Google OAuth and JWT token flows
✅ **CRUD operations** - Terms, notes, and relationships can be managed
✅ **Search functional** - Full-text search returns relevant results
✅ **Exports work** - SKOS and CSV exports generate valid files
✅ **Cultural sensitivity** - Access controls respect sensitivity levels
✅ **Performance meets targets** - <1s search, <500ms term lookup
✅ **Frontend operational** - Web interface loads and functions correctly

**Quickstart complete! Your EtnoTermos system is ready for development and use.**

For detailed API documentation, see the [OpenAPI specification](contracts/openapi.yaml).
For development guidelines, see the [CONTRIBUTING.md](../../CONTRIBUTING.md) file.
