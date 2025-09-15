#!/bin/bash

echo "🚀 Deploying CSV Upload Endpoint to Hetzner Server..."

# Server details
SERVER_IP="178.156.141.138"
SERVER_USER="root"

echo "📦 Uploading CSV upload route..."
scp csv-upload-route.js $SERVER_USER@$SERVER_IP:/root/

echo "🔧 Adding CSV endpoint to server..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
echo "📁 Moving to server directory..."
cd recipe-automation-backend

echo "📝 Adding CSV upload route to server.js..."
# Add the route before the server startup
sed -i '/app.listen(3001/i\
// CSV Upload endpoint\
const multer = require("multer");\
const fs = require("fs");\
const csv = require("csv-parser");\
\
// Configure multer for file uploads\
const upload = multer({ dest: "/tmp/" });\
\
// CSV Upload endpoint\
app.post("/api/recipes/upload-csv", upload.single("csvFile"), async (req, res) => {\
  try {\
    if (!req.file) {\
      return res.status(400).json({ error: "No CSV file uploaded" });\
    }\
\
    const websiteData = JSON.parse(req.body.website);\
    const csvPath = req.file.path;\
\
    console.log(`📁 Processing CSV for ${websiteData.name}: ${csvPath}`);\
\
    // Parse CSV file\
    const recipes = [];\
    const errors = [];\
\
    return new Promise((resolve) => {\
      fs.createReadStream(csvPath)\
        .pipe(csv())\
        .on("data", (row) => {\
          try {\
            // Clean and validate the recipe data\
            const recipe = {\
              title: row.title || row.Title || row.name || "Untitled Recipe",\
              imageUrl: row.image_url || row.imageUrl || row.Image_URL || "",\
              pinUrl: row.pin_url || row.pinUrl || row.url || "",\
              url: row.url || row.pin_url || row.pinUrl || "",\
              website: websiteData.domain,\
              description: row.description || row.Description || "",\
              author: row.author || row.Author || "",\
              category: row.category || row.Category || "",\
              tags: row.tags || row.Tags || "",\
              createdAt: new Date().toISOString()\
            };\
\
            // Only add if we have a title and some form of URL\
            if (recipe.title && (recipe.imageUrl || recipe.pinUrl || recipe.url)) {\
              recipes.push(recipe);\
            }\
          } catch (error) {\
            errors.push(`Row error: ${error.message}`);\
          }\
        })\
        .on("end", async () => {\
          try {\
            console.log(`📊 Parsed ${recipes.length} recipes from CSV`);\
\
            // Save recipes to Notion\
            if (recipes.length > 0) {\
              console.log(`📤 Syncing ${recipes.length} recipes to Notion...`);\
              \
              // Use existing Notion service\
              const notionService = require("./services/notion-service");\
              await notionService.saveRecipes(recipes, websiteData);\
              \
              console.log(`✅ Successfully synced ${recipes.length} recipes to Notion`);\
            }\
\
            // Clean up the temporary file\
            fs.unlinkSync(csvPath);\
\
            res.json({\
              success: true,\
              message: `Successfully processed ${recipes.length} recipes for ${websiteData.name}`,\
              recipesProcessed: recipes.length,\
              errors: errors.length > 0 ? errors : undefined\
            });\
\
            resolve();\
          } catch (error) {\
            console.error("❌ Error processing CSV:", error);\
            \
            // Clean up the temporary file\
            try {\
              fs.unlinkSync(csvPath);\
            } catch (cleanupError) {\
              console.error("Failed to cleanup temp file:", cleanupError);\
            }\
\
            res.status(500).json({\
              error: "Failed to process CSV",\
              details: error.message\
            });\
\
            resolve();\
          }\
        })\
        .on("error", (error) => {\
          console.error("❌ CSV parsing error:", error);\
          \
          // Clean up the temporary file\
          try {\
            fs.unlinkSync(csvPath);\
          } catch (cleanupError) {\
            console.error("Failed to cleanup temp file:", cleanupError);\
          }\
\
          res.status(500).json({\
            error: "CSV parsing failed",\
            details: error.message\
          });\
\
          resolve();\
        });\
    });\
\
  } catch (error) {\
    console.error("❌ CSV upload error:", error);\
    res.status(500).json({\
      error: "Failed to process CSV upload",\
      details: error.message\
    });\
  }\
});\
' server.js

echo "📦 Installing required dependencies..."
npm install multer csv-parser

echo "🐳 Restarting Docker container..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "✅ CSV upload endpoint deployed successfully!"
echo "🔍 Checking service status..."
docker-compose ps
docker-compose logs --tail=10

EOF

echo "🎉 CSV upload endpoint deployment complete!"
echo "📋 The endpoint is now available at: http://178.156.141.138:3001/api/recipes/upload-csv"
