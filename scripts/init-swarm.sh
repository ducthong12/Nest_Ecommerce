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

if [ -f "infrastructure/fluentd/Dockerfile" ]; then
    echo "🔨 Building custom Fluentd image (with ES plugin)..."
    # Thay 'ducthong12' bằng username dockerhub của bạn nếu cần
    docker build -t ducthong12/fluentd-es:latest infrastructure/fluentd/
    
    # Nếu chạy nhiều node worker, bạn cần push lên Hub để các node khác kéo về được
    docker push ducthong12/fluentd-es:latest
else
    echo "⚠️ Warning: No Dockerfile found for Fluentd. Skipping build."
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
FILE_PATH_FLUENTD="infrastructure/fluentd/fluentd-stack.yml"

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
if [ -f "$FILE_PATH_FLUENTD" ]; then
    sudo -E docker stack deploy -c $FILE_PATH_FLUENTD infra --prune
    echo "✅ Deployed Fluentd Logging"
else
    echo "❌ Fluentd config file not found at: $FILE_PATH_FLUENTD"
fi

echo "✅ Deploy command sent!"
