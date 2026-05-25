import React, { useEffect, useMemo, useState } from 'react';
import { COLORS } from '../lib/constants';
import { chatCompletion } from '../lib/openrouter';
import { communityToneGuidance, formatCommunityForPrompt, getCommunityRule, loadCustomCommunities } from '../lib/communityRules';
import { getCommunityPostStatus } from '../lib/communityPosts';
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
  'peer question that exposes whether they have a month-end system',
  'pain question about a specific thing that can slip through',
  'small proof or concrete example, then a soft ask',
];

function promptCommunityDetails(rule) {
  return [
    `Target: ${formatCommunityForPrompt(rule)}`,
    `Platform: ${rule.platform}`,
    `Rule: ${rule.rule || (rule.strict ? 'No product promotion.' : 'Product mention allowed only when context supports it.')}`,
    `Reminder: ${rule.tip || communityToneGuidance(rule)}`,
  ].join('\n');
}

function parseRemixes(text) {
  const matches = [...String(text || '').matchAll(/(?:^|\n)\s*(?:\*\*)?REMIX\s*\d+\s*:?(?:\*\*)?\s*\n([\s\S]*?)(?=\n\s*(?:\*\*)?REMIX\s*\d+\s*:|$)/gi)];
  if (matches.length) return matches.map(m => m[1].trim()).filter(Boolean);

  return String(text || '')
    .split(/\n{2,}/)
    .map(part => part.replace(/^[-*\d.\s]+/, '').trim())
    .filter(part => part.length > 20)
    .slice(0, 3);
}

function inferTemplatePain(body) {
  const text = body.toLowerCase();
  if (text.includes('simplepractice')) return 'getting a clear SimplePractice action list from reports';
  if (text.includes('denial')) return 'catching denials before they age out';
  if (text.includes('unbilled') || text.includes('never billed')) return 'finding sessions that were never billed';
  if (text.includes('month-end') || text.includes('month end')) return 'month-end billing review';
  return 'knowing whether billing is actually clean';
}

function buildLocalRemixes(body, communityRule) {
  const pain = inferTemplatePain(body);
  const isPhase2 = /practicesight\.pages\.dev/i.test(body);
  const allowProduct = isPhase2 && !communityRule.strict;
  const productLine = allowProduct
    ? 'I built PracticeSight for that exact check: export the SimplePractice reports, drag them in, and it points to what needs attention. practicesight.pages.dev'
    : '';

  if (communityRule.platform === 'reddit') {
    return [
      `For people doing their own insurance billing, how are you handling ${pain}? I am curious whether most people have a checklist, or if it is more of a gut-check when something feels off.`,
      `What is the one billing thing you trust least at month end: unbilled sessions, unpaid claims, payment posting, or deposits matching what was posted?`,
      productLine || `I keep coming back to this because the hard part is not knowing the reports exist. It is knowing what needs action before something gets old. How are you catching that now?`,
    ].filter(Boolean);
  }

  return [
    `For those doing your own billing in private practice, what does your ${pain} actually look like at the end of the month?`,
    `I am curious what people worry about most when reviewing billing: a missed session, an unpaid claim, payment posting, or the bank deposit not matching what was entered.`,
    productLine || `The part I keep hearing is that people have reports, but not always a clear "check this next" list. Do you use a routine for that or mostly know your numbers well?`,
  ].filter(Boolean);
}

async function callRemix(body, community, apiKey, preferredModel, allCommunities) {
  const isPhase2 = body.includes('practicesight.pages.dev');
  const communityRule = getCommunityRule(community, null, allCommunities);
  const target = formatCommunityForPrompt(communityRule);
  const productInstruction = isPhase2
    ? communityRule.strict
      ? 'This destination is no-promotion. Remove the link and convert the idea into a peer-support question.'
      : 'PracticeSight can be mentioned only after the pain is named. Keep practicesight.pages.dev once, naturally.'
    : 'NO product mention, NO links, NO company names — pure question or peer observation only';

  const prompt = `You are a therapist in private practice who does their own SimplePractice billing.
Your job is not to make generic marketing copy. Your job is to rewrite the original so it feels native to the exact group/subreddit.

ORIGINAL POST:
"${body}"

TARGET COMMUNITY: ${target}
COMMUNITY DETAILS:
${promptCommunityDetails(communityRule)}

NON-NEGOTIABLE RULE:
${productInstruction}

PSYCHOLOGY:
- The post should pull people toward a concrete billing pain: missed sessions, unpaid claims, denied claims, payment posting, bank deposit mismatch, or aging AR.
- If the audience is not clearly warm, do not pitch. Make them reveal the pain first.
- If PracticeSight is mentioned, it must feel like a useful next step, not a drive-by link.
- Do not use generic phrases like optimize, streamline, game changer, unlock, leverage, robust, or revolutionize.
- Do not sound like an ad, agency, vendor, or content marketer.
- No hashtags, emojis, hype, or exclamation marks.

Write 3 remixes. Each must take a different angle:
- Remix 1: ${REMIX_ANGLES[0]}
- Remix 2: ${REMIX_ANGLES[1]}
- Remix 3: ${REMIX_ANGLES[2]}

Each remix must:
- Open with a completely different first sentence
- Keep the specific billing topic from the original
- Sound like a real person typing in ${communityRule.platform === 'reddit' ? 'a subreddit' : 'a Facebook group'}
- Under 90 words
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

  return parseRemixes(result.text);
}

function PhaseSection({ phase, templates, apiKey, preferredModel, allCommunities, communityPosts, onMarkPosted }) {
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
      {templates.map(t => (
        <TemplateCard
          key={`${t.phase}-${t.id}-${t.title}`}
          template={t}
          apiKey={apiKey}
          preferredModel={preferredModel}
          allCommunities={allCommunities}
          communityPosts={communityPosts}
          onMarkPosted={onMarkPosted}
        />
      ))}
    </div>
  );
}

function communityOptionValue(community) {
  return `${community.platform}:${community.name}`;
}

function firstMatchingCommunity(template, allCommunities) {
  const targetText = template.communities.toLowerCase();
  return allCommunities.find(community => targetText.includes(community.name.toLowerCase()))
    || allCommunities.find(community => targetText.includes(community.platform))
    || allCommunities[0]
    || null;
}

function TemplateCard({ template, apiKey, preferredModel, allCommunities, communityPosts, onMarkPosted }) {
  const [remixes, setRemixes] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const defaultCommunity = firstMatchingCommunity(template, allCommunities);
  const [communityKey, setCommunityKey] = useState(defaultCommunity ? communityOptionValue(defaultCommunity) : '');

  useEffect(() => {
    if (!communityKey && defaultCommunity) setCommunityKey(communityOptionValue(defaultCommunity));
  }, [communityKey, defaultCommunity]);

  const selectedCommunity = allCommunities.find(community => communityOptionValue(community) === communityKey) || defaultCommunity;
  const communityRule = getCommunityRule(selectedCommunity?.name || template.communities, selectedCommunity?.platform, allCommunities);
  const postStatus = selectedCommunity ? getCommunityPostStatus(selectedCommunity, communityPosts) : null;

  const copy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const markPosted = (body, variant) => {
    if (!selectedCommunity || !onMarkPosted) return;
    onMarkPosted(selectedCommunity, {
      kind: 'post',
      templateId: template.id,
      templateTitle: template.title,
      phase: template.phase,
      variant,
      body,
    });
  };

  const handleRemix = async () => {
    const targetCommunity = selectedCommunity?.name || template.communities.split('·')[0].trim();
    const rule = getCommunityRule(targetCommunity, selectedCommunity?.platform, allCommunities);
    const hasProductMention = /PracticeSight|practicesight\.pages\.dev/i.test(template.body);
    if (hasProductMention && rule.strict) {
      setError(`${targetCommunity} is marked no-promotion. Use a Phase 1 template or choose a can-mention community.`);
      return;
    }
    if (!apiKey) {
      setRemixes(buildLocalRemixes(template.body, rule));
      setExpanded(true);
      setError('No OpenRouter key saved. Showing local targeted drafts.');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const results = await callRemix(
        template.body,
        targetCommunity,
        apiKey,
        preferredModel,
        allCommunities
      );
      if (!results.length) throw new Error('No remixes generated — try again');
      setRemixes(results);
      setExpanded(true);
    } catch (e) {
      const fallback = buildLocalRemixes(template.body, rule);
      setRemixes(fallback);
      setExpanded(true);
      setError(`${e.message || 'AI remix failed'} Showing local targeted drafts.`);
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

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 8,
          alignItems: 'center',
          marginBottom: 10,
        }}>
          <select
            value={communityKey}
            onChange={event => {
              setCommunityKey(event.target.value);
              setError('');
            }}
            style={{
              minWidth: 0,
              padding: '10px 11px',
              fontSize: 14,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              fontFamily: 'inherit',
              background: '#fff',
              color: COLORS.text,
            }}
          >
            {allCommunities.map(community => (
              <option key={communityOptionValue(community)} value={communityOptionValue(community)}>
                {community.platform === 'reddit' ? 'Reddit' : community.platform === 'facebook' ? 'Facebook' : community.platform} · {community.name}
              </option>
            ))}
          </select>

          <span style={{
            fontSize: 12,
            fontWeight: 900,
            color: postStatus?.postedToday ? COLORS.success : COLORS.muted,
            background: postStatus?.postedToday ? '#ECFDF5' : '#F8FAFC',
            border: `1px solid ${postStatus?.postedToday ? '#BBF7D0' : COLORS.border}`,
            padding: '9px 10px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
          }}>
            {postStatus?.label || 'Not posted yet'}
          </span>

          <button
            onClick={() => markPosted(template.body, 'original')}
            disabled={!selectedCommunity || !onMarkPosted}
            style={{
              padding: '10px 12px',
              fontSize: 13,
              fontWeight: 900,
              background: '#fff',
              color: selectedCommunity ? COLORS.primary : COLORS.muted,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              cursor: selectedCommunity ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            Mark posted
          </button>
        </div>

        <div style={{
          marginBottom: 10,
          padding: '8px 10px',
          borderRadius: 8,
          background: communityRule.strict ? '#FFF7ED' : '#F0FDF4',
          border: `1px solid ${communityRule.strict ? '#FED7AA' : '#BBF7D0'}`,
          color: communityRule.strict ? '#9A3412' : '#166534',
          fontSize: 12,
          lineHeight: 1.4,
          fontWeight: 800,
        }}>
          {communityRule.strict ? 'No-promotion target: keep this as a peer question.' : 'Can-mention target: mention PracticeSight only when the post earns it.'}
        </div>

        {/* Remix controls */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
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
            <button
              onClick={() => markPosted(r, `remix-${i + 1}`)}
              disabled={!selectedCommunity || !onMarkPosted}
              style={{
                marginTop: 6,
                padding: '8px 10px',
                fontSize: 13,
                fontWeight: 900,
                color: selectedCommunity ? COLORS.success : COLORS.muted,
                background: '#fff',
                border: `1px solid ${selectedCommunity ? COLORS.success : COLORS.border}`,
                borderRadius: 8,
                cursor: selectedCommunity ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
              }}
            >
              Mark this remix posted
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PostTemplatesPanel({ apiKey, preferredModel, communityPosts = [], onMarkPosted }) {
  const [open, setOpen] = useState(false);
  const [customCommunities, setCustomCommunities] = useState([]);

  useEffect(() => {
    setCustomCommunities(loadCustomCommunities());
  }, [open]);

  const allCommunities = useMemo(() => [...COMMUNITIES, ...customCommunities], [customCommunities]);

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
          <PhaseSection
            phase={1}
            templates={TEMPLATES.filter(t => t.phase === 1)}
            apiKey={apiKey}
            preferredModel={preferredModel}
            allCommunities={allCommunities}
            communityPosts={communityPosts}
            onMarkPosted={onMarkPosted}
          />
          <PhaseSection
            phase={2}
            templates={TEMPLATES.filter(t => t.phase === 2)}
            apiKey={apiKey}
            preferredModel={preferredModel}
            allCommunities={allCommunities}
            communityPosts={communityPosts}
            onMarkPosted={onMarkPosted}
          />
          <PhaseSection
            phase={0}
            templates={TEMPLATES.filter(t => t.phase === 0)}
            apiKey={apiKey}
            preferredModel={preferredModel}
            allCommunities={allCommunities}
            communityPosts={communityPosts}
            onMarkPosted={onMarkPosted}
          />
        </div>
      )}
    </div>
  );
}

export default PostTemplatesPanel;
