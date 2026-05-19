// Main guardrails orchestrator: Runs all safety checks in order

import * as rateLimiter from './rateLimiter.js';
import * as humanizer from './humanizer.js';
import * as engagementFilter from './engagementFilter.js';
import * as accountWarmer from './accountWarmer.js';
import * as spamKeywords from './spamKeywords.js';
import * as relevanceCheck from './relevanceCheck.js';

export async function analyzePost(lead, threadData, accountData, config = {}) {
  const results = [];
  let blocked = false;
  let blockReason = '';
  let totalCost = '$0';

  // STEP 1: Rate Limit (local, $0)
  const rateLimitCheck = rateLimiter.checkRateLimit(config);
  results.push({ name: 'rate_limit', ...rateLimitCheck });
  if (!rateLimitCheck.safe) {
    blocked = true;
    blockReason = rateLimitCheck.reason;
  }

  // STEP 2: Account Age (local, $0)
  if (!blocked) {
    const accountCheck = accountWarmer.checkAccountAge(accountData, config);
    results.push({ name: 'account_age', ...accountCheck });
    if (!accountCheck.safe) {
      blocked = true;
      blockReason = accountCheck.reason;
    }
  }

  // STEP 3: Spam Keywords (local regex, $0)
  if (!blocked) {
    const spamCheck = spamKeywords.checkSpamKeywords(lead.reply, config.spamFilterEnabled !== false);
    results.push({ name: 'spam_filter', ...spamCheck });
    if (!spamCheck.safe) {
      blocked = true;
      blockReason = spamCheck.reason;
    }
  }

  // STEP 4: Engagement (local logic, $0)
  if (!blocked) {
    const engagementCheckResult = engagementFilter.checkEngagement(threadData, config);
    results.push({ name: 'engagement', ...engagementCheckResult });
    if (!engagementCheckResult.safe) {
      blocked = true;
      blockReason = engagementCheckResult.reason;
    }
  }

  // STEP 5: Relevance (free tier LLM, $0, cached)
  if (!blocked) {
    const relevanceCheckResult = await relevanceCheck.checkRelevance(
      lead.reply,
      threadData,
      config
    );
    results.push({ name: 'relevance', ...relevanceCheckResult });
    if (!relevanceCheckResult.safe) {
      blocked = true;
      blockReason = relevanceCheckResult.reason;
    }
  }

  // Summary
  return {
    blocked,
    blockReason: blocked ? blockReason : '',
    checks: results,
    totalCost: '$0',
    message: blocked ? `Blocked: ${blockReason}` : 'All checks passed, safe to post'
  };
}

export function recordPost() {
  rateLimiter.recordPost();
  return { posted: true };
}

export function getStatus() {
  return {
    rateLimit: rateLimiter.getStats(),
    cacheStats: relevanceCheck.getCacheStats()
  };
}

export function resetDaily() {
  rateLimiter.resetDaily();
  return { reset: true };
}

export async function warmupPost(delaySeconds = 2) {
  // Wait with humanized jitter before posting
  const waitTime = humanizer.getJitteredTime(delaySeconds);
  await humanizer.waitWithJitter(delaySeconds);
  return { waited: true, actualSeconds: waitTime };
}

export function clearCache() {
  return relevanceCheck.clearCache();
}
