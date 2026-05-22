import React from 'react';
import { COLORS } from '../lib/constants';

function leadAction(lead) {
  if (lead.stage === 'not_fit') {
    return null;
  }

  if (!lead.reply) {
    return { label: 'Draft reply', color: COLORS.secondary, detail: 'Generate a first response' };
  }
  if (!lead.posted) {
    return { label: 'Post reply', color: COLORS.accent, detail: 'Copy, open thread, then mark posted' };
  }
  if (!lead.followUps?.length && ['warm', 'hot', 'testing'].includes(lead.stage)) {
    return { label: 'Follow up', color: COLORS.warning, detail: 'Log their response or next comment' };
  }
  if (lead.stage === 'testing') {
    return { label: 'Ask feedback', color: COLORS.success, detail: 'Move toward feedback notes' };
  }
  return null;
}

export function getActionStats(leads) {
  const activeLeads = leads.filter(lead => lead.stage !== 'not_fit');
  const needsDraft = activeLeads.filter(lead => !lead.reply).length;
  const readyToPost = activeLeads.filter(lead => lead.reply && !lead.posted).length;
  const followUps = activeLeads.filter(lead => lead.posted && !lead.followUps?.length && ['warm', 'hot', 'testing'].includes(lead.stage)).length;
  const wins = leads.filter(lead => lead.stage === 'feedback').length;

  return { needsDraft, readyToPost, followUps, wins };
}

export function ActionQueue({ leads }) {
  const actions = leads
    .map(lead => ({ lead, action: leadAction(lead) }))
    .filter(item => item.action)
    .slice(0, 5);

  const stats = getActionStats(leads);
  const blocks = [
    { label: 'Draft', value: stats.needsDraft, color: COLORS.secondary },
    { label: 'Post', value: stats.readyToPost, color: COLORS.accent },
    { label: 'Follow up', value: stats.followUps, color: COLORS.warning },
    { label: 'Feedback', value: stats.wins, color: COLORS.success },
  ];

  return (
    <section style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
      gap: 14,
      marginBottom: 18,
    }}>
      <div style={{
        background: COLORS.primary,
        color: '#fff',
        borderRadius: 8,
        padding: 18,
        boxShadow: '0 14px 30px rgba(15, 23, 42, 0.16)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#BFDBFE', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
          Today
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1, marginBottom: 14 }}>
          Action queue
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {blocks.map(block => (
            <div key={block.label} style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 8,
              padding: 12,
            }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: block.color === COLORS.warning ? '#FBBF24' : '#fff' }}>
                {block.value}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#CBD5E1' }}>
                {block.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: '#fff',
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 10px 26px rgba(15, 23, 42, 0.06)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: COLORS.text }}>Next best moves</div>
            <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>Sorted from missing reply to posted follow-up.</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.muted }}>
            {actions.length || 0} active
          </div>
        </div>

        {actions.length === 0 ? (
          <div style={{
            padding: 18,
            border: `1px dashed ${COLORS.border}`,
            borderRadius: 8,
            color: COLORS.muted,
            fontSize: 15,
            textAlign: 'center',
          }}>
            No open actions. Add a lead or move posted replies into follow-up.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {actions.map(({ lead, action }) => (
              <div key={lead.id} style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(86px, 100px) minmax(0, 1fr) auto',
                gap: 10,
                alignItems: 'center',
                padding: '10px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                background: '#F8FAFC',
              }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: action.color,
                  background: '#fff',
                  border: `1px solid ${action.color}35`,
                  borderRadius: 6,
                  padding: '5px 7px',
                  textAlign: 'center',
                }}>
                  {action.label}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.name}
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {action.detail}
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.muted }}>
                  {lead.source || lead.ch}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ActionQueue;
