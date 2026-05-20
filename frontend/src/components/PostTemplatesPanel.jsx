import React, { useState } from 'react';
import { COLORS } from '../lib/constants';
import { COMMUNITIES } from './CommunitiesPanel';

const SAFE_COMMUNITIES = COMMUNITIES.filter(c => c.safe);
const STRICT_COMMUNITIES = COMMUNITIES.filter(c => !c.safe);

const DEFAULT_TEMPLATES = [
  {
    id: 1,
    title: 'Month-end billing review',
    tag: 'Engagement post',
    body: `For those of you in private practice who do your own insurance billing — how do you actually do your month-end review?\n\nDo you have a system or is it more just knowing your numbers well enough to catch things?\n\nGenuinely curious what works.`,
  },
  {
    id: 2,
    title: 'Unbilled sessions — catching the gaps',
    tag: 'Pain point post',
    body: `Anyone else ever find sessions that slipped through the billing cracks at month end?\n\nCurious what your process looks like for catching those before they age out.`,
  },
  {
    id: 3,
    title: 'ERA enrollment tip',
    tag: 'Value tip',
    body: `Quick tip for those manually checking EOBs: if you're not enrolled in ERA with all your payers, you're making reconciliation 10x harder than it needs to be.\n\nWho's done this recently — any payers that were surprisingly easy or hard to set up?`,
  },
  {
    id: 4,
    title: 'Claim denial frustration',
    tag: 'Pain point post',
    body: `Is anyone else getting more claim denials lately or is it just me?\n\nSeems like every few weeks there's a new reason they kick things back. What's your process for working through denials without it eating your whole day?`,
  },
];

async function remixTemplate(body, apiKey, count) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Here's an outreach post for private practice therapy communities on Reddit/Facebook:

"${body}"

Generate ${count} variations of this post. Each should:
- Explore the same billing pain point from a different angle or framing
- Sound like a genuine question from a fellow therapist in private practice
- NO promotional language, NO product names, NO company mentions — pure peer value
- Different opening sentence each time
- Under 90 words each
- Conversational, not formal

Format exactly as:
REMIX 1:
[text]

REMIX 2:
[text]

REMIX 3:
[text]`,
      }],
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.content[0].text;
  const matches = [...text.matchAll(/REMIX \d+:\n([\s\S]*?)(?=\nREMIX \d+:|$)/g)];
  return matches.map(m => m[1].trim()).filter(Boolean);
}

function TemplateCard({ template, apiKey }) {
  const [remixes, setRemixes] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const copy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleRemix = async () => {
    if (!apiKey) { alert('Add your Anthropic API key in Settings first (⚙ top right).'); return; }
    setGenerating(true);
    setError('');
    try {
      const results = await remixTemplate(template.body, apiKey, 3);
      setRemixes(results);
      setExpanded(true);
    } catch (e) {
      setError(e.message || 'Generation failed');
    }
    setGenerating(false);
  };

  return (
    <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700 }}>{template.title}</span>
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700,
          background: '#F3F4F6', color: '#555'
        }}>{template.tag}</span>
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700,
          background: '#FFF5EB', color: '#854F0B', marginLeft: 'auto'
        }}>no product mention</span>
      </div>

      {/* Original post */}
      <div
        onClick={() => copy(template.body, 'orig-' + template.id)}
        title="Click to copy"
        style={{
          background: COLORS.bg, padding: '8px 10px', borderRadius: 6,
          fontSize: 11, color: '#555', lineHeight: 1.6, marginBottom: 6,
          cursor: 'copy', whiteSpace: 'pre-wrap'
        }}
      >
        {template.body}
      </div>
      {copiedId === 'orig-' + template.id && (
        <div style={{ fontSize: 10, color: COLORS.success, marginBottom: 4 }}>✓ Copied</div>
      )}

      {/* Which communities to use this in */}
      <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 8 }}>
        Safe for: {STRICT_COMMUNITIES.map(c => c.name).join(', ')} · and all others
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleRemix}
          disabled={generating}
          style={{
            padding: '5px 12px', fontSize: 11, fontWeight: 700,
            background: generating ? '#9CA3AF' : COLORS.primary,
            color: '#fff', border: 'none', borderRadius: 6,
            cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
          }}
        >
          {generating ? '⏳ Remixing...' : '↺ Get 3 remixes'}
        </button>
        {remixes.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: '5px 10px', fontSize: 11,
              background: 'none', border: `1px solid ${COLORS.border}`,
              borderRadius: 6, cursor: 'pointer', color: COLORS.muted, fontFamily: 'inherit'
            }}
          >
            {expanded ? '▲ hide' : `▼ show ${remixes.length} remixes`}
          </button>
        )}
      </div>

      {error && <div style={{ fontSize: 11, color: '#C44', marginTop: 6 }}>Error: {error}</div>}

      {expanded && remixes.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {remixes.map((r, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.muted, marginBottom: 3 }}>
                Remix {i + 1}
              </div>
              <div
                onClick={() => copy(r, `remix-${template.id}-${i}`)}
                title="Click to copy"
                style={{
                  background: '#F0FDF4', border: '1px solid #B8E5C8',
                  borderRadius: 6, padding: '8px 10px', fontSize: 11,
                  color: '#166534', lineHeight: 1.6, cursor: 'copy',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {r}
              </div>
              {copiedId === `remix-${template.id}-${i}` && (
                <div style={{ fontSize: 10, color: COLORS.success, marginTop: 2 }}>✓ Copied</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PostTemplatesPanel({ apiKey }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: '#fff', border: `1px solid ${COLORS.border}`,
      borderRadius: 12, marginBottom: 16, overflow: 'hidden'
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '12px 16px',
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>✏️ Post Templates</span>
          <span style={{ fontSize: 11, color: COLORS.muted }}>
            Value-first posts to start conversations · click to copy · ↺ remix = fresh variation
          </span>
        </div>
        <span style={{ fontSize: 11, color: COLORS.muted }}>{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {/* Safe community guide */}
          <div style={{
            padding: '8px 16px', background: COLORS.bg,
            borderBottom: `1px solid ${COLORS.border}`,
            fontSize: 10, color: COLORS.muted
          }}>
            <strong style={{ color: '#166534' }}>✓ Can post in:</strong>{' '}
            {SAFE_COMMUNITIES.map(c => c.name).join(' · ')}
            {'  '}
            <strong style={{ color: '#854F0B' }}>⚠ Value-only in:</strong>{' '}
            {STRICT_COMMUNITIES.map(c => c.name).join(' · ')}
          </div>
          {DEFAULT_TEMPLATES.map(t => (
            <TemplateCard key={t.id} template={t} apiKey={apiKey} />
          ))}
        </div>
      )}
    </div>
  );
}

export default PostTemplatesPanel;
