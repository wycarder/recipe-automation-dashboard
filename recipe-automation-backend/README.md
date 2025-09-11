# Recipe Automation Backend

This is the backend service for the Recipe Automation System. It handles:
- PinClicks web scraping
- Notion database integration
- Email notifications
- Automation scheduling

## Architecture

```
Frontend (Netlify) ←→ Backend API (Hetzner) ←→ External Services
                                              ├── PinClicks
                                              ├── Notion API
                                              └── Gmail SMTP
```

## API Endpoints

- `POST /api/automation/start` - Start automation for selected websites
- `GET /api/automation/status` - Get current automation status
- `POST /api/automation/stop` - Stop running automation
- `GET /health` - Health check endpoint

## Local Development

1. Clone the repository
2. Copy `env.example` to `.env` and fill in your credentials
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

## Production Deployment

See [HETZNER-DEPLOYMENT.md](./HETZNER-DEPLOYMENT.md) for detailed deployment instructions.

## Environment Variables

- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS
- `PINCLICKS_EMAIL` - PinClicks login email
- `PINCLICKS_PASSWORD` - PinClicks password
- `NOTION_API_KEY` - Notion integration token
- `NOTION_RECIPES_DB_ID` - Notion recipes database ID
- `NOTION_WEBSITES_DB_ID` - Notion websites database ID
- `GMAIL_USER` - Gmail address for notifications
- `GMAIL_APP_PASSWORD` - Gmail app-specific password
- `ENABLE_SCHEDULED_AUTOMATION` - Enable daily automation (true/false)

## Docker Support

Build and run with Docker:
```bash
docker build -t recipe-automation .
docker run -p 3001:3001 --env-file .env recipe-automation
```

Or use Docker Compose:
```bash
docker-compose up -d
```

## Scheduled Automation

When `ENABLE_SCHEDULED_AUTOMATION=true`, the system will automatically run at 2 AM daily.
