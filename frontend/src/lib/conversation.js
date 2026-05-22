function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function formatConversationDate(now = Date.now()) {
  return new Date(now).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function cleanMessage(message, fallbackId) {
  const role = message?.role === 'me' ? 'me' : 'lead';
  const text = String(message?.text || '').trim();
  if (!text) return null;

  return {
    id: String(message.id || fallbackId),
    role,
    text,
    at: String(message.at || ''),
  };
}

export function conversationForLead(lead) {
  const existing = Array.isArray(lead?.conversation)
    ? lead.conversation
        .map((message, index) => cleanMessage(message, `${lead?.id || 'lead'}-saved-${index}`))
        .filter(Boolean)
    : [];

  if (existing.length) return existing;

  const conversation = [];
  const initialComment = String(lead?.comment || '').trim();
  if (initialComment) {
    conversation.push({
      id: `${lead?.id || 'lead'}-initial`,
      role: 'lead',
      text: initialComment,
      at: String(lead?.date || ''),
    });
  }

  (lead?.followUps || []).forEach((followUp, index) => {
    const text = String(followUp || '').trim();
    if (!text || normalizeText(text) === normalizeText(initialComment)) return;
    conversation.push({
      id: `${lead?.id || 'lead'}-followup-${index}`,
      role: 'lead',
      text,
      at: '',
    });
  });

  return conversation;
}

export function latestLeadMessage(lead) {
  const conversation = conversationForLead(lead);
  return [...conversation].reverse().find(message => message.role === 'lead') || null;
}

export function conversationPromptContext(lead, limit = 6) {
  return conversationForLead(lead)
    .slice(-limit)
    .map(message => `${message.role === 'me' ? 'You replied' : `${lead.name || 'Lead'} wrote`}: ${message.text}`)
    .join('\n');
}

export function appendConversationMessage(lead, role, text, options = {}) {
  const cleanText = String(text || '').trim();
  if (!cleanText) return conversationForLead(lead);

  const conversation = conversationForLead(lead);
  const last = conversation[conversation.length - 1];
  if (
    options.skipDuplicateLast !== false &&
    last?.role === role &&
    normalizeText(last.text) === normalizeText(cleanText)
  ) {
    return conversation;
  }

  const now = options.now || Date.now();
  return [
    ...conversation,
    {
      id: `${now}-${role}-${conversation.length}`,
      role: role === 'me' ? 'me' : 'lead',
      text: cleanText,
      at: options.at || formatConversationDate(now),
    },
  ];
}

export function isLastConversationMessage(lead, role, text) {
  const conversation = conversationForLead(lead);
  const last = conversation[conversation.length - 1];
  return Boolean(
    last &&
    last.role === role &&
    normalizeText(last.text) === normalizeText(text)
  );
}
