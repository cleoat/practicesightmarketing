import React from 'react';
import { STAGES, COLORS } from '../lib/constants';
import LeadCard from './LeadCard';

function activityTime(lead) {
  const values = [
    lead.lastImportedAt,
    lead.lastApprovedAt,
    lead.lastPostedAt,
    lead.importedAt,
    lead.date,
    ...(lead.conversation || []).map(message => message.at),
  ];

  return values.reduce((latest, value) => {
    const time = Date.parse(value || '');
    return Number.isFinite(time) && time > latest ? time : latest;
  }, 0);
}

function activityLabel(lead) {
  const time = activityTime(lead);
  if (!time) return lead.lastImportedAt || lead.date || '';
  return new Date(time).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function threadSnippet(lead) {
  const text = String(lead.postText || lead.threadUrl || '').replace(/\s+/g, ' ').trim();
  if (!text) return lead.threadUrl ? 'Linked thread' : 'Manual lead';
  return text.length > 86 ? `${text.slice(0, 86)}...` : text;
}

function groupKey(lead) {
  return [
    lead.ch || 'other',
    lead.source || 'Unknown source',
    lead.threadKey || lead.threadUrl || threadSnippet(lead),
  ].join('|');
}

function groupStageLeads(leads) {
  const groups = new Map();
  [...leads]
    .sort((a, b) => activityTime(b) - activityTime(a))
    .forEach(lead => {
      const key = groupKey(lead);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          source: lead.source || lead.ch || 'Unknown source',
          channel: lead.ch || 'other',
          postAuthor: lead.postAuthor || '',
          snippet: threadSnippet(lead),
          latest: activityTime(lead),
          leads: [],
        });
      }
      const group = groups.get(key);
      group.latest = Math.max(group.latest, activityTime(lead));
      group.leads.push(lead);
    });

  return [...groups.values()].sort((a, b) => b.latest - a.latest);
}

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
        const groupedLeads = groupStageLeads(stageLeads);

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
                groupedLeads.map(group => (
                  <div key={group.key} style={{ marginBottom: 14 }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) auto',
                      gap: 8,
                      alignItems: 'center',
                      marginBottom: 8,
                      padding: '8px 10px',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 8,
                      background: '#F8FAFC',
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          gap: 6,
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          marginBottom: 3,
                        }}>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 900,
                            color: group.channel === 'facebook' ? '#1864AB' : group.channel === 'reddit' ? '#D9480F' : COLORS.secondary,
                            textTransform: 'uppercase',
                          }}>
                            {group.channel}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 900, color: COLORS.text }}>
                            {group.source}
                          </span>
                          <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 800 }}>
                            {group.leads.length} lead{group.leads.length === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: COLORS.muted,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {group.postAuthor ? `${group.postAuthor}: ` : ''}{group.snippet}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: COLORS.muted,
                        whiteSpace: 'nowrap',
                      }}>
                        {activityLabel(group.leads[0])}
                      </div>
                    </div>
                    {group.leads.map(lead => (
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
                    ))}
                  </div>
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
