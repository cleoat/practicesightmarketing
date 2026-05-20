import React, { useState } from 'react';
import { COLORS } from '../lib/constants';

const COMMUNITIES = {
  reddit: {
    color: '#E05929',
    icon: '◉',
    label: 'REDDIT',
    tip: 'Sort by "New" — look for billing, insurance, credentialing frustration',
    items: [
      { name: 'r/therapists', url: 'https://reddit.com/r/therapists/new', desc: 'Billing & insurance complaints daily — best source' },
      { name: 'r/privatepractice', url: 'https://reddit.com/r/privatepractice/new', desc: 'Private practice owners vs insurance panels' },
      { name: 'r/socialwork', url: 'https://reddit.com/r/socialwork/new', desc: 'Medicaid billing, credentialing struggles' },
      { name: 'r/psychotherapy', url: 'https://reddit.com/r/psychotherapy/new', desc: 'Practice management and billing questions' },
      { name: 'r/LCSW', url: 'https://reddit.com/r/LCSW/new', desc: 'Insurance panels, billing pain' },
      { name: 'r/counseling', url: 'https://reddit.com/r/counseling/new', desc: 'LPCs and billing headaches' },
      { name: 'r/ABA', url: 'https://reddit.com/r/ABA/new', desc: 'ABA billing is notoriously complex' },
    ]
  },
  facebook: {
    color: '#1877F2',
    icon: 'f',
    label: 'FACEBOOK GROUPS',
    tip: 'Must be logged in — join the group first, then search "billing" or "insurance" inside',
    items: [
      { name: 'Therapists in Private Practice', search: 'Therapists in Private Practice' },
      { name: 'Private Practice Therapists', search: 'Private Practice Therapists' },
      { name: 'Therapist Entrepreneurs', search: 'Therapist Entrepreneurs' },
      { name: 'The Therapist Network', search: 'The Therapist Network' },
      { name: 'Thriving Therapists', search: 'Thriving Therapists' },
    ]
  },
  x: {
    color: '#000000',
    icon: '𝕏',
    label: 'X / TWITTER',
    tip: 'Click to search live posts — replies pre-fill automatically when you post',
    items: [
      { name: '#therapist billing', url: 'https://twitter.com/search?q=%23therapist+billing+insurance&f=live' },
      { name: '#privatepractice', url: 'https://twitter.com/search?q=%23privatepractice+billing&f=live' },
      { name: '#therapistlife insurance', url: 'https://twitter.com/search?q=%23therapistlife+insurance&f=live' },
      { name: '#LCSW billing', url: 'https://twitter.com/search?q=%23LCSW+billing&f=live' },
      { name: '#socialwork insurance', url: 'https://twitter.com/search?q=%23socialwork+insurance+billing&f=live' },
    ]
  },
  linkedin: {
    color: '#0A66C2',
    icon: 'in',
    label: 'LINKEDIN',
    tip: 'Search for posts about billing or credentialing — therapists complain here too',
    items: [
      { name: 'therapist billing posts', url: 'https://www.linkedin.com/search/results/content/?keywords=therapist%20billing%20insurance' },
      { name: 'private practice insurance', url: 'https://www.linkedin.com/search/results/content/?keywords=private%20practice%20insurance%20billing' },
      { name: 'mental health credentialing', url: 'https://www.linkedin.com/search/results/content/?keywords=mental%20health%20credentialing%20issues' },
      { name: '#privatepractice feed', url: 'https://www.linkedin.com/search/results/content/?keywords=%23privatepractice' },
    ]
  }
};

function CommunityButton({ label, color, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '5px 11px', fontSize: 12, fontWeight: 600,
        background: hovered ? color + '22' : color + '12',
        color: color === '#000000' ? '#333' : color,
        border: `1px solid ${color}44`,
        borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 4,
        transition: 'background 0.1s'
      }}
    >
      {label} <span style={{ fontSize: 10, opacity: 0.6 }}>↗</span>
    </button>
  );
}

export function CommunitiesPanel({ onSelect }) {
  const [open, setOpen] = useState(true);

  const openUrl = (url, channel, name) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    if (onSelect) onSelect(name, channel);
  };

  const openFacebook = (group, name) => {
    window.open(
      `https://www.facebook.com/groups/search/?q=${encodeURIComponent(group)}`,
      '_blank', 'noopener,noreferrer'
    );
    if (onSelect) onSelect(name, 'facebook');
  };

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
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>
            📍 Communities to Monitor
          </span>
          <span style={{ fontSize: 11, color: COLORS.muted }}>
            Reddit · Facebook · X · LinkedIn — click opens + fills Source
          </span>
        </div>
        <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600 }}>
          {open ? '▲ hide' : '▼ show'}
        </span>
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {Object.entries(COMMUNITIES).map(([key, platform], i) => (
            <div
              key={key}
              style={{
                padding: '12px 16px',
                borderBottom: i < Object.keys(COMMUNITIES).length - 1 ? `1px solid ${COLORS.border}` : 'none'
              }}
            >
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.5px',
                color: platform.color === '#000000' ? '#333' : platform.color,
                marginBottom: 7
              }}>
                {platform.icon} {platform.label}
                <span style={{ fontWeight: 400, color: COLORS.muted, marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>
                  — {platform.tip}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {platform.items.map(item => (
                  <CommunityButton
                    key={item.name}
                    label={item.name}
                    color={platform.color}
                    onClick={() =>
                      key === 'facebook'
                        ? openFacebook(item.search, item.name)
                        : openUrl(item.url, key, item.name)
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CommunitiesPanel;
