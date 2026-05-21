# PracticeSight Outreach

Reddit/Facebook CRM for therapy practitioners. Find billing-frustrated leads, generate AI replies, and manage your outreach pipeline.

## Stack

| Part     | Tech              | Host   |
|----------|-------------------|--------|
| Frontend | React 18 + Vite   | Vercel |
| LLM      | OpenRouter (free) | —      |

Frontend-only. No backend, no database — all state in localStorage.

## Setup

```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

Enter your [OpenRouter API key](https://openrouter.ai/keys) in the app's Settings panel. That's it.

## Deploy

Vercel auto-deploys on push to `main`. Build config is in `vercel.json`.
