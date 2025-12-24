# Deployment Guide for Vliewardennl

This guide covers deploying the Vliewardennl marketplace to **Railway** (backend + PostgreSQL) and **Netlify** (frontend).

## Prerequisites

- [Railway](https://railway.app) account (provides free PostgreSQL)
- [Netlify](https://netlify.com) account
- Git repository (GitHub, GitLab, etc.)

---

## 1. Deploy Backend to Railway

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Railway will auto-detect the Node.js app

### Step 2: Set Root Directory

Since your backend is in `/server`:
1. Go to **Settings** → **Service Settings**
2. Set **Root Directory** to `server`

### Step 3: Add PostgreSQL Database

1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway automatically sets `DATABASE_URL` for you

### Step 4: Set Environment Variables

Go to **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | Your secret key (e.g., `your-super-secret-key-123`) |
| `NODE_ENV` | `production` |

### Step 5: Deploy

Railway will automatically deploy. Check the **Deployments** tab for logs.

### Step 6: Get Your API URL

Go to **Settings** → **Networking** → **Generate Domain**  
Your API URL will be something like: `https://vliewardennl-production.up.railway.app`

---

## 2. Deploy Frontend to Netlify

### Step 1: Create Netlify Site

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository

### Step 2: Configure Build Settings

| Setting | Value |
|---------|-------|
| Base directory | `client` |
| Build command | `npm run build` |
| Publish directory | `client/build` |

### Step 3: Set Environment Variables

Go to **Site settings** → **Environment variables** and add:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://your-railway-app.up.railway.app/api` |

> **Important**: Replace with your actual Railway URL from Step 1.6!

### Step 4: Trigger Rebuild

After adding the environment variable, go to **Deploys** and click **"Trigger deploy"** → **"Deploy site"**

---

## 3. Verify Deployment

### Test Backend Health

```bash
curl https://your-railway-app.up.railway.app/api/health
```

Expected response:
```json
{"status":"ok","message":"Server is running"}
```

### Test Frontend

Visit your Netlify URL and:
1. Register a new account
2. Create a post
3. Verify data persists after refresh

---

## Environment Variables Summary

### Railway (Backend)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Auto-set by Railway PostgreSQL addon |
| `JWT_SECRET` | Secret key for JWT tokens |
| `NODE_ENV` | Set to `production` |
| `PORT` | Auto-set by Railway |

### Netlify (Frontend)
| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Full URL to your Railway backend API |

---

## Troubleshooting

### Database Connection Failed
- Make sure PostgreSQL addon is added to Railway
- Check that `DATABASE_URL` variable exists

### CORS Errors
- Verify your Railway backend is running
- Check that `REACT_APP_API_URL` is set correctly (no trailing slash)

### Build Failures on Netlify
- Make sure `base` directory is set to `client`
- Check build logs for npm errors

---

## Alternative: Deploy to Render

If you prefer Render over Railway:

1. Create a **Web Service** on [render.com](https://render.com)
2. Set Root Directory to `server`
3. Add a **PostgreSQL** database
4. Set environment variable `DATABASE_URL` to the Render PostgreSQL URL
5. Set `JWT_SECRET` and `NODE_ENV=production`
