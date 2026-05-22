import React, { useEffect, useState } from 'react';
import { STAGES, CHANNELS, COLORS } from '../lib/constants';
import { chatCompletion } from '../lib/openrouter';
import { getCommunityRule } from '../lib/communityRules';
import { analyzeLeadComment } from '../lib/leadAnalysis';
import {
  appendConversationMessage,
  conversationForLead,
  conversationPromptContext,
  formatConversationDate,
  latestLeadMessage,
} from '../lib/conversation';
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
};

// ── REPLY GENERATION ─────────────────────────────────────────────────────────

/*
  FUNNEL STAGES — REPLY STRATEGY
  ─────────────────────────────────
  cold / saw_it   → Mirror + one curious question. No product. Build trust.
  engaged         → Dig into their specific situation. Still no product.
  warm            → Validate pain + natural PracticeSight mention if community allows.
  hot             → Remove friction. Clear path to try it. One ask.
  testing         → Encourage + ask what they found.
  gave_feedback   → Thank + 3 feedback questions.
  not_fit         → Referral ask. Warm, no pitch.
*/

const FAST_REPLY_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free',
  'openai/gpt-oss-20b:free',
  'google/gemma-4-31b-it:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'openai/gpt-oss-120b:free',
];

const SYSTEM_PERSONA = `You are Leonardo, a therapist in private practice. You write like a helpful colleague, not a marketer. Short, warm, direct, no hype, no exclamation marks. PracticeSight is a small free SimplePractice billing checker you built; mention it only when it fits.`;

function buildPrompt({ comment, name, stage, leadType, communityRule, variationNum, conversationContext }) {
  const strict = communityRule?.strict;
  const canMention = communityRule?.canMentionProduct && ['warm','hot','testing','gave_feedback'].includes(stage);
  const variation = variationNum || 1;
  const context = conversationContext
    ? `Conversation so far:\n${conversationContext}\n\n`
    : '';

  if (leadType === 'billing_vendor') {
    return `${SYSTEM_PERSONA}

${context}${name} appears to be a billing company or service provider. Latest message:
"${comment}"

Write reply #${variation}. Under 35 words. Acknowledge what they do, then ask if any therapist clients who do their own SimplePractice billing might find a free checker useful. Reply only.`;
  }

  if (leadType === 'outsourced_billing') {
    return `${SYSTEM_PERSONA}

${context}${name} has billing outsourced. Latest message:
"${comment}"

Write reply #${variation}. Under 35 words. Acknowledge they may not need this, then casually ask if they know colleagues doing their own SimplePractice billing. Reply only.`;
  }

  if (['cold','saw_it'].includes(stage) || strict) {
    return `${SYSTEM_PERSONA}

${context}${communityRule?.source || 'This community'} is strict/no-promotion. Do not mention PracticeSight or any tool.
${name}'s latest message:
"${comment}"

Write reply #${variation}. Mirror one specific thing they said, then ask one natural follow-up question. Under 45 words. Reply only.`;
  }

  if (stage === 'engaged') {
    return `${SYSTEM_PERSONA}

${context}${name} is engaging back. Latest message:
"${comment}"

Write reply #${variation}. Reflect one specific thing and ask what their actual review/checking process looks like. ${canMention ? 'You may mention PracticeSight only if it flows naturally.' : 'Do not mention PracticeSight yet.'} Under 50 words. Reply only.`;
  }

  if (stage === 'warm' && canMention) {
    return `${SYSTEM_PERSONA}

${context}${name} has real billing pain. Latest message:
"${comment}"

Write reply #${variation}. Validate the specific pain, then naturally mention you built PracticeSight for this: export SimplePractice reports, drag them in, see what needs attention. Soft invite. Under 60 words. Reply only.`;
  }

  if (stage === 'hot') {
    return `${SYSTEM_PERSONA}

${context}${name} wants to try it or asked how. Latest message:
"${comment}"

Give the URL practicesight.pages.dev and one clear next step: export the SimplePractice billing reports as CSVs and it walks them through which ones. Under 45 words. Reply only.`;
  }

  if (stage === 'testing') {
    return `${SYSTEM_PERSONA}

${context}${name} is testing PracticeSight. Latest message:
"${comment}"

Acknowledge where they are and ask one specific question: what did it find, or was anything confusing? Under 40 words. Reply only.`;
  }

  if (stage === 'gave_feedback') {
    return `${SYSTEM_PERSONA}

${context}${name} gave feedback. Latest message:
"${comment}"

Thank them specifically, then ask naturally: did it find anything new, was anything confusing, did it miss something expected? Under 55 words. Reply only.`;
  }

  return `${SYSTEM_PERSONA}

${context}${name}'s latest message:
"${comment}"

Mirror one specific thing and ask one useful follow-up question. Under 45 words. Reply only.`;
}

async function generateReply(comment, name, apiKey, source, channel, stage, leadType, variationNum, preferredModel, conversationContext) {
  const communityRule = getCommunityRule(source, channel, COMMUNITIES);

  const prompt = buildPrompt({
    comment, name, stage, leadType,
    communityRule, variationNum, conversationContext
  });

  const result = await chatCompletion({
    apiKey,
    maxTokens: 120,
    temperature: 0.45,
    models: FAST_REPLY_MODELS,
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
  const [variationNum, setVariationNum] = useState(1);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpText, setFollowUpText] = useState('');

  useEffect(() => {
    setGeneratedReply(lead.reply || '');
  }, [lead.id, lead.reply]);

  const conversation = conversationForLead(lead);
  const latestLead = latestLeadMessage(lead);
  const activeComment = latestLead?.text || lead.comment || '';
  const replyIsError = /^Error:/i.test(generatedReply);
  const approvedReplySaved = Boolean(lead.replyApproved && generatedReply && lead.lastApprovedReply === generatedReply);
  const communityRule = getCommunityRule(lead.source, lead.ch, COMMUNITIES);
  const strict = communityRule.strict;
  const liveAnalysis = analyzeLeadComment(activeComment);
  const leadType = liveAnalysis.leadType;
  const typeMeta = LEAD_TYPE_META[leadType] || LEAD_TYPE_META.potential_practice;
  const stage = STAGES.find(s => s.id === lead.stage);
  const channel = CHANNELS[lead.ch];

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
      const reply = await generateReply(
        activeComment, lead.name, apiKey,
        lead.source, lead.ch, lead.stage,
        leadType,
        nextVariation, preferredModel,
        conversationPromptContext(lead)
      );
      setGeneratedReply(reply);
      onUpdate(lead.id, { reply, replyApproved: false });
    } catch (e) {
      setGeneratedReply(`Error: ${e.message || 'Check your API key in Settings.'}`);
    }
    setGenerating(false);
  };

  const handleDraftChange = (value) => {
    setGeneratedReply(value);
    onUpdate(lead.id, {
      reply: value,
      replyApproved: false,
    });
  };

  const handleApproveReply = () => {
    const reply = generatedReply.trim();
    if (!reply || replyIsError) return false;

    const now = Date.now();
    const at = formatConversationDate(now);
    const conversationWithReply = appendConversationMessage(lead, 'me', reply, { now, at });

    onUpdate(lead.id, {
      conversation: conversationWithReply,
      reply,
      replyApproved: true,
      lastApprovedReply: reply,
      lastApprovedAt: at,
    });

    navigator.clipboard?.writeText(reply);
    return true;
  };

  const handlePost = () => {
    if (!handleApproveReply()) return;
    const { action } = getPostAction(lead.ch, lead.threadUrl, generatedReply.trim());
    action();
  };

  const handleFollowUp = () => {
    if (!followUpText.trim()) return;
    onReply(lead.id, followUpText.trim());
    setFollowUpText('');
    setShowFollowUp(false);
  };

  const postAction = generatedReply && !replyIsError ? getPostAction(lead.ch, lead.threadUrl, generatedReply) : null;

  const btnLabel = generating ? 'Generating...'
    : typeMeta.action ? (generatedReply ? `New ${typeMeta.action}` : typeMeta.action)
    : generatedReply ? 'Generate faster remix'
    : 'Generate fast reply';

  const btnColor = generating ? '#9CA3AF'
    : leadType === 'billing_vendor' ? '#DC2626'
    : leadType === 'outsourced_billing' ? '#D97706'
    : COLORS.primary;

  return (
    <div style={{
      background: '#fff', border: `1px solid ${COLORS.border}`,
      borderLeft: `4px solid ${stage?.color || COLORS.muted}`,
      borderRadius: 8, overflow: 'hidden', marginBottom: 12,
      boxShadow: '0 8px 20px rgba(15,23,42,0.05)'
    }}>

      {/* Header */}
      <div style={{
        background: stage?.color || COLORS.muted, color: '#fff',
        padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{lead.name}</div>
          <div style={{ fontSize: 13, opacity: 0.94, display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center', fontWeight: 700 }}>
            <span>{channel?.icon} {channel?.label || lead.ch}</span>
            {lead.source && <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '1px 5px' }}>{lead.source}</span>}
            <span>· {lead.date}</span>
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

        {/* Latest lead message */}
        <div style={{
          background: COLORS.bg, padding: 12, borderRadius: 8, marginBottom: 12,
          fontSize: 14, color: COLORS.text, lineHeight: 1.55, fontStyle: 'italic'
        }}>
          "{activeComment.slice(0, 180)}{activeComment.length > 180 ? '...' : ''}"
        </div>

        {conversation.length > 0 && (
          <div style={{
            marginBottom: 12,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            overflow: 'hidden',
            background: '#fff',
          }}>
            <div style={{
              padding: '8px 10px',
              background: '#F8FAFC',
              borderBottom: `1px solid ${COLORS.border}`,
              fontSize: 12,
              fontWeight: 900,
              color: COLORS.muted,
              textTransform: 'uppercase',
            }}>
              Conversation thread
            </div>
            <div style={{ padding: 10, display: 'grid', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {conversation.map((message) => {
                const isMe = message.role === 'me';
                return (
                  <div key={message.id} style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: isMe ? '#EFF6FF' : COLORS.bg,
                    border: `1px solid ${isMe ? '#BFDBFE' : COLORS.border}`,
                    color: COLORS.text,
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 4,
                      fontSize: 11,
                      fontWeight: 900,
                      color: isMe ? COLORS.secondary : COLORS.muted,
                      textTransform: 'uppercase',
                    }}>
                      <span>{isMe ? 'You replied' : `${lead.name} wrote`}</span>
                      {message.at && <span style={{ textTransform: 'none', color: COLORS.muted }}>{message.at}</span>}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.45 }}>{message.text}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage */}
        <select value={lead.stage} onChange={handleStageChange} style={{
          width: '100%', padding: '10px 12px', border: `1px solid ${COLORS.border}`,
          borderRadius: 8, fontSize: 14, fontFamily: 'inherit', marginBottom: 12,
          boxSizing: 'border-box', background: '#fff',
          color: stage?.color || COLORS.text, fontWeight: 600
        }}>
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label} — {s.desc}</option>)}
        </select>

        {/* Lead type badge */}
        <div style={{
          marginBottom: 10, padding: '9px 12px', borderRadius: 8,
          border: `1px solid ${typeMeta.border}`, background: typeMeta.bg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: liveAnalysis.reason ? 3 : 0 }}>
            <span style={{ fontSize: 13 }}>{typeMeta.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: typeMeta.color }}>{typeMeta.label}</span>
            {leadType !== 'potential_practice' && (
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700, background: typeMeta.color, color: '#fff', marginLeft: 2 }}>
                not a direct fit
              </span>
            )}
          </div>
          {liveAnalysis.reason && <div style={{ fontSize: 11, color: '#555', lineHeight: 1.4 }}>{liveAnalysis.reason}</div>}
        </div>

        {/* Community rule hint */}
        {(lead.source || lead.ch === 'reddit') && leadType === 'potential_practice' && (
          <div style={{
            fontSize: 12, marginBottom: 10, padding: '6px 10px', borderRadius: 8,
            background: strict ? '#FFF5EB' : '#F0FDF4',
            color: strict ? '#854F0B' : '#166534',
          }}>
            {strict
              ? `⚠ Strict community — reply stays in peer support mode, no product mention`
              : ['warm','hot','testing','gave_feedback'].includes(lead.stage)
                ? `✓ Warm lead in open community — reply may naturally mention PracticeSight`
                : `Building trust — reply stays peer support until they're warm`}
          </div>
        )}

        {/* Generate button */}
        <button onClick={handleGenerate} disabled={generating} style={{
          width: '100%', padding: 13, marginBottom: 10,
          background: btnColor, color: '#fff', border: 'none', borderRadius: 8,
          cursor: generating ? 'not-allowed' : 'pointer',
          fontSize: 15, fontWeight: 900, fontFamily: 'inherit'
        }}>
          {btnLabel}
        </button>

        {/* Generated reply */}
        {generatedReply && (
          <div style={{ marginBottom: 8 }}>
            <textarea
              value={generatedReply}
              onChange={(e) => handleDraftChange(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                background: '#F0FDF4', border: '1px solid #B8E5C8',
                borderRadius: 8, padding: 12, fontSize: 14, lineHeight: 1.6,
                color: '#166534', marginBottom: 8, boxSizing: 'border-box',
                fontFamily: 'inherit', resize: 'vertical'
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 8 }}>
              <button onClick={handleApproveReply} disabled={replyIsError} style={{
                padding: '11px 12px',
                background: replyIsError ? '#9CA3AF' : approvedReplySaved ? COLORS.success : COLORS.primary,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: replyIsError ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 900,
                fontFamily: 'inherit'
              }}>
                {approvedReplySaved ? 'Approved & logged' : 'Approve & log'}
              </button>

              <button
                onClick={() => navigator.clipboard?.writeText(generatedReply)}
                style={{
                  padding: '11px 12px',
                  background: '#fff',
                  color: COLORS.secondary,
                  border: `1px solid ${COLORS.secondary}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 900,
                  fontFamily: 'inherit'
                }}
              >
                Copy draft
              </button>
            </div>

            {postAction && (
              <button onClick={handlePost} style={{
                width: '100%', padding: '12px 12px', marginBottom: 8,
                background: postAction.color, color: '#fff', border: 'none',
                borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 900,
                fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
              }}>
                <span>{postAction.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.86 }}>Approves, copies, and opens the thread</span>
              </button>
            )}

            {!lead.posted ? (
              <button onClick={onMarkPosted ? () => onMarkPosted(lead.id) : null} style={{
                width: '100%', padding: 10,
                background: '#fff',
                color: COLORS.success, border: `1px solid ${COLORS.success}`,
                borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 800
              }}>
                Mark as Posted
              </button>
            ) : (
              <div style={{ textAlign: 'center', fontSize: 14, color: COLORS.success, fontWeight: 800, padding: 6 }}>✓ Posted</div>
            )}
          </div>
        )}

        {/* Next response log */}
        <button onClick={() => setShowFollowUp(!showFollowUp)} style={{
          width: '100%', padding: '9px 10px', marginTop: 6,
          background: approvedReplySaved ? '#F0FDF4' : 'transparent',
          color: approvedReplySaved ? COLORS.success : COLORS.muted,
          border: `1px solid ${COLORS.border}`, borderRadius: 6,
          cursor: 'pointer', fontSize: 14, fontWeight: 800
        }}>
          {showFollowUp ? 'Hide response box' : 'Add their response'}
        </button>

        {showFollowUp && (
          <div style={{ marginTop: 8 }}>
            {approvedReplySaved && (
              <div style={{ fontSize: 12, color: COLORS.success, fontWeight: 800, marginBottom: 6 }}>
                Your approved reply is in the thread. Paste what they say next here.
              </div>
            )}
            <textarea
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              placeholder="Paste their next response..."
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
            }}>Save response & continue</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeadCard;
