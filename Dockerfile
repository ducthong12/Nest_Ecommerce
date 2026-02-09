# --- Stage 1: Base & Dependencies ---
FROM public.ecr.aws/docker/library/node:20-alpine AS base

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

# Khai báo ARG để biết đang build app nào
ARG APP_NAME

# 1. Generate Prisma Client
# Lệnh này sẽ in ra log nếu thành công, giúp bạn theo dõi
RUN if [ -f "apps/${APP_NAME}/prisma/schema.prisma" ]; then \
      echo "🟢 Generating Prisma client for ${APP_NAME}..."; \
      npx prisma generate --schema=apps/${APP_NAME}/prisma/schema.prisma; \
    else \
      echo "🟡 No Prisma schema found for ${APP_NAME}, skipping..."; \
    fi

# 2. Build App
RUN npm run build ${APP_NAME}

# --- Stage 3: Production Runner ---
# Dùng "FROM base" để kế thừa openssl và libc6-compat đã cài ở trên
FROM base AS runner

WORKDIR /app
ENV NODE_ENV production

# Phải khai báo lại ARG ở stage này mới sử dụng được
ARG APP_NAME

# Copy node_modules (chứa Prisma Client đã generate) từ builder
COPY --from=builder /app/node_modules ./node_modules

# Copy folder build của app cụ thể vào folder dist của runner
# Cấu trúc: dist/apps/user/main.js -> dist/main.js
COPY --from=builder /app/dist/apps/${APP_NAME} ./dist

# Chạy file main.js
# Dùng đường dẫn dist/main.js vì mình đã copy nội dung vào folder dist
CMD ["node", "dist/main"]
