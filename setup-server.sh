#!/bin/bash
# Recipe Automation Backend Server Setup Script

echo "🚀 Starting Recipe Automation Backend Setup..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
apt install -y curl git wget software-properties-common

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
apt install -y docker-compose

# Install Nginx
echo "🌐 Installing Nginx..."
apt install -y nginx

# Create app directory
echo "📁 Creating app directory..."
mkdir -p /opt/apps
cd /opt/apps

# Clone the backend repository
echo "📥 Cloning repository..."
git clone https://github.com/wycarder/recipe-automation-backend.git
cd recipe-automation-backend

# Create .env file
echo "🔐 Creating environment file..."
cat > .env << 'EOF'
# Server Configuration
PORT=3001
FRONTEND_URL=https://recipe-automation-dashboard.netlify.app

# PinClicks Credentials
PINCLICKS_EMAIL=wycarder@gmail.com
PINCLICKS_PASSWORD=bohfyn-ximjew-Xihpo5

# Notion API
NOTION_API_KEY=ntn_N781957006022eI7MwlJpg8IliYWnYIE5rDW4fTlfnfa2L
NOTION_RECIPES_DB_ID=1bd1d2152b8c807d86decc5a97d7fdac
NOTION_WEBSITES_DB_ID=1d31d2152b8c8023a4faf8d7829c2ada

# Gmail Configuration
GMAIL_USER=wycarder@gmail.com
GMAIL_APP_PASSWORD="fgre ltqz wjln pxsb"

# Automation Settings
ENABLE_SCHEDULED_AUTOMATION=true
EOF

# Set up Nginx
echo "⚙️ Configuring Nginx..."
cat > /etc/nginx/sites-available/recipe-automation << 'EOF'
server {
    listen 80;
    server_name 178.156.141.138;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for long-running automation
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/recipe-automation /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t && systemctl restart nginx

# Build and start the application
echo "🏗️ Building Docker image..."
cd /opt/apps/recipe-automation-backend
docker-compose build

echo "🚀 Starting application..."
docker-compose up -d

# Set up firewall
echo "🔒 Setting up firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

# Create a systemd service for auto-start
echo "⚙️ Creating systemd service..."
cat > /etc/systemd/system/recipe-automation.service << 'EOF'
[Unit]
Description=Recipe Automation Backend
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/apps/recipe-automation-backend
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
ExecReload=/usr/bin/docker-compose restart

[Install]
WantedBy=multi-user.target
EOF

systemctl enable recipe-automation

echo "✅ Setup complete!"
echo ""
echo "📊 Status:"
docker-compose ps
echo ""
echo "🌐 Your backend is now available at: http://178.156.141.138"
echo "📝 API Endpoints:"
echo "   - POST http://178.156.141.138/api/automation/start"
echo "   - GET  http://178.156.141.138/api/automation/status"
echo "   - GET  http://178.156.141.138/health"
echo ""
echo "📱 Update your Netlify app environment:"
echo "   NEXT_PUBLIC_API_URL=http://178.156.141.138"
