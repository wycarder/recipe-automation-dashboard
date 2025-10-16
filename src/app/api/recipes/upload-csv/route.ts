import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { createReadStream } from 'fs';
import csv from 'csv-parser';
import path from 'path';
import os from 'os';

// Import the CSV processor logic from the existing codebase
// We'll reuse the same logic that processes CSVs in the local automation

interface Recipe {
  recipeName: string;
  pinUrl: string;
  url: string;
  imageUrl: string;
  description: string;
  websiteDomain: string;
  websiteName: string;
  createdAt: string;
}

interface WebsiteData {
  domain: string;
  name: string;
  active: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const csvFile = formData.get('csvFile') as File;
    const websiteJson = formData.get('website') as string;

    if (!csvFile) {
      return NextResponse.json(
        { error: 'No CSV file provided' },
        { status: 400 }
      );
    }

    if (!websiteJson) {
      return NextResponse.json(
        { error: 'No website data provided' },
        { status: 400 }
      );
    }

    const websiteData: WebsiteData = JSON.parse(websiteJson);

    // Create a temporary file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `upload-${Date.now()}-${csvFile.name}`);
    
    // Write the uploaded file to temporary location
    const bytes = await csvFile.arrayBuffer();
    await writeFile(tempFilePath, Buffer.from(bytes));

    console.log(`📁 Processing CSV for ${websiteData.name}: ${csvFile.name} (${tempFilePath})`);

    // Parse CSV file using the same logic as the existing processor
    const recipes: Recipe[] = [];
    const errors: string[] = [];
    let processedRows = 0;

    await new Promise<void>((resolve, reject) => {
      createReadStream(tempFilePath)
        .pipe(csv())
        .on('data', (row) => {
          processedRows++;
          try {
            // Use the same extraction logic as the existing CSV processor
            const recipe = extractRecipeData(row, websiteData);
            if (recipe) {
              recipes.push(recipe);
            }
          } catch (error) {
            errors.push(`Row ${processedRows} error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    console.log(`📊 Parsed ${recipes.length} recipes from ${processedRows} rows in CSV`);

    // Clean up the temporary file
    await unlink(tempFilePath);

    // Test Notion connection first (like the working version)
    console.log('🔍 Testing Notion connection...');
    const connectionOk = await testNotionConnection();
    if (!connectionOk) {
      throw new Error('Failed to connect to Notion. Please check your credentials.');
    }

    // Process recipes to Notion using the same logic
    if (recipes.length > 0) {
      console.log(`📤 Syncing ${recipes.length} recipes to Notion...`);
      const result = await syncRecipesToNotion(recipes, websiteData);
      console.log(`✅ Notion sync complete: ${result.success} successful, ${result.failed} failed`);

      return NextResponse.json({
        success: true,
        message: `Successfully processed ${recipes.length} recipes for ${websiteData.name}`,
        recipesProcessed: recipes.length,
        rowsProcessed: processedRows,
        notionSync: result,
        errors: errors.length > 0 ? errors : undefined
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No valid recipes found in CSV file',
        recipesProcessed: 0,
        rowsProcessed: processedRows,
        errors: errors.length > 0 ? errors : undefined
      });
    }

  } catch (error) {
    console.error('❌ CSV upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process CSV upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Reuse the same recipe extraction logic from the existing CSV processor
function extractRecipeData(row: any, websiteData: WebsiteData): Recipe | null {
  // Try to extract recipe data from various possible columns (same as existing processor)
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
    pinUrl: pinterestUrl,
    url: pinterestUrl,
    imageUrl: imageUrl || pinterestUrl, // Use Pinterest URL as fallback for image
    description: description || '',
    websiteDomain: websiteData.domain,
    websiteName: websiteData.name,
    createdAt: new Date().toISOString()
  };
}

// Reuse the same Notion sync logic from the existing CSV processor
async function syncRecipesToNotion(recipes: Recipe[], websiteData: WebsiteData) {
  let success = 0;
  let failed = 0;

  // Get website relation ID
  const websiteRelationId = await getWebsiteRelationId(websiteData.domain);
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
        await syncSingleRecipe(recipe, websiteRelationId);
        success++;
        console.log(`✅ Synced recipe: ${recipe.recipeName}`);
      } catch (error) {
        failed++;
        console.error(`❌ Failed to sync recipe: ${recipe.recipeName}`, error instanceof Error ? error.message : 'Unknown error');
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

async function syncSingleRecipe(recipe: Recipe, websiteRelationId: string) {
  const notionApiKey = process.env.NOTION_API_KEY;
  const recipesDbId = process.env.NOTION_RECIPES_DB_ID;

  if (!notionApiKey || !recipesDbId) {
    throw new Error('Missing Notion API configuration. Please set NOTION_API_KEY, NOTION_RECIPES_DB_ID, and NOTION_WEBSITES_DB_ID in your .env.local file.');
  }

  // Get model image URL (simplified version of URLConverter.getModelImageUrl)
  const modelImageUrl = getModelImageUrl(recipe);

  const payload: any = {
    parent: {
      database_id: recipesDbId
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
        url: modelImageUrl
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

  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionApiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

async function getWebsiteRelationId(websiteDomain: string): Promise<string | null> {
  const notionApiKey = process.env.NOTION_API_KEY;
  const websitesDbId = process.env.NOTION_WEBSITES_DB_ID;

  if (!notionApiKey || !websitesDbId) {
    throw new Error('Missing Notion API configuration. Please set NOTION_API_KEY, NOTION_RECIPES_DB_ID, and NOTION_WEBSITES_DB_ID in your .env.local file.');
  }

  try {
    // Try to find the website in the Notion Websites database
    const response = await fetch(`https://api.notion.com/v1/databases/${websitesDbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          property: 'Name', // Assuming 'Name' is the property name for the website domain
          title: {
            equals: websiteDomain
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.results.length > 0) {
      return data.results[0].id;
    } else {
      // If not found, create a new website entry
      console.log(`📝 Website ${websiteDomain} not found in Notion, creating new entry...`);
      const newWebsiteResponse = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parent: { database_id: websitesDbId },
          properties: {
            "Name": {
              title: [{ text: { content: websiteDomain } }]
            },
            "Active": {
              checkbox: true
            }
          }
        })
      });

      if (!newWebsiteResponse.ok) {
        throw new Error(`Failed to create website entry: HTTP ${newWebsiteResponse.status}`);
      }

      const newWebsiteData = await newWebsiteResponse.json();
      return newWebsiteData.id;
    }
  } catch (error) {
    console.error(`❌ Failed to get website relation ID for ${websiteDomain}:`, error);
    throw error;
  }
}

// Test Notion connection (same as working version)
async function testNotionConnection(): Promise<boolean> {
  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const recipesDbId = process.env.NOTION_RECIPES_DB_ID;

    if (!notionApiKey || !recipesDbId) {
      console.error('❌ Missing Notion API configuration');
      return false;
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${recipesDbId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      console.error(`❌ Failed to connect to Notion: HTTP ${response.status}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Connected to Notion database: ${data.title?.[0]?.plain_text || 'Untitled'}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to connect to Notion:`, error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

// Simplified version of URLConverter.getModelImageUrl
function getModelImageUrl(recipe: Recipe): string {
  // Prioritize Pinterest pin URL over image URL (like the working version)
  if (recipe.pinUrl && recipe.pinUrl.includes('pinterest.com/pin/')) {
    return recipe.pinUrl;
  }
  
  // Fallback to url field if pinUrl not available
  if (recipe.url && recipe.url.includes('pinterest.com/pin/')) {
    return recipe.url;
  }
  
  // Last resort: use image URL if no Pinterest URL available
  if (recipe.imageUrl && recipe.imageUrl.includes('http')) {
    return recipe.imageUrl;
  }
  
  // Final fallback
  return '';
}
