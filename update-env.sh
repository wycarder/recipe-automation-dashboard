#!/bin/bash
cat > /opt/apps/recipe-automation-backend/.env << 'EOF'
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
