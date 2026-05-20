import React, { useState } from 'react';
import { COLORS } from '../lib/constants';

// Research-backed: best communities + rules to avoid bans
export const COMMUNITIES = [
  {
    platform: 'reddit',
    color: '#E05929',
    icon: '◉',
    name: 'r/therapists',
    url: 'https://reddit.com/r/therapists/new',
    size: '180k members',
    frequency: '1 reply / 3 days',
    rule: 'ZERO product mentions — pure peer support only or instant ban',
    search: 'billing OR insurance OR "getting paid" OR "unbilled" OR credentialing',
    tip: 'Reply like a fellow therapist sharing what worked for you. Never say "we" or mention any company.',
    safe: false,
  },
  {
    platform: 'reddit',
    color: '#E05929',
    icon: '◉',
    name: 'r/privatepractice',
    url: 'https://reddit.com/r/privatepractice/new',
    size: '45k members',
    frequency: '1 reply / 2 days',
    rule: 'Tool mentions OK if genuinely helpful and not the main point',
    search: 'billing OR insurance OR EHR OR "claim denial" OR "ERA" OR revenue',
    tip: 'Best subreddit for eventually mentioning PracticeSight — members expect practical tool advice.',
    safe: true,
  },
  {
    platform: 'reddit',
    color: '#E05929',
    icon: '◉',
    name: 'r/socialwork',
    url: 'https://reddit.com/r/socialwork/new',
    size: '120k members',
    frequency: '1 reply / 3 days',
    rule: 'No promotion — Medicaid billing pain is very common here',
    search: 'billing OR Medicaid OR insurance OR "not getting paid" OR credentialing',
    tip: 'Social workers face brutal billing issues. Pure empathy and practical advice works.',
    safe: false,
  },
  {
    platform: 'reddit',
    color: '#E05929',
    icon: '◉',
    name: 'r/LCSW',
    url: 'https://reddit.com/r/LCSW/new',
    size: '28k members',
    frequency: '1 reply / week',
    rule: 'No promotion — focused community',
    search: 'billing OR insurance OR "panel" OR credentialing OR "getting reimbursed"',
    tip: 'Smaller but highly targeted. LCSWs deal with credentialing nightmares.',
    safe: false,
  },
  {
    platform: 'reddit',
    color: '#E05929',
    icon: '◉',
    name: 'r/ABA',
    url: 'https://reddit.com/r/ABA/new',
    size: '18k members',
    frequency: '1 reply / week',
    rule: 'No promotion — ABA billing is uniquely complex',
    search: 'billing OR insurance OR "prior auth" OR "claim" OR revenue',
    tip: 'ABA billing is the most complex in therapy — huge pain point.',
    safe: false,
  },
  {
    platform: 'facebook',
    color: '#1877F2',
    icon: 'f',
    name: 'Therapists in Private Practice',
    search: 'Therapists in Private Practice',
    size: '200k+ members',
    frequency: '1 reply / day',
    rule: 'More lenient — product mentions OK if genuinely helpful',
    tip: 'Most active therapy Facebook group. Search "billing" inside the group.',
    safe: true,
  },
  {
    platform: 'facebook',
    color: '#1877F2',
    icon: 'f',
    name: 'Private Practice Therapists',
    search: 'Private Practice Therapists',
    size: '80k members',
    frequency: '1 reply / day',
    rule: 'Product mentions OK in context',
    tip: 'Very active billing discussion threads. Good warm leads here.',
    safe: true,
  },
  {
    platform: 'facebook',
    color: '#1877F2',
    icon: 'f',
    name: 'Therapist Entrepreneurs',
    search: 'Therapist Entrepreneurs',
    size: '60k members',
    frequency: '1-2 replies / day',
    rule: 'Business tools welcome — most receptive audience',
    tip: 'Most open to tool recommendations. Business-minded practitioners.',
    safe: true,
  },
  {
    platform: 'facebook',
    color: '#1877F2',
    icon: 'f',
    name: 'Private Practice Startup',
    search: 'Private Practice Startup',
    size: '40k members',
    frequency: '1 reply / day',
    rule: 'New practice owners — very open to billing tools',
    tip: 'Fresh practices have the most billing pain. High conversion potential.',
    safe: true,
  },
  {
    platform: 'x',
    color: '#000',
    icon: '𝕏',
    name: '#therapist billing',
    url: 'https://twitter.com/search?q=%23therapist+billing+insurance&f=live',
    size: 'Live feed',
    frequency: 'Reply freely',
    rule: 'Can mention tools — Twitter is lenient',
    tip: 'Search live for recent billing complaints. Replies pre-fill via button.',
    safe: true,
  },
  {
    platform: 'x',
    color: '#000',
    icon: '𝕏',
    name: '#privatepractice',
    url: 'https://twitter.com/search?q=%23privatepractice+billing&f=live',
    size: 'Live feed',
    frequency: 'Reply freely',
    rule: 'Professional tone — product mentions fine',
    tip: 'Active hashtag. Billing posts get good engagement.',
    safe: true,
  },
  {
    platform: 'linkedin',
    color: '#0A66C2',
    icon: 'in',
    name: 'Therapist billing posts',
    url: 'https://www.linkedin.com/search/results/content/?keywords=therapist%20billing%20insurance',
    size: 'Content search',
    frequency: 'Reply freely',
    rule: 'Most lenient — professional product mentions are normal',
    tip: 'LinkedIn is the safest for mentioning PracticeSight directly.',
    safe: true,
  },
  {
    platform: 'linkedin',
    color: '#0A66C2',
    icon: 'in',
    name: '#privatepractice feed',
    url: 'https://www.linkedin.com/search/results/content/?keywords=%23privatepractice+billing',
    size: 'Hashtag feed',
    frequency: 'Reply freely',
    rule: 'Professional audience — tools welcome',
    tip: 'Therapists complaining about billing on LinkedIn are your warmest leads.',
    safe: true,
  },
];

function CommunityRow({ c, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  const handleOpen = () => {
    if (c.platform === 'facebook') {
      window.open(
        `https://www.facebook.com/groups/search/?q=${encodeURIComponent(c.search)}`,
        '_blank', 'noopener,noreferrer'
      );
    } else {
      window.open(c.url, '_blank', 'noopener,noreferrer');
    }
    if (onSelect) onSelect(c.name, c.platform);
  };

  return (
    <div style={{
      borderBottom: `1px solid ${COLORS.border}`,
      padding: '10px 16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Open button */}
        <button
          onClick={handleOpen}
          style={{
            padding: '5px 12px', fontSize: 12, fontWeight: 700,
            background: c.color + '15',
            color: c.color === '#000' ? '#333' : c.color,
            border: `1px solid ${c.color}30`,
            borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
            whiteSpace: 'nowrap', flexShrink: 0
          }}
        >
          {c.icon} {c.name} ↗
        </button>

        {/* Safe badge */}
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          background: c.safe ? '#E5F5EB' : '#FFF5EB',
          color: c.safe ? '#166534' : '#854F0B',
          flexShrink: 0
        }}>
          {c.safe ? '✓ can mention product' : '⚠ no promotion'}
        </span>

        <span style={{ fontSize: 11, color: COLORS.muted, flexShrink: 0 }}>{c.size}</span>
        <span style={{ fontSize: 11, color: COLORS.muted, flexShrink: 0 }}>· max {c.frequency}</span>

        {/* Expand tips */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginLeft: 'auto', fontSize: 10, color: COLORS.muted,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '2px 6px', flexShrink: 0
          }}
        >
          {expanded ? '▲' : '▼ tips'}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 8, paddingLeft: 4 }}>
          <div style={{
            fontSize: 11, color: '#555', marginBottom: 6,
            padding: '6px 10px', background: '#FFFBF0',
            borderLeft: '3px solid #F59E0B', borderRadius: '0 6px 6px 0'
          }}>
            <strong>Rule:</strong> {c.rule}
          </div>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>
            💡 {c.tip}
          </div>
          {c.search && (
            <div style={{
              fontSize: 10, fontFamily: 'monospace', color: COLORS.muted,
              padding: '4px 8px', background: COLORS.bg, borderRadius: 4
            }}>
              Search: {c.search}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CommunitiesPanel({ onSelect }) {
  const [open, setOpen] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('all');

  const platforms = [
    { id: 'all', label: 'All' },
    { id: 'reddit', label: '◉ Reddit' },
    { id: 'facebook', label: 'f Facebook' },
    { id: 'x', label: '𝕏 X' },
    { id: 'linkedin', label: 'in LinkedIn' },
  ];

  const filtered = platformFilter === 'all'
    ? COMMUNITIES
    : COMMUNITIES.filter(c => c.platform === platformFilter);

  return (
    <div style={{
      background: '#fff', border: `1px solid ${COLORS.border}`,
      borderRadius: 12, marginBottom: 16, overflow: 'hidden'
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', padding: '12px 16px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>📍 Communities to Monitor</span>
          <span style={{ fontSize: 11, color: COLORS.muted }}>
            Click any → opens + fills Source · ▼ tips shows posting rules
          </span>
        </div>
        <span style={{ fontSize: 11, color: COLORS.muted }}>{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <>
          {/* Platform filter */}
          <div style={{
            display: 'flex', gap: 6, padding: '8px 16px',
            borderTop: `1px solid ${COLORS.border}`,
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.bg
          }}>
            {platforms.map(p => (
              <button
                key={p.id}
                onClick={() => setPlatformFilter(p.id)}
                style={{
                  padding: '4px 12px', fontSize: 11, fontWeight: 600,
                  border: platformFilter === p.id ? '2px solid #111' : `1px solid ${COLORS.border}`,
                  background: platformFilter === p.id ? '#111' : '#fff',
                  color: platformFilter === p.id ? '#fff' : '#555',
                  borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                {p.label}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 10, color: COLORS.muted, alignSelf: 'center' }}>
              ⚠ no promotion = use cold reply · ✓ can mention = warm reply when ready
            </span>
          </div>

          {/* Community list */}
          <div>
            {filtered.map(c => (
              <CommunityRow key={c.name} c={c} onSelect={onSelect} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CommunitiesPanel;
