// Rate limiting: max N posts per day, min X seconds between posts

const postTracker = {
  daily: {},      // { date: count }
  timings: {}     // { date: lastPostTime }
};

export function checkRateLimit(config = {}) {
  const {
    maxPostsPerDay = 3,
    minSecondsBetweenPosts = 2,
    enabled = true
  } = config;

  if (!enabled) {
    return { safe: true, reason: '', cost: '$0' };
  }

  const now = Date.now();
  const today = new Date().toDateString();

  // Reset daily count if new day
  if (postTracker.daily.date !== today) {
    postTracker.daily = { date: today, count: 0 };
    postTracker.timings = { lastTime: null };
  }

  // Check daily limit
  if (postTracker.daily.count >= maxPostsPerDay) {
    return {
      safe: false,
      reason: `Daily limit reached (${maxPostsPerDay}/day)`,
      cost: '$0',
      remaining: 0
    };
  }

  // Check min time between posts
  if (postTracker.timings.lastTime) {
    const secondsSince = (now - postTracker.timings.lastTime) / 1000;
    if (secondsSince < minSecondsBetweenPosts) {
      return {
        safe: false,
        reason: `Too soon (${Math.ceil(minSecondsBetweenPosts - secondsSince)}s wait)`,
        cost: '$0',
        canRetryIn: Math.ceil(minSecondsBetweenPosts - secondsSince)
      };
    }
  }

  return {
    safe: true,
    reason: '',
    cost: '$0',
    remaining: maxPostsPerDay - postTracker.daily.count - 1
  };
}

export function recordPost() {
  const today = new Date().toDateString();
  postTracker.daily.count = (postTracker.daily.count || 0) + 1;
  postTracker.timings.lastTime = Date.now();
  return { 
    posted: true, 
    count: postTracker.daily.count,
    date: today
  };
}

export function getStats() {
  const today = new Date().toDateString();
  return {
    postsToday: postTracker.daily.count || 0,
    lastPostTime: postTracker.timings.lastTime,
    date: today
  };
}

export function resetDaily() {
  const today = new Date().toDateString();
  postTracker.daily = { date: today, count: 0 };
  postTracker.timings = { lastTime: null };
  return getStats();
}
