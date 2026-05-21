import React, { useState } from 'react';
import { STAGES, CHANNELS, COLORS } from '../lib/constants';
import { chatCompletion } from '../lib/openrouter';
import { communityToneGuidance, formatCommunityForPrompt, getCommunityRule } from '../lib/communityRules';
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

const SYSTEM_PERSONA = `You are a licensed therapist in private practice. You are NOT a marketer, founder, or salesperson. You talk to colleagues the way therapists talk to each other — warm, direct, no agenda visible.

You happen to have built a small free tool called PracticeSight (practicesight.pages.dev) that checks billing in SimplePractice. You built it for yourself and colleagues. You mention it the way you'd mention anything useful — briefly, naturally, only when it fits.

VOICE RULES — always:
- Short. 2-4 sentences max.
- No exclamation marks ever.
- No "I hope this helps" or "Great question" or "That's interesting."
- No corporate language.
- Specific beats generic — use their exact words back to them.
- Sound like a text message from a colleague, not a LinkedIn post.`;

function buildPrompt({ comment, name, stage, leadType, communityRule, variationNum, intent }) {
  const strict = communityRule?.strict;
  const canMention = communityRule?.canMentionProduct && ['warm','hot','testing','gave_feedback'].includes(stage);
  const variation = variationNum || 1;

  // ── REFERRAL ASKS ────────────────────────────────────────────────────────

  if (leadType === 'billing_vendor') {
    return `${SYSTEM_PERSONA}

This person appears to be a billing company or service provider. They wrote:
"${comment}"

Write a single reply (under 35 words) that:
1. Acknowledges what they do in one phrase
2. Mentions you made a simple free billing checker for therapists using SimplePractice — asks if any of their therapist clients might find it useful
3. Zero pitch. Zero pressure. Sounds like a curious colleague.

Reply only. No labels. No preamble.`;
  }

  if (leadType === 'outsourced_billing') {
    return `${SYSTEM_PERSONA}

This person has billing outsourced. They wrote:
"${comment}"

Write a single reply (under 35 words) that:
1. Acknowledges billing outsourced = they don't need this
2. Casually asks if they know any colleagues who do their own billing in SimplePractice — that's who you built it for
3. Sounds like a fellow therapist making conversation, not a vendor prospecting.

Reply only. No labels. No preamble.`;
  }

  // ── FUNNEL STAGE PROMPTS ─────────────────────────────────────────────────

  // COLD / SAW_IT — pure peer, no product, build trust
  if (['cold','saw_it'].includes(stage) || strict) {
    return `${SYSTEM_PERSONA}

Platform: ${communityRule?.source || 'Reddit'} — strict no-promotion community. Never mention any product, app, tool, or company.

${name} wrote:
"${comment}"

Write reply #${variation} of 4. Each variation opens differently.

Your goal: make them feel heard and keep the conversation going.

Formula:
1. Mirror what they said in 1 short sentence (use their exact words or close paraphrase)
2. Ask ONE follow-up question that goes one level deeper into their actual situation

Examples of good mirrors:
- They said "I just hope it works out" → you say "That background hope that nothing slipped through is exhausting."
- They said "I check weekly" → you say "Weekly checks are more than most people do."

Examples of bad mirrors (don't do these):
- "I completely understand where you're coming from" (generic)
- "That makes total sense" (filler)
- Starting with "I" (too self-focused)

The question should feel genuinely curious, not like a setup.

Reply only. No labels. Under 55 words.`;
  }

  // ENGAGED — digging deeper, still no product unless warm
  if (stage === 'engaged') {
    return `${SYSTEM_PERSONA}

${name} is engaging back. They wrote:
"${comment}"

You're 2-3 exchanges in. They're curious. Keep digging into their specific situation.

Write a reply that:
1. Picks up on ONE specific thing they said and reflects it back precisely
2. Asks the question that gets to the real pain: what does their actual review process look like, what do they do when something feels off, what would it mean if something slipped through
3. Stays conversational — like you're genuinely curious, not interviewing them

${canMention ? 'You may now briefly mention PracticeSight only if it flows completely naturally from what they said. If it would feel like a pivot, stay in peer mode.' : 'Do NOT mention any product yet.'}

Reply only. Under 60 words.`;
  }

  // WARM — validation + natural product mention
  if (stage === 'warm' && canMention) {
    return `${SYSTEM_PERSONA}

${name} has expressed real billing pain or anxiety. They wrote:
"${comment}"

This is the moment. They described the exact problem PracticeSight solves.

Write a reply that:
1. Opens by validating their specific pain in 1 sentence — use their words
2. Transitions naturally: "I actually built something for exactly this" — ONE sentence, not a pitch
3. Says what it does in ONE specific sentence: "You export your SimplePractice reports, drag them in, and it shows exactly what needs attention — specific report, specific row."
4. Ends with a soft pull: "Would you want to try it?" or "practicesight.pages.dev if you're curious."

The tone is: colleague sharing something useful, not founder pitching.
No features list. No adjectives like "powerful" or "amazing."
Under 70 words.`;
  }

  // HOT — they want to try it, remove all friction
  if (stage === 'hot') {
    return `${SYSTEM_PERSONA}

${name} wants to try it or asked how. They wrote:
"${comment}"

Remove all friction. One clear path.

Write a reply that:
1. Opens warmly — 1 sentence acknowledging their interest without overselling it
2. Gives the URL: practicesight.pages.dev
3. One sentence on what to do: "Export your billing reports from SimplePractice as CSVs — it walks you through which ones."
4. Optional: "Let me know what it finds" — makes them feel like there's a real person on the other end

Under 55 words. No hype. No adjectives.`;
  }

  // TESTING — they're in it, encourage + ask
  if (stage === 'testing') {
    return `${SYSTEM_PERSONA}

${name} is currently testing PracticeSight. They wrote:
"${comment}"

Write a reply that:
1. Acknowledges where they are in the process warmly
2. Asks one specific question: what did it find? or was anything confusing?
3. Makes them feel like their feedback genuinely matters to you

Under 45 words. Casual. Like a text.`;
  }

  // GAVE_FEEDBACK — close the loop
  if (stage === 'gave_feedback') {
    return `${SYSTEM_PERSONA}

${name} tested PracticeSight and gave feedback. They wrote:
"${comment}"

Write a reply that:
1. Thanks them genuinely — 1 sentence, specific to what they said
2. Asks the 3 feedback questions naturally (not as a numbered list):
   - Did it find anything you didn't already know about?
   - Was anything confusing?
   - Did it miss something you expected it to catch?

Under 60 words. Warm but direct.`;
  }

  // DEFAULT fallback
  return `${SYSTEM_PERSONA}

${name} wrote:
"${comment}"

Write a warm, curious reply that mirrors what they said and asks one follow-up question.
Under 50 words. No product mention.`;
}

async function generateReply(comment, name, apiKey, source, channel, stage, leadType, intent, variationNum, preferredModel) {
  const communityRule = getCommunityRule(source, channel, COMMUNITIES);

  const prompt = buildPrompt({
    comment, name, stage, leadType,
    communityRule, variationNum, intent
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
  const liveAnalysis = analyzeLeadComment(lead.comment);
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
        lead.comment, lead.name, apiKey,
        lead.source, lead.ch, lead.stage,
        leadType, liveAnalysis.intent,
        nextVariation, preferredModel
      );
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
    : typeMeta.action ? (generatedReply ? `↻ New ${typeMeta.action}` : `✓ ${typeMeta.action}`)
    : generatedReply ? '↻ Different reply'
    : '✨ Generate reply';

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

        {/* Their comment */}
        <div style={{
          background: COLORS.bg, padding: 12, borderRadius: 8, marginBottom: 12,
          fontSize: 14, color: COLORS.text, lineHeight: 1.55, fontStyle: 'italic'
        }}>
          "{lead.comment.slice(0, 150)}{lead.comment.length > 150 ? '...' : ''}"
        </div>

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

        {/* Follow-up log */}
        <button onClick={() => setShowFollowUp(!showFollowUp)} style={{
          width: '100%', padding: '9px 10px', marginTop: 6,
          background: 'transparent', color: COLORS.muted,
          border: `1px solid ${COLORS.border}`, borderRadius: 6,
          cursor: 'pointer', fontSize: 14, fontWeight: 800
        }}>
          {showFollowUp ? '↺ Hide' : `+ Log follow-up${lead.followUps?.length ? ` (${lead.followUps.length})` : ''}`}
        </button>

        {showFollowUp && (
          <div style={{ marginTop: 8 }}>
            <textarea
              value={followUpText}
              onChange={(e) => setFollowUpText(e.target.value)}
              placeholder="Paste their next comment or reply..."
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
            }}>Save follow-up</button>
          </div>
        )}

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
