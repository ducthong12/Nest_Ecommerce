#!/bin/bash

echo "📂 Current directory: $(pwd)"
ls -la

NETWORK_NAME="Docker-Network"
if ! docker network ls | grep -q "$NETWORK_NAME"; then
    echo "🌐 Creating Network: $NETWORK_NAME..."
    docker network create --driver overlay --attachable "$NETWORK_NAME"
else
    echo "✅ Network $NETWORK_NAME already exists."
fi

if [ -f "infrastructure/haproxy/haproxy.cfg" ]; then
    echo "🔧 Fixing HAProxy config EOF..."
    sed -i -e '$a\' infrastructure/haproxy/haproxy.cfg
fi

FILE_PATH_REDIS="infrastructure/redis/redis-stack.yml"
FILE_PATH_JAEGER="infrastructure/jaeger/jaeger-stack.yml"
FILE_PATH_PROMETHEUS="infrastructure/prometheus/prometheus-stack.yml"
FILE_PATH_GRAFANA="infrastructure/grafana/grafana-stack.yml"
FILE_PATH_ELASTIC="infrastructure/elasticsearch/elasticsearch-stack.yml"
FILE_PATH_MONITOR="infrastructure/monitoring/monitoring-stack.yml"
FILE_PATH_MONGO="infrastructure/mongo/mongo-stack.yml"
FILE_PATH_PG="infrastructure/pg/pg-stack.yml"
FILE_PATH_KAFKA="infrastructure/kafka/kafka-stack.yml"
# Lệnh deploy chính thức
# --prune: Tự động xóa các service cũ không còn dùng (Clean rác)
sudo -E docker stack deploy -c $FILE_PATH_REDIS infra --prune
sudo -E docker stack deploy -c $FILE_PATH_JAEGER infra --prune
sudo -E docker stack deploy -c $FILE_PATH_PROMETHEUS infra --prune
sudo -E docker stack deploy -c $FILE_PATH_GRAFANA infra --prune
sudo -E docker stack deploy -c $FILE_PATH_ELASTIC infra --prune
sudo -E docker stack deploy -c $FILE_PATH_MONITOR infra --prune
sudo -E docker stack deploy -c $FILE_PATH_MONGO infra --prune
sudo -E docker stack deploy -c $FILE_PATH_PG infra --prune
sudo -E docker stack deploy -c $FILE_PATH_KAFKA infra --prune
echo "✅ Deploy command sent!"
