const PinterestScraper = require('./pinterest-scraper');
const logger = require('../utils/logger');

class AutomationService {
  constructor() {
    this.pinterestScraper = new PinterestScraper();
  }

  async scrapeRecipes(website) {
    logger.info(`Scraping trending recipes from Pinterest for keyword: ${website.keyword}`);
    
    try {
      // Initialize the Pinterest scraper
      await this.pinterestScraper.initialize();

      // Define search criteria for trending content
      const criteria = {
        limit: 15, // Number of trending pins to fetch
        minSaves: 100, // Minimum saves for trending content
        minPopularityScore: 50 // Minimum popularity score for trending
      };

      // Get trending pins from Pinterest
      const pins = await this.pinterestScraper.getTrendingPins(website.keyword, criteria);
      
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
        boardName: pin.boardName,
        keyword: pin.keyword
      }));

      logger.info(`Found ${recipes.length} trending recipes for keyword: ${website.keyword}`);
      
      return recipes;
      
    } catch (error) {
      logger.error(`Error scraping Pinterest for ${website.keyword}:`, error.message);
      throw error;
    } finally {
      // Clean up the scraper
      await this.pinterestScraper.close();
    }
  }
}

module.exports = AutomationService;
