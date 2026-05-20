import React, { useState, useEffect } from 'react';
import { COLORS } from '../lib/constants';
import { CUSTOM_COMMUNITIES_STORAGE_KEY } from '../lib/communityRules';

export const COMMUNITIES = [
  // ── REDDIT ────────────────────────────────────────────────────────
  {
    platform: 'reddit', color: '#E05929', icon: '◉',
    name: 'r/therapists',
    url: 'https://reddit.com/r/therapists/new',
    size: '180k members', frequency: '1 reply / 3 days', safe: false,
    rule: 'ZERO product mentions — pure peer support only or instant ban',
    search: 'billing OR insurance OR "getting paid" OR "unbilled" OR credentialing',
    tip: 'Reply like a fellow therapist sharing what worked for you. Never say "we" or mention any company.',
  },
  {
    platform: 'reddit', color: '#E05929', icon: '◉',
    name: 'r/privatepractice',
    url: 'https://reddit.com/r/privatepractice/new',
    size: '45k members', frequency: '1 reply / 2 days', safe: true,
    rule: 'Tool mentions OK if genuinely helpful and not the main point',
    search: 'billing OR insurance OR EHR OR "claim denial" OR "ERA" OR revenue',
    tip: 'Best subreddit for eventually mentioning PracticeSight — members expect practical tool advice.',
  },
  {
    platform: 'reddit', color: '#E05929', icon: '◉',
    name: 'r/socialwork',
    url: 'https://reddit.com/r/socialwork/new',
    size: '120k members', frequency: '1 reply / 3 days', safe: false,
    rule: 'No promotion — Medicaid billing pain is very common here',
    search: 'billing OR Medicaid OR insurance OR "not getting paid" OR credentialing',
    tip: 'Social workers face brutal billing issues. Pure empathy and practical advice works.',
  },
  {
    platform: 'reddit', color: '#E05929', icon: '◉',
    name: 'r/psychotherapy',
    url: 'https://reddit.com/r/psychotherapy/new',
    size: '40k members', frequency: '1 reply / 3 days', safe: false,
    rule: 'Clinical discussion focus — billing pain posts do appear',
    search: 'billing OR insurance OR "private pay" OR "credentialing" OR EHR',
    tip: 'More clinical than r/therapists. Billing posts get fewer replies but are very targeted.',
  },
  {
    platform: 'reddit', color: '#E05929', icon: '◉',
    name: 'r/counseling',
    url: 'https://reddit.com/r/counseling/new',
    size: '25k members', frequency: '1 reply / week', safe: false,
    rule: 'No promotion — LPC/LPCC community',
    search: 'billing OR insurance OR "private practice" OR credentialing',
    tip: 'LPCs and LPCCs — credentialing and insurance pain is a regular topic.',
  },
  {
    platform: 'reddit', color: '#E05929', icon: '◉',
    name: 'r/LCSW',
    url: 'https://reddit.com/r/LCSW/new',
    size: '28k members', frequency: '1 reply / week', safe: false,
    rule: 'No promotion — focused community',
    search: 'billing OR insurance OR "panel" OR credentialing OR "getting reimbursed"',
    tip: 'Smaller but highly targeted. LCSWs deal with credentialing nightmares.',
  },
  {
    platform: 'reddit', color: '#E05929', icon: '◉',
    name: 'r/MFT',
    url: 'https://reddit.com/r/MFT/new',
    size: '8k members', frequency: '1 reply / week', safe: false,
    rule: 'No promotion — small tight community',
    search: 'billing OR insurance OR "private practice" OR "paneling"',
    tip: 'Marriage & Family Therapists. Small but billing complaints are frequent.',
  },
  {
    platform: 'reddit', color: '#E05929', icon: '◉',
    name: 'r/ABA',
    url: 'https://reddit.com/r/ABA/new',
    size: '18k members', frequency: '1 reply / week', safe: false,
    rule: 'No promotion — ABA billing is uniquely complex',
    search: 'billing OR insurance OR "prior auth" OR "claim" OR revenue',
    tip: 'ABA billing is the most complex in therapy — huge pain point.',
  },
  {
    platform: 'reddit', color: '#E05929', icon: '◉',
    name: 'r/medicalbilling',
    url: 'https://reddit.com/r/medicalbilling/new',
    size: '15k members', frequency: '1 reply / week', safe: true,
    rule: 'Tool mentions OK — billing professionals expect software discussion',
    search: 'therapy OR mental health OR SimplePractice OR ERA OR "claim denial"',
    tip: 'Billing professionals who work with therapy practices. More receptive to tool mentions.',
  },

  // ── FACEBOOK ─────────────────────────────────────────────────────
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'Therapists in Private Practice',
    search: 'Therapists in Private Practice',
    size: '200k+ members', frequency: '1 reply / day', safe: true,
    rule: 'More lenient — product mentions OK if genuinely helpful',
    tip: 'Most active therapy Facebook group. Search "billing" inside the group.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'Private Practice Therapists',
    search: 'Private Practice Therapists',
    size: '80k members', frequency: '1 reply / day', safe: true,
    rule: 'Product mentions OK in context',
    tip: 'Very active billing discussion threads. Good warm leads here.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'Therapist Entrepreneurs',
    search: 'Therapist Entrepreneurs',
    size: '60k members', frequency: '1-2 replies / day', safe: true,
    rule: 'Business tools welcome — most receptive audience',
    tip: 'Most open to tool recommendations. Business-minded practitioners.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'Private Practice Startup',
    search: 'Private Practice Startup',
    size: '40k members', frequency: '1 reply / day', safe: true,
    rule: 'New practice owners — very open to billing tools',
    tip: 'Fresh practices have the most billing pain. High conversion potential.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'Mental Health Private Practice Owners',
    search: 'Mental Health Private Practice Owners',
    size: '45k members', frequency: '1 reply / day', safe: true,
    rule: 'Business focus — billing tool mentions welcome',
    tip: 'Owners actively managing billing. High intent audience.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'SimplePractice Users Community',
    search: 'SimplePractice Users',
    size: '35k members', frequency: '1 reply / day', safe: true,
    rule: 'EHR-focused — billing add-ons very relevant here',
    tip: 'These are exactly your users. They know SimplePractice and are frustrated with its billing reporting.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'Insurance Billing for Therapists',
    search: 'Insurance Billing for Therapists',
    size: '30k members', frequency: '1-2 replies / day', safe: true,
    rule: 'Billing-specific group — tools are expected and welcome',
    tip: 'The most targeted group. These people are actively wrestling with insurance billing.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'The Group Practice Exchange',
    search: 'The Group Practice Exchange',
    size: '35k members', frequency: '1 reply / day', safe: true,
    rule: 'Group practice focus — billing across multiple clinicians',
    tip: 'Group practices have amplified billing pain — multiple clinicians, multiple payers.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'Counselors in Private Practice',
    search: 'Counselors in Private Practice',
    size: '25k members', frequency: '1 reply / day', safe: true,
    rule: 'LPC/LPCC community — product mentions OK with context',
    tip: 'Counselors starting private practice face heavy credentialing pain.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'Social Workers in Private Practice',
    search: 'Social Workers in Private Practice',
    size: '22k members', frequency: '1 reply / day', safe: false,
    rule: 'More guarded — build trust with pure value first',
    tip: 'LCSW private practice community. Medicaid billing pain is common.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'LMFT Private Practice Network',
    search: 'LMFT Private Practice Network',
    size: '18k members', frequency: '1 reply / 2 days', safe: true,
    rule: 'Collaborative tone — tools welcome if practical',
    tip: 'Marriage & Family Therapists. Paneling and credentialing frustrations are very common.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'Psychologists in Private Practice',
    search: 'Psychologists in Private Practice',
    size: '20k members', frequency: '1 reply / 2 days', safe: true,
    rule: 'Professional community — tools OK if framed clinically',
    tip: 'PhDs in private practice. High out-of-pocket mix but still deal with insurance.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'Private Practice Marketing for Therapists',
    search: 'Private Practice Marketing for Therapists',
    size: '28k members', frequency: '1-2 replies / day', safe: true,
    rule: 'Marketing and business tools welcome',
    tip: 'Growth-focused therapists. Frame billing efficiency as business optimization.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'Insurance Credentialing for Mental Health',
    search: 'Insurance Credentialing Mental Health Professionals',
    size: '20k members', frequency: '1 reply / day', safe: true,
    rule: 'Credentialing-focused — billing tool mentions very relevant',
    tip: 'Therapists in the paneling process. They will hit billing problems immediately after.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'ABA Therapy Business Owners',
    search: 'ABA Therapy Business Owners',
    size: '12k members', frequency: '1 reply / 2 days', safe: true,
    rule: 'Business owners — billing tools welcome',
    tip: 'ABA has the most complex billing in therapy. Very high pain, very open to solutions.',
  },
  {
    platform: 'facebook', color: '#1877F2', icon: 'f',
    name: 'Profitable Practice',
    search: 'Profitable Practice therapists',
    size: '15k members', frequency: '1 reply / 2 days', safe: true,
    rule: 'Revenue and billing focus — tools very welcome',
    tip: 'Revenue-focused group. Billing recovery tools are core to their mission.',
  },

  // ── X / TWITTER ────────────────────────────────────────────────────
  {
    platform: 'x', color: '#000', icon: '𝕏',
    name: '#therapist billing',
    url: 'https://twitter.com/search?q=%23therapist+billing+insurance&f=live',
    size: 'Live feed', frequency: 'Reply freely', safe: true,
    rule: 'Can mention tools — Twitter is lenient',
    tip: 'Search live for recent billing complaints. Replies pre-fill via button.',
  },
  {
    platform: 'x', color: '#000', icon: '𝕏',
    name: '#privatepractice',
    url: 'https://twitter.com/search?q=%23privatepractice+billing&f=live',
    size: 'Live feed', frequency: 'Reply freely', safe: true,
    rule: 'Professional tone — product mentions fine',
    tip: 'Active hashtag. Billing posts get good engagement.',
  },
  {
    platform: 'x', color: '#000', icon: '𝕏',
    name: '#therapistproblems billing',
    url: 'https://twitter.com/search?q=%23therapistproblems+billing+insurance&f=live',
    size: 'Live feed', frequency: 'Reply freely', safe: true,
    rule: 'Casual tone — empathy works well here',
    tip: 'Therapists venting about billing. Very warm leads.',
  },

  // ── LINKEDIN ───────────────────────────────────────────────────────
  {
    platform: 'linkedin', color: '#0A66C2', icon: 'in',
    name: 'Therapist billing posts',
    url: 'https://www.linkedin.com/search/results/content/?keywords=therapist%20billing%20insurance',
    size: 'Content search', frequency: 'Reply freely', safe: true,
    rule: 'Most lenient — professional product mentions are normal',
    tip: 'LinkedIn is the safest for mentioning PracticeSight directly.',
  },
  {
    platform: 'linkedin', color: '#0A66C2', icon: 'in',
    name: '#privatepractice feed',
    url: 'https://www.linkedin.com/search/results/content/?keywords=%23privatepractice+billing',
    size: 'Hashtag feed', frequency: 'Reply freely', safe: true,
    rule: 'Professional audience — tools welcome',
    tip: 'Therapists complaining about billing on LinkedIn are your warmest leads.',
  },
  {
    platform: 'linkedin', color: '#0A66C2', icon: 'in',
    name: 'Mental Health Professionals group',
    url: 'https://www.linkedin.com/search/results/groups/?keywords=mental+health+professionals+private+practice',
    size: 'Groups search', frequency: 'Reply freely', safe: true,
    rule: 'Professional group — tools welcome with business framing',
    tip: 'LinkedIn groups have less competition than Facebook. Easier to stand out.',
  },
];

function loadCustom() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_COMMUNITIES_STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveCustom(list) {
  localStorage.setItem(CUSTOM_COMMUNITIES_STORAGE_KEY, JSON.stringify(list));
}

const PLATFORM_META = {
  reddit:   { color: '#E05929', icon: '◉' },
  facebook: { color: '#1877F2', icon: 'f' },
  x:        { color: '#000',    icon: '𝕏' },
  linkedin: { color: '#0A66C2', icon: 'in' },
  other:    { color: '#7C3AED', icon: '◆' },
};

const BLANK_FORM = { name: '', platform: 'facebook', urlOrSearch: '', size: '', safe: true, tip: '' };

function CommunityRow({ c, onSelect, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const meta = PLATFORM_META[c.platform] || PLATFORM_META.other;

  const handleOpen = () => {
    if (c.platform === 'facebook' || (!c.url && c.search)) {
      window.open(
        `https://www.facebook.com/groups/search/?q=${encodeURIComponent(c.search || c.name)}`,
        '_blank', 'noopener,noreferrer'
      );
    } else if (c.url) {
      window.open(c.url, '_blank', 'noopener,noreferrer');
    }
    if (onSelect) onSelect(c.name, c.platform);
  };

  return (
    <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={handleOpen}
          style={{
            padding: '5px 12px', fontSize: 12, fontWeight: 700,
            background: (c.color || meta.color) + '15',
            color: (c.color || meta.color) === '#000' ? '#333' : (c.color || meta.color),
            border: `1px solid ${(c.color || meta.color)}30`,
            borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
            whiteSpace: 'nowrap', flexShrink: 0
          }}
        >
          {c.icon || meta.icon} {c.name} ↗
        </button>

        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
          background: c.safe ? '#E5F5EB' : '#FFF5EB',
          color: c.safe ? '#166534' : '#854F0B', flexShrink: 0
        }}>
          {c.safe ? '✓ can mention' : '⚠ no promotion'}
        </span>

        {c.custom && (
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 10,
            background: '#F3E8FF', color: '#7C3AED', fontWeight: 700, flexShrink: 0
          }}>custom</span>
        )}

        {c.size && <span style={{ fontSize: 11, color: COLORS.muted, flexShrink: 0 }}>{c.size}</span>}
        {c.frequency && <span style={{ fontSize: 11, color: COLORS.muted, flexShrink: 0 }}>· {c.frequency}</span>}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexShrink: 0 }}>
          {(c.rule || c.tip) && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                fontSize: 10, color: COLORS.muted, background: 'none',
                border: 'none', cursor: 'pointer', padding: '2px 6px'
              }}
            >
              {expanded ? '▲' : '▼ tips'}
            </button>
          )}
          {c.custom && onDelete && (
            <button
              onClick={() => onDelete(c.name)}
              style={{
                fontSize: 12, color: '#C44', background: 'none',
                border: 'none', cursor: 'pointer', padding: '2px 4px'
              }}
              title="Remove"
            >×</button>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 8, paddingLeft: 4 }}>
          {c.rule && (
            <div style={{
              fontSize: 11, color: '#555', marginBottom: 6,
              padding: '6px 10px', background: '#FFFBF0',
              borderLeft: '3px solid #F59E0B', borderRadius: '0 6px 6px 0'
            }}>
              <strong>Rule:</strong> {c.rule}
            </div>
          )}
          {c.tip && (
            <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>
              💡 {c.tip}
            </div>
          )}
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

function AddCommunityForm({ onSave, onCancel }) {
  const [form, setForm] = useState(BLANK_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      name: form.name.trim(),
      url: form.platform !== 'facebook' ? form.urlOrSearch.trim() : undefined,
      search: form.platform === 'facebook' ? form.urlOrSearch.trim() || form.name.trim() : undefined,
      color: PLATFORM_META[form.platform]?.color || '#7C3AED',
      icon: PLATFORM_META[form.platform]?.icon || '◆',
      custom: true,
    });
  };

  const inputStyle = {
    width: '100%', padding: '6px 9px', fontSize: 12,
    border: `1px solid ${COLORS.border}`, borderRadius: 6,
    fontFamily: 'inherit', boxSizing: 'border-box'
  };

  return (
    <div style={{
      padding: '14px 16px', background: '#FAFAF8',
      borderTop: `1px solid ${COLORS.border}`
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: COLORS.text }}>
        Add custom community
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input
          style={inputStyle}
          placeholder="Community name *"
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
        <select
          style={inputStyle}
          value={form.platform}
          onChange={e => set('platform', e.target.value)}
        >
          <option value="facebook">f Facebook</option>
          <option value="reddit">◉ Reddit</option>
          <option value="x">𝕏 X / Twitter</option>
          <option value="linkedin">in LinkedIn</option>
          <option value="other">◆ Other</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 8 }}>
        <input
          style={inputStyle}
          placeholder={form.platform === 'facebook' ? 'Search term (or leave blank)' : 'URL'}
          value={form.urlOrSearch}
          onChange={e => set('urlOrSearch', e.target.value)}
        />
        <input
          style={inputStyle}
          placeholder="Size (e.g. 20k)"
          value={form.size}
          onChange={e => set('size', e.target.value)}
        />
      </div>
      <input
        style={{ ...inputStyle, marginBottom: 8 }}
        placeholder="Tip / notes (optional)"
        value={form.tip}
        onChange={e => set('tip', e.target.value)}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.safe}
            onChange={e => set('safe', e.target.checked)}
          />
          Can mention PracticeSight
        </label>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleSave}
          disabled={!form.name.trim()}
          style={{
            padding: '6px 16px', fontSize: 12, fontWeight: 700,
            background: form.name.trim() ? COLORS.primary : '#9CA3AF',
            color: '#fff', border: 'none', borderRadius: 6,
            cursor: form.name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit'
          }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '6px 12px', fontSize: 12, background: 'none',
            border: `1px solid ${COLORS.border}`, borderRadius: 6,
            cursor: 'pointer', fontFamily: 'inherit', color: COLORS.muted
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function CommunitiesPanel({ onSelect }) {
  const [open, setOpen] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [safeFilter, setSafeFilter] = useState('all');
  const [customCommunities, setCustomCommunities] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setCustomCommunities(loadCustom());
  }, []);

  const allCommunities = [...COMMUNITIES, ...customCommunities];

  const filtered = allCommunities.filter(c => {
    if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
    if (safeFilter === 'safe' && !c.safe) return false;
    if (safeFilter === 'strict' && c.safe) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAdd = (entry) => {
    const updated = [...customCommunities, entry];
    setCustomCommunities(updated);
    saveCustom(updated);
    setShowAddForm(false);
  };

  const handleDelete = (name) => {
    const updated = customCommunities.filter(c => c.name !== name);
    setCustomCommunities(updated);
    saveCustom(updated);
  };

  const platforms = [
    { id: 'all', label: `All (${allCommunities.length})` },
    { id: 'reddit',   label: '◉ Reddit' },
    { id: 'facebook', label: 'f Facebook' },
    { id: 'x',        label: '𝕏 X' },
    { id: 'linkedin', label: 'in LinkedIn' },
  ];

  const btnStyle = (active) => ({
    padding: '4px 12px', fontSize: 11, fontWeight: 600,
    border: active ? '2px solid #111' : `1px solid ${COLORS.border}`,
    background: active ? '#111' : '#fff',
    color: active ? '#fff' : '#555',
    borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit'
  });

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
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>📍 Communities to Monitor</span>
          <span style={{ fontSize: 11, color: COLORS.muted }}>
            {allCommunities.length} total · click to open + fill source · ▼ tips = posting rules
          </span>
        </div>
        <span style={{ fontSize: 11, color: COLORS.muted }}>{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <>
          {/* Filter bar */}
          <div style={{
            borderTop: `1px solid ${COLORS.border}`,
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.bg, padding: '8px 16px'
          }}>
            {/* Platform tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {platforms.map(p => (
                <button key={p.id} onClick={() => setPlatformFilter(p.id)} style={btnStyle(platformFilter === p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
            {/* Safe filter + search */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setSafeFilter('all')} style={btnStyle(safeFilter === 'all')}>All rules</button>
              <button onClick={() => setSafeFilter('safe')} style={{ ...btnStyle(safeFilter === 'safe'), color: safeFilter === 'safe' ? '#fff' : '#166534', borderColor: safeFilter === 'safe' ? '#111' : '#B8E5C8' }}>✓ Can mention</button>
              <button onClick={() => setSafeFilter('strict')} style={{ ...btnStyle(safeFilter === 'strict'), color: safeFilter === 'strict' ? '#fff' : '#854F0B', borderColor: safeFilter === 'strict' ? '#111' : '#F59E0B' }}>⚠ No promo only</button>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search communities..."
                style={{
                  flex: 1, minWidth: 120, padding: '4px 9px', fontSize: 11,
                  border: `1px solid ${COLORS.border}`, borderRadius: 20,
                  fontFamily: 'inherit', background: '#fff'
                }}
              />
              <button
                onClick={() => { setShowAddForm(true); setOpen(true); }}
                style={{
                  padding: '4px 12px', fontSize: 11, fontWeight: 700,
                  background: '#7C3AED', color: '#fff', border: 'none',
                  borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                + Add yours
              </button>
            </div>
          </div>

          {/* Count */}
          <div style={{ padding: '6px 16px', fontSize: 10, color: COLORS.muted, background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
            Showing {filtered.length} of {allCommunities.length} · ⚠ no promotion = cold peer-support reply · ✓ can mention = warm reply when ready
          </div>

          {/* List */}
          <div>
            {filtered.length === 0 ? (
              <div style={{ padding: '20px 16px', fontSize: 12, color: COLORS.muted, textAlign: 'center' }}>
                No communities match — try clearing the filter
              </div>
            ) : (
              filtered.map(c => (
                <CommunityRow key={c.name} c={c} onSelect={onSelect} onDelete={c.custom ? handleDelete : null} />
              ))
            )}
          </div>

          {/* Add form */}
          {showAddForm && (
            <AddCommunityForm
              onSave={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default CommunitiesPanel;
