# Multi-stage Dockerfile for Go backend + Next.js frontend

# Stage 1: Node.js for Next.js frontend
FROM node:20-alpine AS frontend-base
WORKDIR /app

# Copy root package files for turborepo
COPY package*.json turbo.json ./

# Copy frontend package files
COPY apps/frontend/package*.json ./apps/frontend/

# Install all dependencies
RUN npm install

# Copy frontend source
COPY apps/frontend ./apps/frontend

# Stage 2: Frontend builder
FROM frontend-base AS frontend-builder
RUN npm run build --workspace=frontend

# Stage 3: Frontend development
FROM frontend-base AS frontend-dev
EXPOSE 3000
CMD ["npm", "run", "dev", "--workspace=frontend"]

# Stage 4: Go backend base
FROM golang:1.21-alpine AS backend-base
WORKDIR /app

# Install dependencies
RUN apk add --no-cache git ca-certificates

# Copy go mod files
COPY apps/backend/go.mod apps/backend/go.sum ./
RUN go mod download

# Copy backend source
COPY apps/backend ./

# Stage 5: Backend builder
FROM backend-base AS backend-builder
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Stage 6: Backend development
FROM backend-base AS backend-dev
EXPOSE 8080
CMD ["go", "run", "main.go"]

# Stage 7: Production backend
FROM alpine:latest AS backend-prod
WORKDIR /app
RUN apk --no-cache add ca-certificates
COPY --from=backend-builder /app/main ./
EXPOSE 8080
CMD ["./main"]

# Stage 8: Production frontend (nginx)
FROM nginx:alpine AS frontend-prod
COPY --from=frontend-builder /app/apps/frontend/.next /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]