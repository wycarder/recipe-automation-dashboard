#!/bin/bash

echo "🚀 Deploying Fixed Automation Service..."

# Server details
SERVER_IP="178.156.141.138"
SERVER_USER="root"

echo "📦 Uploading fixed automation service..."
scp automation-service-fixed.tar.gz $SERVER_USER@$SERVER_IP:/root/

echo "🔧 Updating service on server..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
echo "📁 Extracting new automation service..."
cd /root
tar -xzf automation-service-fixed.tar.gz

echo "🐳 Rebuilding Docker container with fixes..."
cd recipe-automation-backend
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "✅ Service updated successfully!"
echo "🔍 Checking service status..."
docker-compose ps
docker-compose logs --tail=20

EOF

echo "🎉 Deployment complete! The fixed automation service is now running."
