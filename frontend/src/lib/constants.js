// Pipeline stages
export const APP_BUILD_LABEL = 'LeadCard feedback fix v1';

export const STAGES = [
  { id: 'saw_it', label: 'Saw it', color: '#2563EB', desc: 'No pain yet' },
  { id: 'engaged', label: 'Talking', color: '#D97706', desc: 'Asking questions' },
  { id: 'warm', label: 'Warm', color: '#DC2626', desc: 'Billing pain' },
  { id: 'hot', label: 'Hot', color: '#B91C1C', desc: 'Wants to try' },
  { id: 'testing', label: 'Testing', color: '#059669', desc: 'Using it' },
  { id: 'feedback', label: 'Feedback', color: '#7C3AED', desc: 'Gave feedback' },
  { id: 'not_fit', label: 'Not a fit', color: '#64748B', desc: 'Headway/Alma' }
];

// Communication channels
export const CHANNELS = {
  reddit: { icon: '◉', label: 'Reddit', color: '#D9480F' },
  facebook: { icon: 'f', label: 'Facebook', color: '#1864AB' },
  linkedin: { icon: 'in', label: 'LinkedIn', color: '#0A66C2' },
  x: { icon: '𝕏', label: 'X / Twitter', color: '#000000' },
  whatsapp: { icon: 'W', label: 'WhatsApp', color: '#0E9F6E' },
  dm: { icon: '→', label: 'Direct Message', color: '#7C3AED' }
};

// Design system colors
export const COLORS = {
  primary: '#111827',
  secondary: '#2563EB',
  accent: '#D9480F',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  bg: '#F4F7FB',
  border: '#CBD5E1',
  muted: '#64748B',
  text: '#111827'
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
  redditStats: 'ps_reddit_stats',
  communityPosts: 'ps_community_posts'
};

// Default lead template
export const DEFAULT_LEAD = {
  name: '',
  ch: 'reddit',
  source: '',
  threadUrl: '',
  threadKey: '',
  comment: '',
  stage: 'saw_it',
  leadType: 'unknown',
  responseType: '',
  intent: '',
  analysisReason: '',
  reply: '',
  replyApproved: false,
  lastApprovedReply: '',
  lastApprovedAt: '',
  followUps: [],
  conversation: [],
  date: new Date().toLocaleDateString(),
  actions: [],
  posted: false,
  lastPostedAt: '',
  lastPostedCommunity: '',
  nextFollowUpAt: '',
  postUrl: '',
  postAuthor: '',
  postText: '',
  importedAt: '',
  lastImportedAt: ''
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
