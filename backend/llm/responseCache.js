// Response cache for LLM calls: 1 hour TTL, prevents duplicate API calls

const cache = new Map();
let CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function getCacheKey(type, data) {
  // Generate unique cache key for the request
  const str = JSON.stringify({ type, data });
  return Buffer.from(str).toString('base64');
}

export function get(key) {
  const entry = cache.get(key);
  
  if (!entry) return null;

  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return { ...entry.data, cached: true, cost: '$0' };
}

export function set(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  return true;
}

export function getOrCompute(key, computeFn) {
  // Get from cache or compute and cache
  const cached = get(key);
  if (cached) return Promise.resolve(cached);

  return computeFn().then(result => {
    set(key, result);
    return result;
  });
}

export function clear() {
  cache.clear();
  return true;
}

export function clearExpired() {
  const now = Date.now();
  let cleared = 0;

  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
      cleared++;
    }
  }

  return { cleared, remaining: cache.size };
}

export function getStats() {
  const now = Date.now();
  let expired = 0;
  let valid = 0;

  for (const entry of cache.values()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      expired++;
    } else {
      valid++;
    }
  }

  return {
    totalEntries: cache.size,
    validEntries: valid,
    expiredEntries: expired,
    ttlMs: CACHE_TTL_MS,
    ttlMinutes: CACHE_TTL_MS / (60 * 1000)
  };
}

export function setCustomTTL(ttlMs) {
  // Allow custom TTL if needed
  const oldTTL = CACHE_TTL_MS;
  CACHE_TTL_MS = ttlMs;
  return { old: oldTTL, new: ttlMs };
}
