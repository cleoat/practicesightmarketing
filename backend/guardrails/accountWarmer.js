// Account warming: Prevent posting from brand new Reddit accounts
// (Reddit flags accounts <7 days old instantly)

export function checkAccountAge(accountData, config = {}) {
  const {
    minAccountAgeDays = 7,
    enabled = true
  } = config;

  if (!enabled) {
    return { safe: true, reason: '', cost: '$0' };
  }

  if (!accountData || !accountData.created) {
    return {
      safe: false,
      reason: 'Account data missing',
      cost: '$0'
    };
  }

  const accountAge = calculateAccountAge(accountData.created);

  if (accountAge < minAccountAgeDays) {
    const daysRemaining = minAccountAgeDays - accountAge;
    return {
      safe: false,
      reason: `Account too new (${accountAge} days old, wait ${daysRemaining} more)`,
      cost: '$0',
      daysUntilActive: daysRemaining
    };
  }

  return {
    safe: true,
    reason: '',
    cost: '$0',
    accountAgeDays: accountAge
  };
}

export function calculateAccountAge(createdTimestamp) {
  // Returns age in days
  const created = new Date(createdTimestamp);
  const now = new Date();
  const diffMs = now - created;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.floor(diffDays);
}

export function isAccountWarmed(accountData, minDays = 7) {
  const age = calculateAccountAge(accountData.created);
  return age >= minDays;
}

export function getAccountStatus(accountData) {
  const age = calculateAccountAge(accountData.created);
  
  if (age < 1) return { status: 'brand_new', age, ready: false };
  if (age < 3) return { status: 'very_new', age, ready: false };
  if (age < 7) return { status: 'new', age, ready: false };
  if (age < 30) return { status: 'warming_up', age, ready: true };
  if (age < 90) return { status: 'established', age, ready: true };
  return { status: 'old', age, ready: true };
}

export function getWarmupProgress(accountData, targetDays = 7) {
  const age = calculateAccountAge(accountData.created);
  const progress = Math.min((age / targetDays) * 100, 100);
  return {
    ageDays: age,
    targetDays: targetDays,
    progressPercent: progress.toFixed(1),
    isReady: age >= targetDays
  };
}
