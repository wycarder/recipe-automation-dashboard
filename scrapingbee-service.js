const fetch = require('node-fetch');
const logger = require('../utils/logger');

class ScrapingBeeService {
  constructor() {
    this.apiKey = process.env.SCRAPINGBEE_API_KEY;
    this.baseUrl = 'https://app.scrapingbee.com/api/v1';
  }

  async scrapePinterestSearch(keyword, options = {}) {
    logger.info(`Scraping Pinterest search for keyword: ${keyword} using ScrapingBee`);
    
    try {
      const searchUrls = [
        `https://pinterest.com/search/pins/?q=${encodeURIComponent(keyword)}&rs=recent_pins`,
        `https://pinterest.com/search/pins/?q=${encodeURIComponent(keyword)}&rs=most_recent`,
        `https://pinterest.com/search/pins/?q=${encodeURIComponent(keyword)}`
      ];

      const allPins = [];

      for (const url of searchUrls) {
        try {
          logger.info(`Scraping Pinterest URL via ScrapingBee: ${url}`);
          
          const response = await this.makeScrapingBeeRequest(url);
          
          if (response && response.html) {
            const pins = this.parsePinterestHTML(response.html, keyword);
            allPins.push(...pins);
            logger.info(`Found ${pins.length} pins from ${url}`);
          }
          
          // Add delay between requests to be respectful
          await this.delay(2000);
          
        } catch (error) {
          logger.warn(`Failed to scrape ${url} via ScrapingBee:`, error.message);
        }
      }

      // Remove duplicates and filter by engagement
      const uniquePins = this.removeDuplicates(allPins, 'pinUrl');
      const trendingPins = this.filterTrendingPins(uniquePins, options);
      
      logger.info(`Total unique pins found: ${uniquePins.length}, Trending pins: ${trendingPins.length}`);
      
      return trendingPins;
      
    } catch (error) {
      logger.error(`Error scraping Pinterest for ${keyword}:`, error.message);
      throw error;
    }
  }

  async makeScrapingBeeRequest(url, useJavaScript = true) {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      url: url,
      stealth_proxy: 'true', // Use stealth proxy for advanced anti-bot protection
      transparent_status_code: 'true' // Return actual status codes
    });

    // Only add render_js for Pinterest URLs, not for test URLs
    if (useJavaScript && url.includes('pinterest.com')) {
      params.append('render_js', 'true');
    }

    logger.info(`Making ScrapingBee request to: ${url}`);

    const response = await fetch(`${this.baseUrl}?${params}`, {
      method: 'GET',
      timeout: 60000 // 60 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`ScrapingBee API error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`ScrapingBee API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  }

  parsePinterestHTML(html, keyword) {
    // This is a simplified parser - in practice, you might want to use a proper HTML parser
    const pins = [];
    
    try {
      // Extract pin data using regex patterns (simplified approach)
      const pinMatches = html.match(/data-test-id="pinWrapper"[^>]*>[\s\S]*?<\/div>/g) || [];
      
      pinMatches.forEach((pinHtml, index) => {
        try {
          // Extract title
          const titleMatch = pinHtml.match(/data-test-id="pinrep-title"[^>]*>([^<]+)</) || 
                           pinHtml.match(/<h3[^>]*>([^<]+)</) ||
                           pinHtml.match(/class="pinTitle"[^>]*>([^<]+)</);
          
          // Extract pin URL
          const urlMatch = pinHtml.match(/href="([^"]*\/pin\/[^"]*)"/);
          
          // Extract image URL
          const imgMatch = pinHtml.match(/src="([^"]*\.jpg[^"]*)"/);
          
          // Extract save count
          const saveMatch = pinHtml.match(/data-test-id="pinrep-save-button"[^>]*>([^<]+)</);
          
          if (titleMatch && urlMatch) {
            const title = titleMatch[1].trim();
            const pinUrl = urlMatch[1].startsWith('http') ? urlMatch[1] : `https://pinterest.com${urlMatch[1]}`;
            const imageUrl = imgMatch ? imgMatch[1] : '';
            const saveCount = saveMatch ? this.parseEngagementNumber(saveMatch[1]) : 0;
            
            pins.push({
              title: title,
              pinUrl: pinUrl,
              imageUrl: imageUrl,
              description: title,
              keyword: keyword,
              engagement: {
                saves: saveCount,
                comments: 0,
                clicks: 0
              },
              metrics: {
                engagementRate: saveCount,
                popularityScore: this.calculatePopularityScore(saveCount)
              },
              position: index + 1
            });
          }
        } catch (error) {
          logger.warn('Error parsing individual pin:', error.message);
        }
      });
      
    } catch (error) {
      logger.error('Error parsing Pinterest HTML:', error.message);
    }
    
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
        limit: criteria.limit || 15,
        minSaves: criteria.minSaves || 100, // Minimum 100 saves for trending
        minPopularityScore: criteria.minPopularityScore || 50 // Minimum popularity score
      };

      const pins = await this.scrapePinterestSearch(keyword, searchOptions);
      
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

  async testConnection() {
    try {
      const testUrl = 'https://httpbin.org/ip';
      const response = await this.makeScrapingBeeRequest(testUrl, false);
      
      if (response && response.origin) {
        logger.info('ScrapingBee connection successful, IP:', response.origin);
        return true;
      }
      
      return false;
      
    } catch (error) {
      logger.error('ScrapingBee connection test failed:', error.message);
      return false;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ScrapingBeeService;
