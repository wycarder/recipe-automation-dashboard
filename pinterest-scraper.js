const { chromium } = require('playwright');
const logger = require('../utils/logger');

class PinterestScraper {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async initialize() {
    logger.info('Initializing Pinterest scraper...');
    this.browser = await chromium.launch({
      headless: false, // Keep visible for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--display=:99']
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    this.page = await this.context.newPage();
    
    // Set up request interception to block unnecessary resources
    await this.page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (['image', 'media', 'font', 'stylesheet'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });
  }

  async searchPinterestPins(keyword, options = {}) {
    logger.info(`Searching Pinterest for trending pins: ${keyword}`);
    
    try {
      // Navigate to Pinterest search with different sorting options
      const searchUrls = [
        `https://pinterest.com/search/pins/?q=${encodeURIComponent(keyword)}&rs=recent_pins`, // Recent
        `https://pinterest.com/search/pins/?q=${encodeURIComponent(keyword)}&rs=most_recent`, // Most recent
        `https://pinterest.com/search/pins/?q=${encodeURIComponent(keyword)}` // Default (trending)
      ];

      const allPins = [];

      for (const url of searchUrls) {
        try {
          logger.info(`Scraping Pinterest URL: ${url}`);
          await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          
          // Wait for pins to load
          await this.page.waitForSelector('[data-test-id="pinWrapper"]', { timeout: 10000 });
          
          // Scroll to load more pins
          await this.scrollAndLoadPins();
          
          // Extract pin data
          const pins = await this.extractPinData(keyword);
          allPins.push(...pins);
          
          logger.info(`Found ${pins.length} pins from ${url}`);
          
        } catch (error) {
          logger.warn(`Failed to scrape ${url}:`, error.message);
        }
      }

      // Remove duplicates and filter by engagement
      const uniquePins = this.removeDuplicates(allPins, 'pinUrl');
      const trendingPins = this.filterTrendingPins(uniquePins, options);
      
      logger.info(`Total unique pins found: ${uniquePins.length}, Trending pins: ${trendingPins.length}`);
      
      return trendingPins;
      
    } catch (error) {
      logger.error(`Error searching Pinterest for ${keyword}:`, error.message);
      throw error;
    }
  }

  async scrollAndLoadPins() {
    // Scroll down to load more pins
    for (let i = 0; i < 3; i++) {
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await this.page.waitForTimeout(2000);
    }
  }

  async extractPinData(keyword) {
    const pins = await this.page.evaluate((searchKeyword) => {
      const pinElements = document.querySelectorAll('[data-test-id="pinWrapper"]');
      const extractedPins = [];

      pinElements.forEach((pinElement, index) => {
        try {
          // Extract pin data from the DOM
          const titleElement = pinElement.querySelector('[data-test-id="pinrep-title"]') || 
                              pinElement.querySelector('h3') ||
                              pinElement.querySelector('.pinTitle');
          
          const imageElement = pinElement.querySelector('img');
          const linkElement = pinElement.querySelector('a[href*="/pin/"]');
          
          // Extract engagement metrics
          const saveButton = pinElement.querySelector('[data-test-id="pinrep-save-button"]');
          const saveCount = saveButton ? saveButton.textContent.trim() : '0';
          
          // Extract pin URL
          const pinUrl = linkElement ? linkElement.href : '';
          
          // Extract image URL
          const imageUrl = imageElement ? imageElement.src : '';
          
          // Extract description/title
          const title = titleElement ? titleElement.textContent.trim() : 'Untitled Recipe';
          
          // Extract board name
          const boardElement = pinElement.querySelector('[data-test-id="board-name"]');
          const boardName = boardElement ? boardElement.textContent.trim() : '';

          if (title && pinUrl) {
            extractedPins.push({
              title: title,
              pinUrl: pinUrl,
              imageUrl: imageUrl,
              description: title,
              boardName: boardName,
              keyword: searchKeyword,
              engagement: {
                saves: this.parseEngagementNumber(saveCount),
                comments: 0, // Pinterest doesn't show comment counts on search pages
                clicks: 0 // Not available on search pages
              },
              metrics: {
                engagementRate: this.parseEngagementNumber(saveCount),
                popularityScore: this.calculatePopularityScore(this.parseEngagementNumber(saveCount))
              },
              position: index + 1
            });
          }
        } catch (error) {
          console.warn('Error extracting pin data:', error);
        }
      });

      return extractedPins;
    }, keyword);

    return pins;
  }

  parseEngagementNumber(text) {
    if (!text) return 0;
    
    const cleanText = text.replace(/[^\d.KMB]/g, '').toLowerCase();
    
    if (cleanText.includes('k')) {
      return Math.round(parseFloat(cleanText.replace('k', '')) * 1000);
    } else if (cleanText.includes('m')) {
      return Math.round(parseFloat(cleanText.replace('m', '')) * 1000000);
    } else if (cleanText.includes('b')) {
      return Math.round(parseFloat(cleanText.replace('b', '')) * 1000000000);
    } else {
      return parseInt(cleanText) || 0;
    }
  }

  calculatePopularityScore(saves) {
    // Simple popularity score based on saves
    if (saves >= 1000) return 100;
    if (saves >= 500) return 80;
    if (saves >= 100) return 60;
    if (saves >= 50) return 40;
    if (saves >= 10) return 20;
    return 10;
  }

  removeDuplicates(pins, key) {
    const seen = new Set();
    return pins.filter(pin => {
      const value = pin[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  filterTrendingPins(pins, options = {}) {
    let filteredPins = pins;

    // Filter by minimum saves
    if (options.minSaves) {
      filteredPins = filteredPins.filter(pin => pin.engagement.saves >= options.minSaves);
    }

    // Filter by minimum popularity score
    if (options.minPopularityScore) {
      filteredPins = filteredPins.filter(pin => pin.metrics.popularityScore >= options.minPopularityScore);
    }

    // Sort by popularity score (highest first)
    filteredPins.sort((a, b) => b.metrics.popularityScore - a.metrics.popularityScore);

    // Limit results
    const limit = options.limit || 20;
    return filteredPins.slice(0, limit);
  }

  async getTrendingPins(keyword, criteria = {}) {
    logger.info(`Getting trending pins for ${keyword} with criteria:`, criteria);
    
    try {
      // Set up search criteria for trending content
      const searchOptions = {
        limit: criteria.limit || 20,
        minSaves: criteria.minSaves || 50, // Minimum 50 saves for trending
        minPopularityScore: criteria.minPopularityScore || 40 // Minimum popularity score
      };

      const pins = await this.searchPinterestPins(keyword, searchOptions);
      
      if (!pins || pins.length === 0) {
        logger.warn(`No trending pins found for keyword: ${keyword}`);
        return [];
      }

      logger.info(`Found ${pins.length} trending pins for ${keyword}`);
      
      return pins;
      
    } catch (error) {
      logger.error(`Error getting trending pins for ${keyword}:`, error.message);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = PinterestScraper;
