import React, { useState } from 'react';
import { STAGES, CHANNELS, COLORS } from '../lib/constants';
import { chatCompletion } from '../lib/openrouter';
import { getCommunityRule } from '../lib/communityRules';
import { analyzeLeadComment } from '../lib/leadAnalysis';
import { COMMUNITIES } from './CommunitiesPanel';

// ── LEAD TYPE META ───────────────────────────────────────────────────────────
const LEAD_TYPE_META = {
  billing_vendor: {
    icon: '🏢', label: 'Billing company / vendor',
    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA',
    action: 'Generate Referral Ask',
  },
  outsourced_billing: {
    icon: '🔄', label: 'Billing outsourced',
    color: '#D97706', bg: '#FFFBEB', border: '#FDE68A',
    action: 'Generate Referral Ask',
  },
  potential_practice: {
    icon: '👤', label: 'Private practice therapist',
    color: '#059669', bg: '#F0FDF4', border: '#B8E5C8',
    action: null,
  },
  // process_advice was missing — caused all escalation logic to silently fail
  process_advice: {
    icon: '🧭', label: 'Process-savvy / possible peer',
    color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD',
    action: null,
  },
};

// Leads that are candidates for escalation (not vendors, not outsourced)
const PROSPECT_TYPES = new Set(['potential_practice', 'process_advice']);

// ── REPLY GENERATION ─────────────────────────────────────────────────────────

const SYSTEM_PERSONA = `You are a licensed therapist in private practice. You are NOT a marketer, founder, or salesperson. You talk to colleagues the way therapists talk to each other — warm, direct, no agenda visible.

You happen to have built a small free tool called PracticeSight (practicesight.pages.dev) that checks billing in SimplePractice. You built it for yourself and colleagues. You mention it the way you'd mention anything useful — briefly, naturally, only when it fits.

VOICE RULES — always:
- Short. 2-4 sentences max.
- No exclamation marks ever.
- No "I hope this helps" or "Great question" or "That's interesting."
- No corporate language.
- Specific beats generic — use their exact words back to them.
- Sound like a text message from a colleague, not a LinkedIn post.`;

// Build conversation context from lead.conversation — the single source of truth.
// lead.comment gets overwritten by handleReply with the latest message, so we
// never rely on it for context — only for "what is the latest message."
function buildConversationContext(lead) {
  if (Array.isArray(lead.conversation) && lead.conversation.length > 0) {
    return lead.conversation
      .map(msg => {
        const text = String(msg.text || '').trim();
        if (!text) return null;
        return msg.role === 'me'
          ? `You: "${text}"`
          : `${lead.name || 'Them'}: "${text}"`;
      })
      .filter(Boolean)
      .join('\n');
  }
  // Fallback for legacy leads without a conversation array
  const initial = String(lead.comment || '').trim();
  return initial ? `${lead.name || 'Them'}: "${initial}"` : '';
}

function buildPrompt({ latestComment, name, stage, leadType, communityRule, variationNum, conversationContext, exchangeDepth }) {
  const strict = communityRule?.strict;
  const isProspect = PROSPECT_TYPES.has(leadType);

  // canMentionByStage: stage explicitly signals warmth
  const canMentionByStage = communityRule?.canMentionProduct && ['warm', 'hot', 'testing', 'feedback'].includes(stage);
  // canMentionByDepth: enough exchanges have happened — escalate regardless of stage
  const canMentionByDepth = communityRule?.canMentionProduct && exchangeDepth >= 2 && isProspect;
  const canMention = canMentionByStage || canMentionByDepth;
  const variation = variationNum || 1;

  const context = conversationContext
    ? `Full conversation so far:\n${conversationContext}\n\n`
    : '';

  // ── REFERRAL ASKS ────────────────────────────────────────────────────────

  if (leadType === 'billing_vendor') {
    return `${SYSTEM_PERSONA}

${context}This person appears to be a billing company or service provider. Their latest message:
"${latestComment}"

Write a single reply (under 35 words) that:
1. Acknowledges what they do in one phrase
2. Mentions you made a simple free billing checker for therapists using SimplePractice — asks if any of their therapist clients might find it useful
3. Zero pitch. Zero pressure. Sounds like a curious colleague.

Reply only. No labels. No preamble.`;
  }

  if (leadType === 'outsourced_billing') {
    return `${SYSTEM_PERSONA}

${context}This person has billing outsourced. Their latest message:
"${latestComment}"

Write a single reply (under 35 words) that:
1. Acknowledges billing outsourced = they don't need this
2. Casually asks if they know any colleagues who do their own billing in SimplePractice — that's who you built it for
3. Sounds like a fellow therapist making conversation, not a vendor prospecting.

Reply only. No labels. No preamble.`;
  }

  // ── DEPTH ESCALATION — fires after 2+ exchanges regardless of stage ──────
  // process_advice leads get a collegial/referral angle, not a direct pitch
  if (canMentionByDepth && !['hot', 'testing', 'feedback'].includes(stage)) {

    if (leadType === 'process_advice') {
      return `${SYSTEM_PERSONA}

${context}You have exchanged ${exchangeDepth} messages with ${name}. They clearly know billing well. Their latest message:
"${latestComment}"

Write reply #${variation}. Under 55 words. Acknowledge their process expertise genuinely, then mention PracticeSight as something you built for practices doing their own billing in SimplePractice — specifically to catch the gaps that even disciplined manual processes miss. Ask one of: whether any of their contacts who self-bill might find it useful, or whether they personally do any SimplePractice billing themselves.

Keep it collegial, not salesy. Reply only.`;
    }

    // potential_practice — direct intro
    return `${SYSTEM_PERSONA}

${context}You have now exchanged ${exchangeDepth} messages with ${name}. You have built enough trust. Their latest message:
"${latestComment}"

Write reply #${variation}. This is the moment to introduce PracticeSight naturally — not as a pitch, as something you built for exactly this problem.

Formula:
1. One sentence validating what they just said — use their exact words
2. "I actually built something for exactly this" — one sentence, not a feature list
3. What it does: you export SimplePractice billing reports, drag them in, and it shows exactly what needs attention — specific rows, specific action
4. One soft ask: "Would it be worth running once on your numbers?" or "practicesight.pages.dev if you're curious"

Tone: colleague sharing something useful, not founder pitching.
Under 65 words. Reply only.`;
  }

  // Strict community after 2+ exchanges — move toward DM
  if (exchangeDepth >= 2 && !communityRule?.canMentionProduct && isProspect) {
    return `${SYSTEM_PERSONA}

${context}You have exchanged ${exchangeDepth} messages with ${name}. This community does not allow product promotion. Their latest message:
"${latestComment}"

Write reply #${variation}. Under 45 words.
Give one genuinely useful insight about the billing gap they described.
Move the conversation toward a private channel — ask if they'd find it useful to talk through their process one-on-one, or whether they prefer DMs.
Do not name any tool or product.
Reply only.`;
  }

  // ── FUNNEL STAGE PROMPTS ─────────────────────────────────────────────────

  if (['cold', 'saw_it'].includes(stage) || strict) {
    return `${SYSTEM_PERSONA}

Platform: ${communityRule?.source || 'This community'} — strict no-promotion community. Never mention any product, app, tool, or company.

${context}${name}'s latest message:
"${latestComment}"

Write reply #${variation} of 4. Each variation opens differently.

Formula:
1. Mirror what they said in 1 short sentence (use their exact words or close paraphrase)
2. Ask ONE follow-up question that goes one level deeper into their actual situation

The question should feel genuinely curious, not like a setup.
Reply only. No labels. Under 55 words.`;
  }

  if (stage === 'engaged') {
    return `${SYSTEM_PERSONA}

${context}${name} is engaging back. Their latest message:
"${latestComment}"

Write a reply that:
1. Picks up on ONE specific thing they just said and reflects it back precisely
2. Asks the question that gets to the real pain: what does their actual review process look like, what do they do when something feels off, what would it mean if something slipped through
3. Stays conversational — like you're genuinely curious, not interviewing them

${canMention ? 'You may now briefly mention PracticeSight only if it flows completely naturally from what they said. If it would feel like a pivot, stay in peer mode.' : 'Do NOT mention any product yet.'}

Reply only. Under 60 words.`;
  }

  if (stage === 'warm' && canMention) {
    return `${SYSTEM_PERSONA}

${context}${name} has expressed real billing pain or anxiety. Their latest message:
"${latestComment}"

Write a reply that:
1. Opens by validating their specific pain in 1 sentence — use their words
2. Transitions naturally: "I actually built something for exactly this" — ONE sentence, not a pitch
3. Says what it does in ONE specific sentence: "You export your SimplePractice reports, drag them in, and it shows exactly what needs attention — specific report, specific row."
4. Ends with a soft pull: "Would you want to try it?" or "practicesight.pages.dev if you're curious."

Tone: colleague sharing something useful, not founder pitching.
No features list. No adjectives like "powerful" or "amazing."
Under 70 words.`;
  }

  if (stage === 'hot') {
    return `${SYSTEM_PERSONA}

${context}${name} wants to try it or asked how. Their latest message:
"${latestComment}"

Remove all friction. One clear path.
1. One warm sentence acknowledging their interest
2. URL: practicesight.pages.dev
3. One sentence on what to do: "Export your billing reports from SimplePractice as CSVs — it walks you through which ones."
4. "Let me know what it finds"

Under 55 words. No hype. No adjectives.`;
  }

  if (stage === 'testing') {
    return `${SYSTEM_PERSONA}

${context}${name} is currently testing PracticeSight. Their latest message:
"${latestComment}"

Write a reply that:
1. Acknowledges where they are in the process warmly
2. Asks one specific question: what did it find? or was anything confusing?
3. Makes them feel like their feedback genuinely matters

Under 45 words. Casual. Like a text.`;
  }

  if (stage === 'feedback') {
    return `${SYSTEM_PERSONA}

${context}${name} tested PracticeSight and gave feedback. Their latest message:
"${latestComment}"

Write a reply that:
1. Thanks them genuinely — 1 sentence, specific to what they said
2. Asks the 3 feedback questions naturally (not as a numbered list):
   - Did it find anything you didn't already know about?
   - Was anything confusing?
   - Did it miss something you expected it to catch?

Under 60 words. Warm but direct.`;
  }

  return `${SYSTEM_PERSONA}

${context}${name}'s latest message:
"${latestComment}"

Write a warm, curious reply that mirrors what they said and asks one follow-up question.
Under 50 words. No product mention.`;
}

async function generateReply({ lead, apiKey, stage, leadType, variationNum, preferredModel }) {
  const communityRule = getCommunityRule(lead.source, lead.ch, COMMUNITIES);
  const conversationContext = buildConversationContext(lead);
  const exchangeDepth = Array.isArray(lead.followUps) ? lead.followUps.length : 0;

  // Always reply to the most recent message.
  // lead.comment is overwritten by handleReply to be the latest follow-up text.
  let latestComment = lead.comment || '';
  if (Array.isArray(lead.followUps) && lead.followUps.length > 0) {
    const last = lead.followUps[lead.followUps.length - 1];
    latestComment = typeof last === 'string' ? last : last?.text || lead.comment || '';
  }

  const prompt = buildPrompt({
    latestComment,
    name: lead.name,
    stage,
    leadType,
    communityRule,
    variationNum,
    conversationContext,
    exchangeDepth,
  });

  const result = await chatCompletion({
    apiKey,
    maxTokens: 250,
    preferredModel,
    messages: [{ role: 'user', content: prompt }]
  });

  return result.text;
}

// ── POST ACTION ──────────────────────────────────────────────────────────────
function getPostAction(ch, threadUrl, reply) {
  if (ch === 'x') {
    const tweetMatch = threadUrl?.match(/\/status\/(\d+)/);
    if (tweetMatch) {
      return {
        label: '𝕏 Reply on X',
        sublabel: 'Pre-fills your reply — just click Tweet',
        color: '#000',
        action: () => {
          navigator.clipboard.writeText(reply);
          window.open(`https://twitter.com/intent/tweet?in_reply_to=${tweetMatch[1]}&text=${encodeURIComponent(reply)}`, '_blank', 'noopener,noreferrer');
        }
      };
    }
  }

  const labels = {
    reddit: { label: '● Open Reddit', color: '#E05929' },
    facebook: { label: 'f Open Facebook', color: '#1877F2' },
    linkedin: { label: 'in Open LinkedIn', color: '#0A66C2' },
  };
  const meta = labels[ch] || { label: '→ Open Thread', color: COLORS.secondary };

  return {
    label: meta.label,
    sublabel: threadUrl ? 'Copies reply + opens thread' : 'Copies reply to clipboard',
    color: meta.color,
    action: () => {
      navigator.clipboard.writeText(reply);
      if (threadUrl) window.open(threadUrl, '_blank', 'noopener,noreferrer');
    }
  };
}

// ── COMPONENT ────────────────────────────────────────────────────────────────
export function LeadCard({ lead, onUpdate, onDelete, onReply, onMarkPosted, apiKey, preferredModel }) {
  const [generating, setGenerating] = useState(false);
  const [generatedReply, setGeneratedReply] = useState(lead.reply || '');
  const [posted, setPosted] = useState(false);
  const [variationNum, setVariationNum] = useState(1);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpText, setFollowUpText] = useState('');

  const communityRule = getCommunityRule(lead.source, lead.ch, COMMUNITIES);
  const strict = communityRule.strict;
  const exchangeDepth = Array.isArray(lead.followUps) ? lead.followUps.length : 0;

  const liveAnalysis = analyzeLeadComment(lead.comment);
  const leadType = liveAnalysis.leadType;
  const typeMeta = LEAD_TYPE_META[leadType] || LEAD_TYPE_META.potential_practice;
  const stage = STAGES.find(s => s.id === lead.stage);
  const channel = CHANNELS[lead.ch];

  const isProspect = PROSPECT_TYPES.has(leadType);

  const isReadyToPitch = exchangeDepth >= 2
    && isProspect
    && communityRule.canMentionProduct
    && !['hot', 'testing', 'feedback'].includes(lead.stage);

  const needsDMPush = exchangeDepth >= 2
    && isProspect
    && !communityRule.canMentionProduct
    && !['hot', 'testing', 'feedback'].includes(lead.stage);

  const handleStageChange = (e) => onUpdate(lead.id, { stage: e.target.value });
  const handleDelete = () => { if (confirm(`Remove "${lead.name}"?`)) onDelete(lead.id); };

  const handleGenerate = async () => {
    if (!apiKey) {
      alert('Add your OpenRouter API key in Settings first (⚙ top right). Free at openrouter.ai');
      return;
    }
    const nextVariation = (variationNum % 4) + 1;
    setVariationNum(nextVariation);
    setGenerating(true);
    try {
      const reply = await generateReply({
        lead,
        apiKey,
        stage: lead.stage,
        leadType,
        variationNum: nextVariation,
        preferredModel,
      });
      setGeneratedReply(reply);
      onUpdate(lead.id, { reply });
    } catch (e) {
      setGeneratedReply(`Error: ${e.message || 'Check your API key in Settings.'}`);
    }
    setGenerating(false);
  };

  const handlePost = () => {
    const { action } = getPostAction(lead.ch, lead.threadUrl, generatedReply);
    action();
    setPosted(true);
  };

  const handleFollowUp = () => {
    if (!followUpText.trim()) return;
    onReply(lead.id, followUpText.trim());
    setFollowUpText('');
    setShowFollowUp(false);
  };

  const postAction = generatedReply ? getPostAction(lead.ch, lead.threadUrl, generatedReply) : null;

  const btnLabel = generating ? '⏳ Generating...'
    : isReadyToPitch ? (generatedReply ? '🔥 Remix intro' : '🔥 Introduce PracticeSight')
    : needsDMPush ? (generatedReply ? '↻ Remix DM push' : '→ Move to DM')
    : typeMeta.action ? (generatedReply ? `↻ New ${typeMeta.action}` : `✓ ${typeMeta.action}`)
    : generatedReply ? '↻ Different reply'
    : '✨ Generate reply';

  const btnColor = generating ? '#9CA3AF'
    : isReadyToPitch ? '#EA580C'
    : needsDMPush ? '#2563EB'
    : leadType === 'billing_vendor' ? '#DC2626'
    : leadType === 'outsourced_billing' ? '#D97706'
    : COLORS.primary;

  const latestDisplayText = (() => {
    if (Array.isArray(lead.followUps) && lead.followUps.length > 0) {
      const last = lead.followUps[lead.followUps.length - 1];
      return typeof last === 'string' ? last : last?.text || lead.comment || '';
    }
    return lead.comment || '';
  })();

  return (
    <div style={{
      background: '#fff', border: `1px solid ${COLORS.border}`,
      borderLeft: `4px solid ${isReadyToPitch ? '#EA580C' : stage?.color || COLORS.muted}`,
      borderRadius: 8, overflow: 'hidden', marginBottom: 12,
      boxShadow: '0 8px 20px rgba(15,23,42,0.05)'
    }}>

      {/* Header */}
      <div style={{
        background: isReadyToPitch ? '#EA580C' : stage?.color || COLORS.muted, color: '#fff',
        padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{lead.name}</div>
          <div style={{ fontSize: 13, opacity: 0.94, display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center', fontWeight: 700 }}>
            <span>{channel?.icon} {channel?.label || lead.ch}</span>
            {lead.source && <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '1px 5px' }}>{lead.source}</span>}
            <span>· {lead.date}</span>
            {exchangeDepth > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                {exchangeDepth} follow-up{exchangeDepth !== 1 ? 's' : ''}
              </span>
            )}
            {lead.posted && <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>✓ Posted</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {lead.threadUrl && (
            <a href={lead.threadUrl} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 11, color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
              background: 'rgba(255,255,255,0.15)', padding: '5px 9px', borderRadius: 6, fontWeight: 800
            }}>Thread →</a>
          )}
          <button onClick={handleDelete} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 16
          }}>×</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 14 }}>

        {isReadyToPitch && (
          <div style={{
            marginBottom: 12, padding: '10px 12px', borderRadius: 8,
            background: '#FFF7ED', border: '1px solid #FDBA74',
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#C2410C', marginBottom: 2 }}>
              🔥 {exchangeDepth} exchanges deep — time to introduce PracticeSight
            </div>
            <div style={{ fontSize: 11, color: '#9A3412' }}>
              {leadType === 'process_advice'
                ? 'They know billing well — use the collegial angle, ask if they or their contacts self-bill in SimplePractice.'
                : 'Next reply will naturally mention the tool. No need to change the stage.'}
            </div>
          </div>
        )}

        {needsDMPush && (
          <div style={{
            marginBottom: 12, padding: '10px 12px', borderRadius: 8,
            background: '#EFF6FF', border: '1px solid #BAE6FD',
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1D4ED8', marginBottom: 2 }}>
              💬 {exchangeDepth} exchanges deep — move toward DM
            </div>
            <div style={{ fontSize: 11, color: '#1E40AF' }}>
              This community blocks product mentions. Next reply plants the seed and moves private.
            </div>
          </div>
        )}

        <div style={{
          background: COLORS.bg, padding: 12, borderRadius: 8, marginBottom: 4,
          fontSize: 14, color: COLORS.text, lineHeight: 1.55, fontStyle: 'italic'
        }}>
          "{latestDisplayText.slice(0, 180)}{latestDisplayText.length > 180 ? '...' : ''}"
        </div>
        {exchangeDepth > 0 && (
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 12, paddingLeft: 4 }}>
            Latest of {exchangeDepth + 1} messages — AI replies to this one
          </div>
        )}

        <select value={lead.stage} onChange={handleStageChange} style={{
          width: '100%', padding: '10px 12px', border: `1px solid ${COLORS.border}`,
          borderRadius: 8, fontSize: 14, fontFamily: 'inherit', marginBottom: 12,
          boxSizing: 'border-box', background: '#fff',
          color: stage?.color || COLORS.text, fontWeight: 600
        }}>
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label} — {s.desc}</option>)}
        </select>

        <div style={{
          marginBottom: 10, padding: '9px 12px', borderRadius: 8,
          border: `1px solid ${typeMeta.border}`, background: typeMeta.bg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: liveAnalysis.reason ? 3 : 0 }}>
            <span style={{ fontSize: 13 }}>{typeMeta.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: typeMeta.color }}>{typeMeta.label}</span>
            {!isProspect && (
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700, background: typeMeta.color, color: '#fff', marginLeft: 2 }}>
                not a direct fit
              </span>
            )}
          </div>
          {liveAnalysis.reason && <div style={{ fontSize: 11, color: '#555', lineHeight: 1.4 }}>{liveAnalysis.reason}</div>}
        </div>

        {(lead.source || lead.ch === 'reddit') && isProspect && (
          <div style={{
            fontSize: 12, marginBottom: 10, padding: '6px 10px', borderRadius: 8,
            background: strict ? '#FFF5EB' : '#F0FDF4',
            color: strict ? '#854F0B' : '#166634',
          }}>
            {strict
              ? '⚠ Strict community — reply stays in peer support mode, no product mention'
              : isReadyToPitch
                ? '🔥 Ready — next reply introduces PracticeSight naturally'
                : ['warm', 'hot', 'testing', 'feedback'].includes(lead.stage)
                  ? '✓ Warm lead in open community — reply may naturally mention PracticeSight'
                  : `Building trust — ${Math.max(0, 2 - exchangeDepth)} more exchange${(2 - exchangeDepth) !== 1 ? 's' : ''} before pitch mode`}
          </div>
        )}

        <button onClick={handleGenerate} disabled={generating} style={{
          width: '100%', padding: 13, marginBottom: 10,
          background: btnColor, color: '#fff', border: 'none', borderRadius: 8,
          cursor: generating ? 'not-allowed' : 'pointer',
          fontSize: 15, fontWeight: 900, fontFamily: 'inherit'
        }}>
          {btnLabel}
        </button>

        {generatedReply && (
          <div style={{ marginBottom: 8 }}>
            <div
              onClick={() => navigator.clipboard.writeText(generatedReply)}
              title="Click to copy"
              style={{
                background: '#F0FDF4', border: '1px solid #B8E5C8',
                borderRadius: 8, padding: 12, fontSize: 14, lineHeight: 1.6,
                color: '#166534', marginBottom: 8, cursor: 'copy', userSelect: 'all'
              }}
            >
              {generatedReply}
            </div>

            {postAction && (
              <button onClick={handlePost} style={{
                width: '100%', padding: '12px 12px', marginBottom: 8,
                background: postAction.color, color: '#fff', border: 'none',
                borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 900,
                fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
              }}>
                <span>{postAction.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.86 }}>{postAction.sublabel}</span>
              </button>
            )}

            {!lead.posted ? (
              <button onClick={onMarkPosted ? () => onMarkPosted(lead.id) : null} style={{
                width: '100%', padding: 10,
                background: posted ? COLORS.success + '22' : '#fff',
                color: COLORS.success, border: `1px solid ${COLORS.success}`,
                borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 800
              }}>
                {posted ? '✓ Mark as Posted (confirm)' : '✓ Mark as Posted'}
              </button>
            ) : (
              <div style={{ textAlign: 'center', fontSize: 14, color: COLORS.success, fontWeight: 800, padding: 6 }}>✓ Posted</div>
            )}
          </div>
        )}

        <button onClick={() => setShowFollowUp(!showFollowUp)} style={{
          width: '100%', padding: '9px 10px', marginTop: 6,
          background: 'transparent', color: COLORS.muted,
          border: `1px solid ${COLORS.border}`, borderRadius: 6,
          cursor: 'pointer', fontSize: 14, fontWeight: 800
        }}>
          {showFollowUp ? '↺ Hide' : `+ Log their response${lead.followUps?.length ? ` (${lead.followUps.length} logged)` : ''}`}
        </button>

        {showFollowUp && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 6 }}>
              Paste exactly what they wrote — the AI will reply to this, not the original comment.
            </div>
            <textarea
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              placeholder="Paste their latest reply here..."
              rows={3}
              style={{
                width: '100%', padding: 10, border: `1px solid ${COLORS.border}`,
                borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
                marginBottom: 6, boxSizing: 'border-box', resize: 'vertical'
              }}
            />
            <button onClick={handleFollowUp} style={{
              width: '100%', padding: 10, background: COLORS.secondary,
              color: '#fff', border: 'none', borderRadius: 6,
              cursor: 'pointer', fontSize: 14, fontWeight: 800
            }}>Save & generate next reply</button>
          </div>
        )}

        {lead.followUps && lead.followUps.length > 0 && !showFollowUp && (
          <div style={{ marginTop: 8 }}>
            {lead.followUps.map((fu, i) => {
              const text = typeof fu === 'string' ? fu : fu?.text || '';
              return (
                <div key={i} style={{
                  background: COLORS.bg, padding: '5px 8px', borderRadius: 4,
                  marginBottom: 4, fontSize: 13, color: COLORS.text, fontStyle: 'italic',
                  borderLeft: `2px solid ${COLORS.secondary}`
                }}>
                  "{text.slice(0, 90)}{text.length > 90 ? '...' : ''}"
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default LeadCard;
