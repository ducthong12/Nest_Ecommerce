#!/bin/bash

# 1. Tạo MongoDB Keyfile (Nếu chưa có)
if ! docker secret ls | grep -q mongo_key_secret; then
    echo "Creating Mongo Keyfile..."
    openssl rand -base64 756 > mongo-keyfile
    docker secret create mongo_key_secret mongo-keyfile
    rm mongo-keyfile
fi

# Ví dụ đổi tên thành: Docker-Network
NETWORK_NAME="Docker-Network"  

# Kiểm tra xem mạng đã có chưa
if ! docker network ls | grep -q "$NETWORK_NAME"; then
    echo "Creating Network: $NETWORK_NAME..."
    # Tạo mạng với tên mới
    docker network create --driver overlay --attachable "$NETWORK_NAME"
else
    echo "Network $NETWORK_NAME already exists."
fi

# 2. Deploy Stack với biến môi trường
# Lưu ý: GitHub Actions sẽ truyền PG_PASSWORD, REDIS_PASSWORD... vào đây
docker stack deploy -c infrastructure/infrastructure.yml infra