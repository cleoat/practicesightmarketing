import React, { useState } from 'react';
import { STAGES, CHANNELS, COLORS } from '../lib/constants';
import { chatCompletion } from '../lib/openrouter';
import { communityToneGuidance, formatCommunityForPrompt, getCommunityRule } from '../lib/communityRules';
import { analyzeLeadComment } from '../lib/leadAnalysis';
import { COMMUNITIES } from './CommunitiesPanel';

const LEAD_TYPE_META = {
  billing_vendor: {
    icon: '🏢',
    label: 'Billing company / vendor',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    action: 'Generate Referral Ask',
  },
  outsourced_billing: {
    icon: '🔄',
    label: 'Billing outsourced',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    action: 'Generate Referral Ask',
  },
  potential_practice: {
    icon: '👤',
    label: 'Private practice therapist',
    color: '#059669',
    bg: '#F0FDF4',
    border: '#B8E5C8',
    action: null,
  },
};

async function generateReply(comment, name, apiKey, source, channel, stage, leadType, variationNum, preferredModel) {
  const communityRule = getCommunityRule(source, channel, COMMUNITIES);
  const platform = formatCommunityForPrompt(communityRule);
  const toneGuidance = communityToneGuidance(communityRule);
  const isWarm = communityRule.canMentionProduct && ['hot', 'testing', 'feedback'].includes(stage);
  const variation = variationNum || 1;

  // Vendor / billing company — ask for a referral, don't pitch
  if (leadType === 'billing_vendor') {
    const referralPrompt = `You are a therapist. You don't do your own billing, but you put together a small free tool called PracticeSight that helps therapists catch billing errors in SimplePractice — you made it for colleagues, not for yourself.

This person appears to be a billing company or service provider. They wrote:
"${comment}"

Write a 1-2 sentence reply that:
- Briefly acknowledges what they do
- Casually mentions you made a simple free billing checker for therapists who use SimplePractice — and asks if any of their clients fit that description
- Sounds like a curious therapist, not a salesperson or founder
- Zero pressure
- Under 35 words
- No exclamation marks`;

    const result = await chatCompletion({ apiKey, maxTokens: 150, preferredModel, messages: [{ role: 'user', content: referralPrompt }] });
    return result.text;
  }

  // Outsourced billing — ask for colleague referral
  if (leadType === 'outsourced_billing') {
    const outsourcedPrompt = `You are a therapist. You don't do your own billing, but you put together a small free tool called PracticeSight that helps therapists catch billing errors in SimplePractice — you made it for colleagues, not for yourself.

This person has their billing outsourced and wrote:
"${comment}"

Write a 1-2 sentence reply that:
- Acknowledges this probably isn't relevant to them directly since they outsource billing
- Casually asks if they know any colleagues who handle their own billing in SimplePractice — that's who it's for
- Sounds like a fellow therapist, not a vendor
- Under 35 words
- No exclamation marks`;

    const result = await chatCompletion({ apiKey, maxTokens: 150, preferredModel, messages: [{ role: 'user', content: outsourcedPrompt }] });
    return result.text;
  }

  const ruleGuidance = communityRule.strict
    ? 'This community is no-promotion. Do not mention PracticeSight, apps, tools, software, companies, services, links, or DMs.'
    : 'Product mentions are only allowed for hot/testing/feedback leads. For earlier stages, keep it pure peer support.';

  const coldPrompt = `You are a therapist in private practice replying to a colleague in ${platform}.

Community rule: ${ruleGuidance}
Channel tone: ${toneGuidance}

${name} posted this:
"${comment}"

Write reply variation #${variation} of 4. Each variation uses a different opening.

Rules:
- Empathize with their specific frustration — use their own words back to them
- Ask one genuine question about their situation
- Sound like a real therapist peer — warm, direct, no jargon
- Do NOT offer billing advice or claim billing experience
- Do NOT mention any product, app, tool, or service
- No exclamation marks. No "I hope this helps." No filler phrases.
- Under 60 words.`;

  const warmPrompt = `You are a therapist replying to a colleague in ${platform}. You built a small free tool called PracticeSight that checks billing in SimplePractice — you made it to help colleagues, you don't do your own billing.

Channel tone: ${toneGuidance}

${name} wrote:
"${comment}"

Write 2-3 sentences:
- Acknowledge their frustration briefly
- Mention naturally that you built a small free tool for this — PracticeSight, works with SimplePractice — one casual sentence, no pitch
- Offer to share more if they're interested
- Sound like a real person, not a marketer
- No exclamation marks. Under 60 words.`;

  const result = await chatCompletion({
    apiKey,
    maxTokens: 300,
    preferredModel,
    messages: [{ role: 'user', content: isWarm ? warmPrompt : coldPrompt }],
  });
  return result.text;
}

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
          const url = `https://twitter.com/intent/tweet?in_reply_to=${tweetMatch[1]}&text=${encodeURIComponent(reply)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      };
    }
    return {
      label: '𝕏 Post on X',
      sublabel: 'Opens X with reply pre-filled',
      color: '#000',
      action: () => {
        navigator.clipboard.writeText(reply);
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(reply)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    };
  }

  const labels = {
    reddit: { label: '◉ Open Reddit', color: '#E05929' },
    facebook: { label: 'f Open Facebook', color: '#1877F2' },
    linkedin: { label: 'in Open LinkedIn', color: '#0A66C2' },
  };
  const meta = labels[ch] || { label: '↗ Open Thread', color: COLORS.secondary };

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

export function LeadCard({ lead, onUpdate, onDelete, onReply, onMarkPosted, apiKey, preferredModel }) {
  const [generating, setGenerating] = useState(false);
  const [generatedReply, setGeneratedReply] = useState(lead.reply || '');
  const [posted, setPosted] = useState(false);
  const [variationNum, setVariationNum] = useState(1);
  const communityRule = getCommunityRule(lead.source, lead.ch, COMMUNITIES);
  const strict = communityRule.strict;

  // Always run live analysis — catches old leads that predate leadType storage
  const liveAnalysis = analyzeLeadComment(lead.comment);
  const leadType = liveAnalysis.leadType;
  const typeMeta = LEAD_TYPE_META[leadType] || LEAD_TYPE_META.potential_practice;

  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpText, setFollowUpText] = useState('');

  const stage = STAGES.find(s => s.id === lead.stage);
  const channel = CHANNELS[lead.ch];

  const handleStageChange = (e) => onUpdate(lead.id, { stage: e.target.value });

  const handleDelete = () => {
    if (confirm(`Remove "${lead.name}"?`)) onDelete(lead.id);
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      alert('Add your OpenRouter API key in Settings first (⚙ top right). Free at openrouter.ai');
      return;
    }
    const nextVariation = (variationNum % 4) + 1;
    setVariationNum(nextVariation);
    setGenerating(true);
    try {
      const reply = await generateReply(lead.comment, lead.name, apiKey, lead.source, lead.ch, lead.stage, leadType, nextVariation, preferredModel);
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

  const handleMarkPosted = () => {
    onMarkPosted(lead.id);
  };

  const handleFollowUp = () => {
    if (!followUpText.trim()) return;
    onReply(lead.id, followUpText.trim());
    setFollowUpText('');
    setShowFollowUp(false);
  };

  const postAction = generatedReply ? getPostAction(lead.ch, lead.threadUrl, generatedReply) : null;

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${COLORS.border}`,
      borderLeft: `4px solid ${stage?.color || COLORS.muted}`,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 12,
      boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)'
    }}>
      {/* Header */}
      <div style={{
        background: stage?.color || COLORS.muted,
        color: '#fff',
        padding: '12px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{lead.name}</div>
          <div style={{ fontSize: 13, opacity: 0.94, display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center', fontWeight: 700 }}>
            <span>{channel?.icon} {channel?.label || lead.ch}</span>
            {lead.source && (
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '1px 5px' }}>
                {lead.source}
              </span>
            )}
            <span>· {lead.date}</span>
            {lead.posted && (
              <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                ✓ Posted
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {lead.threadUrl && (
            <a
              href={lead.threadUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open original thread"
              style={{
                fontSize: 11, color: 'rgba(255,255,255,0.85)',
                textDecoration: 'none', background: 'rgba(255,255,255,0.15)',
                padding: '5px 9px', borderRadius: 6, fontWeight: 800
              }}
            >
              Thread ↗
            </a>
          )}
          <button onClick={handleDelete} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: 16
          }}>×</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 14 }}>
        {/* Their comment */}
        <div style={{
          background: COLORS.bg, padding: 12, borderRadius: 8, marginBottom: 12,
          fontSize: 14, color: COLORS.text, lineHeight: 1.55, fontStyle: 'italic'
        }}>
          "{lead.comment.slice(0, 150)}{lead.comment.length > 150 ? '...' : ''}"
        </div>

        {/* Stage selector */}
        <select value={lead.stage} onChange={handleStageChange} style={{
          width: '100%', padding: '10px 12px', border: `1px solid ${COLORS.border}`,
          borderRadius: 8, fontSize: 14, fontFamily: 'inherit', marginBottom: 12,
          boxSizing: 'border-box', background: '#fff',
          color: stage?.color || COLORS.text, fontWeight: 600
        }}>
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label} — {s.desc}</option>)}
        </select>

        {/* Lead type + analysis badge — always live */}
        <div style={{
          marginBottom: 10, padding: '9px 12px', borderRadius: 8,
          border: `1px solid ${typeMeta.border}`,
          background: typeMeta.bg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: liveAnalysis.reason ? 3 : 0 }}>
            <span style={{ fontSize: 13 }}>{typeMeta.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: typeMeta.color }}>{typeMeta.label}</span>
            {leadType !== 'potential_practice' && (
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700,
                background: typeMeta.color, color: '#fff', marginLeft: 2
              }}>not a direct fit</span>
            )}
          </div>
          {liveAnalysis.reason && (
            <div style={{ fontSize: 11, color: '#555', lineHeight: 1.4 }}>{liveAnalysis.reason}</div>
          )}
        </div>

        {/* Community posting rule */}
        {(lead.source || lead.ch === 'reddit') && leadType === 'potential_practice' && (
          <div style={{
            fontSize: 12, marginBottom: 10, padding: '6px 10px', borderRadius: 8,
            background: strict ? '#FFF5EB' : '#F0FDF4',
            color: strict ? '#854F0B' : '#166534',
          }}>
            {strict
              ? `⚠ ${communityRule.assumed ? 'Unknown Reddit community' : communityRule.source} — reply will never mention any product`
              : `✓ ${['hot','testing','feedback'].includes(lead.stage) ? 'Warm lead — reply may mention PracticeSight' : 'Building trust — peer support mode'}`}
          </div>
        )}

        {/* Generate button — label changes based on lead type */}
        <button onClick={handleGenerate} disabled={generating} style={{
          width: '100%', padding: 13, marginBottom: 10,
          background: generating ? '#9CA3AF' : leadType === 'billing_vendor' ? '#DC2626' : leadType === 'outsourced_billing' ? '#D97706' : COLORS.primary,
          color: '#fff', border: 'none', borderRadius: 8,
          cursor: generating ? 'not-allowed' : 'pointer',
          fontSize: 15, fontWeight: 900, fontFamily: 'inherit'
        }}>
          {generating
            ? '⏳ Generating...'
            : generatedReply
              ? `↺ Re-generate${typeMeta.action ? ' Referral Ask' : ''}`
              : typeMeta.action
                ? `✉ ${typeMeta.action}`
                : '✨ Generate Reply'}
        </button>

        {/* Generated reply + post actions */}
        {generatedReply && (
          <div style={{ marginBottom: 8 }}>
            {/* Reply text — click to copy */}
            <div
              onClick={() => navigator.clipboard.writeText(generatedReply)}
              title="Click to copy"
              style={{
                background: '#F0FDF4', border: '1px solid #B8E5C8',
                borderRadius: 8, padding: 12, fontSize: 14,
                lineHeight: 1.6, color: '#166534', marginBottom: 8,
                cursor: 'copy', userSelect: 'all'
              }}
            >
              {generatedReply}
            </div>

            {/* Platform post button */}
            {postAction && (
              <button
                onClick={handlePost}
                style={{
                  width: '100%', padding: '12px 12px', marginBottom: 8,
                  background: postAction.color,
                  color: '#fff', border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontSize: 15, fontWeight: 900,
                  fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                }}
              >
                <span>{postAction.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.86 }}>{postAction.sublabel}</span>
              </button>
            )}

            {/* Mark as posted */}
            {!lead.posted ? (
              <button
                onClick={handleMarkPosted}
                style={{
                  width: '100%', padding: 10,
                  background: posted ? COLORS.success + '22' : '#fff',
                  color: COLORS.success,
                  border: `1px solid ${COLORS.success}`, borderRadius: 6,
                  cursor: 'pointer', fontSize: 14, fontWeight: 800
                }}
              >
                {posted ? '✓ Mark as Posted (confirm)' : '✓ Mark as Posted'}
              </button>
            ) : (
              <div style={{ textAlign: 'center', fontSize: 14, color: COLORS.success, fontWeight: 800, padding: 6 }}>
                ✓ Posted
              </div>
            )}
          </div>
        )}

        {/* Log follow-up */}
        <button onClick={() => setShowFollowUp(!showFollowUp)} style={{
          width: '100%', padding: '9px 10px', marginTop: 6,
          background: 'transparent', color: COLORS.muted,
          border: `1px solid ${COLORS.border}`, borderRadius: 6,
          cursor: 'pointer', fontSize: 14, fontWeight: 800
        }}>
          {showFollowUp ? '▲ Hide' : `+ Log follow-up${lead.followUps?.length ? ` (${lead.followUps.length})` : ''}`}
        </button>

        {showFollowUp && (
          <div style={{ marginTop: 8 }}>
            <textarea
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              placeholder="Paste their reply or next comment..."
              rows={2}
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
            }}>
              Save follow-up
            </button>
          </div>
        )}

        {/* Follow-up history */}
        {lead.followUps && lead.followUps.length > 0 && !showFollowUp && (
          <div style={{ marginTop: 8 }}>
            {lead.followUps.map((fu, i) => (
              <div key={i} style={{
                background: COLORS.bg, padding: '5px 8px', borderRadius: 4,
                marginBottom: 4, fontSize: 13, color: COLORS.text, fontStyle: 'italic',
                borderLeft: `2px solid ${COLORS.secondary}`
              }}>
                "{fu.slice(0, 90)}{fu.length > 90 ? '...' : ''}"
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LeadCard;
