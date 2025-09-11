# 🚀 Local PinClicks Automation

This automation service runs on your Mac and connects to your Netlify frontend to process recipe websites.

## ✅ What It Does

- Opens a visible Chrome browser on your Mac
- Logs into PinClicks automatically
- Searches for recipes using keywords
- Downloads CSV files with pin data
- Syncs recipes directly to your Notion database

## 🎯 How to Use with Netlify Frontend

### Option 1: Simple Command Line
```bash
# Go to your Netlify frontend
# Select websites you want to process
# Copy the website data (JSON format)
# Run the automation:
node run-from-netlify.js "PASTE_JSON_HERE"
```

### Option 2: Using npm script
```bash
npm run netlify "PASTE_JSON_HERE"
```

### Option 3: Test with single website
```bash
npm test
```

## 📋 Example Usage

1. **Go to Netlify frontend**: https://boisterous-toffee-d95f57.netlify.app
2. **Select websites** you want to process (check the boxes)
3. **Copy the website data** (it will be in JSON format like this):
   ```json
   [
     {
       "domain": "airfryerauthority.com",
       "name": "Air Fryer Authority", 
       "keyword": "air fryer recipes",
       "quota": 30,
       "active": true
     },
     {
       "domain": "comfortfoodcozy.com",
       "name": "Comfort Food Cozy",
       "keyword": "comfort food recipes", 
       "quota": 30,
       "active": true
     }
   ]
   ```
4. **Run the automation**:
   ```bash
   node run-from-netlify.js '[{"domain":"airfryerauthority.com","name":"Air Fryer Authority","keyword":"air fryer recipes","quota":30,"active":true},{"domain":"comfortfoodcozy.com","name":"Comfort Food Cozy","keyword":"comfort food recipes","quota":30,"active":true}]'
   ```

## 🔧 Setup (Already Done)

- ✅ PinClicks credentials configured
- ✅ Notion API key configured  
- ✅ Playwright browsers installed
- ✅ All dependencies installed

## 📊 What Happens

1. **Browser opens** - You'll see Chrome launch
2. **Auto-login** - Logs into PinClicks with your credentials
3. **Search & Export** - For each website, searches for the keyword and downloads CSV
4. **Notion Sync** - Parses CSV and adds recipes to your Notion database
5. **Cleanup** - Closes browser and cleans up files

## 🎉 Success Example

```
🚀 Starting automation for 2 websites selected from Netlify frontend...

   1. Air Fryer Authority (airfryerauthority.com) - "air fryer recipes"
   2. Comfort Food Cozy (comfortfoodcozy.com) - "comfort food recipes"

✅ Connected to Notion database: N8N Test Database
📊 Found 16 recipes in CSV
✅ Synced recipe: 39+ Amazing Comfort Food Recipes to Warm Your Heart
✅ Synced recipe: 15 Most Effective Classic Comfort Food Recipes
...
✅ Notion sync complete: 16 successful, 0 failed
🎉 All done! Check your Notion database for the new recipes.
```

## 🚨 Troubleshooting

- **Browser doesn't open**: Make sure Chrome is installed
- **Login fails**: Check your PinClicks credentials in `.env`
- **Notion sync fails**: Check your Notion API key and database IDs in `.env`
- **No CSV download**: Sometimes PinClicks has temporary issues, try again

## 📁 Files

- `local-automation.js` - Main automation service
- `run-from-netlify.js` - Simple script for Netlify integration
- `csv-processor.js` - Handles CSV parsing and Notion sync
- `.env` - Your credentials (keep private!)
