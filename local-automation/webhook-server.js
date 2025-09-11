const express = require('express');
const cors = require('cors');
const LocalAutomationService = require('./local-automation');
require('dotenv').config();

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Global automation instance
let automationService = null;
let isRunning = false;
let currentStatus = {
  isRunning: false,
  currentWebsite: null,
  recipesCollected: 0,
  startTime: null,
  lastError: null,
  progress: 0
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    automation: currentStatus
  });
});

// Start automation endpoint
app.post('/api/automation/start', async (req, res) => {
  if (isRunning) {
    return res.status(400).json({
      error: 'Automation already running',
      status: currentStatus
    });
  }

  const { websites } = req.body;

  if (!websites || websites.length === 0) {
    return res.status(400).json({
      error: 'No websites provided'
    });
  }

  console.log(`🚀 Starting automation for ${websites.length} websites...`);
  
  // Update status
  isRunning = true;
  currentStatus = {
    isRunning: true,
    currentWebsite: null,
    recipesCollected: 0,
    startTime: new Date().toISOString(),
    lastError: null,
    progress: 0
  };

  // Start automation in background
  runAutomation(websites).catch(error => {
    console.error('❌ Automation failed:', error);
    currentStatus.lastError = error.message;
    currentStatus.isRunning = false;
    isRunning = false;
  });

  res.json({
    success: true,
    message: `Automation started for ${websites.length} websites`,
    runId: Date.now(),
    status: currentStatus
  });
});

// Stop automation endpoint
app.post('/api/automation/stop', (req, res) => {
  if (!isRunning) {
    return res.json({
      success: true,
      message: 'No automation running'
    });
  }

  console.log('🛑 Stopping automation...');
  
  if (automationService) {
    automationService.close().catch(console.error);
  }

  isRunning = false;
  currentStatus.isRunning = false;
  currentStatus.lastError = 'Stopped by user';

  res.json({
    success: true,
    message: 'Automation stop requested'
  });
});

// Get automation status
app.get('/api/automation/status', (req, res) => {
  res.json(currentStatus);
});

// Run automation function
async function runAutomation(websites) {
  try {
    automationService = new LocalAutomationService();
    
    // Override the updateServerStatus method to update our local status
    automationService.updateServerStatus = (status) => {
      currentStatus = { ...currentStatus, ...status };
      console.log(`📊 Status update:`, status);
    };

    await automationService.runAutomation(websites);
    
    console.log('✅ Automation completed successfully');
  } catch (error) {
    console.error('❌ Automation error:', error);
    currentStatus.lastError = error.message;
  } finally {
    isRunning = false;
    currentStatus.isRunning = false;
    currentStatus.progress = 100;
    automationService = null;
  }
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Local webhook server running on http://localhost:${PORT}`);
  console.log(`📡 Ready to receive automation requests from Netlify frontend`);
  console.log(`🔗 Your Netlify frontend should connect to: http://YOUR_LOCAL_IP:${PORT}`);
  console.log(`💡 To find your local IP, run: ifconfig | grep "inet " | grep -v 127.0.0.1`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down webhook server...');
  if (automationService) {
    automationService.close().then(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
