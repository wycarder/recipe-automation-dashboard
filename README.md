# Recipe Automation Dashboard

A Next.js application for managing recipe keyword automation across 45+ food blog websites.

## Features

- 🌐 **45 Pre-configured Websites** - All your websites are already loaded
- ➕ **Add New Websites** - Easy form to add new sites to your collection
- 🔍 **Search & Filter** - Quick search across all websites
- ✅ **Bulk Selection** - Select all/deselect all functionality
- 📊 **Clean Dashboard** - Modern, responsive interface

## Deploy to Netlify

### Option 1: One-Click Deploy (Recommended)

1. Push this repository to GitHub
2. Log in to [Netlify](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub account and select this repository
5. Click "Deploy site"

### Option 2: Manual Deploy via Netlify CLI

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Deploy:
```bash
netlify deploy --prod
```

### Option 3: Drag & Drop

1. Build the project locally:
```bash
npm run build
```

2. Go to [Netlify Drop](https://app.netlify.com/drop)
3. Drag the `.next` folder to the browser window

## Local Development

```bash
npm install
npm run dev
```

## Website List

The app includes 45 pre-configured websites:
- airfryerauthority.com
- antiinflammatorytable.com
- balconyharvestkitchen.com
- bluezonefeast.com
- brunchbright.com
- And 40 more...

## Adding New Websites

1. Click "Add New Website" button
2. Enter the domain (e.g., example.com)
3. Set the search keyword
4. Define weekly quota
5. Click "Add Website"

## Environment Variables (Optional)

If you want to connect to a backend API, add these to Netlify:

```
NEXT_PUBLIC_API_URL=your-api-url
```

## Notes

- The app currently stores websites in local state
- To persist data, you'll need to connect to a backend API
- All websites are set to "Active" by default
- Weekly quota defaults to 30 recipes per website