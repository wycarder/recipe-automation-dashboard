# Netlify Environment Variables Setup

## Issue Found
The CSV upload is failing with a 500 error because the Notion API credentials are not available in the Netlify deployment environment.

## Required Environment Variables
You need to add these environment variables to your Netlify site settings:

### 1. Go to Netlify Dashboard
1. Go to [netlify.com](https://netlify.com) and log in
2. Find your site: `recipe-automation-dashboard`
3. Click on the site name

### 2. Navigate to Site Settings
1. Click on "Site settings" in the left sidebar
2. Click on "Environment variables" under "Build & deploy"

### 3. Add These Variables
Click "Add variable" and add each of these:

```
NOTION_API_KEY = ntn_N781957006022eI7MwlJpg8IliYWnYIE5rDW4fTlfnfa2L
NOTION_RECIPES_DB_ID = 1bd1d2152b8c807d86decc5a97d7fdac
NOTION_WEBSITES_DB_ID = 1d31d2152b8c8023a4faf8d7829c2ada
```

### 4. Redeploy
After adding the environment variables:
1. Go to "Deploys" tab
2. Click "Trigger deploy" → "Deploy site"
3. Or push a new commit to trigger automatic deployment

## Alternative: Quick Fix Script
If you prefer, I can create a script to help you set these up automatically.

## Verification
After setting up the environment variables and redeploying:
1. Try uploading a CSV file again
2. Check the browser console for any remaining errors
3. The upload should now work and push data to Notion

## Security Note
These API keys are now visible in this file. Consider rotating them after setup for security.
