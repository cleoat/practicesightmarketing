// Engagement filter: Only post to threads that meet minimum activity threshold

export function checkEngagement(threadData, config = {}) {
  const {
    minThreadAgeDays = 1,
    maxThreadAgeDays = 7,
    minThreadComments = 5,
    enabled = true
  } = config;

  if (!enabled) {
    return { safe: true, reason: '', cost: '$0' };
  }

  const threadAge = threadData.ageHours / 24; // Convert to days
  const comments = threadData.comments || 0;

  // Check minimum age
  if (threadAge < minThreadAgeDays) {
    return {
      safe: false,
      reason: `Thread too new (${threadAge.toFixed(1)} days, min ${minThreadAgeDays})`,
      cost: '$0'
    };
  }

  // Check maximum age (don't post to dead threads)
  if (threadAge > maxThreadAgeDays) {
    return {
      safe: false,
      reason: `Thread too old (${threadAge.toFixed(1)} days, max ${maxThreadAgeDays})`,
      cost: '$0'
    };
  }

  // Check minimum comments
  if (comments < minThreadComments) {
    return {
      safe: false,
      reason: `Low engagement (${comments} comments, min ${minThreadComments})`,
      cost: '$0'
    };
  }

  return {
    safe: true,
    reason: '',
    cost: '$0',
    details: {
      threadAgeDays: threadAge.toFixed(1),
      comments: comments,
      score: threadData.score || 0
    }
  };
}

export function getEngagementScore(threadData) {
  // Score out of 100 (higher is better)
  const threadAge = threadData.ageHours / 24;
  const comments = threadData.comments || 0;
  const score = threadData.score || 0;

  let engagementScore = 0;

  // Age scoring (ideal: 2-5 days)
  if (threadAge >= 1 && threadAge <= 7) {
    engagementScore += (50 - Math.abs(threadAge - 3) * 10); // Peak at 3 days
  }

  // Comments scoring (higher is better)
  engagementScore += Math.min(comments * 3, 30);

  // Score/upvotes scoring
  engagementScore += Math.min(score / 10, 20);

  return Math.max(0, Math.min(100, engagementScore));
}

export function isIdealThread(threadData) {
  // Returns true if thread is in sweet spot
  const threadAge = threadData.ageHours / 24;
  const comments = threadData.comments || 0;
  
  return (
    threadAge >= 1 &&
    threadAge <= 7 &&
    comments >= 5
  );
}
