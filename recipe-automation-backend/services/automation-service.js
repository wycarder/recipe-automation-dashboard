const { chromium } = require('playwright');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

class AutomationService {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async initialize() {
    logger.info('Initializing browser...');
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    this.page = await this.context.newPage();
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  async loginToPinClicks() {
    const email = process.env.PINCLICKS_EMAIL;
    const password = process.env.PINCLICKS_PASSWORD;

    if (!email || !password) {
      throw new Error('PinClicks credentials not configured');
    }

    logger.info('Logging into PinClicks...');
    
    try {
      // Navigate to PinClicks
      await this.page.goto('https://pinclicks.com/login', { 
        waitUntil: 'networkidle' 
      });

      // Fill login form
      await this.page.fill('input[name="email"]', email);
      await this.page.fill('input[name="password"]', password);
      
      // Click login button
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation
      await this.page.waitForNavigation({ 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      logger.info('Successfully logged into PinClicks');
    } catch (error) {
      logger.error('Login failed:', error);
      throw new Error('Failed to login to PinClicks');
    }
  }

  async scrapeRecipes(website) {
    logger.info(`Scraping recipes from ${website.domain} with keyword: ${website.keyword}`);
    
    try {
      if (!this.browser) {
        await this.initialize();
        await this.loginToPinClicks();
      }

      // Navigate to search page
      await this.page.goto('https://pinclicks.com/search', {
        waitUntil: 'networkidle'
      });

      // Enter search parameters
      await this.page.fill('input[name="keyword"]', website.keyword);
      await this.page.fill('input[name="domain"]', website.domain);
      
      // Set quota if available
      if (website.quota) {
        await this.page.fill('input[name="limit"]', website.quota.toString());
      }

      // Start search
      await this.page.click('button[type="submit"]');
      
      // Wait for results
      await this.page.waitForSelector('.recipe-results', {
        timeout: 60000
      });

      // Extract recipe data
      const recipes = await this.page.evaluate(() => {
        const recipeElements = document.querySelectorAll('.recipe-item');
        return Array.from(recipeElements).map(el => ({
          title: el.querySelector('.recipe-title')?.textContent?.trim() || '',
          url: el.querySelector('.recipe-url')?.href || '',
          description: el.querySelector('.recipe-description')?.textContent?.trim() || '',
          imageUrl: el.querySelector('.recipe-image')?.src || '',
          author: el.querySelector('.recipe-author')?.textContent?.trim() || '',
          publishDate: el.querySelector('.recipe-date')?.textContent?.trim() || '',
          keyword: document.querySelector('input[name="keyword"]')?.value || '',
          sourceDomain: document.querySelector('input[name="domain"]')?.value || '',
          collectedAt: new Date().toISOString()
        }));
      });

      logger.info(`Collected ${recipes.length} recipes from ${website.domain}`);
      return recipes;

    } catch (error) {
      logger.error(`Error scraping ${website.domain}:`, error);
      return [];
    }
  }

  async scrapeAllWebsites(websites) {
    const results = [];
    
    try {
      await this.initialize();
      await this.loginToPinClicks();

      for (const website of websites) {
        const recipes = await this.scrapeRecipes(website);
        results.push({
          website: website.domain,
          recipesCount: recipes.length,
          recipes
        });
        
        // Add delay between websites
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } finally {
      await this.cleanup();
    }

    return results;
  }
}

module.exports = new AutomationService();
