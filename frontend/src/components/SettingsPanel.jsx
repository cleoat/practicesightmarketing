import React, { useState } from 'react';
import { COLORS } from '../lib/constants';

export function SettingsPanel({ settings, onUpdate, backendUrl, onBackendUrlChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSettingChange = (key, value) => {
    onUpdate(key, value);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '8px 14px',
          border: 'none',
          background: '#F5F4F0',
          color: '#555',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        ⚙ Settings
      </button>
    );
  }

  return (
    <div style={{
      background: '#FFFBF0',
      border: `1px solid #F0D080`,
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '12px',
        borderBottom: `1px solid #F0D080`
      }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#555' }}>
          🛡️ Safety Settings
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            border: 'none',
            background: 'none',
            color: COLORS.muted,
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0'
          }}
        >
          ×
        </button>
      </div>

      {/* Settings grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '12px'
      }}>
        {/* Max posts per day */}
        <div>
          <label style={{
            fontSize: '11px',
            color: COLORS.muted,
            display: 'block',
            marginBottom: '4px',
            fontWeight: 600
          }}>
            Max posts/day
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={settings.maxPostsPerDay}
            onChange={(e) => handleSettingChange('maxPostsPerDay', +e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontSize: '12px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Min time between posts */}
        <div>
          <label style={{
            fontSize: '11px',
            color: COLORS.muted,
            display: 'block',
            marginBottom: '4px',
            fontWeight: 600
          }}>
            Min time between (secs)
          </label>
          <input
            type="number"
            min="1"
            max="300"
            value={settings.minSecondsBetweenPosts}
            onChange={(e) => handleSettingChange('minSecondsBetweenPosts', +e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontSize: '12px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Warmup days */}
        <div>
          <label style={{
            fontSize: '11px',
            color: COLORS.muted,
            display: 'block',
            marginBottom: '4px',
            fontWeight: 600
          }}>
            Warmup days (new account)
          </label>
          <input
            type="number"
            min="1"
            max="30"
            value={settings.minAccountAgeDays}
            onChange={(e) => handleSettingChange('minAccountAgeDays', +e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              fontSize: '12px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Rate limiting */}
        <div>
          <label style={{
            fontSize: '11px',
            color: COLORS.muted,
            display: 'block',
            marginBottom: '4px',
            fontWeight: 600
          }}>
            Rate limiting
          </label>
          <button
            onClick={() => handleSettingChange('rateLimit', !settings.rateLimit)}
            style={{
              width: '100%',
              padding: '6px',
              background: settings.rateLimit ? COLORS.success : '#FFE5E5',
              color: settings.rateLimit ? '#fff' : COLORS.error,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            {settings.rateLimit ? '✓ ON' : '⚠ OFF'}
          </button>
        </div>
      </div>

      {/* Backend URL */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          fontSize: '11px',
          color: COLORS.muted,
          display: 'block',
          marginBottom: '4px',
          fontWeight: 600
        }}>
          Backend URL (for Reddit posting)
        </label>
        <input
          type="text"
          placeholder="http://localhost:3000"
          value={backendUrl}
          onChange={(e) => onBackendUrlChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '6px',
            fontSize: '12px',
            boxSizing: 'border-box',
            fontFamily: 'monospace'
          }}
        />
        <div style={{
          fontSize: '10px',
          color: COLORS.muted,
          marginTop: '4px',
          fontStyle: 'italic'
        }}>
          Leave empty to disable Reddit posting
        </div>
      </div>

      {/* Info box */}
      <div style={{
        fontSize: '11px',
        color: '#666',
        background: '#fff',
        padding: '10px',
        borderRadius: '6px',
        lineHeight: '1.6'
      }}>
        <strong>Safety guardrails active:</strong> Spam filter, rate limiting, account warmup, engagement checks, relevance scoring. No post executes without passing all checks.
      </div>
    </div>
  );
}

export default SettingsPanel;
