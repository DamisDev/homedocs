# Build di produzione — Vue 3 + Vite, servito staticamente da nginx.
# Contesto: repo root, per copiare packages/shared-types nella posizione
# relativa attesa dal path mapping di tsconfig.app.json (tipi soltanto).

FROM node:22-alpine AS builder
WORKDIR /repo
COPY packages/shared-types packages/shared-types
COPY apps/frontend/package*.json apps/frontend/
WORKDIR /repo/apps/frontend
RUN npm ci
COPY apps/frontend .
# Vite inlinea le var VITE_* nel bundle in fase di build, non a runtime:
# di default punta al backend esposto in locale su :3000 (docker-compose.prod.yml).
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=builder /repo/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
