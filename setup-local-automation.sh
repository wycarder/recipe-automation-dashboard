#!/bin/bash

echo "🚀 Setting up Local PinClicks Automation..."

# Create local automation directory
mkdir -p local-automation
cd local-automation

# Copy the automation file
cp ../local-automation.js ./
cp ../local-automation-package.json ./package.json

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install chromium

# Create environment file template
echo "📝 Creating environment file template..."
cat > .env.example << EOF
# PinClicks Credentials
PINCLICKS_EMAIL=your_email@example.com
PINCLICKS_PASSWORD=your_password

# Hetzner Server (for sending CSVs)
SERVER_URL=http://178.156.141.138:3001
EOF

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy .env.example to .env and add your PinClicks credentials"
echo "2. Run: npm test (to test with Air Fryer Authority)"
echo "3. Or run: npm start (to run with custom websites)"
echo ""
echo "🔧 The automation will:"
echo "  - Open a visible Chrome browser on your computer"
echo "  - Log into PinClicks automatically"
echo "  - Search for recipes and download CSV files"
echo "  - Send the CSV files to your Hetzner server for processing"
echo "  - Your Hetzner server will parse the CSV and sync to Notion"
echo ""
echo "🎯 This gives you the best of both worlds:"
echo "  - Local browser automation (no server issues)"
echo "  - Remote processing and Notion integration"
