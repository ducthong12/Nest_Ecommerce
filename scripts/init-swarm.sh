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
echo "🚀 Deploying Stack with Redis Password..."

if [ -f "infrastructure/haproxy/haproxy.cfg" ]; then
    echo "🔧 Fixing HAProxy config EOF..."
    sed -i -e '$a\' infrastructure/haproxy/haproxy.cfg
fi

FILE_PATH_REDIS="infrastructure/redis.yml"
FILE_PATH_MONITOR="infrastructure/monitoring-stack.yml"
FILE_PATH_MONGO="infrastructure/mongo-stack.yml"
FILE_PATH_PG="infrastructure/pg-stack.yml"
FILE_PATH_KAFKA="infrastructure/kafka-stack.yml"

# Lệnh deploy chính thức
# --prune: Tự động xóa các service cũ không còn dùng (Clean rác)
sudo -E docker stack deploy -c $FILE_PATH_REDIS infra --prune
sudo -E docker stack deploy -c $FILE_PATH_MONITOR infra --prune
sudo -E docker stack deploy -c $FILE_PATH_MONGO infra --prune
sudo -E docker stack deploy -c $FILE_PATH_PG infra --prune
sudo -E docker stack deploy -c $FILE_PATH_KAFKA infra --prune
echo "✅ Deploy command sent!"
