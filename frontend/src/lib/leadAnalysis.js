function hasAny(text, patterns) {
  return patterns.some(p => p.test(text));
}

// ── OFFERING HELP / SERVICE PROVIDER ────────────────────────────────
const OFFERING_HELP_PATTERNS = [
  /\b(i|we)\s+can\s+help\s+(you|with|your|therapists|practices)\b/,
  /\b(i|we)\s+(offer|provide|specialize in|focus on)\s+(billing|rcm|revenue cycle|claims|medical billing)\b/,
  /\bfeel free to\s+(reach out|contact|dm|message)\b/,
  /\b(reach out|contact us|dm me|message me)\s+(if you need|for help|to learn more|anytime)\b/,
  /\bhappy to\s+(help|assist|answer|chat|discuss)\b/,
  /\b(available|here)\s+(to help|for questions|if you have questions)\b/,
  /\blet'?s\s+connect\b/,
  /\blet\s+me\s+know\s+if\s+(i|we)\s+can\s+help\b/,
  /\bsend\s+me\s+(a\s+)?(text|dm|message)\b/,
  /\bplease\s+check\s+(ib|inbox|dm|messages?)\b/,
  /\bwe\s+(also\s+)?help\s+(practices|therapists|providers|clinics|clinicians)\s+with\b/,
  /\bcheck out\s+(my|our)\s+(website|service|company|profile)\b/,
  /\bwe\s+(specialize|work)\s+(in|with)\s+(therapists|therapy practices|mental health)\b/,
];

// ── VENDOR / BILLING COMPANY ────────────────────────────────────────
const BILLING_VENDOR_PATTERNS = [
  // "we do [the] [entire/whole] billing"
  /\bwe\s+(do|handle|manage|provide|offer|take care of|process)\s+(the\s+)?(entire\s+|whole\s+|all\s+the\s+)?(billing|claims|payments|revenue cycle|rcm)\b/,
  // "we enter/post/reconcile payments or claims"
  /\bwe\s+(enter|post|reconcile|submit|follow up on|chase|work)\s+(payments|claims|eras|eobs|denials|charges)\b/,
  // "we export the payment report" / "we do the reconciliation"
  /\bwe\s+(export|run|generate|pull)\s+(the\s+)?(payment\s+report|billing\s+report|aging\s+report|eob|era)\b/,
  /\bwe\s+do\s+(the\s+)?(entire|whole|full|all\s+the)\s+(billing|reconciliation|payment posting|claim submission)\b/,
  // "our billing company/service/agency/department"
  /\b(our|my)\s+(billing company|billing service|billing agency|rcm company|billing department|billing team|billing staff)\b/,
  // standalone service-provider terms
  /\b(medical biller|medical billing company|revenue cycle management company|rcm company|billing agency|billing clearinghouse)\b/,
  /\b(rcm|billing)\s+(solutions|services|support|consulting|consultants)\b/,
  // "for our clients / providers / practices"
  /\bfor\s+(our\s+)?(clients|providers|practices|clinicians|therapists)\b/,
  // "I'm a (medical) biller"
  /\bi'?m\s+(a\s+)?(medical\s+)?biller\b/,
  // "I work at/for a billing company"
  /\bi\s+work\s+(at|for)\s+(a\s+)?(billing|rcm|revenue cycle)\s*(company|firm|agency|service)?\b/,
  // "we handle billing for multiple practices"
  /\bwe\s+handle\s+(the\s+)?billing\s+for\s+(multiple|several|many|our|all)\b/,
  // "I do billing for [someone else]"
  /\bi\s+(do|handle|manage|process|take care of)\s+(the\s+|all\s+the\s+)?(billing|claims|payments)\s+for\b/,
  // "we work with multiple practices/providers"
  /\bwe\s+work\s+with\s+(multiple|many|several|various|our)?\s*(practices|providers|therapists|clinicians|offices)\b/,
  // "our clients" in a vendor context
  /\bour\s+(therapy\s+)?(clients|client practices|client providers)\b/,
];

// ── OUTSOURCED / NOT THE BILLER ────────────────────────────────────
const OUTSOURCED_PATTERNS = [
  /\b(headway|alma|grow therapy|sondermind|rive|octave|brightside|invoquest)\b/,
  /\bmy\s+biller\b/,
  /\b(my|our)\s+biller\s+(handles|does|takes care of|manages|works|is)\b/,
  /\b(i|we)\s+(have|use|hired|outsource\s+to|love|like|trust)\s+(a\s+|my\s+)?(biller|billing company|billing service|virtual biller)\b/,
  /\bsomeone\s+else\s+(handles|does|manages)\s+(the\s+)?billing\b/,
  /\bi\s+don'?t\s+(do|handle|manage|touch)\s+(my|our|the)\s+own?\s+billing\b/,
  /\b(flat\s+rate|monthly\s+fee)\s+(for\s+)?(billing|claims)\b/,
];

// ── PROCESS ADVICE — KNOWLEDGEABLE BUT NOT PAIN YET ────────────────
const PROCESS_ADVICE_PATTERNS = [
  /\b(run|pull|export|check|review|compare|match|reconcile|work)\s+(reports?|aging|a\/r|ar|claims|payments|deposits|eras|eobs)\b/,
  /\b(claims submitted|claims paid|bank deposits|aging reports?|scheduled sessions|billed sessions|unpaid claims|denied claims)\b/,
  /\b(month.?end|end.?of.?month)\s+(workflow|process|routine|review|reconciliation|reconcile)\b/,
  /\b(routine|system|workflow|spreadsheet|dashboard|reporting|weekly reconciliation)\b/,
  /\b(collection report|charge lag report|days in ar|a\/r aging|ar aging)\b/,
  /\b(ehr reporting|clearinghouse platform|era\/eob|eras?|eobs?)\b/,
];

// ── DOES OWN BILLING — QUALIFY BEFORE PITCH ────────────────────────
const OWN_BILLING_PATTERNS = [
  /\b(i|we)\s+(do|handle|manage|run)\s+(my|our)\s+own\s+(billing|claims|insurance|insurance billing)\b/,
  /\b(i|we)\s+(bill|submit claims|post payments|reconcile)\s+(my|our)\s*(own\s*)?(claims|payments|billing)?\b/,
];

// ── BILLING PAIN — IDEAL LEAD ───────────────────────────────────────
const PAIN_PATTERNS = [
  /\b(struggling|stuck|confused|overwhelmed|behind|stressed|frustrated|annoyed|worried)\s+(with|about|by)\s+(billing|claims|insurance|payments|eras|eobs|reconcili)/,
  /\b(my|our)\s+(claims|billing|payments|eras|eobs)\s+(are|is|keep|keeps|got|get)\s+(stuck|denied|rejected|delayed|messy|overdue|unpaid|missing|lost)\b/,
  /\b(unbilled|uncollected|unfiled|unpaid insurance|aging claims|claim denial|outstanding balance|revenue gap|lost revenue|money on the table)\b/,
  /\b(i|we)\s+(can'?t|cannot)\s+(keep up with|figure out|track|reconcile|stay on top of)\b/,
  /\bsimple\s*practice\s+(billing|reports|outstanding|claims).*\b(stuck|missing|denied|unpaid|wrong|confusing|reconcile|catch)\b/,
  /\b(how do you|does anyone|anyone else)\s+(track|manage|handle|check|review)\s+(billing|claims|insurance|eras|payments|denials)\b/,
  /\b(sessions?|appointments?)\s+(that\s+)?(went\s+)?(unbilled|unfiled|never\s+billed|slipped\s+through|fell\s+through)\b/,
  /\b(check|review|audit|catch)\s+(my|your|the|our)\s+(billing|claims|insurance|eras|denials|outstanding)\b/,
];

// ── BUYING INTENT ────────────────────────────────────────────────────
const BUYING_INTENT_PATTERNS = [
  /\b(want to try|how do i|how much|sign up|get started|interested in|where can i find|can you send|dm me|link please|what'?s the link|send me the link|can i try)\b/,
];

// ── ALREADY TESTING ──────────────────────────────────────────────────
const TESTING_PATTERNS = [
  /\b(been using|tried it|tested it|testing it|ran it|uploaded my reports|just tried|just ran|imported my)\b/,
];

// ── GAVE FEEDBACK ────────────────────────────────────────────────────
const FEEDBACK_PATTERNS = [
  /\b(it worked|found something|caught|fixed|solved it|feedback|confusing|bug|missed|didn'?t catch|great tool|saved me)\b/,
];

function classifyPersona(text) {
  if (hasAny(text, OFFERING_HELP_PATTERNS) || hasAny(text, BILLING_VENDOR_PATTERNS)) {
    return {
      leadType: 'billing_vendor',
      responseType: '🏢 Billing company / vendor',
      reason: 'They are offering billing help or describing billing work for multiple clients — not a therapist doing their own billing.',
      nextMove: 'Do not pitch in public. Reply neutrally or skip unless the conversation moves private.',
      blocksWarm: true,
    };
  }

  if (hasAny(text, OUTSOURCED_PATTERNS)) {
    return {
      leadType: 'outsourced_billing',
      responseType: '🔄 Billing outsourced',
      reason: 'Billing appears to be handled by a platform or third party, so they aren\'t the direct buyer — but may know someone who is.',
      nextMove: 'Do not pitch. Ask what they still review themselves only if the thread is worth engaging.',
      blocksWarm: true,
    };
  }

  return {
    leadType: 'potential_practice',
      responseType: '👤 Private practice therapist',
      reason: '',
      nextMove: 'Qualify gently before pitching.',
      blocksWarm: false,
    };
}

export function analyzeLeadComment(comment) {
  const text = String(comment || '').toLowerCase();
  const persona = classifyPersona(text);

  if (!text.trim()) {
    return { ...persona, intent: 'empty', stage: 'saw_it', reason: 'No comment text yet.' };
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
      reason: 'They are reporting results or feedback after trying the product.',
    };
  }

  if (hasAny(text, TESTING_PATTERNS)) {
    return {
      ...persona,
      intent: 'testing',
      stage: 'testing',
      reason: 'They appear to be trying or testing the workflow.',
    };
  }

  if (hasAny(text, BUYING_INTENT_PATTERNS)) {
    return {
      ...persona,
      intent: 'buying_intent',
      stage: 'hot',
      reason: 'They are asking how to try, sign up, or get a link.',
    };
  }

  if (hasAny(text, PAIN_PATTERNS)) {
    return {
      ...persona,
      intent: 'billing_pain',
      stage: 'warm',
      reason: 'They describe their own billing, claim, payment, or reconciliation pain.',
      nextMove: 'Validate the specific pain and offer PracticeSight only if the community allows it.',
    };
  }

  if (hasAny(text, OWN_BILLING_PATTERNS)) {
    return {
      ...persona,
      intent: 'own_billing_no_pain',
      stage: 'engaged',
      reason: 'They appear to do their own billing, but have not named a concrete pain point yet.',
      nextMove: 'Ask what they worry might slip through before mentioning PracticeSight.',
    };
  }

  if (hasAny(text, PROCESS_ADVICE_PATTERNS)) {
    return {
      leadType: 'process_advice',
      responseType: '🧭 Process advice / possible peer',
      intent: 'process_advice',
      stage: 'engaged',
      reason: 'They gave billing workflow advice, not evidence that they personally have the pain.',
      blocksWarm: false,
      nextMove: 'Use their workflow to ask a pain-finding question about what still slips through.',
    };
  }

  if (text.includes('?')) {
    return {
      ...persona,
      intent: 'question',
      stage: 'engaged',
      reason: 'They are asking a question but haven\'t shown clear billing pain yet.',
      nextMove: 'Answer briefly, then ask one question that reveals whether they do their own billing.',
    };
  }

  return {
    ...persona,
    intent: 'low_signal',
    stage: 'saw_it',
    reason: 'No clear intent or billing pain detected yet.',
    nextMove: 'Do not pitch. Ask one light qualifying question or skip.',
  };
}
