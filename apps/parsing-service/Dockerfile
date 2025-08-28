# Multi-stage build for Parsing Service
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy application source
COPY apps/parsing-service ./apps/parsing-service
COPY libs/shared-types ./libs/shared-types

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Build the application
RUN npx nx build parsing-service --prod

# Production stage
FROM node:20-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist/apps/parsing-service ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api || exit 1

# Start the application
CMD ["node", "main.js"]