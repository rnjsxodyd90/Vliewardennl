# Deployment Guide for Vliewardennl

This guide covers deploying to **Railway** (backend + PostgreSQL) and **Netlify** (frontend), including custom domain setup.

## Prerequisites

- [Railway](https://railway.app) account
- [Netlify](https://netlify.com) account
- Git repository (GitHub)
- (Optional) Custom domain from TransIP, Namecheap, or Cloudflare

---

## 1. Deploy Backend to Railway

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository (`Vliewardennl`)

### Step 2: Configure the Service

After deployment starts:
1. **Click on the service card** (the purple box with your repo name)
2. This opens the service panel on the right side
3. Go to **"Settings"** tab (at the top of the panel)
4. Find **"Root Directory"** and set it to: `server`
5. Click **"Save"**

> **Note**: Railway's UI shows settings when you click on a service. There's no separate "Service Settings" menu - just click the service itself!

### Step 3: Add PostgreSQL Database

1. Click **"+ New"** button (top right of project canvas)
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically connects it and sets `DATABASE_URL`

### Step 4: Set Environment Variables

1. Click on your **server service** (the one with your code)
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | `your-super-secret-key-change-this-123` |
| `NODE_ENV` | `production` |

### Step 5: Generate Public URL

1. Click on your server service
2. Go to **"Settings"** tab
3. Scroll to **"Networking"** section
4. Click **"Generate Domain"**
5. Copy the URL (e.g., `vliewardennl-production.up.railway.app`)

---

## 2. Deploy Frontend to Netlify

### Step 1: Create Site

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repo

### Step 2: Configure Build

| Setting | Value |
|---------|-------|
| Base directory | `client` |
| Build command | `npm run build` |
| Publish directory | `client/build` |

### Step 3: Set Environment Variables

1. Go to **Site configuration** → **Environment variables**
2. Add:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://YOUR-RAILWAY-URL.up.railway.app/api` |

> Replace with your actual Railway URL from Step 1.5!

### Step 4: Redeploy

Go to **Deploys** → **Trigger deploy** → **Deploy site**

---

## 3. Custom Domain Setup (For Public Launch)

### Recommended Structure

| Domain | Platform | Purpose |
|--------|----------|---------|
| `vliewarden.nl` | Netlify | Main website |
| `www.vliewarden.nl` | Netlify | Redirect to main |
| `api.vliewarden.nl` | Railway | Backend API |

### Step 1: Buy a Domain

Recommended registrars:
- **[TransIP](https://transip.nl)** - €5/year for `.nl` (Dutch company)
- **[Namecheap](https://namecheap.com)** - Good prices, easy UI
- **[Cloudflare](https://cloudflare.com/products/registrar)** - At-cost pricing + free CDN

### Step 2: Connect Domain to Railway (Backend)

1. In Railway, click your **server service**
2. Go to **"Settings"** tab → scroll to **"Networking"**
3. Under **"Custom Domain"**, click **"+ Custom Domain"**
4. Enter: `api.vliewarden.nl`
5. Railway shows DNS records - add them to your registrar:
   - Type: `CNAME`
   - Name: `api`
   - Value: `your-app.up.railway.app`

### Step 3: Connect Domain to Netlify (Frontend)

1. In Netlify, go to **Site configuration** → **Domain management**
2. Click **"Add a domain"**
3. Enter: `vliewarden.nl`
4. Add DNS records to your registrar:
   - Type: `A` record pointing to Netlify's IP (they'll show you)
   - Or use Netlify DNS for automatic setup

### Step 4: Update API URL

After custom domain is working:
1. Go to Netlify → **Environment variables**
2. Update `REACT_APP_API_URL` to: `https://api.vliewarden.nl/api`
3. Trigger a redeploy

---

## 4. Verify Deployment

### Test Backend

```bash
curl https://api.vliewarden.nl/api/health
# or with Railway URL:
curl https://your-app.up.railway.app/api/health
```

Expected: `{"status":"ok","message":"Server is running"}`

### Test Frontend

1. Visit your domain
2. Register an account
3. Create a post
4. Refresh and verify data persists

---

## Environment Variables Summary

### Railway (Backend)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | ✅ Auto-set by PostgreSQL addon |
| `JWT_SECRET` | Your secret key (make it long and random) |
| `NODE_ENV` | `production` |
| `PORT` | ✅ Auto-set by Railway |

### Netlify (Frontend)

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Your Railway backend URL + `/api` |

---

## Troubleshooting

### Can't find settings on Railway?
Click directly on the service card (the box with your repo name). Settings appear in a panel on the right side.

### Database connection failed?
- Make sure PostgreSQL addon is added
- Check that `DATABASE_URL` exists in Variables tab

### CORS errors?
- Verify Railway URL is exactly right (no trailing slash)
- Check REACT_APP_API_URL includes `/api` at the end

### Custom domain not working?
- DNS changes can take up to 48 hours (usually faster)
- Check DNS propagation at [whatsmydns.net](https://whatsmydns.net)
