# PracticeSight – Deployment Guide

## Architecture

| Part     | Tech                    | Host    |
|----------|-------------------------|---------|
| Frontend | React + Vite            | Vercel  |
| Backend  | Node.js + Express + Python PRAW | Railway |

---

## 1. Get Reddit API Credentials

1. Go to https://www.reddit.com/prefs/apps
2. Click **"Create App"** at the bottom
3. Fill in:
   - **Name**: PracticeSight (or anything)
   - **Type**: script ← important
   - **Redirect URI**: http://localhost:3000
4. Click **"Create app"**
5. You'll see:
   - A string under the app name → this is your **CLIENT_ID**
   - A "secret" field → this is your **CLIENT_SECRET**

---

## 2. Deploy Backend to Railway

1. Go to https://railway.app → sign up with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `practicesightmarketing`
4. Set **Root Directory** to: `backend`
5. Add these Environment Variables in Railway dashboard:

```
REDDIT_CLIENT_ID=        ← from step 1
REDDIT_CLIENT_SECRET=    ← from step 1
REDDIT_USERNAME=         ← your Reddit username (not email)
REDDIT_PASSWORD=         ← your Reddit password
REDDIT_USER_AGENT=PracticeSight/1.0 by u/YOUR_USERNAME
CORS_ORIGIN=https://practicesightmarketing.vercel.app
PORT=3000
```

6. Deploy. Railway gives you a URL like:
   `https://practicesightmarketing-backend.up.railway.app`

7. Test it: visit `https://your-railway-url.up.railway.app/health`
   You should see: `{"status":"ok","timestamp":"..."}`

---

## 3. Connect Frontend to Backend

1. Go to https://vercel.com → your project → **Settings → Environment Variables**
2. Add:
   ```
   VITE_API_URL = https://your-railway-url.up.railway.app
   ```
3. Go to **Deployments** → click **"Redeploy"** on the latest deployment

---

## 4. Verify Everything Works

- Frontend: https://practicesightmarketing.vercel.app
- Backend health: https://your-railway-url.up.railway.app/health
- Backend status: https://your-railway-url.up.railway.app/status

---

## Environment Variables Summary

### Backend (Railway)
| Variable | Description |
|---|---|
| `REDDIT_CLIENT_ID` | From reddit.com/prefs/apps |
| `REDDIT_CLIENT_SECRET` | From reddit.com/prefs/apps |
| `REDDIT_USERNAME` | Your Reddit username |
| `REDDIT_PASSWORD` | Your Reddit password |
| `REDDIT_USER_AGENT` | e.g. `PracticeSight/1.0 by u/yourname` |
| `CORS_ORIGIN` | `https://practicesightmarketing.vercel.app` |
| `PORT` | `3000` |

### Frontend (Vercel)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Your Railway backend URL |
