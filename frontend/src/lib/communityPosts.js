import { inferChannelFromText, normalizeCommunityName } from './communityRules';

const MAX_RECORDS = 600;

function asTime(value) {
  const time = typeof value === 'number' ? value : Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
}

function dayKey(value) {
  const date = new Date(asTime(value) || Date.now());
  return date.toDateString();
}

function sourceFromTarget(target) {
  if (typeof target === 'string') return target;
  return target?.name || target?.source || target?.communityName || target?.url || target?.threadUrl || '';
}

function urlFromTarget(target) {
  if (typeof target === 'string') return '';
  return target?.url || target?.threadUrl || '';
}

function platformFromTarget(target, source, url) {
  if (typeof target === 'object' && (target?.platform || target?.ch)) {
    return target.platform || target.ch;
  }
  return inferChannelFromText(`${source} ${url}`) || 'other';
}

export function communityPostKey(target) {
  const source = sourceFromTarget(target);
  const url = urlFromTarget(target);
  const platform = platformFromTarget(target, source, url);
  const identity = normalizeCommunityName(source || url);
  return identity ? `${platform}:${identity}` : `${platform}:unknown`;
}

export function formatPostedAt(value) {
  const time = asTime(value);
  if (!time) return '';

  return new Date(time).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function buildCommunityPostRecord(target, options = {}) {
  const now = options.now || Date.now();
  const source = sourceFromTarget(target) || 'Unknown community';
  const url = urlFromTarget(target);
  const platform = platformFromTarget(target, source, url);
  const key = communityPostKey({ name: source, url, platform });
  const body = String(options.body || '');

  return {
    id: `${now}-${key}-${options.kind || 'post'}`,
    communityKey: key,
    communityName: source,
    platform,
    url,
    kind: options.kind || 'post',
    templateId: options.templateId || '',
    templateTitle: options.templateTitle || '',
    phase: options.phase || '',
    variant: options.variant || '',
    bodyPreview: body.replace(/\s+/g, ' ').trim().slice(0, 180),
    note: options.note || '',
    postedAt: now,
  };
}

function isNearDuplicate(record, candidate) {
  return (
    record.communityKey === candidate.communityKey &&
    record.kind === candidate.kind &&
    record.templateId === candidate.templateId &&
    record.variant === candidate.variant &&
    Math.abs(asTime(record.postedAt) - asTime(candidate.postedAt)) < 5000
  );
}

export function recordCommunityPost(records, target, options = {}) {
  const list = Array.isArray(records) ? records : [];
  const record = buildCommunityPostRecord(target, options);
  if (list.some(existing => isNearDuplicate(existing, record))) return list;
  return [record, ...list].slice(0, MAX_RECORDS);
}

export function getCommunityPostStatus(target, records = [], now = Date.now()) {
  const key = communityPostKey(target);
  const matches = (Array.isArray(records) ? records : [])
    .filter(record => record.communityKey === key)
    .sort((a, b) => asTime(b.postedAt) - asTime(a.postedAt));
  const lastPost = matches[0] || null;
  const today = dayKey(now);
  const todayPosts = matches.filter(record => dayKey(record.postedAt) === today);

  return {
    key,
    count: matches.length,
    todayCount: todayPosts.length,
    postedToday: todayPosts.length > 0,
    lastPost,
    label: lastPost
      ? todayPosts.length > 0
        ? `Posted today (${todayPosts.length})`
        : `Last ${formatPostedAt(lastPost.postedAt)}`
      : 'Not posted yet',
  };
}

export function getCommunityPostStats(records = [], now = Date.now()) {
  const list = Array.isArray(records) ? records : [];
  const today = dayKey(now);
  const todayRecords = list.filter(record => dayKey(record.postedAt) === today);
  const todayOriginalPosts = todayRecords.filter(record => record.kind === 'post');
  const todayReplies = todayRecords.filter(record => record.kind === 'reply');
  const communitiesPostedToday = new Set(todayRecords.map(record => record.communityKey)).size;
  const recent = [...list]
    .sort((a, b) => asTime(b.postedAt) - asTime(a.postedAt))
    .slice(0, 8);

  return {
    total: list.length,
    postedToday: todayOriginalPosts.length,
    repliesToday: todayReplies.length,
    communitiesPostedToday,
    recent,
  };
}
