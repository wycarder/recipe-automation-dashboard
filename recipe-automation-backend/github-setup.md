# GitHub Repository Setup

## Create New Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `recipe-automation-backend`
3. Description: "Backend service for Recipe Automation - PinClicks scraping, Notion sync, email notifications"
4. Set to **Private** (contains sensitive automation logic)
5. Don't initialize with README (we already have one)
6. Click "Create repository"

## Push to GitHub

After creating the repository, run these commands:

```bash
# Add remote origin (replace 'wycarder' with your GitHub username)
git remote add origin https://github.com/wycarder/recipe-automation-backend.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Repository Settings

After pushing, go to Settings → Secrets and variables → Actions:

Add these repository secrets for CI/CD (optional):
- `DOCKER_HUB_USERNAME`
- `DOCKER_HUB_TOKEN`
- `HETZNER_SSH_KEY`
- `HETZNER_HOST`

This will allow automated deployments in the future.
