import React, { useState } from 'react';
import { COLORS } from '../lib/constants';

export function SettingsPanel({ settings, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} style={{
        padding: '8px 14px', border: 'none', background: '#F5F4F0',
        color: '#555', borderRadius: 20, fontSize: 12,
        fontWeight: 600, cursor: 'pointer'
      }}>
        ⚙ Settings
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={() => setIsOpen(false)} style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.4)', zIndex: 999
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#fff', borderRadius: 16, padding: 24,
        width: '90%', maxWidth: 460, zIndex: 1000,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 20
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Settings</div>
          <button onClick={() => setIsOpen(false)} style={{
            border: 'none', background: 'none', color: COLORS.muted,
            cursor: 'pointer', fontSize: 20, lineHeight: 1
          }}>×</button>
        </div>

        {/* OpenRouter API Key */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            fontSize: 11, color: '#888', display: 'block',
            marginBottom: 4, fontWeight: 600, textTransform: 'uppercase'
          }}>
            OpenRouter API Key
          </label>
          <input
            type="password"
            placeholder="sk-or-v1-..."
            value={settings.openrouterApiKey || ''}
            onChange={(e) => onUpdate('openrouterApiKey', e.target.value)}
            style={{
              width: '100%', padding: '8px 10px',
              border: '1px solid #ddd', borderRadius: 6,
              fontSize: 12, boxSizing: 'border-box', fontFamily: 'monospace'
            }}
          />
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>
            Free at openrouter.ai · uses Llama 3.2 · $0 cost · stored locally
          </div>
        </div>

        {/* Max replies per day */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            fontSize: 11, color: '#888', display: 'block',
            marginBottom: 4, fontWeight: 600, textTransform: 'uppercase'
          }}>
            Max replies/day (personal reminder)
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={settings.maxPostsPerDay || 3}
            onChange={(e) => onUpdate('maxPostsPerDay', +e.target.value)}
            style={{
              width: '100%', padding: '8px 10px',
              border: '1px solid #ddd', borderRadius: 6,
              fontSize: 12, boxSizing: 'border-box'
            }}
          />
        </div>

        <button onClick={() => setIsOpen(false)} style={{
          width: '100%', padding: 12, background: COLORS.primary,
          color: '#fff', border: 'none', borderRadius: 9,
          cursor: 'pointer', fontSize: 14, fontWeight: 600
        }}>
          Save & Close
        </button>
      </div>
    </>
  );
}

export default SettingsPanel;
