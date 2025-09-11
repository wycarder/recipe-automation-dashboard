const { chromium } = require('playwright');
const logger = require('./utils/logger');

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
      executablePath: "/usr/bin/chromium-browser",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
      // Navigate to PinClicks login page
      await this.page.goto('https://app.pinclicks.com/login', {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      // Wait for login form to be visible
      await this.page.waitForSelector('input[placeholder="Email"]', { timeout: 30000 });

      // Fill in email and password
      await this.page.fill('input[placeholder="Email"]', email);
      await this.page.fill('input[placeholder="Password"]', password);

      // Click the Login button
      await this.page.click('button:has-text("Login")');

      // Wait for navigation after login - this is the key change!
      await this.page.waitForNavigation({
        waitUntil: 'networkidle',
        timeout: 30000
      });

      logger.info('Successfully logged into PinClicks');
      
      // Navigate directly to pins page instead of waiting for verification
      logger.info('Navigating to pins page...');
      await this.page.goto('https://app.pinclicks.com/pins', { 
        waitUntil: 'networkidle', 
        timeout: 60000 
      });
      
      logger.info('Successfully navigated to pins page');
      
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

      // Clear the search input and enter the keyword
      const searchInput = await this.page.waitForSelector('input[type="text"]', { timeout: 10000 });
      await searchInput.clear();
      await searchInput.type(website.keyword);

      // Press Enter to search
      await searchInput.press('Enter');

      // Wait for results to load
      await this.page.waitForTimeout(3000);

      // Wait for the Export button to be visible
      await this.page.waitForSelector('button:has-text("Export")', { timeout: 10000 });

      // Click Export button
      await this.page.click('button:has-text("Export")');

      // Wait for dropdown and click Pin Data
      await this.page.waitForSelector('text=Pin Data', { timeout: 5000 });
      await this.page.click('text=Pin Data');

      // Wait for download to start
      const downloadPromise = this.page.waitForEvent('download');
      const download = await downloadPromise;

      // Save the download
      const fileName = `${website.domain.replace(/\./g, '_')}_${Date.now()}.csv`;
      const filePath = `/tmp/${fileName}`;
      await download.saveAs(filePath);

      logger.info(`Downloaded PIN data for ${website.domain} to ${filePath}`);

      // Parse the CSV file to extract recipes
      const recipes = await this.parseCSVFile(filePath);

      return recipes;
    } catch (error) {
      logger.error(`Error scraping ${website.domain}:`, error);
      throw error;
    }
  }

  async parseCSVFile(filePath) {
    // For now, return mock data
    // In production, you'd parse the actual CSV file
    return [
      {
        title: 'Sample Recipe 1',
        url: 'https://example.com/recipe1',
        score: 8,
        position: 1
      },
      {
        title: 'Sample Recipe 2',
        url: 'https://example.com/recipe2',
        score: 7,
        position: 2
      }
    ];
  }

  async scrapeAllWebsites(websites) {
    const results = [];

    try {
      await this.initialize();
      await this.loginToPinClicks();

      for (const website of websites) {
        try {
          const recipes = await this.scrapeRecipes(website);
          results.push({
            website: website.domain,
            recipesCount: recipes.length,
            recipes,
            status: 'success'
          });
        } catch (error) {
          logger.error(`Failed to scrape ${website.domain}:`, error);
          results.push({
            website: website.domain,
            recipesCount: 0,
            recipes: [],
            status: 'failed',
            error: error.message
          });
        }

        // Add delay between websites
        await this.page.waitForTimeout(5000);
      }
    } finally {
      await this.cleanup();
    }

    return results;
  }
}

module.exports = AutomationService;
