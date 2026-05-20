import React, { useState } from 'react';
import { COLORS } from '../lib/constants';

const REDDIT = [
  { name: 'r/therapists', url: 'https://reddit.com/r/therapists', desc: 'Billing & insurance frustration daily — best source' },
  { name: 'r/privatepractice', url: 'https://reddit.com/r/privatepractice', desc: 'Private practice owners dealing with insurance panels' },
  { name: 'r/socialwork', url: 'https://reddit.com/r/socialwork', desc: 'Medicaid billing, credentialing, underpayment' },
  { name: 'r/psychotherapy', url: 'https://reddit.com/r/psychotherapy', desc: 'Practice management and billing questions' },
  { name: 'r/LCSW', url: 'https://reddit.com/r/LCSW', desc: 'Licensure, insurance panels, billing pain' },
  { name: 'r/counseling', url: 'https://reddit.com/r/counseling', desc: 'LPCs struggling with billing and credentialing' },
  { name: 'r/ABA', url: 'https://reddit.com/r/ABA', desc: 'ABA billing is notoriously complex' },
];

const FACEBOOK = [
  { name: 'Therapists in Private Practice', search: 'Therapists in Private Practice' },
  { name: 'Private Practice Therapists', search: 'Private Practice Therapists' },
  { name: 'Therapist Entrepreneurs', search: 'Therapist Entrepreneurs' },
  { name: 'The Therapist Network', search: 'The Therapist Network' },
  { name: 'Thriving Therapists', search: 'Thriving Therapists' },
];

export function CommunitiesPanel({ onSelect }) {
  const [open, setOpen] = useState(true);

  const handleReddit = (r) => {
    window.open(r.url, '_blank', 'noopener,noreferrer');
    onSelect(r.name, 'reddit');
  };

  const handleFacebook = (g) => {
    window.open(
      `https://www.facebook.com/groups/search/?q=${encodeURIComponent(g.search)}`,
      '_blank', 'noopener,noreferrer'
    );
    onSelect(g.name, 'facebook');
  };

  return (
    <div style={{
      background: '#fff', border: `1px solid ${COLORS.border}`,
      borderRadius: 12, marginBottom: 16, overflow: 'hidden'
    }}>
      {/* Toggle header */}
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
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>📍 Communities to Monitor</span>
          <span style={{ fontSize: 11, color: COLORS.muted }}>
            Click any → opens in browser + fills Source below
          </span>
        </div>
        <span style={{ fontSize: 12, color: COLORS.muted }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${COLORS.border}` }}>

          {/* Reddit */}
          <div style={{ marginTop: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E05929', marginBottom: 8, letterSpacing: '0.4px' }}>
              ◉ REDDIT — search for "billing" "insurance" "unbilled" "credentialing"
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {REDDIT.map(r => (
                <button
                  key={r.name}
                  onClick={() => handleReddit(r)}
                  title={r.desc}
                  style={{
                    padding: '6px 12px', fontSize: 12, fontWeight: 600,
                    background: '#FFF5F2', color: '#C04010',
                    border: '1px solid #F5C5B0', borderRadius: 20,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  {r.name}
                  <span style={{ fontSize: 10, opacity: 0.7 }}>↗</span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 6 }}>
              Tip: Sort by "New" in each subreddit to find fresh complaints you can reply to first.
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${COLORS.border}`, marginBottom: 14 }} />

          {/* Facebook */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1877F2', marginBottom: 8, letterSpacing: '0.4px' }}>
              f FACEBOOK GROUPS — join and search within each group
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {FACEBOOK.map(g => (
                <button
                  key={g.name}
                  onClick={() => handleFacebook(g)}
                  title="Opens Facebook group search"
                  style={{
                    padding: '6px 12px', fontSize: 12, fontWeight: 600,
                    background: '#EEF3FF', color: '#1877F2',
                    border: '1px solid #BAD0F8', borderRadius: 20,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  {g.name}
                  <span style={{ fontSize: 10, opacity: 0.7 }}>↗</span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 6 }}>
              Tip: Must be logged into Facebook. Search "billing" or "insurance" inside each group.
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default CommunitiesPanel;
