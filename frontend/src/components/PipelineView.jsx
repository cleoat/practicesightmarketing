import React from 'react';
import { STAGES, COLORS } from '../lib/constants';
import LeadCard from './LeadCard';

export function PipelineView({ leads, onUpdate, onDelete, onReply, onMarkPosted, filter = 'all', apiKey, preferredModel }) {
  const filteredLeads = filter === 'all' ? leads : leads.filter(l => l.stage === filter);

  return (
    <div style={{
      display: filter === 'all' ? 'grid' : 'block',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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
              marginBottom: 12,
              padding: '10px 12px',
              border: `1px solid ${stage.color}35`,
              borderLeft: `4px solid ${stage.color}`,
              borderRadius: 8,
              background: '#fff'
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: stage.color, flexShrink: 0
              }} />
              <span style={{ fontSize: 15, fontWeight: 900, color: stage.color }}>
                {stage.label}
              </span>
              <span style={{
                fontSize: 13, color: COLORS.muted,
                fontWeight: 900, marginLeft: 'auto'
              }}>
                {stageLeads.length}
              </span>
            </div>

            {/* Leads */}
            <div>
              {stageLeads.length === 0 ? (
                <div style={{
                  fontSize: 14, color: COLORS.muted,
                  textAlign: 'center', padding: '20px 10px', fontStyle: 'italic'
                }}>No leads</div>
              ) : (
                stageLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onReply={onReply}
                    onMarkPosted={onMarkPosted}
                    apiKey={apiKey}
                    preferredModel={preferredModel}
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
          <div style={{ fontSize: 18, fontWeight: 900, color: COLORS.text, marginBottom: 8 }}>
            No leads yet
          </div>
          <div style={{ fontSize: 15, color: COLORS.muted, lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
            Add the first billing conversation to start the pipeline.
          </div>
        </div>
      )}
    </div>
  );
}

export default PipelineView;
