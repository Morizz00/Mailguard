# Multi-stage build for React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies
RUN npm ci || npm install

# Copy source files
COPY . .

# Build the frontend
RUN npm run build

# Output stage - just keep the dist folder
FROM alpine:latest

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# This image only exists to build the dist folder when using docker-compose
# The dist folder is mounted as a volume and used by the API service
CMD ["echo", "Frontend build complete. Dist folder is ready."]
