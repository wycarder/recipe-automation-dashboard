const { Client } = require('@notionhq/client');
const winston = require('winston');
const URLConverter = require('../utils/url-converter');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

class NotionService {
  constructor() {
    this.notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });
    this.recipesDbId = process.env.NOTION_RECIPES_DB_ID;
    this.websitesDbId = process.env.NOTION_WEBSITES_DB_ID;
  }

  async saveRecipes(recipes, website) {
    logger.info(`Saving ${recipes.length} recipes to Notion`);
    
    const savedRecipes = [];
    
    for (const recipe of recipes) {
      try {
        const response = await this.notion.pages.create({
          parent: { database_id: this.recipesDbId },
          properties: {
            'Name Keyword': {
              title: [
                {
                  text: {
                    content: recipe.title || 'Untitled Recipe'
                  }
                }
              ]
            },
            'Model Image URL': {
              url: URLConverter.getModelImageUrl(recipe)
            },
            'Website': {
              relation: [
                {
                  id: await this.getWebsiteRelationId(website.domain)
                }
              ]
            }
          }
        });
        
        savedRecipes.push(response);
        logger.info(`Saved recipe: ${recipe.title}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        logger.error(`Failed to save recipe "${recipe.title}":`, error.message);
      }
    }
    
    // Update website statistics
    await this.updateWebsiteStats(website, savedRecipes.length);
    
    return savedRecipes;
  }

  async updateWebsiteStats(website, recipesCount) {
    try {
      // Find the website page in Notion
      const response = await this.notion.databases.query({
        database_id: this.websitesDbId,
        filter: {
          property: 'Domain',
          rich_text: {
            equals: website.domain
          }
        }
      });

      if (response.results.length > 0) {
        const pageId = response.results[0].id;
        
        // Get current stats
        const page = await this.notion.pages.retrieve({ page_id: pageId });
        const currentTotal = page.properties['Total Recipes']?.number || 0;
        const currentRuns = page.properties['Total Runs']?.number || 0;

        // Update stats
        await this.notion.pages.update({
          page_id: pageId,
          properties: {
            'Total Recipes': {
              number: currentTotal + recipesCount
            },
            'Total Runs': {
              number: currentRuns + 1
            },
            'Last Run': {
              date: {
                start: new Date().toISOString()
              }
            },
            'Last Recipes Count': {
              number: recipesCount
            },
            'Average Per Run': {
              number: Math.round((currentTotal + recipesCount) / (currentRuns + 1))
            }
          }
        });
        
        logger.info(`Updated stats for ${website.domain}`);
      }
    } catch (error) {
      logger.error(`Failed to update website stats:`, error.message);
    }
  }

  async getWebsiteRelationId(websiteDomain) {
    try {
      // Try to find the website in the websites database
      const response = await this.notion.databases.query({
        database_id: this.websitesDbId,
        filter: {
          property: 'Name',
          title: {
            equals: websiteDomain
          }
        }
      });

      if (response.results.length > 0) {
        return response.results[0].id;
      }
      
      // If not found, return null
      logger.warn(`Website relation ID not found for: ${websiteDomain}`);
      return null;
    } catch (error) {
      logger.error(`Failed to get website relation ID for ${websiteDomain}:`, error);
      return null;
    }
  }

  async getWebsiteConfigs() {
    try {
      const response = await this.notion.databases.query({
        database_id: this.websitesDbId,
        filter: {
          property: 'Active',
          checkbox: {
            equals: true
          }
        }
      });

      return response.results.map(page => ({
        id: page.id,
        domain: page.properties['Domain']?.rich_text[0]?.text?.content || '',
        keyword: page.properties['Keyword']?.rich_text[0]?.text?.content || '',
        quota: page.properties['Quota']?.number || 30,
        active: page.properties['Active']?.checkbox || false
      }));
    } catch (error) {
      logger.error('Failed to fetch website configs:', error);
      return [];
    }
  }
}

module.exports = new NotionService();
