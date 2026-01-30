#!/bin/bash

# 1. Tạo MongoDB Keyfile (Nếu chưa có)
if ! docker secret ls | grep -q mongo_key_secret; then
    echo "Creating Mongo Keyfile..."
    openssl rand -base64 756 > mongo-keyfile
    docker secret create mongo_key_secret mongo-keyfile
    rm mongo-keyfile
fi

# 2. Deploy Stack với biến môi trường
# Lưu ý: GitHub Actions sẽ truyền PG_PASSWORD, REDIS_PASSWORD... vào đây
docker stack deploy -c infrastructure.yml infra