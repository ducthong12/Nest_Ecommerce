#!/bin/bash

# 1. In ra đường dẫn hiện tại để debug (nếu cần)
echo "📂 Current directory: $(pwd)"
ls -la

# 2. Tạo Mạng Docker (Nếu chưa có)
NETWORK_NAME="Docker-Network"
if ! docker network ls | grep -q "$NETWORK_NAME"; then
    echo "🌐 Creating Network: $NETWORK_NAME..."
    docker network create --driver overlay --attachable "$NETWORK_NAME"
else
    echo "✅ Network $NETWORK_NAME already exists."
fi

# 3. Tạo Secret cho Mongo (Nếu cần)
if ! docker secret ls | grep -q mongo_key_secret; then
    echo "🔑 Creating Mongo Keyfile..."
    openssl rand -base64 756 > mongo-keyfile
    docker secret create mongo_key_secret mongo-keyfile
    rm mongo-keyfile
fi

# 4. DEPLOY STACK
# Biến REDIS_PASSWORD đã được GitHub Actions nạp vào từ bước trước
echo "🚀 Deploying Stack with Redis Password..."

if [ -f "infrastructure/haproxy/haproxy.cfg" ]; then
    echo "🔧 Fixing HAProxy config EOF..."
    # sed -i -e '$a\' : Append a newline at the last line
    sed -i -e '$a\' infrastructure/haproxy/haproxy.cfg
fi

# Kiểm tra xem file nằm ở đâu (đề phòng runner đứng sai chỗ)
if [ -f "infrastructure.yml" ]; then
    FILE_PATH="infrastructure.yml"
elif [ -f "infrastructure/infrastructure.yml" ]; then
    FILE_PATH="infrastructure/infrastructure.yml"
else
    echo "❌ ERROR: Không tìm thấy file infrastructure.yml"
    exit 1
fi

# Lệnh deploy chính thức
# --prune: Tự động xóa các service cũ không còn dùng (Clean rác)
sudo -E docker stack deploy -c $FILE_PATH infra --prune

echo "✅ Deploy command sent!"
