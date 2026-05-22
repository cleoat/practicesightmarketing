import { analyzeLeadComment } from './leadAnalysis';
import { buildThreadKey, normalizeImportedText } from './threadImport';
import { conversationForLead, latestLeadMessage } from './conversation';

function uniqueStrings(values) {
  const seen = new Set();
  return values.filter(value => {
    const text = String(value || '').trim();
    const key = normalizeImportedText(text);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueConversation(leads) {
  const seen = new Set();
  const messages = [];

  leads.forEach(lead => {
    conversationForLead(lead).forEach(message => {
      const key = `${message.role}:${normalizeImportedText(message.text)}`;
      if (seen.has(key)) return;
      seen.add(key);
      messages.push(message);
    });
  });

  return messages;
}

function stageRank(stage) {
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

function strongerStage(a, b) {
  if (a === 'not_fit' || b === 'not_fit') return 'not_fit';
  return stageRank(b) > stageRank(a) ? b : a;
}

function leadThreadKey(lead) {
  return lead.threadKey || buildThreadKey({
    threadUrl: lead.threadUrl,
    source: lead.source,
    ch: lead.ch,
    postAuthor: lead.postAuthor,
    postText: lead.postText,
  });
}

function duplicateKey(lead) {
  const name = normalizeImportedText(lead.name);
  if (!name) return '';

  const threadKey = leadThreadKey(lead);
  if (threadKey) return `thread:${threadKey}:${name}`;

  const comment = normalizeImportedText(lead.comment);
  const source = normalizeImportedText(lead.source);
  if (comment && source) return `exact:${source}:${name}:${comment}`;

  return '';
}

function mergeGroup(group) {
  const [primary, ...rest] = group;
  if (!rest.length) return primary;

  const conversation = uniqueConversation(group);
  const latestLead = latestLeadMessage({ ...primary, conversation });
  const latestText = latestLead?.text || primary.comment || '';
  const analysis = analyzeLeadComment(latestText);

  return rest.reduce((merged, lead) => ({
    ...merged,
    source: merged.source || lead.source || '',
    ch: merged.ch || lead.ch || '',
    threadUrl: merged.threadUrl || lead.threadUrl || '',
    threadKey: merged.threadKey || lead.threadKey || leadThreadKey(lead) || '',
    postAuthor: merged.postAuthor || lead.postAuthor || '',
    postText: merged.postText || lead.postText || '',
    importedAt: merged.importedAt || lead.importedAt || '',
    lastImportedAt: lead.lastImportedAt || merged.lastImportedAt || '',
    reply: merged.reply || lead.reply || '',
    replyApproved: Boolean(merged.replyApproved || lead.replyApproved),
    lastApprovedReply: merged.lastApprovedReply || lead.lastApprovedReply || '',
    lastApprovedAt: merged.lastApprovedAt || lead.lastApprovedAt || '',
    posted: Boolean(merged.posted || lead.posted),
    followUps: uniqueStrings([...(merged.followUps || []), ...(lead.followUps || [])]),
    conversation,
    comment: latestText || merged.comment,
    stage: strongerStage(merged.stage, lead.stage),
  }), {
    ...primary,
    conversation,
    followUps: uniqueStrings(group.flatMap(lead => lead.followUps || [])),
    comment: latestText || primary.comment,
    stage: group.reduce((stage, lead) => strongerStage(stage, lead.stage), primary.stage),
    leadType: analysis.leadType,
    responseType: analysis.responseType,
    intent: analysis.intent,
    analysisReason: analysis.reason,
  });
}

export function mergeDuplicateLeads(leads) {
  const groups = new Map();
  const singles = [];

  leads.forEach(lead => {
    const key = duplicateKey(lead);
    if (!key) {
      singles.push(lead);
      return;
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(lead);
  });

  const merged = [];
  let removed = 0;

  groups.forEach(group => {
    merged.push(mergeGroup(group));
    removed += Math.max(0, group.length - 1);
  });

  return {
    leads: [...merged, ...singles].sort((a, b) => Number(b.id || 0) - Number(a.id || 0)),
    removed,
  };
}
