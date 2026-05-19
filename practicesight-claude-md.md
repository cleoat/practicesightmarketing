# ════════════════════════════════════════════════════════
# PRACTICESIGHT OUTREACH — PROJECT SCAFFOLD
# Director/Coder Architecture · Scrum Method · Credit Efficient
# ════════════════════════════════════════════════════════

## WHO YOU ARE IN THIS PROJECT
You are the **Director**, not the coder. Your job is to:
1. Read this file at the start of every response
2. Check what sprint task is next (see SCRUM BOARD below)
3. Write the code for that task — but keep each piece small and focused
4. Mark the task done in the board, pick the next one
5. Always tell me what you just completed and what is next

You write code because deployment needs git. To save credits:
- Write one focused task at a time — never dump the whole app at once
- Reuse existing code before writing new code
- Ask before adding new libraries or changing architecture
- After each task, stop and confirm before moving to the next

---

## PROJECT IDENTITY
**App name:** PracticeSight Outreach + Reddit Automation
**What it does:** AI-powered CRM for therapy practitioners to automate Reddit/Facebook outreach with PRAW integration, auto-reply generation, and Reddit safety guardrails
**Stack:** React 18 + Vite + Tailwind + Node.js + PRAW + Express
**Auth:** None (local user, future: Supabase)
**Database:** localStorage (frontend) + .env config (backend)

---

## FOLDER STRUCTURE
```
practicesightmarketing/
├── CLAUDE.md                 ← this file (governance)
├── SCRUM.md                  ← sprint board updates
├── README.md                 ← deployment guide
├── frontend/
│   ├── src/
│   │   ├── App.jsx          ← main React component
│   │   ├── components/
│   │   │   ├── PipelineView.jsx
│   │   │   ├── SettingsPanel.jsx
│   │   │   ├── LeadCard.jsx
│   │   │   ├── MetricsBar.jsx
│   │   │   └── SafetyChecksPanel.jsx ← NEW: show guardrail status
│   │   ├── api/
│   │   │   └── reddit.js    ← API calls to backend
│   │   ├── lib/
│   │   │   ├── storage.js   ← localStorage helpers
│   │   │   ├── validators.js ← Zod schemas
│   │   │   └── constants.js ← stages, channels, colors
│   │   ├── hooks/
│   │   │   ├── useLeads.js
│   │   │   └── useSettings.js
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env
│   └── .gitignore
├── backend/
│   ├── server.js               ← Express + /reddit/post endpoint
│   ├── guardrails/
│   │   ├── index.js            ← Main guardrails orchestrator
│   │   ├── rateLimiter.js      ← 60 req/min, 2 sec between posts
│   │   ├── humanizer.js        ← Randomized delays + jitter
│   │   ├── engagementFilter.js ← Min age, min comments check
│   │   ├── accountWarmer.js    ← Account age validation
│   │   ├── relevanceCheck.js   ← NLP via OpenRouter LLM
│   │   └── pushshift.js        ← Pushshift API research
│   ├── reddit/
│   │   ├── praw-wrapper.js     ← PRAW subprocess calls
│   │   ├── redditwarp.js       ← Optional: RedditWarp alternative
│   │   └── post_to_reddit.py   ← PRAW + safety checks
│   ├── llm/
│   │   └── openrouter.js       ← OpenRouter API calls
│   ├── package.json
│   ├── .env                    ← Store Reddit OAuth + OpenRouter key
│   └── .gitignore
├── docs/
│   ├── DEPLOYMENT.md
│   ├── REDDIT-SETUP.md
│   ├── GUARDRAILS.md           ← NEW: safety logic docs
│   └── ARCHITECTURE.md
└── n8n/
    └── workflows/
        └── reddit-warmup.json  ← Optional: n8n account warming
```

---

## TECH STACK DECISIONS

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React 18 + Vite | Fast, modern, easy HMR |
| Styling | Tailwind CSS | Utility-first, consistent design |
| Backend | Node.js + Express | JavaScript unified, easy deployment |
| Reddit API | PRAW (Python) + RedditWarp (type-safe) | Official + modern alternative |
| Reddit Research | Pushshift API | Historical data, trend analysis, safe limits |
| **LLM Routing** | **OpenRouter (free tier only)** | **Multi-model, no cost on free tier** |
| **LLM Models** | **Llama 2 7B + Mistral 7B (free)** | **Open-source, zero cost, faster** |
| Guardrails Module | Custom (rate limit, warmup, engagement scoring) | Account protection, humanization logic |
| **Smart Algorithm** | **Hybrid: Local logic + minimal LLM calls** | **99% free, only use LLM for complex tasks** |
| Process Bridge | python-shell | Safe subprocess for PRAW/RedditWarp |
| Validation | Zod | Type-safe runtime validation |
| Storage (Frontend) | localStorage | Simple, no backend DB needed |
| Storage (Backend Config) | .env | Secrets stay out of repo |
| Deployment | Vercel (frontend, FREE tier) + Render (backend, FREE tier) | No costs |

**CRITICAL: ZERO-COST GUARANTEE**

```javascript
// Algorithm hierarchy (stop at first match, no API call if possible):
1. LOCAL REGEX CHECK    → Is reply obviously spam? (keyword blocklist)
2. LOCAL ENGAGEMENT     → Thread meets min age + comments? (no API)
3. LOCAL RATE LIMIT     → Check rate limiter + jitter (no API)
4. LOCAL ACCOUNT WARMUP → Check account age (no API)
5. OPENROUTER LLM CALL  → Only if ^4 checks PASS (voice match + relevance)
   └─ Use Llama 2 7B (free tier, cached responses)
```

**Rules Claude must follow:**
- ✅ **ZERO API COSTS**: No Claude API calls. OpenRouter free tier ONLY.
- ✅ **99% local processing**: Guardrails work without LLM
- ✅ **LLM only for complexity**: Voice matching, context nuance (1 call per lead max)
- ✅ **Response caching**: Don't re-check same thread twice
- ✅ **Batch scoring**: Process 10 leads, make 1 LLM call if needed
- ✅ **All inputs validated with Zod**
- ✅ **No `any` TypeScript**
- ✅ **No inline styles — Tailwind only**
- ✅ **No `console.log` in production code**
- ✅ **Never commit `.env` files (OpenRouter API key must be free tier)**
- ✅ **One task per response — complete before next**

---

## DESIGN SYSTEM

**Colors:**
- Primary: `#111` (black)
- Secondary: `#3B82F6` (blue)
- Accent: `#E05929` (reddit orange)
- Success: `#10B981` (green)
- Warning: `#F59E0B` (amber)
- Error: `#EF4444` (red)
- Background: `#F9F8F6` (off-white)
- Text: `#111` (near-black)
- Border: `#E5E3DE` (light)
- Muted: `#AAA` (gray)

**Typography:** DM Sans
- h1: `text-2xl font-bold`
- h2: `text-lg font-bold`
- h3: `text-base font-semibold`
- body: `text-sm`
- caption: `text-xs`

**Border radius:** 8px (cards), 6px (inputs), 9px (buttons)

**Component rules:**
- Buttons: Black bg, white text, 9px radius, 12px padding
- Inputs: Light border, 6px radius, 8px padding, DM Sans
- Cards: White bg, light border, 8px radius
- Pipeline columns: 280px width, auto overflow

---

## HYBRID ALGORITHM — FREE TIER ONLY ($0 COST)

**Goal:** 99% local logic. Free tier LLM only when needed. Zero API charges.

### Algorithm Flow (Stop at first fail):

```javascript
async function analyzeAndReply(lead, threadData) {
  // STEP 1: LOCAL SPAM CHECK (0 API calls, $0)
  const spamKeywords = ['buy now', 'click here', 'free money', 'guaranteed'];
  if (spamKeywords.some(k => lead.reply.toLowerCase().includes(k))) {
    return { blocked: true, reason: 'Spam detected', cost: '$0' };
  }

  // STEP 2: LOCAL RATE LIMIT (0 API calls, $0)
  if (Date.now() - store.get('lastPostTime') < 2000) {
    return { blocked: true, reason: 'Rate limited', cost: '$0' };
  }

  // STEP 3: LOCAL ACCOUNT AGE (0 API calls, $0)
  const accountAge = (Date.now() - accountData.created) / (1000 * 60 * 60 * 24);
  if (accountAge < 7) {
    return { blocked: true, reason: `Account too new (${accountAge} days)`, cost: '$0' };
  }

  // STEP 4: LOCAL ENGAGEMENT FILTER (0 API calls, $0)
  const threadAge = (Date.now() - threadData.createdAt) / (1000 * 60 * 60 * 24);
  if (!(threadData.comments >= 5 && threadAge >= 1)) {
    return { blocked: true, reason: 'Low engagement', cost: '$0' };
  }

  // STEP 5: FREE TIER LLM RELEVANCE CHECK (Llama 2 7B, cached, $0)
  const relevance = await checkRelevanceViaLlama2(lead.reply, threadData);
  if (relevance.score < 0.6) {
    return { blocked: true, reason: 'Not relevant', cost: '$0 (free tier)' };
  }

  // STEP 6: FREE TIER LLM GENERATE REPLY (Llama 2 7B, cached, $0)
  const reply = await generateReplyViaLlama2(threadData, lead);
  
  return { 
    safe: true, 
    reply: reply.text,
    cost: '$0 (free tier)'
  };
}
```

### Cost Guarantee:

| Component | Method | Cost |
|-----------|--------|------|
| Rate limit check | Local timer | $0 |
| Account age check | Local date math | $0 |
| Spam blocklist | Local regex | $0 |
| Engagement filter | Local logic | $0 |
| Relevance scoring | Llama 2 7B (free, cached) | $0 |
| Reply generation | Llama 2 7B (free, cached) | $0 |
| **Total per post** | | **$0** |

### Caching (Prevents redundant calls):

```javascript
const responseCache = new Map(); // key: threadId, value: { relevance, reply }

async function checkRelevanceViaLlama2(comment, thread) {
  // Check cache first (1 hour TTL)
  if (responseCache.has(thread.id)) {
    return { ...responseCache.get(thread.id), cached: true, cost: '$0' };
  }

  // Call free tier LLM only if not cached
  const response = await openrouter.messages.create({
    model: "meta-llama/llama-2-7b-chat",  // FREE TIER
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `Thread: "${thread.content}"\n\nComment: "${comment}"\n\nReturn JSON: {score: 0-1, reason: "why"}`
    }]
  });

  const result = JSON.parse(response.choices[0].text);
  
  // Cache for 1 hour
  responseCache.set(thread.id, result);
  setTimeout(() => responseCache.delete(thread.id), 60 * 60 * 1000);

  return { ...result, cached: false };
}
``` Model:

| Component | LLM | Cost | Calls/lead | Notes |
|-----------|-----|------|-----------|-------|
| Spam check | Local regex | $0 | 0 | Every lead |
| Engagement | Local logic | $0 | 0 | Every lead |
| Rate limit | Local timer | $0 | 0 | Every lead |
| Account age | Local date | $0 | 0 | Every lead |
| Relevance filter | Llama 2 7B | $0 | 1 (cached) | Free tier, 30-min TTL |
| Reply generation | Claude 3.5 | ~$0.01-0.05 | 1 | Only if passes all checks |

**Total cost per successful post: ~$0.02-0.06**
(Blocked leads cost nothing)

### Response Caching:

```javascript
// Don't regenerate same reply twice
const replyCache = new Map(); // key: threadId, value: reply

async function generateReplyWithClaude(thread, voice) {
  // Check cache first
  if (replyCache.has(thread.id)) {
    return { reply: replyCache.get(thread.id), cached: true, cost: '$0' };
  }

  // Call Claude only if not cached
  const reply = await claudeAPI.messages.create({
    model: "claude-3-5-sonnet",
    system: `You are a helpful therapist in private practice. Match this voice: "${voice}"`,
    messages: [{ role: "user", content: thread.content }]
  });

  // Cache for 30 minutes
  replyCache.set(thread.id, reply);
  setTimeout(() => replyCache.delete(thread.id), 30 * 60 * 1000);

  return { reply, cached: false, cost: '$0.01-0.05' };
}
```

---

## NAMING CONVENTIONS
```
Components:   PascalCase.jsx          → LeadCard.jsx
API functions: camelCase              → postToReddit()
Hooks:        use + PascalCase.js     → useLeads.js
Utils:        camelCase.js            → validatePost.js
Validators:   camelCase.types.js      → lead.types.js
Constants:    CONSTANT_CASE.js        → STAGES.js
Python files: snake_case.py           → post_to_reddit.py
```

---

## ══════════════════════════════════════════
## SCRUM BOARD — SPRINT 1 (FOUNDATION)
## ══════════════════════════════════════════

**Current Sprint:** Sprint 1 - Foundation
**Sprint Goal:** Deploy working frontend + backend with Reddit automation
**Sprint Dates:** Week 1-2
**Points target:** 34 points

### ✅ DONE
| ID | Task | Pts |
|----|------|-----|
| S1-01 | Setup frontend (Vite + React + Tailwind) | 3 |

### 👁 IN REVIEW
| ID | Task | Pts |
|----|------|-----|
| — | — | — |

### 🔨 IN PROGRESS
| ID | Task | Pts |
|----|------|-----|
| S1-02 | Create lib/constants.js (stages, channels, colors) | 2 |

### ⬜ TODO ← Next unblocked
| ID | Task | Pts | Depends on |
|----|------|-----|------------|
| S1-02 | Create lib/constants.js (stages, channels, colors) | 2 | S1-01 |
| S1-03 | Create lib/validators.js (Zod schemas) | 3 | S1-01 |
| S1-04 | Create lib/storage.js (localStorage helpers) | 2 | S1-01 |
| S1-05 | Create components/MetricsBar.jsx | 3 | S1-02 |
| S1-06 | Create components/LeadCard.jsx | 5 | S1-03, S1-04 |
| S1-07 | Create components/PipelineView.jsx | 5 | S1-06 |
| S1-08 | Create components/SettingsPanel.jsx | 3 | S1-02 |
| S1-09 | Create components/SafetyChecksPanel.jsx | 3 | S1-02 |
| S1-10 | Create App.jsx (main orchestrator) | 3 | S1-05 through S1-09 |
| S1-11 | Setup backend (Express server) | 3 | — |
| S1-12 | Create guardrails/rateLimiter.js | 3 | — |
| S1-13 | Create guardrails/humanizer.js (jitter + delays) | 3 | — |
| S1-14 | Create guardrails/engagementFilter.js | 3 | — |
| S1-15 | Create guardrails/accountWarmer.js | 2 | — |
| S1-16 | Create llm/openrouter.js (Llama 2 7B free tier) | 5 | — |
| S1-17 | Create llm/responseCache.js (30-min TTL caching) | 3 | — |
| S1-18 | Create guardrails/spamKeywords.js (local regex blocklist) | 2 | — |
| S1-19 | Create guardrails/relevanceCheck.js (orchestrates S1-16 + caching) | 3 | S1-16, S1-17 |
| S1-20 | Create guardrails/pushshift.js (research API) | 3 | — |
| S1-21 | Create guardrails/index.js (main hybrid orchestrator) | 5 | S1-12 through S1-20 |
| S1-22 | Create reddit/praw-wrapper.js (PRAW subprocess) | 3 | — |
| S1-23 | Create post_to_reddit.py (PRAW + safety calls) | 5 | S1-22 |
| S1-24 | Create backend/server.js with /reddit/post endpoint | 5 | S1-11, S1-21, S1-23 |
| S1-25 | Create frontend/api/reddit.js (call backend) | 3 | S1-10 |
| S1-26 | Create components/CostTracker.jsx (show 0 API costs) | 3 | S1-02 |
| S1-27 | Create docs/HYBRID-ALGORITHM.md + ZERO-COST.md | 3 | — |
| S1-28 | Create .env.example files + setup guide | 2 | — |
| S1-29 | Create README.md + DEPLOYMENT.md | 3 | — |

### 🧊 BACKLOG (Future sprints)
| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| B-01 | Dashboard analytics | High | View posted content performance |
| B-02 | Supabase integration | High | Real DB instead of localStorage |
| B-03 | Auto-warmup scheduler | Med | Schedule posts at safe intervals |
| B-04 | Multi-account support | Med | Manage multiple Reddit accounts |
| B-05 | Facebook integration | Med | Extend PRAW to Facebook Groups |
| B-06 | Notification webhook | Low | Slack/email alerts on conversions |

---

## ══════════════════════════════════════════
## FILE REGISTRY — UPDATED AS FILES CREATED
## ══════════════════════════════════════════

| File path | Description | Status | Last updated |
|-----------|-------------|--------|--------------|
| frontend/package.json | React 18 + Vite + Tailwind dependencies | ✅ | S1-01 |
| frontend/vite.config.js | Vite build config + API proxy | ✅ | S1-01 |
| frontend/index.html | HTML entry point + DM Sans font | ✅ | S1-01 |
| frontend/tailwind.config.js | Tailwind design system colors + theme | ✅ | S1-01 |
| frontend/postcss.config.js | Tailwind + autoprefixer | ✅ | S1-01 |
| frontend/.env | Local API URL config | ✅ | S1-01 |
| frontend/.gitignore | Ignore node_modules, dist, .env.local | ✅ | S1-01 |
| frontend/src/lib/constants.js | All stages, channels, colors, guardrails, errors | ✅ | S1-02 |

---

## ══════════════════════════════════════════
## DECISIONS LOG — APPEND ONLY
## ══════════════════════════════════════════

```
[SESSION 1] SAFETY-FIRST ARCHITECTURE: PRAW alone is insufficient. 
  Implemented 5-layer guardrails: rate limit → humanizer → engagement filter 
  → account warmer → LLM relevance check. No post executes without passing all 5.

[SESSION 1] OpenRouter API for intelligence: Multi-model LLM access via single 
  API key. Used for relevance checking (does reply match thread context?), 
  humanization scoring, and voice matching.

[SESSION 1] Pushshift API for research: Enables market research, trend analysis, 
  historical data without hitting Reddit's 30-60 req/min rate limit.

[SESSION 1] Modular guardrails: Each check is separate JS file. Easier to test, 
  update, and understand. rateLimiter.js, humanizer.js, etc. can work independently.

[SESSION 1] Randomized delays + jitter: Posts never happen at same interval. 
  Minimum 2 seconds between requests, randomized up to configured max.

[SESSION 1] Engagement scoring: Only reply to threads with min 1-7 days age 
  and 5+ comments. Avoids dead/ghost threads.

[SESSION 1] Account warming: Reject any post from accounts <7 days old. 
  New accounts are instant-flagged by Reddit; we gate them early.

[SESSION 1] No n8n for MVP: Keeping it simpler (Express + custom guardrails). 
  Can add n8n workflows in Sprint 2 for complex scheduling.

[SESSION 1] Frontend shows safety status: SafetyChecksPanel.jsx displays which 
  guardrails passed/failed before posting. Transparency for user.
```

---

## HOW EACH RESPONSE SHOULD BE STRUCTURED

```
📍 CURRENT TASK: [task ID + name]
📦 SPRINT STATUS: X done / Y in progress / Z todo

[Code artifact for this task only]

✅ COMPLETED: [what was just done]
📋 FILES CREATED/UPDATED: [list]
🔜 NEXT TASK: [next ID + name]
```

---

## DEPLOYMENT CHECKLIST (at end of sprint)

- [ ] All `.env` files in `.gitignore`
- [ ] No `console.log` in production code
- [ ] All inputs validated with Zod
- [ ] Frontend builds without errors: `npm run build`
- [ ] Backend starts without errors: `npm start`
- [ ] Reddit OAuth credentials safely in Render env vars
- [ ] PRAW safety guardrails active in post_to_reddit.py
- [ ] README.md + DEPLOYMENT.md complete
- [ ] GitHub repo pushed and clean

---

## CREDIT EFFICIENCY RULES
1. **One task at a time** — complete fully before next
2. **Show only changed sections** when editing files
3. **Ask before:**
   - Adding npm packages
   - Changing DB schema
   - Modifying tech stack
4. **Append to DECISIONS** whenever you make a choice
5. **If task >100 lines**, split into smaller subtasks
6. **Update FILE REGISTRY** after every file creation

---

## START HERE

**PracticeSight: Zero-Cost Reddit Marketing CRM**

✅ **No Claude API charges** — Free tier LLMs only (Llama 2, Mistral)
✅ **99% local logic** — Spam, rate limit, engagement (no API calls)
✅ **Smart replies** — Llama 2 7B generates contextual responses
✅ **Aggressive caching** — 1-hour TTL prevents duplicate calls
✅ **Infrastructure: FREE** — Vercel + Render free tier
✅ **API costs: $0** — OpenRouter free tier only
✅ **Safety guardrails** — 5-layer protection, account warming, jitter delays

**TOTAL COST: $0/month**
- No Claude API charges
- No subscription needed (your $20 Claude is separate, for personal use)
- Everything runs on free tier open-source LLMs
- Infrastructure is FREE

Ready to continue building? Say **"CONTINUE"** to proceed with S1-02.

(This is the correct setup: free LLMs only, zero ongoing costs)
