import React, { useState } from 'react';
import { COLORS } from '../lib/constants';
import { chatCompletion } from '../lib/openrouter';
import { communityToneGuidance, formatCommunityForPrompt, getCommunityRule } from '../lib/communityRules';
import { COMMUNITIES } from './CommunitiesPanel';

const TEMPLATES = [
  // ── PHASE 1 — NO LINK, NO PRODUCT MENTION ────────────────────────
  {
    id: 1, phase: 1,
    title: 'Month-end review question',
    tag: 'Phase 1 · No product mention',
    when: 'Post FIRST — pure question, zero product mention. Great opener in any therapist community.',
    communities: 'r/therapists · r/socialwork · r/counseling · Facebook groups',
    body: `For those of you in private practice who do your own insurance billing — how do you actually do your month-end billing review?

Do you have a specific routine, or is it more just knowing your numbers well enough to catch things?

Genuinely curious what works for people.`,
  },
  {
    id: 2, phase: 1,
    title: 'Lost revenue / unbilled sessions',
    tag: 'Phase 1 · No product mention',
    when: 'Pain-point angle. Works well in private practice communities.',
    communities: 'r/privatepractice · Therapists in Private Practice FB · Therapist Entrepreneurs FB',
    body: `Anyone in private practice ever go back and find sessions that were never billed?

I've heard from a few colleagues that it happens more than people admit — an appointment slips through, a claim never gets filed, and it just sits there aging out.

Curious whether you have a process to catch those or if it's more "hope for the best."`,
  },
  {
    id: 3, phase: 1,
    title: 'The billing anxiety post',
    tag: 'Phase 1 · No product mention',
    when: 'Emotional angle. High engagement in large therapist groups.',
    communities: 'r/therapists · Mental Health Private Practice Owners FB · Facebook groups',
    body: `Do you actually know if your insurance billing is clean right now?

Or are you kind of just hoping it is?

I keep hearing colleagues describe this low-grade anxiety around it — not knowing if a claim is stuck, something went unbilled, a balance is quietly aging. Curious whether that's common or if most people have a real system that gives them confidence.`,
  },
  {
    id: 4, phase: 1,
    title: 'SimplePractice reports question',
    tag: 'Phase 1 · No product mention',
    when: 'Highly specific — targets SimplePractice users directly.',
    communities: 'SimplePractice Users Community FB · r/privatepractice',
    body: `For those using SimplePractice and doing your own insurance billing — which reports do you actually use for your billing review?

I'm finding the data is all in there somewhere, but getting a clear action list out of it (what's aging, what's unfiled, what needs follow-up before 90 days) requires a lot of manual cross-referencing.

Is that your experience or have you found a better workflow?`,
  },
  {
    id: 5, phase: 1,
    title: 'Claim denial frustration',
    tag: 'Phase 1 · No product mention',
    when: 'Works well when claim denials are being discussed in the thread.',
    communities: 'r/therapists · Insurance Billing for Therapists FB · r/medicalbilling',
    body: `Is anyone else getting more claim denials this year or is it just me?

It feels like every few weeks there's a new reason they kick things back. I've gotten better at catching them but I'm still not confident I'm finding every one before it ages out.

What does your denial follow-up process look like?`,
  },

  // ── PHASE 2 — AFTER ENGAGEMENT, WITH LINK ─────────────────────────
  {
    id: 4, phase: 2,
    title: 'Share PracticeSight — therapists',
    tag: 'Phase 2 · Has link · After 5+ comments on Phase 1',
    when: 'Only post after Phase 1 got real engagement. Introduces PracticeSight.',
    communities: 'r/privatepractice · r/SoloPrivatePractice · r/SimplePractice',
    body: `I'm a therapist who built a billing QA tool for SimplePractice.

You export your reports and drag them in. It shows exactly what needs attention — the specific report and row to check.

In real data it found things like $970 sitting unbilled, 4 claims stuck in Error, 2 appointments never filed.

Runs in your browser. Nothing uploaded. No account needed. Free.

practicesight.pages.dev

Would love to know what it finds in your real data.`,
  },
  {
    id: 5, phase: 2,
    title: 'Share PracticeSight — billing managers',
    tag: 'Phase 2 · Has link · Billing audience',
    when: 'For billing communities after adding value in comments.',
    communities: 'r/SimplePractice · r/privatepractice',
    body: `I built a browser-based billing review tool specifically for SimplePractice.

You export the standard reports — Outstanding Balances, Unpaid Insurance Appointments, Filed Claims, Client Invoice Aging — and drag them in. It cross-references everything and gives you a prioritized action list. What's aging, what was never filed, what needs attention before it hits 90 days.

Runs entirely in your browser. Nothing uploaded. Free.

practicesight.pages.dev

Would love feedback from anyone who does this regularly.`,
  },

  // ── REPLY SCRIPTS ──────────────────────────────────────────────────
  {
    id: 6, phase: 0,
    title: 'Reply — someone describes the pain',
    tag: 'Reply script · When pain is clear',
    when: 'When someone says they check manually, worry something slipped, or have no real system.',
    communities: 'Any thread',
    body: `That's actually why I built PracticeSight.

You export your SimplePractice reports and drag them in. It cross-references everything and gives you a list of what needs attention — specific report, specific row. No guessing.

Runs in your browser, nothing uploaded. Free — practicesight.pages.dev

Would love to know if it finds anything you didn't already know about.`,
  },
  {
    id: 7, phase: 0,
    title: 'Reply — they use Headway or Alma',
    tag: 'Reply script · Not a fit — ask for referral',
    when: "When billing is handled for them. Ask for referral, don't pitch.",
    communities: 'Any channel',
    body: `That makes sense — if Headway is handling the billing side you probably wouldn't need this directly.

But if you know any colleagues who use SimplePractice and do their own insurance billing, I'd love an intro. That's exactly who I built it for.

No pressure either way.`,
  },
  {
    id: 8, phase: 0,
    title: 'Follow-up after they try it',
    tag: 'Reply script · Feedback ask',
    when: 'After someone has tested the app.',
    communities: 'Any channel',
    body: `Thank you so much.

Three quick questions if you have two minutes:
1. Did it find anything you didn't already know about?
2. Was anything confusing?
3. Did it miss something you expected it to catch?

No wrong answers — just want to know if it's solving a real problem.`,
  },
  {
    id: 9, phase: 0,
    title: 'Direct message to a colleague',
    tag: 'DM script · Highest conversion',
    when: 'Send to people you actually know. Highest conversion of any channel.',
    communities: 'WhatsApp · Text · Email · DM',
    body: `Hey [name] — I built a billing QA tool for SimplePractice and need a real therapist to try it.

Takes 3 minutes. Nothing stored anywhere — runs in your browser.

Would you be willing to try it this week?
practicesight.pages.dev

Even "it worked" or "it was confusing" helps me.`,
  },
  {
    id: 10, phase: 0,
    title: 'WhatsApp group invite',
    tag: 'WhatsApp script · Warm group message',
    when: 'Send to your existing WhatsApp group. Colleague tone, not a pitch.',
    communities: 'WhatsApp groups',
    body: `Hey everyone — I've been building something for therapists who do their own billing in SimplePractice and I'm looking for a few colleagues to give me honest feedback on whether it's actually useful.

Takes 3 minutes. Nothing stored anywhere.

If curious: practicesight.pages.dev

No pressure — even "this isn't for me" helps.`,
  },
];

const PHASE_COLORS = {
  1: { bg: '#EFF6FF', color: '#1D4ED8', label: 'Phase 1 — No product mention' },
  2: { bg: '#F0FDF4', color: '#166534', label: 'Phase 2 — Has link' },
  0: { bg: '#F5F4F0', color: '#555', label: 'Reply scripts' },
};

const REMIX_ANGLES = [
  'Lead with a personal observation or experience',
  'Lead with a direct question to the reader',
  'Lead with a specific number or data point ("$970 sitting unbilled", "3 out of 5 colleagues...")',
];

async function callRemix(body, community, apiKey, preferredModel) {
  const isPhase2 = body.includes('practicesight.pages.dev');
  const communityRule = getCommunityRule(community, null, COMMUNITIES);
  const target = formatCommunityForPrompt(communityRule);
  const productInstruction = isPhase2
    ? 'Keep practicesight.pages.dev in the post naturally'
    : 'NO product mention, NO links, NO company names — pure question or peer observation only';

  const prompt = `You are a therapist in private practice who does their own SimplePractice billing.

ORIGINAL POST:
"${body}"

TARGET COMMUNITY: ${target}
RULE: ${productInstruction}
TONE: ${communityToneGuidance(communityRule)}

Write 3 remixes. Each must take a different angle:
- Remix 1: ${REMIX_ANGLES[0]}
- Remix 2: ${REMIX_ANGLES[1]}
- Remix 3: ${REMIX_ANGLES[2]}

Each remix must:
- Open with a completely different first sentence
- Explore the same billing pain point from that angle
- Sound like a real person typing on their phone, not polished copy
- Under 80 words
- No exclamation marks

Format exactly:
REMIX 1:
[text]

REMIX 2:
[text]

REMIX 3:
[text]`;

  const result = await chatCompletion({
    apiKey,
    maxTokens: 700,
    preferredModel,
    messages: [{ role: 'user', content: prompt }],
  });

  const matches = [...result.text.matchAll(/(?:^|\n)\s*(?:\*\*)?REMIX\s*\d+\s*:?(?:\*\*)?\s*\n([\s\S]*?)(?=\n\s*(?:\*\*)?REMIX\s*\d+\s*:|$)/gi)];
  return matches.map(m => m[1].trim()).filter(Boolean);
}

function PhaseSection({ phase, templates, apiKey, preferredModel }) {
  const pc = PHASE_COLORS[phase];
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 13, fontWeight: 900, color: pc.color, background: pc.bg,
        padding: '8px 14px', borderRadius: 8, marginBottom: 12,
        textTransform: 'uppercase', letterSpacing: '.5px'
      }}>
        {pc.label}
      </div>
      {templates.map(t => <TemplateCard key={t.id} template={t} apiKey={apiKey} preferredModel={preferredModel} />)}
    </div>
  );
}

function TemplateCard({ template, apiKey, preferredModel }) {
  const [remixes, setRemixes] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [community, setCommunity] = useState('');

  const copy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleRemix = async () => {
    if (!apiKey) { setError('Add your OpenRouter API key in Settings first'); return; }
    const targetCommunity = community || template.communities.split('·')[0].trim();
    const rule = getCommunityRule(targetCommunity, null, COMMUNITIES);
    const hasProductMention = /PracticeSight|practicesight\.pages\.dev/i.test(template.body);
    if (hasProductMention && rule.strict) {
      setError(`${targetCommunity} is marked no-promotion. Use a Phase 1 template or choose a can-mention community.`);
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const results = await callRemix(
        template.body,
        targetCommunity,
        apiKey,
        preferredModel
      );
      if (!results.length) throw new Error('No remixes generated — try again');
      setRemixes(results);
      setExpanded(true);
    } catch (e) {
      setError(e.message);
    }
    setGenerating(false);
  };

  return (
    <div style={{
      border: `1px solid ${COLORS.border}`, borderRadius: 8,
      overflow: 'hidden', marginBottom: 12,
      boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)'
    }}>
      {/* Header */}
      <div style={{ padding: '13px 14px', background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 900 }}>{template.title}</span>
          <span style={{
            fontSize: 12, padding: '4px 7px', borderRadius: 6,
            background: '#fff', color: COLORS.muted, border: `1px solid ${COLORS.border}`, fontWeight: 800
          }}>
            {template.tag}
          </span>
        </div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 3, lineHeight: 1.4 }}>
          <strong>When:</strong> {template.when}
        </div>
        <div style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.4 }}>
          <strong>Post in:</strong> {template.communities}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '13px 14px' }}>
        {/* Original — click to copy */}
        <div
          onClick={() => copy(template.body, 'orig-' + template.id)}
          title="Click to copy"
          style={{
            background: '#fff', padding: '12px 13px', borderRadius: 8,
            fontSize: 14, color: COLORS.text, lineHeight: 1.65, marginBottom: 10,
            cursor: 'copy', whiteSpace: 'pre-wrap', border: `1px solid ${COLORS.border}`
          }}
        >
          {template.body}
        </div>
        {copied === 'orig-' + template.id && (
          <div style={{ fontSize: 13, color: COLORS.success, marginBottom: 6, fontWeight: 800 }}>Copied</div>
        )}

        {/* Remix controls */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={community}
            onChange={e => setCommunity(e.target.value)}
            placeholder="Community (e.g. r/therapists)"
            style={{
              flex: 1, minWidth: 180, padding: '9px 11px', fontSize: 14,
              border: `1px solid ${COLORS.border}`, borderRadius: 8,
              fontFamily: 'inherit', background: '#fff'
            }}
          />
          <button
            onClick={handleRemix}
            disabled={generating}
            style={{
              padding: '10px 14px', fontSize: 14, fontWeight: 900,
              background: generating ? '#9CA3AF' : COLORS.primary,
              color: '#fff', border: 'none', borderRadius: 8,
              cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
            }}
          >
            {generating ? '⏳ Remixing...' : '↺ Get 3 remixes'}
          </button>
          {remixes.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                padding: '10px 12px', fontSize: 14, background: 'none',
                border: `1px solid ${COLORS.border}`, borderRadius: 8,
                cursor: 'pointer', color: COLORS.muted, fontFamily: 'inherit'
              }}
            >
              {expanded ? '▲ hide' : `▼ show ${remixes.length}`}
            </button>
          )}
        </div>

        {error && <div style={{ fontSize: 13, color: COLORS.error, marginTop: 8, fontWeight: 800 }}>{error}</div>}

        {/* Remixes */}
        {expanded && remixes.map((r, i) => (
          <div key={i} style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: COLORS.muted, marginBottom: 4 }}>
              Remix {i + 1}
            </div>
            <div
              onClick={() => copy(r, `remix-${template.id}-${i}`)}
              title="Click to copy"
              style={{
                background: '#F0FDF4', border: '1px solid #B8E5C8', borderRadius: 8,
                padding: '10px 12px', fontSize: 14, color: '#166534',
                lineHeight: 1.7, cursor: 'copy', whiteSpace: 'pre-wrap'
              }}
            >
              {r}
            </div>
            {copied === `remix-${template.id}-${i}` && (
              <div style={{ fontSize: 13, color: '#166534', marginTop: 4, fontWeight: 800 }}>Copied</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PostTemplatesPanel({ apiKey, preferredModel }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: '#fff', border: `1px solid ${COLORS.border}`,
      borderRadius: 8, marginBottom: 16, overflow: 'hidden',
      boxShadow: '0 10px 26px rgba(15, 23, 42, 0.06)'
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '16px 18px',
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit'
        }}
      >
        <div>
          <span style={{ fontSize: 17, fontWeight: 900 }}>Post templates + remix</span>
          <span style={{ fontSize: 13, color: COLORS.muted, marginLeft: 10, fontWeight: 700 }}>
            Phase 1 → Phase 2 → Reply scripts · click to copy · remix for each community
          </span>
        </div>
        <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 800 }}>{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '14px 16px' }}>
          <PhaseSection phase={1} templates={TEMPLATES.filter(t => t.phase === 1)} apiKey={apiKey} preferredModel={preferredModel} />
          <PhaseSection phase={2} templates={TEMPLATES.filter(t => t.phase === 2)} apiKey={apiKey} preferredModel={preferredModel} />
          <PhaseSection phase={0} templates={TEMPLATES.filter(t => t.phase === 0)} apiKey={apiKey} preferredModel={preferredModel} />
        </div>
      )}
    </div>
  );
}

export default PostTemplatesPanel;
