// Spam keyword blocklist: Local regex check ($0 cost, prevents obvious spam)

const SPAM_KEYWORDS = [
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
  'discount code',
  'get yours',
  'order now',
  'call now',
  'visit our site',
  'shop now',
  'click the link',
  'follow the link',
  'check out my',
  'visit my site',
  'my website',
  'http://',
  'https://',
  '.com',
  'affiliate',
  'commission'
];

const SPAM_PATTERNS = [
  /\$\d+/,                 // Dollar amounts ($99, etc)
  /discount.*(%)|(off)/i,  // Discount offers
  /earn.*(money|cash)/i,   // Money making claims
  /free.*(trial|sample|money)/i, // Free offers
  /join.*(now|today)/i,    // Urgent joining
  /limited.*(offer|time)/i // Limited offers
];

export function checkSpamKeywords(text, enabled = true) {
  if (!enabled || !text) {
    return { safe: true, reason: '', cost: '$0' };
  }

  const lower = text.toLowerCase();

  // Check for exact keyword matches
  for (const keyword of SPAM_KEYWORDS) {
    if (lower.includes(keyword)) {
      return {
        safe: false,
        reason: `Spam keyword detected: "${keyword}"`,
        cost: '$0',
        keyword
      };
    }
  }

  // Check for pattern matches
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        reason: `Spam pattern detected: ${pattern.toString()}`,
        cost: '$0',
        pattern: pattern.toString()
      };
    }
  }

  return {
    safe: true,
    reason: '',
    cost: '$0'
  };
}

export function getSpamScore(text) {
  // Score out of 100 (higher = more likely spam)
  let score = 0;

  if (!text) return score;

  const lower = text.toLowerCase();

  // Count keyword matches
  for (const keyword of SPAM_KEYWORDS) {
    if (lower.includes(keyword)) score += 15;
  }

  // Count pattern matches
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) score += 10;
  }

  // Check for ALL CAPS (spammy)
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5) score += 20;

  // Check for excessive punctuation
  const punctCount = (text.match(/[!?!?]{2,}/g) || []).length;
  if (punctCount > 0) score += 10;

  return Math.min(score, 100);
}

export function isLikelySpam(text, threshold = 40) {
  return getSpamScore(text) >= threshold;
}

export function addKeyword(keyword) {
  if (!SPAM_KEYWORDS.includes(keyword.toLowerCase())) {
    SPAM_KEYWORDS.push(keyword.toLowerCase());
    return true;
  }
  return false;
}

export function removeKeyword(keyword) {
  const idx = SPAM_KEYWORDS.indexOf(keyword.toLowerCase());
  if (idx > -1) {
    SPAM_KEYWORDS.splice(idx, 1);
    return true;
  }
  return false;
}

export function getKeywordList() {
  return [...SPAM_KEYWORDS];
}
