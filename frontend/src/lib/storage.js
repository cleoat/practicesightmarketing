import { STORAGE_KEYS, DEFAULT_SETTINGS, DEFAULT_REDDIT_STATS } from './constants';

function getStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function getLeads() {
  return getStorage(STORAGE_KEYS.leads) || [];
}

export function setLeads(leads) {
  return setStorage(STORAGE_KEYS.leads, leads);
}

export function getSettings() {
  const stored = getStorage(STORAGE_KEYS.settings) || {};
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    openrouterApiKey: stored.openrouterApiKey || import.meta.env.VITE_OPENROUTER_API_KEY || '',
  };
}

export function setSettings(settings) {
  return setStorage(STORAGE_KEYS.settings, settings);
}

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
