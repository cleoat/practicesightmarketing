export const CUSTOM_COMMUNITIES_STORAGE_KEY = 'ps_custom_communities';

const CHANNEL_LABELS = {
  reddit: 'Reddit',
  facebook: 'Facebook group',
  linkedin: 'LinkedIn',
  x: 'X / Twitter',
  whatsapp: 'WhatsApp',
  dm: 'direct message',
  other: 'online community',
};

export function normalizeCommunityName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/new\/?$/, '')
    .replace(/\/$/, '')
    .replace(/\s+/g, ' ');
}

export function loadCustomCommunities() {
  if (typeof localStorage === 'undefined') return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_COMMUNITIES_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function redditNameFromText(value) {
  const match = String(value || '').match(/(?:reddit\.com\/)?r\/([a-z0-9_]+)/i);
  return match ? `r/${match[1]}` : '';
}

function communityAliases(community) {
  return [community.name, community.search, community.url, redditNameFromText(community.url)]
    .filter(Boolean)
    .map(normalizeCommunityName);
}

export function findCommunity(source, knownCommunities = [], customCommunities = loadCustomCommunities()) {
  const normalized = normalizeCommunityName(source);
  const redditName = normalizeCommunityName(redditNameFromText(source));
  if (!normalized && !redditName) return null;

  const targets = new Set([normalized, redditName].filter(Boolean));
  return [...knownCommunities, ...customCommunities].find(c =>
    communityAliases(c).some(alias => targets.has(alias))
  ) || null;
}

export function inferChannelFromText(value, knownCommunities = []) {
  const community = findCommunity(value, knownCommunities);
  if (community?.platform) return community.platform;

  const normalized = normalizeCommunityName(value);
  if (!normalized) return '';
  if (/^r\/[a-z0-9_]+/.test(normalized) || normalized.includes('reddit.com/r/')) return 'reddit';
  if (normalized.includes('facebook.com') || normalized.includes('fb.com') || /\bfacebook\b|\bfb\b/.test(normalized)) return 'facebook';
  if (normalized.includes('linkedin.com')) return 'linkedin';
  if (normalized.includes('twitter.com') || normalized.includes('x.com') || normalized.startsWith('#')) return 'x';
  return '';
}

export function getCommunityRule(source, channel, knownCommunities = []) {
  const community = findCommunity(source, knownCommunities);
  const inferredChannel = community?.platform || channel || inferChannelFromText(source, knownCommunities) || 'other';
  const isKnown = Boolean(community);
  const canMentionProduct = isKnown ? Boolean(community.safe) : inferredChannel !== 'reddit';

  return {
    source: community?.name || String(source || '').trim(),
    platform: inferredChannel,
    label: CHANNEL_LABELS[inferredChannel] || CHANNEL_LABELS.other,
    canMentionProduct,
    strict: !canMentionProduct,
    assumed: !isKnown,
    rule: community?.rule || '',
    tip: community?.tip || '',
  };
}

export function formatCommunityForPrompt(rule) {
  const source = rule.source ? `${rule.source} on ` : '';
  return `${source}${rule.label}`;
}

export function communityToneGuidance(rule) {
  if (rule.platform === 'reddit') {
    return 'Use concise Reddit peer-support language. Avoid sales tone, links, and product names unless the community is explicitly marked can-mention.';
  }
  if (rule.platform === 'facebook') {
    return 'Use a warm Facebook group tone. Sound like a helpful colleague, not a business page.';
  }
  if (rule.platform === 'linkedin') {
    return 'Use a professional but personal LinkedIn tone.';
  }
  if (rule.platform === 'x') {
    return 'Use a short conversational reply suited for X.';
  }
  return 'Use a natural peer-to-peer tone for the channel.';
}
