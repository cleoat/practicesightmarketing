import { DEFAULT_LEAD } from './constants';
import { analyzeLeadComment } from './leadAnalysis';
import { appendConversationMessage } from './conversation';

const ACTION_LINES = new Set([
  'like',
  'reply',
  'share',
  'send message',
  'follow',
  'edited',
  'most relevant',
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
  /^add friend$/i,
  /^see all$/i,
  /^number of unread/i,
  /^\d+ unread/i,
  /^what's on your mind/i,
  /^comment as /i,
  /^reply as /i,
  /^anonymous participant$/i,
  /^[·•]$/,
  /^[a-z]$/i,
  /^\d+$/,
  /^\+\d+$/,
];

const TIMESTAMP_PATTERN = /^(\d+\s*(m|h|d|w|mo|y)|just now)$/i;

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
  return lines.findIndex((line, index) => {
    if (!isLikelyName(line)) return false;
    if (sourceInfo.source && isSameText(line, sourceInfo.source)) return false;
    return hasCommentBeforeTimestamp(lines, index);
  });
}

function sliceRelevantThread(lines, sourceInfo) {
  const startMarkers = ['most relevant', 'all comments', 'view more comments'];
  const endMarkers = ['comment as '];

  const startIndex = lines.findIndex(line => startMarkers.includes(line.toLowerCase()));
  const firstCommentIndex = startIndex >= 0 ? startIndex + 1 : findFirstCommentIndex(lines, sourceInfo);
  const sliced = firstCommentIndex >= 0 ? lines.slice(firstCommentIndex) : lines;
  const endIndex = sliced.findIndex(line =>
    endMarkers.some(marker => line.toLowerCase().startsWith(marker))
  );

  return endIndex >= 0 ? sliced.slice(0, endIndex) : sliced;
}

function findPostAuthor(lines, sourceInfo, firstCommentIndex) {
  const sourceIndex = sourceInfo.source
    ? lines.findIndex(line => isSameText(line, sourceInfo.source))
    : -1;
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
  const stopIndex = firstCommentIndex >= 0 ? firstCommentIndex : lines.length;
  const parts = [];

  for (let index = 0; index < stopIndex; index += 1) {
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
    comments,
  };
}

function commentExists(lead, comment) {
  const normalized = normalizeText(comment);
  if (!normalized) return true;

  const history = [lead.comment, ...(lead.followUps || [])].map(normalizeText);
  return history.includes(normalized);
}

function findExistingLead(leads, incoming) {
  const incomingName = normalizeText(incoming.name);
  const incomingSource = normalizeText(incoming.source);

  return leads.find(lead => {
    const sameName = normalizeText(lead.name) === incomingName;
    if (!sameName) return false;

    const existingSource = normalizeText(lead.source);
    if (commentExists(lead, incoming.comment)) return true;
    if (incomingSource && existingSource) return existingSource === incomingSource;
    return Boolean(incoming.ch && lead.ch === incoming.ch);
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

export function importCopiedThread(rawText, existingLeads, options = {}) {
  const parsed = parseCopiedThread(rawText, options.communities || []);
  const baseChannel = parsed.channel || options.defaultChannel || 'facebook';
  const baseSource = parsed.source || options.defaultSource || '';
  const now = options.now || Date.now();
  const importedAt = formatImportDate(now);

  let added = 0;
  let updated = 0;
  let skipped = 0;
  const updatedNames = [];
  const addedNames = [];

  const nextLeads = [...existingLeads];

  parsed.comments.forEach((item, index) => {
    const incoming = {
      ...item,
      ch: item.ch || baseChannel,
      source: item.source || baseSource,
    };
    const analysis = analyzeLeadComment(incoming.comment);
    const existing = findExistingLead(nextLeads, incoming);

    if (existing) {
      if (commentExists(existing, incoming.comment)) {
        skipped += 1;
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
        threadUrl: existing.threadUrl || options.threadUrl || parsed.threadUrl || '',
        postAuthor: existing.postAuthor || parsed.postAuthor || '',
        postText: existing.postText || parsed.postText || '',
        importedAt: existing.importedAt || importedAt,
      };
      updated += 1;
      updatedNames.push(incoming.name);
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
      threadUrl: options.threadUrl || parsed.threadUrl || '',
      postAuthor: parsed.postAuthor || '',
      postText: parsed.postText || '',
      importedAt,
      conversation: [{
        id: `${now + index}-lead-0`,
        role: 'lead',
        text: incoming.comment,
        at: importedAt,
      }],
    });
    added += 1;
    addedNames.push(incoming.name);
  });

  return {
    leads: nextLeads,
    parsed,
    importedAt,
    added,
    updated,
    skipped,
    addedNames,
    updatedNames,
  };
}

export { normalizeText as normalizeImportedText };
