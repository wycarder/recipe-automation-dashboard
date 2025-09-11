const ScrapingBeeService = require('./scrapingbee-service');
const logger = require('../utils/logger');

class AutomationService {
  constructor() {
    this.scrapingBeeService = new ScrapingBeeService();
  }

  async scrapeRecipes(website) {
    logger.info(`Scraping trending recipes from Pinterest for keyword: ${website.keyword} using ScrapingBee`);
    
    try {
      // Skip connection test and go directly to Pinterest scraping
      logger.info('Skipping ScrapingBee connection test, proceeding with Pinterest scraping');

      // Define search criteria for trending content
      const criteria = {
        limit: 15, // Number of trending pins to fetch
        minSaves: 100, // Minimum saves for trending content
        minPopularityScore: 50 // Minimum popularity score for trending
      };

      // Get trending pins from Pinterest via ScrapingBee
      const pins = await this.scrapingBeeService.getTrendingPins(website.keyword, criteria);
      
      if (!pins || pins.length === 0) {
        logger.warn(`No trending pins found for keyword: ${website.keyword}`);
        return [];
      }

      // Transform Pinterest pins to recipe format
      const recipes = pins.map((pin, index) => ({
        title: pin.title,
        url: pin.pinUrl,
        score: pin.metrics.popularityScore,
        position: index + 1,
        engagement: pin.engagement,
        imageUrl: pin.imageUrl,
        description: pin.description,
        keyword: pin.keyword
      }));

      logger.info(`Found ${recipes.length} trending recipes for keyword: ${website.keyword}`);
      
      return recipes;
      
    } catch (error) {
      logger.error(`Error scraping Pinterest for ${website.keyword}:`, error.message);
      throw error;
    }
  }
}

module.exports = AutomationService;
