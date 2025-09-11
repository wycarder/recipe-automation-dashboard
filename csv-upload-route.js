// Add this route to your Hetzner server's server.js file
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');

// Configure multer for file uploads
const upload = multer({ dest: '/tmp/' });

// CSV Upload endpoint
app.post('/api/recipes/upload-csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const websiteData = JSON.parse(req.body.website);
    const csvPath = req.file.path;

    console.log(`📁 Processing CSV for ${websiteData.name}: ${csvPath}`);

    // Parse CSV file
    const recipes = [];
    const errors = [];

    return new Promise((resolve) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            // Clean and validate the recipe data
            const recipe = {
              title: row.title || row.Title || row.name || 'Untitled Recipe',
              imageUrl: row.image_url || row.imageUrl || row.Image_URL || row.pin_url || row.pinUrl,
              pinUrl: row.pin_url || row.pinUrl || row.url || '',
              website: websiteData.domain,
              description: row.description || row.Description || '',
              author: row.author || row.Author || '',
              category: row.category || row.Category || '',
              tags: row.tags || row.Tags || '',
              createdAt: new Date().toISOString()
            };

            // Only add if we have a title and image
            if (recipe.title && recipe.imageUrl) {
              recipes.push(recipe);
            }
          } catch (error) {
            errors.push(`Row error: ${error.message}`);
          }
        })
        .on('end', async () => {
          try {
            console.log(`📊 Parsed ${recipes.length} recipes from CSV`);

            // Save recipes to Notion
            if (recipes.length > 0) {
              console.log(`📤 Syncing ${recipes.length} recipes to Notion...`);
              
              // Use your existing Notion service
              const notionService = require('./services/notion-service');
              await notionService.saveRecipes(recipes, websiteData);
              
              console.log(`✅ Successfully synced ${recipes.length} recipes to Notion`);
            }

            // Clean up the temporary file
            fs.unlinkSync(csvPath);

            res.json({
              success: true,
              message: `Successfully processed ${recipes.length} recipes for ${websiteData.name}`,
              recipesProcessed: recipes.length,
              errors: errors.length > 0 ? errors : undefined
            });

            resolve();
          } catch (error) {
            console.error('❌ Error processing CSV:', error);
            
            // Clean up the temporary file
            try {
              fs.unlinkSync(csvPath);
            } catch (cleanupError) {
              console.error('Failed to cleanup temp file:', cleanupError);
            }

            res.status(500).json({
              error: 'Failed to process CSV',
              details: error.message
            });

            resolve();
          }
        })
        .on('error', (error) => {
          console.error('❌ CSV parsing error:', error);
          
          // Clean up the temporary file
          try {
            fs.unlinkSync(csvPath);
          } catch (cleanupError) {
            console.error('Failed to cleanup temp file:', cleanupError);
          }

          res.status(500).json({
            error: 'CSV parsing failed',
            details: error.message
          });

          resolve();
        });
    });

  } catch (error) {
    console.error('❌ CSV upload error:', error);
    res.status(500).json({
      error: 'Failed to process CSV upload',
      details: error.message
    });
  }
});
