# PracticeSight Outreach + Reddit Automation

Safe, intelligent Reddit marketing CRM for therapy practitioners. Auto-reply generation, lead pipeline management, and Reddit posting with built-in safety guardrails.

## Features

✅ **Zero-Cost Forever**
- Frontend: Vercel FREE tier
- Backend: Render FREE tier  
- LLM: OpenRouter free tier (Llama 2 7B)
- **Total cost: $0/month**

✅ **5-Layer Safety Guardrails**
1. Rate limiting (max 3 posts/day, 2+ sec between)
2. Account warming (7+ day minimum age)
3. Spam keyword blocklist (local regex, $0)
4. Engagement filtering (thread age, min comments)
5. Relevance scoring (Llama 2 7B, cached 1 hour)

✅ **AI-Powered Features**
- Auto-detect lead stage from comment
- Generate contextual replies (Llama 2 7B)
- Cache responses (1 hour TTL)
- Humanized posting delays (randomized jitter)

✅ **Full Transparency**
- All costs shown ($0)
- Pipeline view (7 stages)
- Guardrail breakdown
- Response cache stats

## Quick Start

### Frontend (Vercel)

```bash
cd frontend
npm install
npm run build
```

Deploy to Vercel:
```bash
npm install -g vercel
vercel
# Follow prompts, pick 'frontend' folder
```

### Backend (Render)

```bash
cd backend
npm install
```

Create `.env` file:
```bash
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password
OPENROUTER_API_KEY=sk-or-v1-your-key
PORT=3000
```

Deploy to Render:
1. Push to GitHub
2. Go to render.com
3. New Web Service
4. Connect repo, select `backend` folder
5. Add env vars from `.env`
6. Deploy

## Get Reddit Credentials

1. Go to https://www.reddit.com/prefs/apps
2. Create "personal use script"
3. Copy client ID, client secret
4. Add your Reddit username/password to `.env`

## Get OpenRouter Key

1. Go to https://openrouter.ai (free tier available)
2. Create API key
3. Add to `.env` as `OPENROUTER_API_KEY=sk-or-v1-xxx`

## Local Development

```bash
# Terminal 1: Frontend
cd frontend
npm run dev
# Visit http://localhost:5173

# Terminal 2: Backend
cd backend
npm start
# Backend runs on http://localhost:3000
```

## Architecture

**Frontend (React + Vite)**
- Pipeline view (7 stages)
- Lead management
- Auto-add with stage detection
- Settings panel
- Metrics dashboard

**Backend (Express + Node.js)**
- 5 guardrail modules
- LLM integration (Llama 2 7B)
- Response caching
- PRAW wrapper (Reddit posting)
- Rate limiting

**Guardrails**
- rateLimiter.js - Max 3/day, 2+ sec between
- humanizer.js - Randomized delays
- engagementFilter.js - Thread age + comments
- accountWarmer.js - Account age checks
- spamKeywords.js - Local keyword blocklist
- relevanceCheck.js - LLM relevance scoring (cached)

## API Endpoints

- `GET /health` - Health check
- `POST /reddit/post` - Post to Reddit (runs all guardrails)
- `GET /status` - Show guardrail stats
- `POST /cache/clear` - Clear LLM response cache
- `POST /admin/reset-daily` - Reset daily post counter

## Cost Model

| Component | Cost |
|-----------|------|
| Vercel (frontend) | $0 |
| Render (backend) | $0 |
| Llama 2 7B (LLM) | $0 (free tier) |
| Reddit API | $0 |
| **Total** | **$0** |

## Safety Features

- ✅ Won't post from accounts <7 days old
- ✅ Won't spam (max 3/day, 2+ sec between)
- ✅ Won't post to dead threads (min engagement required)
- ✅ Won't post spam keywords (local filter, $0)
- ✅ Won't post irrelevant content (LLM check, cached)
- ✅ All delays are randomized (looks human, not bot)
- ✅ All guardrails pass or no post happens

## Files

```
frontend/
├── src/
│   ├── App.jsx              (main component)
│   ├── main.jsx
│   ├── index.css
│   ├── components/
│   │   ├── MetricsBar.jsx
│   │   ├── PipelineView.jsx
│   │   ├── LeadCard.jsx
│   │   └── SettingsPanel.jsx
│   ├── api/
│   │   └── reddit.js
│   └── lib/
│       ├── constants.js
│       ├── validators.js
│       └── storage.js

backend/
├── server.js
├── guardrails/
│   ├── index.js
│   ├── rateLimiter.js
│   ├── humanizer.js
│   ├── engagementFilter.js
│   ├── accountWarmer.js
│   ├── spamKeywords.js
│   └── relevanceCheck.js
├── llm/
│   ├── openrouter.js
│   └── responseCache.js
├── reddit/
│   ├── praw-wrapper.js
│   └── post_to_reddit.py
└── package.json
```

## Documentation

- `CLAUDE.md` - Project governance (sprint board, decisions log)
- `DEPLOYMENT.md` - Detailed deployment guide
- `REDDIT-SETUP.md` - Reddit API setup
- `ARCHITECTURE.md` - System design

## License

PracticeSight © 2024

## Support

For issues or feature requests: [GitHub Issues]
