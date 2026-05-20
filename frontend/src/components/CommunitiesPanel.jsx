import React, { useEffect, useMemo, useState } from 'react';
import { COLORS } from '../lib/constants';
import { CUSTOM_COMMUNITIES_STORAGE_KEY } from '../lib/communityRules';

const VERIFIED_AT = 'May 20, 2026';

export const COMMUNITIES = [
  {
    platform: 'reddit', color: '#D9480F', icon: 'R',
    name: 'r/therapists',
    url: 'https://www.reddit.com/r/therapists/',
    verifiedAt: VERIFIED_AT,
    size: '203k members',
    frequency: '1 reply / 3 days',
    safe: false,
    rule: 'Strict professional community. Peer support only. No product names, links, DMs, or vendor framing.',
    search: 'billing OR insurance OR unbilled OR credentialing OR SimplePractice',
    tip: 'Use this for listening and pure support. Treat every reply like a colleague-to-colleague comment.',
  },
  {
    platform: 'reddit', color: '#D9480F', icon: 'R',
    name: 'r/privatepractice',
    url: 'https://www.reddit.com/r/privatepractice/',
    verifiedAt: VERIFIED_AT,
    size: 'Verified subreddit',
    frequency: '1 reply / 2 days',
    safe: true,
    rule: 'Business-focused community. Tool mentions may fit only after real context and value.',
    search: 'billing OR insurance OR EHR OR claims OR revenue',
    tip: 'Best built-in Reddit target for later-stage PracticeSight mentions.',
  },
  {
    platform: 'reddit', color: '#D9480F', icon: 'R',
    name: 'r/SimplePractice',
    url: 'https://www.reddit.com/r/SimplePractice/',
    verifiedAt: VERIFIED_AT,
    size: 'Verified subreddit',
    frequency: 'Monitor weekly',
    safe: true,
    rule: 'Product-specific subreddit. Stay useful and specific; do not spam links.',
    search: 'billing OR claims OR invoice OR payment OR managed billing',
    tip: 'Highly targeted when people are already talking about SimplePractice billing friction.',
  },
  {
    platform: 'reddit', color: '#D9480F', icon: 'R',
    name: 'r/SoloPrivatePractice',
    url: 'https://www.reddit.com/r/SoloPrivatePractice/',
    verifiedAt: VERIFIED_AT,
    size: 'Verified subreddit',
    frequency: 'Monitor weekly',
    safe: true,
    rule: 'Solo practice focus. Keep replies practical, modest, and non-salesy.',
    search: 'billing OR insurance OR claims OR SimplePractice',
    tip: 'Small but relevant. Useful for solo clinicians doing their own admin.',
  },
  {
    platform: 'reddit', color: '#D9480F', icon: 'R',
    name: 'r/socialwork',
    url: 'https://www.reddit.com/r/socialwork/',
    verifiedAt: VERIFIED_AT,
    size: 'Verified subreddit',
    frequency: '1 reply / 3 days',
    safe: false,
    rule: 'No promotion. Social work community, not a product channel.',
    search: 'billing OR Medicaid OR insurance OR reimbursement OR credentialing',
    tip: 'Good for empathy and practical process advice. Never mention PracticeSight here by default.',
  },
  {
    platform: 'reddit', color: '#D9480F', icon: 'R',
    name: 'r/counseling',
    url: 'https://www.reddit.com/r/counseling/',
    verifiedAt: VERIFIED_AT,
    size: 'Verified subreddit',
    frequency: 'Monitor weekly',
    safe: false,
    rule: 'No promotion. Keep replies broad, professional, and helpful.',
    search: 'billing OR insurance OR private practice OR credentialing',
    tip: 'Use for early trust-building only.',
  },
  {
    platform: 'reddit', color: '#D9480F', icon: 'R',
    name: 'r/LCSW',
    url: 'https://www.reddit.com/r/LCSW/',
    verifiedAt: VERIFIED_AT,
    size: 'Verified subreddit',
    frequency: 'Monitor weekly',
    safe: false,
    rule: 'No promotion. Focus on payer/process experience.',
    search: 'billing OR insurance OR panel OR credentialing OR reimbursement',
    tip: 'LCSWs often run into payer and paneling pain. Practical comments work best.',
  },
  {
    platform: 'reddit', color: '#D9480F', icon: 'R',
    name: 'r/ABA',
    url: 'https://www.reddit.com/r/ABA/',
    verifiedAt: VERIFIED_AT,
    size: 'Verified subreddit',
    frequency: 'Monitor weekly',
    safe: false,
    rule: 'No promotion. ABA billing is complex; lead with concrete experience.',
    search: 'billing OR insurance OR prior auth OR claim OR revenue',
    tip: 'A focused place to learn billing language and pain points before replying.',
  },
];

function loadCustom() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_COMMUNITIES_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustom(list) {
  localStorage.setItem(CUSTOM_COMMUNITIES_STORAGE_KEY, JSON.stringify(list));
}

const PLATFORM_META = {
  reddit: { color: '#D9480F', icon: 'R', label: 'Reddit' },
  facebook: { color: '#1864AB', icon: 'f', label: 'Facebook' },
  x: { color: '#111827', icon: 'X', label: 'X' },
  linkedin: { color: '#0A66C2', icon: 'in', label: 'LinkedIn' },
  other: { color: '#7C3AED', icon: '*', label: 'Other' },
};

const BLANK_FORM = {
  name: '',
  platform: 'facebook',
  url: '',
  size: '',
  safe: false,
  tip: '',
};

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function validateCommunity(form) {
  const url = form.url.trim();
  if (!form.name.trim()) return 'Name is required.';
  if (!url) return 'A direct group or community URL is required.';
  if (!isValidUrl(url)) return 'Use a full URL starting with https://.';

  const lower = url.toLowerCase();
  if (form.platform === 'facebook' && !lower.includes('facebook.com/groups/')) {
    return 'Facebook entries need a direct facebook.com/groups/ URL.';
  }
  if (form.platform === 'reddit' && !lower.includes('reddit.com/r/')) {
    return 'Reddit entries need a direct reddit.com/r/ URL.';
  }

  return '';
}

function CommunityRow({ c, onSelect, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const meta = PLATFORM_META[c.platform] || PLATFORM_META.other;

  const handleOpen = () => {
    if (c.url) window.open(c.url, '_blank', 'noopener,noreferrer');
    if (onSelect) onSelect(c.name, c.platform);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: 14,
      padding: '14px 16px',
      borderBottom: `1px solid ${COLORS.border}`,
      alignItems: 'center',
      background: '#fff',
    }}>
      <div style={{ minWidth: 0 }}>
        <button
          onClick={handleOpen}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 12px',
            fontSize: 14,
            fontWeight: 800,
            background: meta.color + '14',
            color: meta.color,
            border: `1px solid ${meta.color}35`,
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
            maxWidth: '100%',
          }}
        >
          <span>{c.icon || meta.icon}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
          <span aria-hidden="true">↗</span>
        </button>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <span style={{
            fontSize: 12,
            fontWeight: 800,
            padding: '4px 7px',
            borderRadius: 6,
            background: '#ECFDF5',
            color: COLORS.success,
          }}>
            verified link
          </span>
          <span style={{
            fontSize: 12,
            fontWeight: 800,
            padding: '4px 7px',
            borderRadius: 6,
            background: c.safe ? '#DBEAFE' : '#FEF3C7',
            color: c.safe ? COLORS.secondary : COLORS.warning,
          }}>
            {c.safe ? 'can mention later' : 'no promotion'}
          </span>
          {c.custom && (
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              padding: '4px 7px',
              borderRadius: 6,
              background: '#F3E8FF',
              color: '#7C3AED',
            }}>
              custom
            </span>
          )}
        </div>
      </div>

      <div style={{ color: COLORS.text, minWidth: 0 }}>
        <div style={{ fontSize: 14, lineHeight: 1.45, fontWeight: 700, marginBottom: 4 }}>
          {c.rule}
        </div>
        <div style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.45 }}>
          {c.tip}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8, fontSize: 12, color: COLORS.muted }}>
          {c.size && <span>{c.size}</span>}
          {c.frequency && <span>{c.frequency}</span>}
          <span>Verified {c.verifiedAt || 'manually'}</span>
        </div>
        {expanded && c.search && (
          <div style={{
            marginTop: 10,
            padding: '9px 10px',
            background: COLORS.bg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            fontSize: 13,
            color: COLORS.text,
            lineHeight: 1.4,
          }}>
            Search terms: {c.search}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
        {c.search && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: '8px 10px',
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.secondary,
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {expanded ? 'Hide' : 'Terms'}
          </button>
        )}
        {c.custom && onDelete && (
          <button
            onClick={() => onDelete(c.name)}
            style={{
              padding: '8px 10px',
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.error,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function AddCommunityForm({ onSave, onCancel }) {
  const [form, setForm] = useState(BLANK_FORM);
  const [error, setError] = useState('');
  const set = (key, value) => {
    setError('');
    setForm(current => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    const validation = validateCommunity(form);
    if (validation) {
      setError(validation);
      return;
    }

    const meta = PLATFORM_META[form.platform] || PLATFORM_META.other;
    onSave({
      name: form.name.trim(),
      platform: form.platform,
      url: form.url.trim(),
      size: form.size.trim() || 'Manual entry',
      safe: form.safe,
      tip: form.tip.trim() || 'User-verified community. Check group rules before mentioning PracticeSight.',
      rule: form.safe
        ? 'Manual verified link. Product mention allowed only if group rules and context support it.'
        : 'Manual verified link. Default to no-promotion until rules are confirmed.',
      verifiedAt: 'manual',
      color: meta.color,
      icon: meta.icon,
      custom: true,
    });
    setForm(BLANK_FORM);
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    background: '#fff',
    color: COLORS.text,
  };

  return (
    <div style={{
      padding: 16,
      background: '#F8FAFC',
      borderTop: `1px solid ${COLORS.border}`,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 10 }}>
        <input
          style={inputStyle}
          placeholder="Community name"
          value={form.name}
          onChange={event => set('name', event.target.value)}
        />
        <select
          style={inputStyle}
          value={form.platform}
          onChange={event => set('platform', event.target.value)}
        >
          <option value="facebook">Facebook</option>
          <option value="reddit">Reddit</option>
          <option value="linkedin">LinkedIn</option>
          <option value="x">X</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 10 }}>
        <input
          style={inputStyle}
          placeholder="Direct URL"
          value={form.url}
          onChange={event => set('url', event.target.value)}
        />
        <input
          style={inputStyle}
          placeholder="Size or note"
          value={form.size}
          onChange={event => set('size', event.target.value)}
        />
      </div>
      <input
        style={{ ...inputStyle, marginBottom: 10 }}
        placeholder="Reminder for this community"
        value={form.tip}
        onChange={event => set('tip', event.target.value)}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: COLORS.text }}>
          <input
            type="checkbox"
            checked={form.safe}
            onChange={event => set('safe', event.target.checked)}
          />
          Rules allow PracticeSight mentions
        </label>
        {error && <span style={{ color: COLORS.error, fontSize: 13, fontWeight: 700 }}>{error}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 800,
            background: COLORS.primary,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Save verified link
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 700,
            background: '#fff',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: COLORS.muted,
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

  const allCommunities = useMemo(() => [...COMMUNITIES, ...customCommunities], [customCommunities]);

  const filtered = allCommunities.filter(c => {
    if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
    if (safeFilter === 'safe' && !c.safe) return false;
    if (safeFilter === 'strict' && c.safe) return false;
    if (search && !`${c.name} ${c.rule} ${c.tip}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const platformCount = platform => allCommunities.filter(c => c.platform === platform).length;
  const platforms = [
    { id: 'all', label: `All ${allCommunities.length}` },
    { id: 'reddit', label: `Reddit ${platformCount('reddit')}` },
    { id: 'facebook', label: `Facebook ${platformCount('facebook')}` },
    { id: 'linkedin', label: `LinkedIn ${platformCount('linkedin')}` },
    { id: 'x', label: `X ${platformCount('x')}` },
  ];

  const handleAdd = entry => {
    const updated = [...customCommunities, entry];
    setCustomCommunities(updated);
    saveCustom(updated);
    setShowAddForm(false);
  };

  const handleDelete = name => {
    const updated = customCommunities.filter(c => c.name !== name);
    setCustomCommunities(updated);
    saveCustom(updated);
  };

  const btnStyle = active => ({
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 800,
    border: active ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
    background: active ? COLORS.primary : '#fff',
    color: active ? '#fff' : COLORS.text,
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  const noFacebookBuiltIns = platformFilter === 'facebook' && platformCount('facebook') === 0;

  return (
    <section style={{
      background: '#fff',
      border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
      marginBottom: 18,
      overflow: 'hidden',
      boxShadow: '0 10px 26px rgba(15, 23, 42, 0.06)',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 18px',
          background: '#fff',
          border: 'none',
          borderBottom: open ? `1px solid ${COLORS.border}` : 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, color: COLORS.text }}>Verified community targets</div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>
            Built-ins now require a working direct link. Facebook is manual-only until you add exact group URLs.
          </div>
        </div>
        <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 800 }}>{open ? 'Hide' : 'Show'}</span>
      </button>

      {open && (
        <>
          <div style={{ padding: 16, background: '#F8FAFC', borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {platforms.map(platform => (
                <button key={platform.id} onClick={() => setPlatformFilter(platform.id)} style={btnStyle(platformFilter === platform.id)}>
                  {platform.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setSafeFilter('all')} style={btnStyle(safeFilter === 'all')}>All rules</button>
              <button onClick={() => setSafeFilter('safe')} style={btnStyle(safeFilter === 'safe')}>Can mention</button>
              <button onClick={() => setSafeFilter('strict')} style={btnStyle(safeFilter === 'strict')}>No promotion</button>
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search target, rule, or note"
                style={{
                  flex: 1,
                  minWidth: 220,
                  padding: '10px 12px',
                  fontSize: 14,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  fontFamily: 'inherit',
                  background: '#fff',
                }}
              />
              <button
                onClick={() => { setShowAddForm(true); setOpen(true); }}
                style={{
                  padding: '10px 14px',
                  fontSize: 14,
                  fontWeight: 900,
                  background: COLORS.secondary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Add verified link
              </button>
            </div>
          </div>

          <div style={{
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 700,
            color: COLORS.muted,
            background: '#fff',
            borderBottom: `1px solid ${COLORS.border}`,
          }}>
            Showing {filtered.length} targets. Removed unverified Facebook guesses, private r/psychotherapy, banned r/MFT, and banned r/medicalbilling.
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 24, fontSize: 15, color: COLORS.muted, textAlign: 'center', lineHeight: 1.5 }}>
              {noFacebookBuiltIns
                ? 'No verified built-in Facebook groups. Add the exact facebook.com/groups URL after you confirm the group exists and rules allow outreach.'
                : 'No targets match the current filters.'}
            </div>
          ) : (
            filtered.map(c => (
              <CommunityRow key={`${c.platform}-${c.name}`} c={c} onSelect={onSelect} onDelete={c.custom ? handleDelete : null} />
            ))
          )}

          {showAddForm && (
            <AddCommunityForm
              onSave={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          )}
        </>
      )}
    </section>
  );
}

export default CommunitiesPanel;
