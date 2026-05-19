// Humanization: randomized delays + jitter to avoid bot patterns

export function getRandomDelay(min = 500, max = 5000) {
  // Random delay between min and max milliseconds
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getJitteredTime(baseSeconds = 2) {
  // Add jitter to posting time (±20% randomness)
  const jitterPercent = 0.2;
  const jitterAmount = baseSeconds * jitterPercent;
  const randomJitter = (Math.random() - 0.5) * 2 * jitterAmount;
  return Math.max(baseSeconds + randomJitter, baseSeconds * 0.5);
}

export function addHumanizationDelay(minutes = 5) {
  // Simulate human behavior: delay between 3-8 minutes
  const min = minutes * 0.6 * 60 * 1000;
  const max = minutes * 1.4 * 60 * 1000;
  return getRandomDelay(min, max);
}

export function shouldPostNow(lastPostTime, minSeconds = 2) {
  if (!lastPostTime) return true;
  
  const now = Date.now();
  const jitteredMin = getJitteredTime(minSeconds) * 1000;
  const timeSinceLastPost = now - lastPostTime;
  
  return timeSinceLastPost >= jitteredMin;
}

export function getHumanizationStatus() {
  return {
    randomDelayMs: getRandomDelay(),
    jitteredSeconds: getJitteredTime(2),
    humanizationMinutes: addHumanizationDelay(5),
    note: 'All times are randomized to appear human-like, not bot-like'
  };
}

export async function waitWithJitter(seconds = 2) {
  // Wait a jittered amount of time
  const waitMs = getJitteredTime(seconds) * 1000;
  return new Promise(resolve => setTimeout(resolve, waitMs));
}
