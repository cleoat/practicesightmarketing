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
  x: { icon: '𝕏', label: 'X / Twitter', color: '#000000' },
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

// Spam keywords blocklist (local check, no API)
export const SPAM_KEYWORDS = [
  'buy now', 'click here', 'free money', 'guaranteed', 'limited time',
  'act now', 'hurry', "don't miss", 'exclusive offer', 'secret',
  'unbelievable', 'no catch', 'risk-free', 'money back', 'promo code',
  'discount', 'get yours', 'order now', 'call now', 'visit our site', 'shop now'
];

// Local storage keys
export const STORAGE_KEYS = {
  leads: 'ps_leads',
  settings: 'ps_settings',
  redditStats: 'ps_reddit_stats'
};

// Default lead template
export const DEFAULT_LEAD = {
  name: '',
  ch: 'reddit',
  source: '',
  threadUrl: '',
  comment: '',
  stage: 'saw_it',
  reply: '',
  followUps: [],
  date: new Date().toLocaleDateString(),
  actions: [],
  posted: false,
  postUrl: ''
};

// Default settings template
export const DEFAULT_SETTINGS = {
  maxPostsPerDay: 3,
  openrouterApiKey: '',
  openrouterModel: ''
};

// Default Reddit stats
export const DEFAULT_REDDIT_STATS = {
  postsToday: 0,
  lastPostTime: null,
  accountAge: 0
};
