import { DEFAULT_LEAD } from './constants';
import { analyzeLeadComment } from './leadAnalysis';
import { appendConversationMessage, conversationForLead } from './conversation';

const ACTION_LINES = new Set([
  'like',
  'reply',
  'share',
  'send message',
  'follow',
  'edited',
  'see more',
  'most relevant',
  'all comments',
  'view 1 reply',
  'view more comments',
  'comment as leonardo',
  'reply as leonardo',
]);

const UI_NOISE_PATTERNS = [
  /^facebook$/i,
  /^reels$/i,
  /^home$/i,
  /^stories$/i,
  /^create (a )?(post|story)$/i,
  /^feed posts$/i,
  /^people you may know$/i,
  /^public group$/i,
  /^add friend$/i,
  /^see all$/i,
  /^no file chosen$/i,
  /^number of unread/i,
  /^\d+ unread/i,
  /^what's on your mind/i,
  /^comment as /i,
  /^reply as /i,
  /^copy link$/i,
  /^view (all )?\d+ repl(y|ies)$/i,
  /^[\d.,]+[kKmM]?\s+members$/i,
  /^anonymous participant$/i,
  /^[·•]$/,
  /^[a-z]$/i,
  /^\d+$/,
  /^\+\d+$/,
];

const TIMESTAMP_PATTERN = /^(just now|a minute ago|an hour ago|a day ago|\d+\s*(m|h|d|w|mo|y)|\d+\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)\s+ago)$/i;

function cleanLine(line) {
  return String(line || '')
    .replace(/\uFEFF/g, '')
    .replace(/\u202F/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function firstUrl(rawText) {
  const match = String(rawText || '').match(/https?:\/\/[^\s)]+/i);
  return match ? match[0].replace(/[.,;]+$/, '') : '';
}

function stableThreadUrlKey(url) {
  const value = String(url || '').trim().toLowerCase().replace(/\/+$/, '');
  if (!value) return '';

  if (
    /facebook\.com\/groups\/[^/]+\/posts\/[^/?#]+/.test(value) ||
    /facebook\.com\/permalink\.php/.test(value) ||
    /story_fbid=/.test(value) ||
    /reddit\.com\/r\/[^/]+\/comments\/[^/]+/.test(value) ||
    /\/status\/\d+/.test(value)
  ) {
    return value.replace(/[?#].*$/, '');
  }

  return '';
}

export function buildThreadKey(parts = {}) {
  const urlKey = stableThreadUrlKey(parts.threadUrl);
  if (urlKey) return `url:${urlKey}`;

  const source = normalizeText(parts.source);
  const author = normalizeText(parts.postAuthor);
  const post = normalizeText(parts.postText).slice(0, 320);
  const channel = normalizeText(parts.ch || parts.channel);

  if (post.length > 24 && (source || author)) {
    return `post:${channel}:${source}:${author}:${post}`;
  }

  return '';
}

function formatImportDate(now) {
  return new Date(now).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isTimestamp(line) {
  return TIMESTAMP_PATTERN.test(line);
}

function isScrambledFacebookMeta(line) {
  const cleaned = cleanLine(line);
  if (!cleaned) return true;
  if (/^srponstedo$/i.test(cleaned)) return true;
  if (/^:+$/.test(cleaned)) return true;
  return /^[a-z0-9]{2,12}$/i.test(cleaned) && /\d/.test(cleaned);
}

function isNoise(line) {
  const cleaned = cleanLine(line);
  if (!cleaned) return true;
  if (ACTION_LINES.has(cleaned.toLowerCase())) return true;
  return UI_NOISE_PATTERNS.some(pattern => pattern.test(cleaned));
}

function isLikelyName(line) {
  const cleaned = cleanLine(line);
  if (!cleaned || isNoise(cleaned) || isTimestamp(cleaned)) return false;
  if (/^anonymous participant \d+$/i.test(cleaned)) return true;
  if (/^u\/[A-Za-z0-9_-]{2,24}$/i.test(cleaned)) return true;
  if (/^[A-Za-z][A-Za-z0-9_-]{2,24}$/.test(cleaned) && /[-_\d]/.test(cleaned)) return true;
  if (cleaned.length > 70) return false;
  if (/[?.!]/.test(cleaned)) return false;
  if (/@|https?:|www\.|\.com/i.test(cleaned)) return false;

  const words = cleaned.split(/\s+/);
  if (words.length < 2 || words.length > 6) return false;

  return words.every(word =>
    /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ'’.-]*$/.test(word) ||
    /^[A-Z]{2,}$/.test(word) ||
    /^&$/.test(word)
  );
}

function shouldSkipComment(comment) {
  const normalized = normalizeText(comment);
  if (normalized.length < 5) return true;
  if (/^(like|reply|share|send message)$/.test(normalized)) return true;
  return false;
}

function isSameText(a, b) {
  const first = normalizeText(a);
  const second = normalizeText(b);
  return Boolean(first && second && first === second);
}

function isPostContextMarker(line) {
  return /'s post$/i.test(cleanLine(line));
}

function findPostContextIndex(lines) {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (isPostContextMarker(lines[index])) return index;
  }
  return -1;
}

function findSourceIndex(lines, sourceInfo) {
  if (!sourceInfo.source) return -1;

  const postContextIndex = findPostContextIndex(lines);
  if (postContextIndex >= 0) {
    const afterMarker = lines.findIndex((line, index) =>
      index > postContextIndex && isSameText(line, sourceInfo.source)
    );
    if (afterMarker >= 0) return afterMarker;
  }

  const indices = [];
  lines.forEach((line, index) => {
    if (isSameText(line, sourceInfo.source)) indices.push(index);
  });
  if (!indices.length) return -1;

  const structured = indices.find(index => {
    const window = lines.slice(index + 1, index + 10);
    const authorIndex = window.findIndex(line => isLikelyName(line));
    if (authorIndex < 0) return false;
    return window.slice(authorIndex + 1).some(line =>
      !isNoise(line) &&
      !isTimestamp(line) &&
      !isScrambledFacebookMeta(line) &&
      normalizeText(line).length > 20
    );
  });

  return structured >= 0 ? structured : indices[0];
}

function hasCommentBeforeTimestamp(lines, startIndex) {
  let commentLength = 0;

  for (let index = startIndex + 1; index < Math.min(lines.length, startIndex + 18); index += 1) {
    const line = lines[index];

    if (isTimestamp(line)) return commentLength >= 5;
    if (isNoise(line) || isScrambledFacebookMeta(line)) continue;
    if (isLikelyName(line) && commentLength === 0) return false;

    commentLength += normalizeText(line).length;
  }

  return false;
}

function findFirstCommentIndex(lines, sourceInfo) {
  const sourceIndex = findSourceIndex(lines, sourceInfo);
  const firstNameAfterSourceIndex = lines.findIndex((line, index) =>
    index > sourceIndex &&
    isLikelyName(line) &&
    !(sourceInfo.source && isSameText(line, sourceInfo.source))
  );

  function looksLikePostAuthor(index) {
    if (index !== firstNameAfterSourceIndex || index < 0) return false;

    let sawPostText = false;
    for (let cursor = index + 1; cursor < Math.min(lines.length, index + 16); cursor += 1) {
      const line = lines[cursor];
      if (isTimestamp(line)) return false;
      if (isNoise(line) || isScrambledFacebookMeta(line)) continue;
      if (isLikelyName(line) && sawPostText) return true;
      if (normalizeText(line).length > 20) sawPostText = true;
    }

    return false;
  }

  return lines.findIndex((line, index) => {
    if (index <= sourceIndex) return false;
    if (!isLikelyName(line)) return false;
    if (sourceInfo.source && isSameText(line, sourceInfo.source)) return false;
    if (looksLikePostAuthor(index)) return false;
    return hasCommentBeforeTimestamp(lines, index);
  });
}

function sliceRelevantThread(lines, sourceInfo) {
  const startMarkers = ['most relevant', 'all comments', 'view more comments'];
  const endMarkers = ['comment as '];
  const sourceIndex = findSourceIndex(lines, sourceInfo);

  const startIndex = lines.findIndex((line, index) =>
    index > sourceIndex && startMarkers.includes(line.toLowerCase())
  );
  const firstCommentIndex = startIndex >= 0 ? startIndex + 1 : findFirstCommentIndex(lines, sourceInfo);
  const sliced = firstCommentIndex >= 0 ? lines.slice(firstCommentIndex) : lines;
  const endIndex = sliced.findIndex(line =>
    endMarkers.some(marker => line.toLowerCase().startsWith(marker))
  );

  return endIndex >= 0 ? sliced.slice(0, endIndex) : sliced;
}

function findPostAuthor(lines, sourceInfo, firstCommentIndex) {
  const sourceIndex = findSourceIndex(lines, sourceInfo);
  const startIndex = sourceIndex >= 0 ? sourceIndex + 1 : 0;
  const stopIndex = firstCommentIndex >= 0 ? firstCommentIndex : lines.length;

  for (let index = startIndex; index < stopIndex; index += 1) {
    const line = lines[index];
    if (!isLikelyName(line)) continue;
    if (sourceInfo.source && isSameText(line, sourceInfo.source)) continue;
    return line;
  }

  return '';
}

function extractPostText(lines, sourceInfo, postAuthor, firstCommentIndex) {
  const sourceIndex = findSourceIndex(lines, sourceInfo);
  const startIndex = sourceIndex >= 0 ? sourceIndex + 1 : 0;
  const stopIndex = firstCommentIndex >= 0 ? firstCommentIndex : lines.length;
  const parts = [];

  for (let index = startIndex; index < stopIndex; index += 1) {
    const line = lines[index];
    if (isNoise(line) || isTimestamp(line) || isScrambledFacebookMeta(line)) continue;
    if (sourceInfo.source && isSameText(line, sourceInfo.source)) continue;
    if (postAuthor && isSameText(line, postAuthor)) continue;
    if (line.length < 18) continue;
    parts.push(line);
  }

  return parts.join('\n').trim();
}

export function detectThreadSource(rawText, communities = []) {
  const normalizedRaw = normalizeText(rawText);
  const rawUrlText = String(rawText || '').toLowerCase();
  const community = communities.find(item => {
    const nameAlias = normalizeText(item.name);
    const urlAlias = String(item.url || '').toLowerCase().replace(/\/+$/, '');

    return Boolean(
      (nameAlias && normalizedRaw.includes(nameAlias)) ||
      (urlAlias && rawUrlText.includes(urlAlias))
    );
  });

  if (community) {
    return {
      source: community.name,
      channel: community.platform,
    };
  }

  if (/facebook/i.test(rawText)) return { source: '', channel: 'facebook' };
  if (/reddit\.com\/r\//i.test(rawText)) return { source: '', channel: 'reddit' };
  return { source: '', channel: '' };
}

export function parseCopiedThread(rawText, communities = []) {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const sourceInfo = detectThreadSource(rawText, communities);
  const firstCommentIndex = findFirstCommentIndex(lines, sourceInfo);
  const postAuthor = findPostAuthor(lines, sourceInfo, firstCommentIndex);
  const postText = extractPostText(lines, sourceInfo, postAuthor, firstCommentIndex);
  const relevantLines = sliceRelevantThread(lines, sourceInfo);
  const comments = [];
  let current = null;

  function finishCurrent() {
    if (!current) return;
    const comment = current.parts.join('\n').trim();
    if (!shouldSkipComment(comment)) {
      comments.push({
        name: current.name,
        comment,
        ch: sourceInfo.channel || 'facebook',
        source: sourceInfo.source,
      });
    }
    current = null;
  }

  relevantLines.forEach((line, index) => {
    if (isTimestamp(line)) {
      finishCurrent();
      return;
    }

    if (!current) {
      if (isLikelyName(line)) current = { name: line, parts: [] };
      return;
    }

    if (isLikelyName(line) && hasCommentBeforeTimestamp(relevantLines, index)) {
      finishCurrent();
      current = { name: line, parts: [] };
      return;
    }

    if (isNoise(line)) return;

    current.parts.push(line);
  });

  finishCurrent();

  return {
    ...sourceInfo,
    threadUrl: firstUrl(rawText),
    postAuthor,
    postText,
    threadKey: buildThreadKey({
      ...sourceInfo,
      threadUrl: firstUrl(rawText),
      postAuthor,
      postText,
    }),
    comments,
  };
}

function commentExists(lead, comment) {
  const normalized = normalizeText(comment);
  if (!normalized) return true;

  const conversationComments = conversationForLead(lead)
    .filter(message => message.role === 'lead')
    .map(message => message.text);
  const history = [lead.comment, ...(lead.followUps || []), ...conversationComments].map(normalizeText);
  return history.includes(normalized);
}

function leadThreadKey(lead) {
  return buildThreadKey({
    threadUrl: lead.threadUrl,
    source: lead.source,
    ch: lead.ch,
    postAuthor: lead.postAuthor,
    postText: lead.postText,
  });
}

function sameLooseSource(lead, incoming) {
  const incomingSource = normalizeText(incoming.source);
  const existingSource = normalizeText(lead.source);
  if (incomingSource && existingSource) return incomingSource === existingSource;
  return Boolean(incoming.ch && lead.ch === incoming.ch);
}

function findExistingLead(leads, incoming) {
  const incomingName = normalizeText(incoming.name);
  const incomingThreadKey = incoming.threadKey;

  return leads.find(lead => {
    const sameName = normalizeText(lead.name) === incomingName;
    if (!sameName) return false;

    if (commentExists(lead, incoming.comment)) return true;

    const existingThreadKey = lead.threadKey || leadThreadKey(lead);
    if (incomingThreadKey && existingThreadKey) {
      return incomingThreadKey === existingThreadKey;
    }

    if (!incomingThreadKey && !existingThreadKey) {
      return sameLooseSource(lead, incoming);
    }

    return !existingThreadKey && sameLooseSource(lead, incoming);
  });
}

function stagePriority(stage) {
  return {
    saw_it: 1,
    engaged: 2,
    warm: 3,
    hot: 4,
    testing: 5,
    feedback: 6,
    not_fit: 0,
  }[stage] || 0;
}

function mergedStage(currentStage, analysisStage) {
  if (analysisStage === 'not_fit') return 'not_fit';
  if (currentStage === 'not_fit') return currentStage;
  return stagePriority(analysisStage) > stagePriority(currentStage) ? analysisStage : currentStage;
}

function importMatchKey(incoming) {
  return [
    normalizeText(incoming.name),
    incoming.threadKey || normalizeText(incoming.source),
    incoming.ch || '',
  ].join('|');
}

export function importCopiedThread(rawText, existingLeads, options = {}) {
  const parsed = parseCopiedThread(rawText, options.communities || []);
  const baseChannel = parsed.channel || options.defaultChannel || 'facebook';
  const baseSource = parsed.source || options.defaultSource || '';
  const now = options.now || Date.now();
  const importedAt = formatImportDate(now);
  const threadUrl = options.threadUrl || parsed.threadUrl || '';
  const threadKey = parsed.threadKey || buildThreadKey({
    ...parsed,
    source: baseSource,
    ch: baseChannel,
    threadUrl,
  });
  const threadMatched = Boolean(threadKey && existingLeads.some(lead => (lead.threadKey || leadThreadKey(lead)) === threadKey));
  const originalLeadIds = new Set(existingLeads.map(lead => lead.id));

  let added = 0;
  let updated = 0;
  let skipped = 0;
  let newComments = 0;
  let duplicateComments = 0;
  const updatedNames = new Set();
  const addedNames = new Set();
  const matchedNames = new Set();
  const skippedNames = new Set();

  const nextLeads = [...existingLeads];
  const importMatches = new Map();

  parsed.comments.forEach((item, index) => {
    const incoming = {
      ...item,
      ch: item.ch || baseChannel,
      source: item.source || baseSource,
      threadKey,
    };
    const analysis = analyzeLeadComment(incoming.comment);
    const matchKey = importMatchKey(incoming);
    const existing = importMatches.get(matchKey) || findExistingLead(nextLeads, incoming);

    if (existing) {
      importMatches.set(matchKey, existing);
      if (originalLeadIds.has(existing.id)) matchedNames.add(incoming.name);

      if (commentExists(existing, incoming.comment)) {
        skipped += 1;
        duplicateComments += 1;
        skippedNames.add(incoming.name);
        return;
      }

      const followUps = [...(existing.followUps || []), incoming.comment];
      const conversation = appendConversationMessage(existing, 'lead', incoming.comment, {
        at: importedAt,
        now: now + index,
      });
      const existingIndex = nextLeads.findIndex(lead => lead === existing);
      nextLeads[existingIndex] = {
        ...existing,
        followUps,
        conversation,
        comment: incoming.comment,
        stage: mergedStage(existing.stage, analysis.stage),
        leadType: analysis.leadType,
        responseType: analysis.responseType,
        intent: analysis.intent,
        analysisReason: analysis.reason,
        source: existing.source || incoming.source,
        ch: existing.ch || incoming.ch,
        threadUrl: existing.threadUrl || threadUrl,
        threadKey: existing.threadKey || threadKey,
        postAuthor: existing.postAuthor || parsed.postAuthor || '',
        postText: existing.postText || parsed.postText || '',
        importedAt: existing.importedAt || importedAt,
        lastImportedAt: importedAt,
        reply: '',
        replyApproved: false,
        posted: false,
        nextFollowUpAt: '',
      };
      importMatches.set(matchKey, nextLeads[existingIndex]);
      updated += 1;
      newComments += 1;
      updatedNames.add(incoming.name);
      return;
    }

    nextLeads.unshift({
      ...DEFAULT_LEAD,
      id: now + index,
      name: incoming.name,
      ch: incoming.ch,
      source: incoming.source,
      comment: incoming.comment,
      stage: analysis.stage,
      leadType: analysis.leadType,
      responseType: analysis.responseType,
      intent: analysis.intent,
      analysisReason: analysis.reason,
      date: importedAt,
      threadUrl,
      threadKey,
      postAuthor: parsed.postAuthor || '',
      postText: parsed.postText || '',
      importedAt,
      lastImportedAt: importedAt,
      conversation: [{
        id: `${now + index}-lead-0`,
        role: 'lead',
        text: incoming.comment,
        at: importedAt,
      }],
    });
    added += 1;
    newComments += 1;
    addedNames.add(incoming.name);
  });

  return {
    leads: nextLeads,
    parsed: { ...parsed, threadKey },
    importedAt,
    threadKey,
    threadMatched,
    added,
    updated,
    skipped,
    newComments,
    duplicateComments,
    matched: matchedNames.size,
    addedNames: [...addedNames],
    updatedNames: [...updatedNames],
    matchedNames: [...matchedNames],
    skippedNames: [...skippedNames],
  };
}

export { normalizeText as normalizeImportedText };
