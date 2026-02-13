# --- Stage 1: Base & Dependencies ---
FROM node:20-alpine AS base

# Cài thư viện hệ thống cần thiết (giữ lại cho stage runner)
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package*.json ./

# Cài đặt toàn bộ dependencies bao gồm cả devDependencies để build
RUN npm ci

# --- Stage 2: Builder ---
FROM base AS builder

WORKDIR /app
# Copy toàn bộ source code
COPY . .

# 1. Generate Prisma Client
# Lệnh này sẽ in ra log nếu thành công, giúp bạn theo dõi
RUN if [ -f "apps/order/prisma/schema.prisma" ]; then \
      echo "🟢 Generating Prisma client for order..."; \
      npx prisma generate --schema=apps/order/prisma/schema.prisma; \
    else \
      echo "🟡 No Prisma schema found for order, skipping..."; \
    fi

# 2. Build App
RUN npm run build order

# --- Stage 3: Production Runner ---
# Dùng "FROM base" để kế thừa openssl và libc6-compat đã cài ở trên
FROM base AS runner

WORKDIR /app
ENV NODE_ENV production

# Copy node_modules (chứa Prisma Client đã generate) từ builder
COPY --from=builder /app/node_modules ./node_modules

# Copy folder build của app cụ thể vào folder dist của runner
# Cấu trúc: dist/apps/user/main.js -> dist/main.js
COPY --from=builder /app/dist/apps/order ./dist

# Chạy file main.js
# Dùng đường dẫn dist/main.js vì mình đã copy nội dung vào folder dist
CMD ["node", "dist/main"]
