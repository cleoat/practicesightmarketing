// Relevance check: Uses cached LLM calls to determine if comment fits thread

import * as openrouter from '../llm/openrouter.js';
import * as responseCache from '../llm/responseCache.js';

export async function checkRelevance(comment, threadData, config = {}) {
  const {
    threshold = 0.6,
    enabled = true
  } = config;

  if (!enabled) {
    return { safe: true, reason: '', cost: '$0' };
  }

  // Create cache key
  const cacheKey = responseCache.getCacheKey('relevance', {
    comment: comment.slice(0, 100),
    thread: (threadData.content || '').slice(0, 100)
  });

  // Check cache first
  const cached = responseCache.get(cacheKey);
  if (cached) {
    const safe = cached.score >= threshold;
    return {
      safe,
      reason: safe ? '' : `Not relevant (${(cached.score * 100).toFixed(0)}%)`,
      score: cached.score,
      cached: true,
      cost: '$0'
    };
  }

  // Not in cache, call LLM
  try {
    const result = await openrouter.checkRelevance(
      comment,
      threadData.content || threadData.title || ''
    );

    // Cache the result
    responseCache.set(cacheKey, {
      score: result.score,
      reason: result.reason
    });

    const safe = result.score >= threshold;
    return {
      safe,
      reason: safe ? '' : `Not relevant (${(result.score * 100).toFixed(0)}%)`,
      score: result.score,
      cached: false,
      cost: '$0'
    };
  } catch (error) {
    // On error, assume moderate relevance
    return {
      safe: true,
      reason: 'Could not check relevance',
      score: 0.5,
      cached: false,
      cost: '$0',
      error: error.message
    };
  }
}

export async function generateReply(threadData, userContext, config = {}) {
  const { enabled = true } = config;

  if (!enabled) {
    return { text: '', confidence: 0, cost: '$0' };
  }

  // Create cache key
  const cacheKey = responseCache.getCacheKey('reply', {
    thread: (threadData.content || '').slice(0, 100),
    context: userContext.slice(0, 50)
  });

  // Check cache first
  const cached = responseCache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true, cost: '$0' };
  }

  // Not in cache, generate with LLM
  try {
    const result = await openrouter.generateReply(
      threadData.content || threadData.title || '',
      userContext
    );

    // Cache the result
    responseCache.set(cacheKey, {
      text: result.text,
      confidence: result.confidence
    });

    return { ...result, cached: false, cost: '$0' };
  } catch (error) {
    return {
      text: '',
      confidence: 0,
      cached: false,
      cost: '$0',
      error: error.message
    };
  }
}

export function getCacheStats() {
  return responseCache.getStats();
}

export function clearCache() {
  responseCache.clear();
  return { cleared: true };
}

export function clearExpiredCache() {
  return responseCache.clearExpired();
}
