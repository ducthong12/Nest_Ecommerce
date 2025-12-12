# --- Stage 1: Base & Dependencies ---
FROM node:20-alpine AS base

# Cài đặt libc6-compat nếu cần thiết cho Prisma trên Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files để cài đặt dependencies trước (tận dụng Docker cache)
COPY package*.json ./
COPY prisma ./prisma/

# Cài đặt dependencies
RUN npm ci

# Generate Prisma Client (Rất quan trọng để Prisma hoạt động)
RUN npx prisma generate

# --- Stage 2: Build ---
FROM base AS builder

WORKDIR /app

# Copy toàn bộ source code (bao gồm apps, common, prisma, libs...)
COPY . .

# Copy node_modules từ stage trước
COPY --from=base /app/node_modules ./node_modules

# Nhận tên App cần build từ Docker Compose
ARG APP_NAME
RUN npm run build ${APP_NAME}

# --- Stage 3: Production Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

# Thiết lập biến môi trường
ENV NODE_ENV production

# Copy node_modules (chứa cả Prisma client đã generate)
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./

# Nhận tên App để copy đúng thư mục dist
ARG APP_NAME

# Copy folder dist của app tương ứng từ builder
COPY --from=builder /app/dist/apps/${APP_NAME} ./dist

# Command để chạy app
CMD ["node", "dist/main"]