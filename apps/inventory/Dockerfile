# --- Stage 1: Base & Dependencies
FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package*.json ./

RUN npm ci

# --- Stage 2: Builder
FROM base AS builder

WORKDIR /app

COPY . .

RUN if [ -f "apps/inventory/prisma/schema.prisma" ]; then \
  echo "🟢 Generating Prisma client for inventory..."; \
  npx prisma generate --schema=apps/inventory/prisma/schema.prisma; \
else \
  echo "🟡 No Prisma schema found for inventory, skipping..."; \
fi

RUN npm run build inventory

# --- Stage 3: Production
FROM base AS runner

WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist/apps/inventory ./dist

CMD ["node", "dist/main"]
