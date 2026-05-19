import React from 'react';
import { STAGES, COLORS } from '../lib/constants';
import LeadCard from './LeadCard';

export function PipelineView({ leads, onUpdate, onDelete, onReply, filter = 'all' }) {
  const filteredLeads = filter === 'all' ? leads : leads.filter(l => l.stage === filter);

  return (
    <div style={{
      display: filter === 'all' ? 'grid' : 'block',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '16px',
      marginBottom: '20px'
    }}>
      {STAGES.map(stage => {
        const stageLeads = filteredLeads.filter(l => l.stage === stage.id);

        // Only show columns in "all" filter
        if (filter !== 'all' && stage.id !== filter) return null;

        return (
          <div key={stage.id}>
            {/* Stage header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: `2px solid ${stage.color}`
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: stage.color,
                flexShrink: 0
              }} />
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                color: stage.color
              }}>
                {stage.label}
              </span>
              <span style={{
                fontSize: '11px',
                color: COLORS.muted,
                fontFamily: 'monospace',
                marginLeft: 'auto'
              }}>
                {stageLeads.length}
              </span>
            </div>

            {/* Leads in this stage */}
            <div>
              {stageLeads.length === 0 ? (
                <div style={{
                  fontSize: '12px',
                  color: COLORS.muted,
                  textAlign: 'center',
                  padding: '20px 10px',
                  fontStyle: 'italic'
                }}>
                  —
                </div>
              ) : (
                stageLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onReply={onReply}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {filteredLeads.length === 0 && filter === 'all' && (
        <div style={{
          gridColumn: '1 / -1',
          textAlign: 'center',
          color: COLORS.muted,
          fontSize: '13px',
          paddingTop: '40px'
        }}>
          No leads yet. Paste one in the input field above.
        </div>
      )}
    </div>
  );
}

export default PipelineView;
