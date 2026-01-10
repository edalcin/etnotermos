# Multi-stage build for EtnoTermos application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY tailwind.config.js ./

# Install dependencies
RUN cd backend && npm ci --only=production && npm cache clean --force
RUN cd frontend && npm ci && npm cache clean --force

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Build Tailwind CSS
RUN cd frontend && npm run build:css

# Production stage
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose both ports
EXPOSE 4000 4001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start both contexts using the start script
CMD ["dumb-init", "node", "backend/src/start.js"]
