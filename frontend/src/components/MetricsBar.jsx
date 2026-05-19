import React from 'react';
import { COLORS } from '../lib/constants';

export function MetricsBar({ leads, redditStats }) {
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => ['warm', 'hot'].includes(l.stage)).length;
  const tested = leads.filter(l => ['testing', 'feedback'].includes(l.stage)).length;
  const posted = leads.filter(l => l.posted).length;

  const metrics = [
    { label: 'Total leads', value: totalLeads, color: COLORS.primary },
    { label: 'Hot leads', value: hotLeads, color: COLORS.error },
    { label: 'Tested it', value: tested, color: COLORS.success },
    { label: 'Posted today', value: redditStats?.postsToday || 0, color: COLORS.accent }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px',
      marginBottom: '20px'
    }}>
      {metrics.map(metric => (
        <div
          key={metric.label}
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '10px',
            padding: '14px',
            textAlign: 'center'
          }}
        >
          <div style={{
            fontSize: '11px',
            color: COLORS.muted,
            fontFamily: 'monospace',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.4px'
          }}>
            {metric.label}
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-1px',
            color: metric.color
          }}>
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MetricsBar;
