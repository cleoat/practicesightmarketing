import React from 'react';
import { COLORS } from '../lib/constants';
import { getActionStats } from './ActionQueue';

export function MetricsBar({ leads, redditStats }) {
  const totalLeads = leads.length;
  const activePain = leads.filter(l => ['warm', 'hot'].includes(l.stage)).length;
  const readyToPost = getActionStats(leads).readyToPost;
  const posted = leads.filter(l => l.posted).length;
  const feedback = leads.filter(l => l.stage === 'feedback').length;

  const metrics = [
    { label: 'Leads', value: totalLeads, color: COLORS.primary, note: 'tracked' },
    { label: 'Pain', value: activePain, color: COLORS.error, note: 'warm/hot' },
    { label: 'Ready', value: readyToPost, color: COLORS.accent, note: 'reply drafted' },
    { label: 'Posted', value: posted, color: COLORS.success, note: `${redditStats?.postsToday || 0} today` },
    { label: 'Feedback', value: feedback, color: '#7C3AED', note: 'won learning' }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: 12,
      marginBottom: 18
    }}>
      {metrics.map(metric => (
        <div
          key={metric.label}
          style={{
            background: '#fff',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            padding: 16,
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)'
          }}
        >
          <div style={{
            fontSize: 13,
            color: COLORS.muted,
            marginBottom: 6,
            fontWeight: 800
          }}>
            {metric.label}
          </div>
          <div style={{
            fontSize: 34,
            fontWeight: 900,
            color: metric.color
          }}>
            {metric.value}
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4, fontWeight: 700 }}>
            {metric.note}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MetricsBar;
