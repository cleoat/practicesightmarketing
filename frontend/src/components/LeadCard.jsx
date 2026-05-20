import React, { useState } from 'react';
import { STAGES, CHANNELS, COLORS } from '../lib/constants';

async function generateReply(comment, name, apiKey, source) {
  const community = source || 'an online therapy community';
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `You are helping a therapy practice find new patients through outreach in ${community}.

Someone named "${name}" posted this comment:
"${comment}"

Write a short, helpful, human-sounding reply (2-4 sentences).
- Sound like a real person, not a salesperson
- Acknowledge their specific pain point
- Mention PracticeSight handles insurance billing and revenue collection for therapy practices
- End with a soft offer to answer questions or share more info
- Do NOT use exclamation marks or sound like marketing copy
- Do NOT start with "I" or "Great question"

Reply only with the comment text, nothing else.`
      }]
    })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text;
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

export function LeadCard({ lead, onUpdate, onDelete, onReply, onMarkPosted, apiKey }) {
  const [generating, setGenerating] = useState(false);
  const [generatedReply, setGeneratedReply] = useState(lead.reply || '');
  const [posted, setPosted] = useState(false);

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
      alert('Add your Anthropic API key in Settings first (⚙ top right).');
      return;
    }
    setGenerating(true);
    try {
      const reply = await generateReply(lead.comment, lead.name, apiKey, lead.source);
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
      borderLeft: `3px solid ${stage?.color || COLORS.muted}`,
      borderRadius: 11,
      overflow: 'hidden',
      marginBottom: 8
    }}>
      {/* Header */}
      <div style={{
        background: stage?.color || COLORS.muted,
        color: '#fff',
        padding: '10px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{lead.name}</div>
          <div style={{ fontSize: 11, opacity: 0.9, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
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
                padding: '2px 8px', borderRadius: 4, fontWeight: 600
              }}
            >
              Thread ↗
            </a>
          )}
          <button onClick={handleDelete} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 14
          }}>×</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 12 }}>
        {/* Their comment */}
        <div style={{
          background: COLORS.bg, padding: 10, borderRadius: 8, marginBottom: 10,
          fontSize: 12, color: '#555', lineHeight: 1.5, fontStyle: 'italic'
        }}>
          "{lead.comment.slice(0, 150)}{lead.comment.length > 150 ? '...' : ''}"
        </div>

        {/* Stage selector */}
        <select value={lead.stage} onChange={handleStageChange} style={{
          width: '100%', padding: '7px 10px', border: `1px solid ${COLORS.border}`,
          borderRadius: 8, fontSize: 12, fontFamily: 'inherit', marginBottom: 10,
          boxSizing: 'border-box', background: '#fff',
          color: stage?.color || COLORS.text, fontWeight: 600
        }}>
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label} — {s.desc}</option>)}
        </select>

        {/* Generate button */}
        <button onClick={handleGenerate} disabled={generating} style={{
          width: '100%', padding: 10, marginBottom: 8,
          background: generating ? '#9CA3AF' : COLORS.primary,
          color: '#fff', border: 'none', borderRadius: 8,
          cursor: generating ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 700, fontFamily: 'inherit'
        }}>
          {generating ? '⏳ Generating...' : generatedReply ? '↺ Re-generate' : '✨ Generate Reply'}
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
                borderRadius: 8, padding: 10, fontSize: 12,
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
                  width: '100%', padding: '10px 12px', marginBottom: 6,
                  background: postAction.color,
                  color: '#fff', border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                }}
              >
                <span>{postAction.label}</span>
                <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.8 }}>{postAction.sublabel}</span>
              </button>
            )}

            {/* Mark as posted */}
            {!lead.posted ? (
              <button
                onClick={handleMarkPosted}
                style={{
                  width: '100%', padding: 8,
                  background: posted ? COLORS.success + '22' : '#fff',
                  color: COLORS.success,
                  border: `1px solid ${COLORS.success}`, borderRadius: 6,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600
                }}
              >
                {posted ? '✓ Mark as Posted (confirm)' : '✓ Mark as Posted'}
              </button>
            ) : (
              <div style={{ textAlign: 'center', fontSize: 12, color: COLORS.success, fontWeight: 600, padding: 4 }}>
                ✓ Posted
              </div>
            )}
          </div>
        )}

        {/* Log follow-up */}
        <button onClick={() => setShowFollowUp(!showFollowUp)} style={{
          width: '100%', padding: '6px 10px', marginTop: 4,
          background: 'transparent', color: COLORS.muted,
          border: `1px solid ${COLORS.border}`, borderRadius: 6,
          cursor: 'pointer', fontSize: 11
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
                width: '100%', padding: 8, border: `1px solid ${COLORS.border}`,
                borderRadius: 6, fontSize: 11, fontFamily: 'inherit',
                marginBottom: 6, boxSizing: 'border-box', resize: 'vertical'
              }}
            />
            <button onClick={handleFollowUp} style={{
              width: '100%', padding: 6, background: COLORS.secondary,
              color: '#fff', border: 'none', borderRadius: 6,
              cursor: 'pointer', fontSize: 11, fontWeight: 600
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
                marginBottom: 2, fontSize: 11, color: '#555', fontStyle: 'italic',
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
