import React from 'react';
import { STAGES, COLORS } from '../lib/constants';
import LeadCard from './LeadCard';

export function PipelineView({ leads, onUpdate, onDelete, onReply, filter = 'all', apiKey }) {
  const filteredLeads = filter === 'all' ? leads : leads.filter(l => l.stage === filter);

  return (
    <div style={{
      display: filter === 'all' ? 'grid' : 'block',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 16,
      marginBottom: 20
    }}>
      {STAGES.map(stage => {
        const stageLeads = filteredLeads.filter(l => l.stage === stage.id);

        if (filter !== 'all' && stage.id !== filter) return null;

        return (
          <div key={stage.id}>
            {/* Stage header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 12, paddingBottom: 8,
              borderBottom: `2px solid ${stage.color}`
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: stage.color, flexShrink: 0
              }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: stage.color }}>
                {stage.label}
              </span>
              <span style={{
                fontSize: 11, color: COLORS.muted,
                fontFamily: 'monospace', marginLeft: 'auto'
              }}>
                {stageLeads.length}
              </span>
            </div>

            {/* Leads */}
            <div>
              {stageLeads.length === 0 ? (
                <div style={{
                  fontSize: 12, color: COLORS.muted,
                  textAlign: 'center', padding: '20px 10px', fontStyle: 'italic'
                }}>—</div>
              ) : (
                stageLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onReply={onReply}
                    apiKey={apiKey}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {filteredLeads.length === 0 && filter === 'all' && (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 8 }}>
            No leads yet
          </div>
          <div style={{ fontSize: 13, color: '#999', lineHeight: 1.7, maxWidth: 380, margin: '0 auto' }}>
            Find someone on Reddit or Facebook talking about billing or insurance issues.
            Paste their name and comment above, then click <strong>✨ Generate Reply</strong> to get an AI reply you can copy and post.
          </div>
        </div>
      )}
    </div>
  );
}

export default PipelineView;
