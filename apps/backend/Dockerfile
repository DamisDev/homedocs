# Build di produzione — NestJS.
# Contesto: repo root (non apps/backend), per poter copiare packages/shared-types
# nella stessa posizione relativa attesa dal path mapping di tsconfig.json
# ("../../packages/shared-types/src/index.d.ts", tipi soltanto, erasi a runtime).

FROM node:22-alpine AS builder
WORKDIR /repo
COPY packages/shared-types packages/shared-types
COPY apps/backend/package*.json apps/backend/
WORKDIR /repo/apps/backend
RUN npm ci
COPY apps/backend .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /repo/apps/backend/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
