import { STORAGE_KEYS, DEFAULT_LEAD, DEFAULT_SETTINGS, DEFAULT_REDDIT_STATS } from './constants';

// Generic get/set helpers
export function getStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Storage read error (${key}):`, err);
    return null;
  }
}

export function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Storage write error (${key}):`, err);
    return false;
  }
}

export function removeStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error(`Storage remove error (${key}):`, err);
    return false;
  }
}

// LEADS
export function getLeads() {
  return getStorage(STORAGE_KEYS.leads) || [];
}

export function setLeads(leads) {
  return setStorage(STORAGE_KEYS.leads, leads);
}

export function addLead(lead) {
  const leads = getLeads();
  const newLead = { ...DEFAULT_LEAD, ...lead, id: Date.now() };
  leads.unshift(newLead);
  setLeads(leads);
  return newLead;
}

export function updateLead(id, updates) {
  const leads = getLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return null;
  leads[idx] = { ...leads[idx], ...updates };
  setLeads(leads);
  return leads[idx];
}

export function deleteLead(id) {
  const leads = getLeads().filter(l => l.id !== id);
  setLeads(leads);
  return true;
}

// SETTINGS
export function getSettings() {
  return getStorage(STORAGE_KEYS.settings) || DEFAULT_SETTINGS;
}

export function setSettings(settings) {
  return setStorage(STORAGE_KEYS.settings, settings);
}

export function updateSetting(key, value) {
  const settings = getSettings();
  settings[key] = value;
  setSettings(settings);
  return settings;
}

// REDDIT STATS
export function getRedditStats() {
  return getStorage(STORAGE_KEYS.redditStats) || DEFAULT_REDDIT_STATS;
}

export function setRedditStats(stats) {
  return setStorage(STORAGE_KEYS.redditStats, stats);
}

export function incrementPostsToday() {
  const stats = getRedditStats();
  stats.postsToday += 1;
  stats.lastPostTime = Date.now();
  setRedditStats(stats);
  return stats;
}

export function resetDailyStats() {
  const stats = getRedditStats();
  const lastReset = localStorage.getItem('ps_last_reset_date');
  const today = new Date().toDateString();
  
  if (lastReset !== today) {
    stats.postsToday = 0;
    stats.lastPostTime = null;
    localStorage.setItem('ps_last_reset_date', today);
    setRedditStats(stats);
  }
  
  return stats;
}

// BACKEND URL
export function getBackendUrl() {
  return getStorage(STORAGE_KEYS.backendUrl) || '';
}

export function setBackendUrl(url) {
  return setStorage(STORAGE_KEYS.backendUrl, url);
}

// RESPONSE CACHE (1 hour TTL)
export function getResponseCache() {
  return getStorage(STORAGE_KEYS.responseCache) || {};
}

export function getCachedResponse(threadId) {
  const cache = getResponseCache();
  const cached = cache[threadId];
  
  if (!cached) return null;
  
  // Check if expired (1 hour)
  const now = Date.now();
  if (now - cached.timestamp > 60 * 60 * 1000) {
    // Expired, remove it
    delete cache[threadId];
    setStorage(STORAGE_KEYS.responseCache, cache);
    return null;
  }
  
  return cached;
}

export function setCachedResponse(threadId, response) {
  const cache = getResponseCache();
  cache[threadId] = {
    ...response,
    timestamp: Date.now()
  };
  return setStorage(STORAGE_KEYS.responseCache, cache);
}

export function clearExpiredCache() {
  const cache = getResponseCache();
  const now = Date.now();
  const updated = {};
  
  Object.entries(cache).forEach(([id, entry]) => {
    if (now - entry.timestamp < 60 * 60 * 1000) {
      updated[id] = entry;
    }
  });
  
  setStorage(STORAGE_KEYS.responseCache, updated);
  return updated;
}

// COST TRACKER
export function getCostTracker() {
  return getStorage(STORAGE_KEYS.costTracker) || { totalCost: 0, entries: [] };
}

export function addCostEntry(entry) {
  const tracker = getCostTracker();
  if (entry.cost > 0) {
    tracker.totalCost += entry.cost;
  }
  tracker.entries.push({
    ...entry,
    timestamp: new Date().toISOString()
  });
  setStorage(STORAGE_KEYS.costTracker, tracker);
  return tracker;
}

export function resetCostTracker() {
  return setStorage(STORAGE_KEYS.costTracker, { totalCost: 0, entries: [] });
}

// BULK OPERATIONS
export function clearAllData() {
  Object.values(STORAGE_KEYS).forEach(key => removeStorage(key));
  localStorage.removeItem('ps_last_reset_date');
  return true;
}

export function exportData() {
  return {
    leads: getLeads(),
    settings: getSettings(),
    redditStats: getRedditStats(),
    costTracker: getCostTracker(),
    exportedAt: new Date().toISOString()
  };
}

export function importData(data) {
  try {
    if (data.leads) setLeads(data.leads);
    if (data.settings) setSettings(data.settings);
    if (data.redditStats) setRedditStats(data.redditStats);
    if (data.costTracker) setStorage(STORAGE_KEYS.costTracker, data.costTracker);
    return true;
  } catch (err) {
    console.error('Import error:', err);
    return false;
  }
}
