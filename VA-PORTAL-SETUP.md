# VA Portal Features Setup Guide

## 🚀 Features Successfully Implemented

✅ **Feature 1: Keyword Table Display** - Shows clean table alongside existing command string  
✅ **Feature 2: CSV Upload Portal** - Manual CSV upload with Notion integration

## 🔧 Environment Setup Required

The CSV upload feature requires Notion API configuration. Here's how to set it up:

### Step 1: Get Your Notion API Credentials

1. **Go to [Notion Developers](https://developers.notion.com/)**
2. **Create a new integration** (if you don't have one)
3. **Copy your API key** from the integration settings
4. **Find your database IDs**:
   - Go to your Notion database (Recipes database)
   - Copy the database ID from the URL: `https://notion.so/[WORKSPACE]/[DATABASE_ID]`
   - Do the same for your Websites database

### Step 2: Configure Environment Variables

Edit the `.env.local` file in your project root:

```bash
# Replace these with your actual values
NOTION_API_KEY=secret_your_actual_notion_api_key_here
NOTION_RECIPES_DB_ID=your_actual_recipes_database_id_here
NOTION_WEBSITES_DB_ID=your_actual_websites_database_id_here

# Optional - only needed for full Playwright automation
PINCLICKS_EMAIL=your-email@gmail.com
PINCLICKS_PASSWORD=your-password

# Development API URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 3: Share Databases with Integration

1. **Go to each Notion database** (Recipes and Websites)
2. **Click "Share"** in the top right
3. **Add your integration** by searching for its name
4. **Give it "Can edit" permissions**

### Step 4: Restart Development Server

```bash
# Kill the current server (Ctrl+C) then restart
npm run dev
```

## 🧪 Testing the Features

### Feature 1: Keyword Table Display
1. **Select websites** using checkboxes
2. **Add optional recipe theme** (e.g., "thanksgiving")
3. **Click "Show Command"** or **"📋 Copy Command"**
4. **See the new table** with clean keyword display
5. **Test individual copy buttons** and **CSV export**

### Feature 2: CSV Upload Portal
1. **Scroll down** to "📁 Manual CSV Upload Portal"
2. **Upload a CSV file** (drag & drop or click to browse)
3. **Click "🚀 Push to Notion"**
4. **Check your Notion database** for the new recipes

## 🔍 Troubleshooting

### If CSV Upload Still Fails:
1. **Check browser console** for detailed error messages
2. **Verify environment variables** are set correctly
3. **Ensure databases are shared** with your integration
4. **Check that CSV file** has proper format (Title, URL, etc.)

### If Environment Variables Don't Load:
1. **Restart the development server** completely
2. **Check `.env.local` file** exists and has correct format
3. **Verify no spaces** around the `=` signs

## 📋 Current Status

- ✅ **Keyword table display** - Working (no setup needed)
- ✅ **CSV upload UI** - Working (no setup needed)  
- ⚠️ **Notion integration** - Requires API setup (see above)

## 🎯 What Works Without Setup

- **Website selection and management**
- **AI keyword generation and display**
- **Keyword table with copy buttons**
- **CSV export from keyword table**
- **CSV file upload and validation**
- **All existing automation features**

## 🎯 What Requires Notion Setup

- **Pushing uploaded CSV data to Notion**
- **Creating recipe entries in your database**

---

**Need help?** Check the browser console for detailed error messages, or verify your Notion integration has access to both databases.
