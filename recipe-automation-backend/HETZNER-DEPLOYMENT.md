# Hetzner Server Deployment Guide

## Prerequisites

- Hetzner Cloud Server (Ubuntu 22.04 recommended)
- Domain name (optional, for SSL)
- SSH access to your server

## Step 1: Connect to Your Hetzner Server

```bash
ssh root@your-server-ip
```

## Step 2: Install Required Software

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Install Git
apt install git -y

# Install Nginx (for reverse proxy)
apt install nginx -y
```

## Step 3: Clone the Backend Repository

```bash
# Create app directory
mkdir -p /opt/apps
cd /opt/apps

# Clone your repository
git clone https://github.com/yourusername/recipe-automation-backend.git
cd recipe-automation-backend
```

## Step 4: Configure Environment Variables

```bash
# Copy the example env file
cp env.example .env

# Edit with your actual values
nano .env
```

Add your actual credentials:
```
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
```

## Step 5: Set Up Nginx Reverse Proxy

```bash
# Create Nginx config
nano /etc/nginx/sites-available/recipe-automation
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Or use your server IP

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
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/recipe-automation /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Step 6: Build and Start the Application

```bash
cd /opt/apps/recipe-automation-backend

# Build the Docker image
docker-compose build

# Start the application
docker-compose up -d

# Check if it's running
docker-compose ps
docker-compose logs -f
```

## Step 7: Set Up SSL (Optional but Recommended)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d your-domain.com
```

## Step 8: Update Your Frontend

Update your Netlify app to use your Hetzner server URL:

1. Go to your GitHub repository for the frontend
2. Edit `src/components/automation-dashboard.tsx`
3. Change the API URL from `/api/automation/start` to `https://your-domain.com/api/automation/start`
4. Commit and push the changes
5. Netlify will automatically redeploy

Or set it as an environment variable in Netlify:
- Go to Netlify Dashboard > Site Settings > Environment variables
- Add: `NEXT_PUBLIC_API_URL = https://your-domain.com`

## Step 9: Monitor and Maintain

### View logs:
```bash
docker-compose logs -f
```

### Restart service:
```bash
docker-compose restart
```

### Update application:
```bash
git pull
docker-compose build
docker-compose up -d
```

### Check automation status:
```bash
curl http://localhost:3001/api/automation/status
```

## Security Recommendations

1. **Set up firewall:**
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

2. **Create non-root user:**
```bash
adduser appuser
usermod -aG docker appuser
```

3. **Set up fail2ban:**
```bash
apt install fail2ban -y
```

## Troubleshooting

### If automation fails:
1. Check logs: `docker-compose logs`
2. Verify PinClicks credentials are correct
3. Check Notion API permissions
4. Ensure Gmail app password is valid

### If can't connect:
1. Check firewall settings
2. Verify Nginx is running: `systemctl status nginx`
3. Check Docker is running: `docker ps`

## Architecture Overview

```
[Netlify Frontend] 
     ↓ HTTPS
[Hetzner Server]
     ├── Nginx (Reverse Proxy)
     └── Docker Container
          ├── Express API Server
          ├── Playwright (Browser Automation)
          ├── Notion Integration
          └── Email Service
```

This setup provides:
- ✅ Full automation capabilities
- ✅ No timeout limitations
- ✅ Scheduled daily runs
- ✅ Secure API endpoints
- ✅ Email notifications
- ✅ Complete control over the environment
