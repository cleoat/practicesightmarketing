import React, { useState } from 'react';
import { STAGES, CHANNELS, COLORS } from '../lib/constants';

export function LeadCard({ lead, onUpdate, onDelete, onReply }) {
  const [showActions, setShowActions] = useState(false);
  const stage = STAGES.find(s => s.id === lead.stage);
  const channel = CHANNELS[lead.ch];

  const handleStageChange = (e) => {
    onUpdate(lead.id, { stage: e.target.value });
  };

  const handleDelete = () => {
    if (confirm(`Remove "${lead.name}"?`)) {
      onDelete(lead.id);
    }
  };

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${COLORS.border}`,
      borderLeft: `3px solid ${stage?.color || COLORS.muted}`,
      borderRadius: '11px',
      overflow: 'hidden',
      marginBottom: '8px'
    }}>
      {/* Header */}
      <div style={{
        background: stage?.color || COLORS.muted,
        color: '#fff',
        padding: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>
            {lead.name}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>
            <span style={{ marginRight: '8px' }}>
              {channel?.icon} {lead.ch}
            </span>
            · {lead.date}
          </div>
        </div>
        {lead.posted && (
          <div style={{
            fontSize: '10px',
            background: 'rgba(255,255,255,0.2)',
            padding: '3px 8px',
            borderRadius: '4px'
          }}>
            ✓ Posted
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '12px' }}>
        {/* Comment */}
        <div style={{
          background: COLORS.bg,
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '10px',
          fontSize: '12px',
          color: '#555',
          lineHeight: '1.5',
          fontStyle: 'italic'
        }}>
          "{lead.comment.slice(0, 100)}{lead.comment.length > 100 ? '...' : ''}"
        </div>

        {/* Reply (if exists) */}
        {lead.reply && (
          <div style={{
            background: '#F0FDF4',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '10px',
            fontSize: '11px',
            lineHeight: '1.5',
            color: '#166534',
            border: `1px solid #B8E5C8`
          }}>
            <strong>Reply:</strong> {lead.reply.slice(0, 100)}{lead.reply.length > 100 ? '...' : ''}
          </div>
        )}

        {/* Stage selector */}
        <select
          value={lead.stage}
          onChange={handleStageChange}
          style={{
            width: '100%',
            padding: '8px 10px',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'inherit',
            marginBottom: '10px',
            boxSizing: 'border-box'
          }}
        >
          {STAGES.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowActions(!showActions)}
            style={{
              flex: 1,
              padding: '8px',
              background: COLORS.secondary,
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            💬 Reply
          </button>
          <button
            onClick={handleDelete}
            style={{
              flex: 1,
              padding: '8px',
              background: '#FFE5E5',
              color: COLORS.error,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            ×
          </button>
        </div>

        {/* Reply input (if toggled) */}
        {showActions && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${COLORS.border}` }}>
            <textarea
              placeholder="Paste their next comment..."
              rows={2}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'inherit',
                marginBottom: '8px',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                  onReply(lead.id, e.target.value);
                  e.target.value = '';
                  setShowActions(false);
                }
              }}
            />
            <button
              onClick={(e) => {
                const textarea = e.currentTarget.parentElement.querySelector('textarea');
                onReply(lead.id, textarea.value);
                textarea.value = '';
                setShowActions(false);
              }}
              style={{
                width: '100%',
                padding: '6px',
                background: COLORS.success,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              ✓ Generate reply (Ctrl+Enter)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeadCard;
