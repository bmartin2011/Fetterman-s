# Multi-stage build for production optimization

# Stage 1: Build the React application
FROM node:18-alpine AS frontend-build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build:prod

# Stage 2: Build the server
FROM node:18-alpine AS server-build

# Set working directory
WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server source code
COPY server/ .

# Stage 3: Production image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy built frontend from first stage
COPY --from=frontend-build --chown=nextjs:nodejs /app/build ./public

# Copy server files from second stage
COPY --from=server-build --chown=nextjs:nodejs /app/server ./server

# Copy server node_modules
COPY --from=server-build --chown=nextjs:nodejs /app/server/node_modules ./server/node_modules

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node server/healthcheck.js

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the server with dumb-init
CMD ["dumb-init", "node", "server/index.js"]

# Labels for metadata
LABEL maintainer="Fetterman's Development Team"
LABEL version="1.0.0"
LABEL description="Fetterman's E-commerce Platform"