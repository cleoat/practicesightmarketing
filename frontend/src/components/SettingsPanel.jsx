import React, { useState } from 'react';
import { COLORS } from '../lib/constants';
import { getOpenRouterKeyIssue, normalizeOpenRouterKey, testOpenRouterKey } from '../lib/openrouter';

export function SettingsPanel({ settings, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [keyStatus, setKeyStatus] = useState('');
  const [keyStatusType, setKeyStatusType] = useState('info');

  const handleKeyChange = (value) => {
    onUpdate('openrouterApiKey', value);
    setKeyStatus('');
  };

  const handleKeyBlur = (value) => {
    const normalized = normalizeOpenRouterKey(value);
    if (normalized !== value) {
      onUpdate('openrouterApiKey', normalized);
    }
  };

  const handleTestKey = async () => {
    const issue = getOpenRouterKeyIssue(settings.openrouterApiKey);
    if (issue) {
      setKeyStatusType('error');
      setKeyStatus(issue);
      return;
    }

    setTesting(true);
    setKeyStatus('');
    try {
      const result = await testOpenRouterKey(settings.openrouterApiKey);
      setKeyStatusType('success');
      setKeyStatus(`Connected through ${result.model}`);
    } catch (error) {
      setKeyStatusType('error');
      setKeyStatus(error.message || 'OpenRouter key test failed');
    }
    setTesting(false);
  };

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
            onChange={(e) => handleKeyChange(e.target.value)}
            onBlur={(e) => handleKeyBlur(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px',
              border: '1px solid #ddd', borderRadius: 6,
              fontSize: 12, boxSizing: 'border-box', fontFamily: 'monospace'
            }}
          />
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>
            Use an OpenRouter key, not an OpenAI key. Stored locally in this browser.
          </div>
          <button
            onClick={handleTestKey}
            disabled={testing}
            style={{
              marginTop: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700,
              background: testing ? '#9CA3AF' : '#fff',
              color: testing ? '#fff' : COLORS.secondary,
              border: `1px solid ${testing ? '#9CA3AF' : COLORS.secondary}`,
              borderRadius: 6, cursor: testing ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit'
            }}
          >
            {testing ? 'Testing...' : 'Test OpenRouter key'}
          </button>
          {keyStatus && (
            <div style={{
              fontSize: 10, marginTop: 6, padding: '6px 8px', borderRadius: 6,
              background: keyStatusType === 'success' ? '#E5F5EB' : '#FFE5E5',
              color: keyStatusType === 'success' ? '#166534' : '#C44',
              lineHeight: 1.4
            }}>
              {keyStatus}
            </div>
          )}
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
