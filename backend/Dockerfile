# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for native modules if needed
RUN apk add --no-cache python3 make g++ 

COPY package*.json ./
RUN npm ci

COPY . .

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Add a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Copy built files and dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/src ./src

# Create the uploads directory and set permissions
RUN mkdir -p public/uploads && \
    chown -R nodeuser:nodejs public

# Switch to the non-root user
USER nodeuser

# Expose the API port
EXPOSE 5000

# Set production environment
ENV NODE_ENV=production

# Graceful shutdown support requires Node to handle signals properly.
# The server.js should be the entry point.
CMD ["npm", "start"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1
