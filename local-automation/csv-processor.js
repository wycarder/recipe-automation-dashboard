const fs = require('fs');
const csv = require('csv-parser');
const fetch = require('node-fetch');
const URLConverter = require('../utils/url-converter');
require('dotenv').config();

class LocalCSVProcessor {
  constructor() {
    this.notionApiKey = process.env.NOTION_API_KEY;
    this.recipesDbId = process.env.NOTION_RECIPES_DB_ID;
    this.websitesDbId = process.env.NOTION_WEBSITES_DB_ID;
    this.baseUrl = 'https://api.notion.com/v1';
  }

  async makeNotionRequest(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async processCSVFile(csvPath, websiteData) {
    console.log(`📊 Processing CSV file: ${csvPath}`);
    
    const recipes = [];
    const errors = [];

    return new Promise((resolve) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            // Extract recipe data from CSV row (similar to old app)
            const recipe = this.extractRecipeData(row, websiteData);
            if (recipe) {
              recipes.push(recipe);
            }
          } catch (error) {
            errors.push(`Row error: ${error.message}`);
          }
        })
        .on('end', async () => {
          console.log(`📊 Found ${recipes.length} recipes in CSV`);
          
          if (recipes.length > 0) {
            console.log(`📤 Syncing ${recipes.length} recipes to Notion...`);
            const result = await this.syncRecipesToNotion(recipes, websiteData);
            console.log(`✅ Notion sync complete: ${result.success} successful, ${result.failed} failed`);
          }

          resolve({
            success: true,
            totalRecipes: recipes.length,
            errors: errors.length > 0 ? errors : undefined
          });
        })
        .on('error', (error) => {
          console.error('❌ CSV parsing error:', error);
          resolve({
            success: false,
            totalRecipes: 0,
            errors: [error.message]
          });
        });
    });
  }

  extractRecipeData(row, websiteData) {
    // Try to extract recipe data from various possible columns (like the old app)
    let pinterestUrl = '';
    let recipeName = '';
    let imageUrl = '';
    let description = '';

    // Common column names in PinClicks CSV exports
    const urlColumns = ['Pinterest URL', 'Pin URL', 'URL', 'Link', 'pinterest_url', 'Pin Link'];
    const nameColumns = ['Title', 'Recipe Name', 'Name', 'Pin Title', 'title', 'recipe_name', 'Pin Name'];
    const imageColumns = ['Image URL', 'Image', 'Thumbnail', 'image_url', 'thumbnail_url', 'Pin Image'];
    const descColumns = ['Description', 'Pin Description', 'description', 'desc', 'Pin Description'];

    // Find Pinterest URL
    for (const col of urlColumns) {
      if (row[col] && row[col].includes('pinterest.com/pin/')) {
        pinterestUrl = row[col].trim();
        break;
      }
    }

    // Find recipe name
    for (const col of nameColumns) {
      if (row[col] && row[col].trim()) {
        recipeName = row[col].trim();
        break;
      }
    }

    // Find image URL
    for (const col of imageColumns) {
      if (row[col] && row[col].trim()) {
        imageUrl = row[col].trim();
        break;
      }
    }

    // Find description
    for (const col of descColumns) {
      if (row[col] && row[col].trim()) {
        description = row[col].trim();
        break;
      }
    }

    // Validate required fields
    if (!pinterestUrl || !recipeName) {
      return null; // Skip this row if missing required data
    }

    return {
      recipeName,
      pinUrl: pinterestUrl, // Map pinterestUrl to pinUrl for URL converter
      url: pinterestUrl, // Also set as url for URL converter
      imageUrl: imageUrl || pinterestUrl, // Use Pinterest URL as fallback for image
      description: description || '',
      websiteDomain: websiteData.domain,
      websiteName: websiteData.name,
      createdAt: new Date().toISOString()
    };
  }

  async syncRecipesToNotion(recipes, websiteData) {
    let success = 0;
    let failed = 0;

    // Get website relation ID
    const websiteRelationId = await this.getWebsiteRelationId(websiteData.domain);
    if (!websiteRelationId) {
      console.error(`❌ Could not find Notion relation ID for website: ${websiteData.domain}`);
      return { success: 0, failed: recipes.length };
    }

    // Process recipes in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < recipes.length; i += batchSize) {
      const batch = recipes.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipe) => {
        try {
          await this.syncSingleRecipe(recipe, websiteRelationId);
          success++;
          console.log(`✅ Synced recipe: ${recipe.recipeName}`);
        } catch (error) {
          failed++;
          console.error(`❌ Failed to sync recipe: ${recipe.recipeName}`, error.message);
        }
      });

      await Promise.all(batchPromises);

      // Add delay between batches to respect rate limits
      if (i + batchSize < recipes.length) {
        console.log('⏳ Waiting 1 second before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { success, failed };
  }

  async syncSingleRecipe(recipe, websiteRelationId) {
    const payload = {
      parent: {
        database_id: this.recipesDbId
      },
      properties: {
        "Name Keyword": {
          title: [{
            text: {
              content: recipe.recipeName
            }
          }]
        },
        "Model Image URL": {
          url: URLConverter.getModelImageUrl(recipe)
        },
        "Website": {
          relation: [{
            id: websiteRelationId
          }]
        }
      }
    };

    // Add description if available
    if (recipe.description) {
      payload.properties["Description"] = {
        rich_text: [{
          text: {
            content: recipe.description
          }
        }]
      };
    }

    await this.makeNotionRequest('/pages', 'POST', payload);
  }

  async getWebsiteRelationId(websiteDomain) {
    try {
      // Try to find the website in the Notion Websites database
      const response = await this.makeNotionRequest(`/databases/${this.websitesDbId}/query`, 'POST', {
        filter: {
          property: 'Name', // Assuming 'Name' is the property name for the website domain
          title: {
            equals: websiteDomain
          }
        }
      });

      if (response.results.length > 0) {
        return response.results[0].id;
      } else {
        // If not found, create a new website entry
        console.log(`📝 Website ${websiteDomain} not found in Notion, creating new entry...`);
        const newWebsitePage = await this.makeNotionRequest('/pages', 'POST', {
          parent: { database_id: this.websitesDbId },
          properties: {
            "Name": {
              title: [{ text: { content: websiteDomain } }]
            },
            "Active": {
              checkbox: true
            }
          }
        });
        return newWebsitePage.id;
      }
    } catch (error) {
      console.error(`❌ Failed to get website relation ID for ${websiteDomain}:`, error);
      throw error;
    }
  }

  async testNotionConnection() {
    try {
      const response = await this.makeNotionRequest(`/databases/${this.recipesDbId}`);
      console.log(`✅ Connected to Notion database: ${response.title?.[0]?.plain_text || 'Untitled'}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to connect to Notion:`, error.message);
      return false;
    }
  }
}

module.exports = LocalCSVProcessor;
