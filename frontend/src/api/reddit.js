// API calls to backend Reddit endpoints

import { API_ENDPOINTS } from '../lib/constants';

const getBaseURL = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

export async function checkHealth() {
  try {
    const response = await fetch(`${getBaseURL()}${API_ENDPOINTS.health}`);
    return await response.json();
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

export async function postToReddit(lead, threadData, accountData, subreddit) {
  try {
    const response = await fetch(
      `${getBaseURL()}${API_ENDPOINTS.redditPost}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          threadData,
          accountData,
          subreddit
        })
      }
    );

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: err.message,
      cost: '$0'
    };
  }
}

export async function analyzePost(lead, threadData, accountData) {
  try {
    const response = await fetch(
      `${getBaseURL()}${API_ENDPOINTS.redditAnalyze}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          threadData,
          accountData
        })
      }
    );

    const data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: err.message,
      cost: '$0'
    };
  }
}

export async function getStatus() {
  try {
    const response = await fetch(`${getBaseURL()}/status`);
    return await response.json();
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

export async function clearCache() {
  try {
    const response = await fetch(
      `${getBaseURL()}/cache/clear`,
      { method: 'POST' }
    );
    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
}

export async function resetDailyStats() {
  try {
    const response = await fetch(
      `${getBaseURL()}/admin/reset-daily`,
      { method: 'POST' }
    );
    return await response.json();
  } catch (err) {
    return { error: err.message };
  }
}

export function isBackendConnected() {
  return getBaseURL().length > 0;
}

export function getBackendURL() {
  return getBaseURL();
}
