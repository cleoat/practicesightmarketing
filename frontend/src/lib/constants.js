// Pipeline stages
export const STAGES = [
  { id: 'saw_it', label: 'Saw it', color: '#3B82F6', desc: 'No pain yet' },
  { id: 'engaged', label: 'Talking', color: '#F59E0B', desc: 'Asking questions' },
  { id: 'warm', label: 'Warm', color: '#EF4444', desc: 'Billing pain' },
  { id: 'hot', label: 'Hot 🔥', color: '#DC2626', desc: 'Wants to try' },
  { id: 'testing', label: 'Testing', color: '#10B981', desc: 'Using it' },
  { id: 'feedback', label: '✓ Feedback', color: '#8B5CF6', desc: 'Gave feedback' },
  { id: 'not_fit', label: 'Not a fit', color: '#9CA3AF', desc: 'Headway/Alma' }
];

// Communication channels
export const CHANNELS = {
  reddit: { icon: '◉', label: 'Reddit', color: '#E05929' },
  facebook: { icon: 'f', label: 'Facebook', color: '#1877F2' },
  linkedin: { icon: 'in', label: 'LinkedIn', color: '#0A66C2' },
  whatsapp: { icon: 'W', label: 'WhatsApp', color: '#25D366' },
  dm: { icon: '→', label: 'Direct Message', color: '#7C3AED' }
};

// Design system colors
export const COLORS = {
  primary: '#111',
  secondary: '#3B82F6',
  accent: '#E05929',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  bg: '#F9F8F6',
  border: '#E5E3DE',
  muted: '#AAA',
  text: '#111'
};

// Guardrail settings (default values)
export const GUARDRAILS = {
  maxPostsPerDay: 3,
  minSecondsBetweenPosts: 2,
  minAccountAgeDays: 7,
  minThreadAgeDays: 1,
  minThreadComments: 5,
  responseCacheTTLMinutes: 60,
  relevanceThreshold: 0.6,
  rateLimit: true
};

// Spam keywords blocklist (local check, no API)
export const SPAM_KEYWORDS = [
  'buy now',
  'click here',
  'free money',
  'guaranteed',
  'limited time',
  'act now',
  'hurry',
  'don\'t miss',
  'exclusive offer',
  'secret',
  'unbelievable',
  'no catch',
  'risk-free',
  'money back',
  'promo code',
  'discount',
  'get yours',
  'order now',
  'call now',
  'visit our site',
  'shop now'
];

// Local storage keys
export const STORAGE_KEYS = {
  leads: 'ps_leads',
  settings: 'ps_settings',
  backendUrl: 'ps_backend_url',
  redditStats: 'ps_reddit_stats',
  responseCache: 'ps_response_cache',
  costTracker: 'ps_cost_tracker'
};

// API endpoints (relative to backend)
export const API_ENDPOINTS = {
  health: '/health',
  redditPost: '/reddit/post',
  redditAnalyze: '/reddit/analyze',
  pushshift: '/pushshift/search'
};

// Default lead template
export const DEFAULT_LEAD = {
  name: '',
  ch: 'reddit',
  comment: '',
  stage: 'saw_it',
  reply: '',
  date: new Date().toLocaleDateString(),
  actions: [],
  posted: false,
  postUrl: ''
};

// Default settings template
export const DEFAULT_SETTINGS = {
  maxPostsPerDay: 3,
  minSecondsBetweenPosts: 2,
  minAccountAgeDays: 7,
  rateLimit: true,
  backendUrl: '',
  anthropicApiKey: ''
};

// Default Reddit stats
export const DEFAULT_REDDIT_STATS = {
  postsToday: 0,
  lastPostTime: null,
  accountAge: 0
};

// Error messages
export const ERRORS = {
  noName: 'Need a name or handle',
  noComment: 'Need their comment',
  noBackendUrl: 'Configure backend URL in Settings first',
  rateLimitHit: (remaining) => `Hit daily limit (${remaining}/3)`,
  accountTooNew: (days) => `Account too new (${days} days, wait ${7 - days} more)`,
  tooSoon: (wait) => `Wait ${Math.ceil(wait)}s between posts`,
  spamDetected: 'Spam keyword detected',
  notRelevant: 'Not contextually relevant (Llama says <60% match)',
  lowEngagement: 'Thread too new or low engagement',
  connectionError: (msg) => `Connection error: ${msg}`
};

// Success messages
export const SUCCESS = {
  added: 'Lead added (stage auto-detected)',
  replied: 'Reply copied + logged',
  posted: 'Posted to Reddit!',
  cached: 'Using cached response'
};
