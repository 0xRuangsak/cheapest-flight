# Multi-stage Dockerfile for Go backend + Next.js frontend

# Stage 1: Node.js for Turborepo and Next.js
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies
RUN npm install

# Copy frontend source
COPY apps/frontend ./apps/frontend
COPY packages ./packages

# Build frontend
RUN npm run build --workspace=frontend

# Stage 2: Go backend builder
FROM golang:1.21-alpine AS backend-builder
WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY apps/backend/go.mod apps/backend/go.sum ./
RUN go mod download

# Copy backend source
COPY apps/backend ./

# Build backend
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Stage 3: Final runtime image
FROM alpine:latest
WORKDIR /app

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

# Copy built binaries
COPY --from=backend-builder /app/main ./backend
COPY --from=frontend-builder /app/apps/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/apps/frontend/public ./frontend/public
COPY --from=frontend-builder /app/apps/frontend/package.json ./frontend/

# Expose ports
EXPOSE 8080 3000

# Start both services (we'll use docker-compose for this)
CMD ["./backend"]