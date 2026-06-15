# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage — let Nginx handle it (see below)
FROM scratch AS export
COPY --from=builder /app/build ./build