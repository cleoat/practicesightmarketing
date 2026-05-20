function hasAny(text, patterns) {
  return patterns.some(pattern => pattern.test(text));
}

const BILLING_VENDOR_PATTERNS = [
  /\bwe\s+(do|handle|manage|provide|offer|take care of|process)\s+(the\s+)?(entire\s+|whole\s+)?(billing|claims|payments|revenue cycle)\b/,
  /\bwe\s+(enter|post|reconcile|submit|follow up on)\s+(payments|claims|eras|eobs)\b/,
  /\b(our|my)\s+(billing company|billing service|billing agency|rcm company|credentialing company)\b/,
  /\b(billing company|billing service|billing agency|medical biller|revenue cycle|rcm|credentialing service)\b/,
  /\bfor\s+(our\s+)?(clients|providers|practices|clinicians)\b.*\b(billing|claims|payments|reconciliation)\b/,
  /\bwe\s+export\s+(the\s+)?payment report\b/,
];

const OUTSOURCED_PATTERNS = [
  /\b(headway|alma|grow therapy|sondermind|rive|octave)\b/,
  /\b(my|our)\s+biller\s+(handles|does|takes care of)\b/,
  /\b(i|we)\s+(have|use|hired)\s+(a\s+)?(biller|billing company|billing service)\b/,
];

const PAIN_PATTERNS = [
  /\b(i|we)\s+(am|are|'m|'re)\s+(struggling|stuck|confused|lost|overwhelmed|behind)\b/,
  /\b(my|our)\s+(claims|billing|payments|eras|eobs|invoices)\s+(are|is|keep|keeps|got|get)\s+(stuck|denied|rejected|delayed|messy|overdue|unpaid|missing)\b/,
  /\b(unbilled|stuck claims|claim denial|claim denials|aging claims|unpaid insurance|payment posting|era enrollment|reconciliation)\b/,
  /\b(i|we)\s+(do|handle|manage)\s+(my|our)\s+own\s+(billing|claims|insurance)\b/,
  /\b(i|we)\s+can't\s+(keep up|figure out|track|reconcile)\b/,
];

const BUYING_INTENT_PATTERNS = [
  /\b(want to try|how do i|how much|sign up|get started|interested in|where can i find|can you send|dm me|link)\b/,
];

const TESTING_PATTERNS = [
  /\b(been using|tried it|tested it|testing it|ran it|uploaded my reports)\b/,
];

const FEEDBACK_PATTERNS = [
  /\b(it worked|found something|caught|solved|feedback|confusing|bug|missed)\b/,
];

function classifyPersona(text) {
  if (hasAny(text, BILLING_VENDOR_PATTERNS)) {
    return {
      leadType: 'billing_vendor',
      responseType: 'Vendor / billing company',
      reason: 'They describe providing billing, payment posting, reconciliation, or RCM work.',
      blocksWarm: true,
    };
  }

  if (hasAny(text, OUTSOURCED_PATTERNS)) {
    return {
      leadType: 'outsourced_billing',
      responseType: 'Not a direct fit',
      reason: 'Billing appears outsourced or handled by a platform, so they are not the direct buyer right now.',
      blocksWarm: true,
    };
  }

  return {
    leadType: 'potential_practice',
    responseType: 'Potential practice lead',
    reason: '',
    blocksWarm: false,
  };
}

export function analyzeLeadComment(comment) {
  const text = String(comment || '').toLowerCase();
  const persona = classifyPersona(text);

  if (!text.trim()) {
    return {
      ...persona,
      intent: 'empty',
      stage: 'saw_it',
      reason: 'No comment text yet.',
    };
  }

  if (persona.blocksWarm) {
    return {
      ...persona,
      intent: persona.leadType === 'billing_vendor' ? 'vendor_process' : 'outsourced',
      stage: 'not_fit',
    };
  }

  if (hasAny(text, FEEDBACK_PATTERNS)) {
    return {
      ...persona,
      intent: 'feedback',
      stage: 'feedback',
      reason: 'They are reporting results, confusion, or feedback after trying something.',
    };
  }

  if (hasAny(text, TESTING_PATTERNS)) {
    return {
      ...persona,
      intent: 'testing',
      stage: 'testing',
      reason: 'They appear to be trying or using the product/workflow.',
    };
  }

  if (hasAny(text, BUYING_INTENT_PATTERNS)) {
    return {
      ...persona,
      intent: 'buying_intent',
      stage: 'hot',
      reason: 'They are asking how to try, buy, sign up, or get a link.',
    };
  }

  if (hasAny(text, PAIN_PATTERNS)) {
    return {
      ...persona,
      intent: 'billing_pain',
      stage: 'warm',
      reason: 'They describe their own billing, claim, payment, or reconciliation pain.',
    };
  }

  if (text.includes('?')) {
    return {
      ...persona,
      intent: 'question',
      stage: 'engaged',
      reason: 'They are asking a question, but not clearly showing billing pain yet.',
    };
  }

  return {
    ...persona,
    intent: 'low_signal',
    stage: 'saw_it',
    reason: 'No clear buying intent or billing pain detected.',
  };
}

