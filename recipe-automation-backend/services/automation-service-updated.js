const { chromium } = require('playwright');
const logger = require('../utils/logger');

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
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--single-process',
        '--no-zygote'
      ]
    });
    this.context = await this.browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9'
      }
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

      // Wait for page to fully load
      await this.page.waitForTimeout(3000);

      // Find and fill email field
      logger.info('Looking for email input field...');
      const emailInput = await this.page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]').first();
      await emailInput.waitFor({ timeout: 10000 });
      await emailInput.click();
      await emailInput.fill(email);
      logger.info('Email field filled');

      // Find and fill password field
      logger.info('Looking for password input field...');
      const passwordInput = await this.page.locator('input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]').first();
      await passwordInput.waitFor({ timeout: 5000 });
      await passwordInput.click();
      await passwordInput.fill(password);
      logger.info('Password field filled');

      // Submit the form
      logger.info('Looking for login button...');
      const loginButton = await this.page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in"), button:has-text("Continue"), input[type="submit"]').first();
      await loginButton.waitFor({ timeout: 5000 });
      logger.info('Clicking login button...');
      await loginButton.click();

      // Wait for potential loading
      await this.page.waitForTimeout(5000);

      // Check current URL after login attempt
      const currentUrl = this.page.url();
      logger.info(`URL after login attempt: ${currentUrl}`);

      // Wait for navigation after login - be more flexible
      try {
        logger.info('Waiting for login success indicators...');
        await Promise.race([
          this.page.waitForURL('**/dashboard**', { timeout: 15000 }),
          this.page.waitForURL('**/pins**', { timeout: 15000 }),
          this.page.waitForURL('**/home**', { timeout: 15000 }),
          this.page.waitForURL('**/app**', { timeout: 15000 }),
          this.page.waitForURL('**/keyword-explorer**', { timeout: 15000 }),
          this.page.waitForURL('**/analytics**', { timeout: 15000 }),
          this.page.locator('nav, .sidebar, [role="navigation"], .main-content, .app-header, .dashboard, .header, .navbar').first().waitFor({ timeout: 15000 }),
          this.page.locator('input[type="password"]').waitFor({ state: 'hidden', timeout: 15000 })
        ]);
        logger.info('Login success detected');
      } catch (error) {
        const finalUrl = this.page.url();
        logger.info(`Final URL check: ${finalUrl}`);
        if (finalUrl.includes('login') || finalUrl.includes('signin')) {
          throw new Error(`Still on login page after attempt: ${finalUrl}. Please check your credentials.`);
        }
        logger.info('Login appears successful - not on login page anymore');
      }

      logger.info('Successfully logged into PinClicks');
      
      // Navigate directly to pins page after successful login
      logger.info('Navigating to pins page...');
      await this.page.goto('https://app.pinclicks.com/pins', {
        waitUntil: 'networkidle',
        timeout: 60000
      });
      logger.info('Successfully navigated to pins page');
      
    } catch (error) {
      logger.error('Login failed:', error);
      throw new Error(`Failed to login to PinClicks: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your credentials.`);
    }
  }

  async scrapeRecipes(website) {
    logger.info(`Scraping recipes from ${website.domain} with keyword: ${website.keyword}`);
    
    try {
      if (!this.browser) {
        await this.initialize();
        await this.loginToPinClicks();
      }

      // We're already on the pins page from login, so skip navigation
      logger.info('Using existing PinClicks session...');
      
      // Add a brief pause to simulate natural workflow timing
      await this.page.waitForTimeout(2000);

      // Take a screenshot for debugging
      await this.page.screenshot({ path: 'debug-pinclicks-page.png', fullPage: true });
      logger.info('Screenshot saved: debug-pinclicks-page.png');

      // Find and click the search input
      logger.info('Looking for search input...');
      const searchInput = await this.page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"], input[placeholder*="search"], input[type="text"]').first();
      
      const searchExists = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
      if (!searchExists) {
        logger.info('Standard search not found, looking for alternative navigation...');
        await this.page.screenshot({ path: 'debug-no-search.png', fullPage: true });
        
        const pageTitle = await this.page.title();
        const currentUrl = this.page.url();
        logger.info(`Current page: ${pageTitle} at ${currentUrl}`);
        
        throw new Error(`Could not find search input. Page title: ${pageTitle}, URL: ${currentUrl}`);
      }

      // Clear any existing text and type the keyword
      logger.info(`Searching for: ${website.keyword}`);
      await searchInput.click();
      await this.page.waitForTimeout(1000);
      await searchInput.fill(''); // Clear existing text
      await searchInput.fill(website.keyword); // Fill with new keyword

      // Submit the search
      await this.page.waitForTimeout(2000);
      try {
        await searchInput.press('Enter');
      } catch {
        // Alternative: Click submit button if exists
        const submitButton = await this.page.locator('button[type="submit"], button:has-text("Search"), button:has-text("Submit")').first();
        if (submitButton) {
          await submitButton.click();
        }
      }

      // Wait for results to load
      logger.info('Waiting for search results...');
      await this.page.waitForTimeout(5000);

      // Scroll to load more results
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await this.page.waitForTimeout(2000);

      // Find and click the export/download button
      logger.info('Looking for export button...');
      const exportSelectors = [
        'button:has-text("Export")',
        'button:has-text("Download")', 
        'button:has-text("CSV")',
        'a:has-text("Export")',
        'a:has-text("Download")',
        '[data-action="export"]',
        '[data-action="download"]',
        'button[title*="export"]',
        'button[title*="download"]'
      ];

      let exportButton = null;
      for (const selector of exportSelectors) {
        exportButton = await this.page.locator(selector).first();
        if (await exportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          logger.info(`Found export button with selector: ${selector}`);
          break;
        }
        exportButton = null;
      }

      if (!exportButton) {
        await this.page.screenshot({ path: 'debug-no-export.png', fullPage: true });
        throw new Error('Could not find any export/download button after search. Check debug-no-export.png for page state.');
      }

      // Set up download detection
      logger.info('Clicking export button...');
      const downloadPromise = this.page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
      
      await exportButton.click();

      // Wait for export dropdown menu to appear and click "Pin Data"
      logger.info('Looking for "Pin Data" option in export dropdown...');
      await this.page.waitForTimeout(1000);
      
      const pinDataSelectors = [
        'text="Pin Data"',
        'button:has-text("Pin Data")',
        'a:has-text("Pin Data")',
        '[data-option="pin-data"]',
        '.pin-data-option',
        'li:has-text("Pin Data")',
        'div:has-text("Pin Data")'
      ];
      
      let pinDataOption = null;
      for (const selector of pinDataSelectors) {
        pinDataOption = await this.page.locator(selector).first();
        if (await pinDataOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          logger.info(`Found "Pin Data" option with selector: ${selector}`);
          break;
        }
        pinDataOption = null;
      }
      
      if (!pinDataOption) {
        await this.page.screenshot({ path: 'debug-no-pin-data.png', fullPage: true });
        throw new Error('Could not find "Pin Data" option in export dropdown. Check debug-no-pin-data.png');
      }

      logger.info('Clicking "Pin Data" to start CSV download...');
      await pinDataOption.click();

      // Wait for download
      logger.info('Waiting for download to start...');
      const download = await downloadPromise;
      
      if (!download) {
        await this.page.screenshot({ path: 'debug-no-download.png', fullPage: true });
        throw new Error('No download detected after clicking export. Check debug-no-download.png for page state.');
      }
      
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${website.domain}_${timestamp}.csv`;
      const filePath = `/tmp/${fileName}`;
      
      // Save the download
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
