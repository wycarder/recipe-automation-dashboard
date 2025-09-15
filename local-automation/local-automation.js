const { chromium } = require('playwright');
const LocalCSVProcessor = require('./csv-processor');
require('dotenv').config();

class LocalAutomationService {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.serverUrl = 'http://178.156.141.138:3001';
    this.csvProcessor = new LocalCSVProcessor();
  }

  async initialize() {
    console.log('🚀 Initializing local browser automation...');
    
    // Launch browser on your local machine (visible so you can see what's happening)
    this.browser = await chromium.launch({
      headless: false, // Run with visible browser so you can see what's happening
      slowMo: 1000, // Slow down actions for better visibility
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
    console.log('✅ Browser initialized successfully');
  }

  async loginToPinClicks() {
    console.log('🔐 Logging into PinClicks...');
    
    try {
      // Check if we have credentials
      const email = process.env.PINCLICKS_EMAIL;
      const password = process.env.PINCLICKS_PASSWORD;
      
      if (!email || !password) {
        throw new Error('PinClicks credentials not found. Please set PINCLICKS_EMAIL and PINCLICKS_PASSWORD environment variables.');
      }

      // Navigate to login page
      await this.page.goto('https://app.pinclicks.com/login', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Check if already logged in
      const currentUrl = this.page.url();
      const isDashboard = await this.page.locator('[data-testid="dashboard"], .dashboard, nav, .sidebar, .header, .navbar').first().isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isDashboard || currentUrl.includes('/pins') || currentUrl.includes('/dashboard')) {
        console.log('✅ Already logged in to PinClicks');
        return true;
      }

      console.log(`🔑 Logging in to PinClicks with email: ${email}`);

      // Wait for page to load
      await this.page.waitForTimeout(2000);

      // Find and fill email field
      console.log('🔍 Looking for email input field...');
      const emailInput = await this.page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]').first();
      await emailInput.waitFor({ timeout: 10000 });
      await emailInput.click();
      await emailInput.fill(email);
      console.log('✅ Email field filled');

      // Find and fill password field
      console.log('🔍 Looking for password input field...');
      const passwordInput = await this.page.locator('input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]').first();
      await passwordInput.waitFor({ timeout: 5000 });
      await passwordInput.click();
      await passwordInput.fill(password);
      console.log('✅ Password field filled');

      // Submit the form
      console.log('🔍 Looking for login button...');
      const loginButton = await this.page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in"), button:has-text("Continue"), input[type="submit"]').first();
      await loginButton.waitFor({ timeout: 5000 });
      console.log('🖱️ Clicking login button...');
      await loginButton.click();

      // Wait for login to complete
      await this.page.waitForTimeout(3000);

      // Check current URL after login attempt
      const finalUrl = this.page.url();
      console.log(`📍 URL after login attempt: ${finalUrl}`);

      // Check for error messages
      const errorMessage = await this.page.locator('.error, .alert-danger, [class*="error"], [class*="invalid"], .invalid-feedback').first().textContent().catch(() => null);
      if (errorMessage) {
        console.log(`❌ Found error message: ${errorMessage}`);
        throw new Error(`Login failed with error: ${errorMessage}`);
      }

      // Wait for successful navigation
      try {
        await Promise.race([
          this.page.waitForURL('**/dashboard**', { timeout: 15000 }),
          this.page.waitForURL('**/pins**', { timeout: 15000 }),
          this.page.waitForURL('**/home**', { timeout: 15000 }),
          this.page.waitForURL('**/app**', { timeout: 15000 }),
          this.page.locator('nav, .sidebar, [role="navigation"], .main-content, .app-header, .dashboard, .header, .navbar').first().waitFor({ timeout: 15000 })
        ]);
        console.log('✅ Login success detected');
      } catch (error) {
        const finalUrl = this.page.url();
        if (finalUrl.includes('login') || finalUrl.includes('signin')) {
          throw new Error(`Still on login page after attempt: ${finalUrl}. Please check your credentials.`);
        }
        console.log('✅ Login appears successful - not on login page anymore');
      }

      console.log('✅ Successfully logged into PinClicks');
      return true;
    } catch (error) {
      console.error('❌ Failed to login to PinClicks:', error.message);
      return false;
    }
  }

  async downloadCSVForWebsite(website) {
    console.log(`🔍 Searching for ${website.name} with keyword: ${website.keyword}`);
    
    try {
      // Navigate to PinClicks pins page
      console.log('🌐 Navigating to PinClicks pins page...');
      await this.page.goto('https://app.pinclicks.com/pins', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait for the page to load
      await this.page.waitForTimeout(2000);

      // Take a screenshot for debugging
      await this.page.screenshot({ path: 'debug-pinclicks-page.png', fullPage: true });
      console.log('📸 Screenshot saved: debug-pinclicks-page.png');

      // Find and click the search input
      console.log('🔍 Looking for search input...');
      const searchInput = await this.page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"], input[placeholder*="search"], input[type="text"]').first();
      
      const searchExists = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
      if (!searchExists) {
        await this.page.screenshot({ path: 'debug-no-search.png', fullPage: true });
        const pageTitle = await this.page.title();
        const currentUrl = this.page.url();
        console.log('📍 Current page:', pageTitle, 'at', currentUrl);
        throw new Error(`Could not find search input. Page title: ${pageTitle}, URL: ${currentUrl}`);
      }

      // Clear any existing text and type the keyword
      console.log(`🔤 Searching for: ${website.keyword}`);
      await searchInput.click();
      await searchInput.fill('');
      await searchInput.fill(website.keyword);

      // Submit the search
      await searchInput.press('Enter');

      // Wait for results to load
      console.log('⏳ Waiting for search results...');
      await this.page.waitForTimeout(3000);

      // Scroll to load more results
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await this.page.waitForTimeout(2000);


      // Find and click the export/download button
      console.log('📁 Looking for export button...');
      const exportSelectors = [
        'button:has-text("Export")',
        'button:has-text("Download")', 
        'button:has-text("CSV")',
        'a:has-text("Export")',
        'a:has-text("Download")',
        '[data-action="export"]',
        '[data-action="download"]',
        'button[title*="export"]',
        'button[title*="download"]',
        'button[data-testid*="export"]',
        'button[class*="export"]',
        'button[class*="download"]',
        '.export-btn',
        '.download-btn'
      ];

      let exportButton = null;
      for (const selector of exportSelectors) {
        exportButton = await this.page.locator(selector).first();
        if (await exportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`✅ Found export button with selector: ${selector}`);
          break;
        }
        exportButton = null;
      }

      if (!exportButton) {
        await this.page.screenshot({ path: 'debug-no-export.png', fullPage: true });
        console.log('❌ No export button found. Taking screenshot...');
        
        // Look for any clickable elements with export-related text
        const allButtons = await this.page.locator('button, a, [role="button"]').all();
        console.log(`🔍 Found ${allButtons.length} clickable elements, checking text content...`);
        
        for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
          const text = await allButtons[i].textContent().catch(() => '');
          const title = await allButtons[i].getAttribute('title').catch(() => '');
          if (text?.toLowerCase().includes('export') || text?.toLowerCase().includes('download') || 
              title?.toLowerCase().includes('export') || title?.toLowerCase().includes('download')) {
            console.log(`🎯 Found potential export element: "${text}" / "${title}"`);
            exportButton = allButtons[i];
            break;
          }
        }
      }

      if (!exportButton) {
        throw new Error('Could not find any export/download button after search. Check debug-no-export.png for page state.');
      }

      // Set up download detection
      console.log('🖱️ Clicking export button...');
      const downloadPromise = this.page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
      
      await exportButton.click();

      // Wait for export dropdown menu to appear and click "Pin Data"
      console.log('🔍 Looking for "Pin Data" option in export dropdown...');
      await this.page.waitForTimeout(1000); // Give dropdown time to appear
      
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
          console.log(`✅ Found "Pin Data" option with selector: ${selector}`);
          break;
        }
        pinDataOption = null;
      }
      
      if (!pinDataOption) {
        await this.page.screenshot({ path: 'debug-no-pin-data.png', fullPage: true });
        throw new Error('Could not find "Pin Data" option in export dropdown. Check debug-no-pin-data.png');
      }

      console.log('🖱️ Clicking "Pin Data" to start CSV download...');
      await pinDataOption.click();

      // Wait for download
      console.log('⬇️ Waiting for download to start...');
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
      console.log(`✅ CSV downloaded: ${filePath}`);

      // Process CSV file locally and send to Notion
      await this.processCSVLocally(filePath, website);
      
      return filePath;
    } catch (error) {
      console.error(`❌ Failed to download CSV for ${website.name}:`, error.message);
      throw error;
    }
  }

  async processCSVLocally(filePath, website) {
    try {
      console.log(`📊 Processing CSV file locally and sending to Notion...`);
      
      // Test Notion connection first
      const connectionOk = await this.csvProcessor.testNotionConnection();
      if (!connectionOk) {
        throw new Error('Failed to connect to Notion. Please check your credentials.');
      }

      // Process the CSV file
      const result = await this.csvProcessor.processCSVFile(filePath, website);
      
      if (result.success) {
        console.log(`✅ CSV processed successfully: ${result.totalRecipes} recipes`);
      } else {
        console.error('❌ CSV processing failed:', result.errors);
      }

      // Clean up the CSV file
      const fs = require('fs');
      fs.unlinkSync(filePath);
      console.log('🧹 Cleaned up CSV file');

    } catch (error) {
      console.error('❌ Error processing CSV locally:', error.message);
    }
  }

  async updateServerStatus(status) {
    try {
      await fetch(`${this.serverUrl}/api/automation/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(status)
      });
    } catch (error) {
      console.error('❌ Failed to update server status:', error.message);
    }
  }

  async runAutomation(websites) {
    try {
      await this.initialize();
      
      const loginSuccess = await this.loginToPinClicks();
      if (!loginSuccess) {
        throw new Error('Failed to login to PinClicks');
      }

      let totalCSVs = 0;
      
      for (let i = 0; i < websites.length; i++) {
        const website = websites[i];
        console.log(`\n🌐 [${i + 1}/${websites.length}] Processing website: ${website.name} (${website.domain})`);
        
        await this.updateServerStatus({
          isRunning: true,
          currentWebsite: website.domain,
          recipesCollected: totalCSVs,
          progress: (i / websites.length) * 100
        });

        try {
          const csvPath = await this.downloadCSVForWebsite(website);
          totalCSVs++;
          
          console.log(`✅ Completed ${website.name}: CSV downloaded and sent to server`);
          
          // Small delay between websites to be respectful
          if (i < websites.length - 1) {
            console.log('⏳ Waiting 3 seconds before next website...');
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch (error) {
          console.error(`❌ Failed to process ${website.name}:`, error.message);
        }
      }

      await this.updateServerStatus({
        isRunning: false,
        currentWebsite: null,
        recipesCollected: totalCSVs,
        progress: 100,
        completed: true
      });

      console.log(`\n🎉 Automation completed! Total CSVs processed: ${totalCSVs}`);
      
    } catch (error) {
      console.error('❌ Automation failed:', error.message);
      
      await this.updateServerStatus({
        isRunning: false,
        currentWebsite: null,
        recipesCollected: 0,
        progress: 0,
        error: error.message
      });
    } finally {
      if (this.browser) {
        await this.browser.close();
        console.log('🔒 Browser closed');
      }
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Export for use
module.exports = LocalAutomationService;

// If run directly, start automation
if (require.main === module) {
  const service = new LocalAutomationService();
  
  // Get websites from command line or use default
  const websites = process.argv[2] ? JSON.parse(process.argv[2]) : [
    {
      domain: "airfryerauthority.com",
      name: "Air Fryer Authority",
      keyword: "air fryer recipes",
      quota: 30,
      active: true
    }
  ];

  console.log('🚀 Starting local automation service...');
  service.runAutomation(websites).then(() => {
    console.log('✅ Local automation completed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Local automation failed:', error);
    process.exit(1);
  });
}
