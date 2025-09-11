const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Services
const automationService = require('./services/automation-service');
const notionService = require('./services/notion-service');
const emailService = require('./services/email-service');

// Setup logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://recipe-automation-dashboard.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean)
}));
app.use(express.json());

// Store active automation status
let automationStatus = {
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
    timestamp: new Date().toISOString()
  });
});

// Start automation endpoint
app.post('/api/automation/start', async (req, res) => {
  if (automationStatus.isRunning) {
    return res.status(400).json({
      error: 'Automation already running',
      status: automationStatus
    });
  }

  const { websites } = req.body;
  
  if (!websites || websites.length === 0) {
    return res.status(400).json({
      error: 'No websites provided'
    });
  }

  // Start automation in background
  automationStatus = {
    isRunning: true,
    currentWebsite: null,
    recipesCollected: 0,
    startTime: new Date().toISOString(),
    lastError: null,
    progress: 0
  };

  // Run automation asynchronously
  runAutomation(websites).catch(error => {
    logger.error('Automation failed:', error);
    automationStatus.lastError = error.message;
    automationStatus.isRunning = false;
  });

  res.json({
    success: true,
    message: `Automation started for ${websites.length} websites`,
    runId: Date.now(),
    status: automationStatus
  });
});

// Get automation status
app.get('/api/automation/status', (req, res) => {
  res.json(automationStatus);
});

// Stop automation
app.post('/api/automation/stop', (req, res) => {
  if (!automationStatus.isRunning) {
    return res.status(400).json({
      error: 'No automation running'
    });
  }

  automationStatus.isRunning = false;
  res.json({
    success: true,
    message: 'Automation stop requested'
  });
});

// Run automation function
async function runAutomation(websites) {
  logger.info(`Starting automation for ${websites.length} websites`);
  
  try {
    for (let i = 0; i < websites.length; i++) {
      if (!automationStatus.isRunning) {
        logger.info('Automation stopped by user');
        break;
      }

      const website = websites[i];
      automationStatus.currentWebsite = website.domain;
      automationStatus.progress = Math.round((i / websites.length) * 100);

      logger.info(`Processing ${website.domain} with keyword: ${website.keyword}`);
      
      // Scrape recipes from PinClicks
      const recipes = await automationService.scrapeRecipes(website);
      
      // Save to Notion
      if (recipes && recipes.length > 0) {
        await notionService.saveRecipes(recipes, website);
        automationStatus.recipesCollected += recipes.length;
      }
      
      // Add delay between websites to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Send completion email
    await emailService.sendReport({
      websitesProcessed: websites.length,
      recipesCollected: automationStatus.recipesCollected,
      duration: Date.now() - new Date(automationStatus.startTime).getTime()
    });

    logger.info('Automation completed successfully');
  } catch (error) {
    logger.error('Automation error:', error);
    automationStatus.lastError = error.message;
    throw error;
  } finally {
    automationStatus.isRunning = false;
    automationStatus.currentWebsite = null;
    automationStatus.progress = 100;
  }
}

// Schedule daily automation (optional)
if (process.env.ENABLE_SCHEDULED_AUTOMATION === 'true') {
  // Run every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running scheduled automation');
    // Load websites from your data source
    const websites = require('./data/websites.json');
    await runAutomation(websites);
  });
}

// Start server
app.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`);
  logger.info(`CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
