import React, { useEffect, useMemo, useState } from 'react';
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

function activityLabel(value) {
  const time = typeof value === 'number' ? value : activityTime(value);
  if (!time) return value?.lastImportedAt || value?.date || '';
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
  return text.length > 96 ? `${text.slice(0, 96)}...` : text;
}

function latestLeadText(lead) {
  const leadMessages = (lead.conversation || []).filter(message => message.role === 'lead');
  const text = leadMessages[leadMessages.length - 1]?.text || lead.comment || '';
  return text.replace(/\s+/g, ' ').trim();
}

function groupKey(lead) {
  return [
    lead.ch || 'other',
    lead.source || 'Unknown source',
    lead.threadKey || lead.threadUrl || threadSnippet(lead),
  ].join('|');
}

function stageMeta(stageId) {
  return STAGES.find(stage => stage.id === stageId) || STAGES[0];
}

function leadActionLabel(lead) {
  if (lead.stage === 'not_fit') return 'Not fit';
  if (!lead.reply || /^Error:/i.test(lead.reply)) return 'Draft';
  if (!(lead.replyApproved && lead.lastApprovedReply === lead.reply)) return 'Approve';
  if (!lead.posted) return 'Post';
  if (['warm', 'hot', 'testing'].includes(lead.stage)) return 'Follow up';
  return 'Watch';
}

function groupLeadsByThread(leads) {
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

function stageCounts(leads) {
  return STAGES
    .map(stage => ({ stage, count: leads.filter(lead => lead.stage === stage.id).length }))
    .filter(item => item.count > 0);
}

function actionCounts(leads) {
  return ['Draft', 'Approve', 'Post', 'Follow up', 'Watch', 'Not fit']
    .map(label => ({ label, count: leads.filter(lead => leadActionLabel(lead) === label).length }))
    .filter(item => item.count > 0);
}

function EmptyState({ text = 'No leads match this view.' }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '44px 20px',
      background: '#fff',
      border: `1px dashed ${COLORS.border}`,
      borderRadius: 8,
      color: COLORS.muted,
      fontSize: 15,
      fontWeight: 700,
      marginBottom: 20,
    }}>
      {text}
    </div>
  );
}

function Pill({ children, color = COLORS.muted, bg = '#fff' }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 7px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 900,
      color,
      background: bg,
      border: `1px solid ${color}25`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

function CompactLeadRow({ lead }) {
  const stage = stageMeta(lead.stage);
  const text = latestLeadText(lead);
  const action = leadActionLabel(lead);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 10,
      alignItems: 'center',
      padding: '9px 10px',
      borderTop: `1px solid ${COLORS.border}`,
      background: '#fff',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.name}
        </div>
        <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 800 }}>
          {activityLabel(lead)}
        </div>
      </div>
      <div style={{
        minWidth: 0,
        fontSize: 13,
        color: COLORS.text,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {text || 'No comment text'}
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Pill color={stage.color} bg={stage.color + '10'}>{stage.label}</Pill>
        <Pill color={action === 'Post' ? COLORS.accent : action === 'Draft' ? COLORS.secondary : action === 'Not fit' ? COLORS.muted : COLORS.warning}>
          {action}
        </Pill>
      </div>
    </div>
  );
}

function ThreadGroup({ group, expanded, onToggle, cardProps }) {
  const visibleRows = group.leads.slice(0, 6);
  const hiddenCount = Math.max(0, group.leads.length - visibleRows.length);

  return (
    <section style={{
      background: '#fff',
      border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 12,
      boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 12,
          alignItems: 'center',
          padding: '13px 14px',
          background: expanded ? '#F8FAFC' : '#fff',
          border: 'none',
          borderBottom: expanded || visibleRows.length ? `1px solid ${COLORS.border}` : 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', marginBottom: 5 }}>
            <Pill color={group.channel === 'facebook' ? '#1864AB' : group.channel === 'reddit' ? '#D9480F' : COLORS.secondary}>
              {group.channel}
            </Pill>
            <span style={{ fontSize: 16, fontWeight: 900, color: COLORS.text }}>
              {group.source}
            </span>
            <span style={{ fontSize: 12, fontWeight: 900, color: COLORS.muted }}>
              {group.leads.length} lead{group.leads.length === 1 ? '' : 's'}
            </span>
            {actionCounts(group.leads).map(item => (
              <Pill key={item.label} color={item.label === 'Not fit' ? COLORS.muted : COLORS.primary}>
                {item.label} {item.count}
              </Pill>
            ))}
          </div>
          <div style={{
            fontSize: 13,
            color: COLORS.muted,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {group.postAuthor ? `${group.postAuthor}: ` : ''}{group.snippet}
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 900, whiteSpace: 'nowrap' }}>
            {activityLabel(group.latest)}
          </span>
          <span style={{
            fontSize: 13,
            fontWeight: 900,
            color: expanded ? COLORS.muted : COLORS.secondary,
            whiteSpace: 'nowrap',
          }}>
            {expanded ? 'Hide cards' : 'Open cards'}
          </span>
        </div>
      </button>

      {!expanded && visibleRows.map(lead => <CompactLeadRow key={lead.id} lead={lead} />)}
      {!expanded && hiddenCount > 0 && (
        <div style={{
          padding: '8px 10px',
          borderTop: `1px solid ${COLORS.border}`,
          fontSize: 12,
          fontWeight: 900,
          color: COLORS.muted,
          background: '#F8FAFC',
        }}>
          {hiddenCount} more hidden in this thread
        </div>
      )}

      {expanded && (
        <div style={{ padding: 12, background: '#F8FAFC' }}>
          {group.leads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              {...cardProps}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ThreadsView({ leads, cardProps }) {
  const groups = useMemo(() => groupLeadsByThread(leads), [leads]);
  const groupKeyList = groups.map(group => group.key).join('||');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    setExpanded(current => {
      const activeKeys = new Set(groups.map(group => group.key));
      const next = Object.fromEntries(Object.entries(current).filter(([key]) => activeKeys.has(key)));
      if (!Object.values(next).some(Boolean) && groups[0]) next[groups[0].key] = true;
      return next;
    });
  }, [groupKeyList]);

  if (!leads.length) return <EmptyState />;

  const expandAll = () => setExpanded(Object.fromEntries(groups.map(group => [group.key, true])));
  const collapseAll = () => setExpanded({});

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 14, color: COLORS.muted, fontWeight: 800 }}>
          {groups.length} thread{groups.length === 1 ? '' : 's'} · {leads.length} lead{leads.length === 1 ? '' : 's'} · newest first
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={expandAll} style={smallButtonStyle()}>
            Expand all
          </button>
          <button onClick={collapseAll} style={smallButtonStyle()}>
            Collapse all
          </button>
        </div>
      </div>

      {groups.map(group => (
        <ThreadGroup
          key={group.key}
          group={group}
          expanded={Boolean(expanded[group.key])}
          onToggle={() => setExpanded(current => ({ ...current, [group.key]: !current[group.key] }))}
          cardProps={cardProps}
        />
      ))}
    </div>
  );
}

function FollowUpView({ leads, cardProps }) {
  const openLeads = [...leads]
    .filter(lead => lead.stage !== 'not_fit')
    .sort((a, b) => {
      const order = { Draft: 1, Approve: 2, Post: 3, 'Follow up': 4, Watch: 5 };
      return (order[leadActionLabel(a)] || 9) - (order[leadActionLabel(b)] || 9) || activityTime(b) - activityTime(a);
    });

  if (!openLeads.length) return <EmptyState text="No open follow-up work in this filter." />;

  return (
    <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
      {['Draft', 'Approve', 'Post', 'Follow up', 'Watch'].map(label => {
        const bucket = openLeads.filter(lead => leadActionLabel(lead) === label);
        if (!bucket.length) return null;

        return (
          <section key={label} style={{
            background: '#fff',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '11px 13px',
              background: '#F8FAFC',
              borderBottom: `1px solid ${COLORS.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              alignItems: 'center',
            }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: COLORS.text }}>{label}</div>
              <Pill>{bucket.length}</Pill>
            </div>
            {bucket.map(lead => <CompactLeadRow key={lead.id} lead={lead} />)}
            {bucket.slice(0, 1).map(lead => (
              <div key={`${lead.id}-card`} style={{ padding: 12, background: '#F8FAFC', borderTop: `1px solid ${COLORS.border}` }}>
                <LeadCard lead={lead} {...cardProps} />
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

function StagesView({ leads, filter, cardProps }) {
  const filteredLeads = filter === 'all' ? leads : leads.filter(lead => lead.stage === filter);

  if (!filteredLeads.length) return <EmptyState />;

  return (
    <div style={{
      display: filter === 'all' ? 'grid' : 'block',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: 16,
      marginBottom: 20,
    }}>
      {STAGES.map(stage => {
        const stageLeads = filteredLeads
          .filter(lead => lead.stage === stage.id)
          .sort((a, b) => activityTime(b) - activityTime(a));

        if (filter !== 'all' && stage.id !== filter) return null;

        return (
          <div key={stage.id}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 12,
              padding: '10px 12px',
              border: `1px solid ${stage.color}35`,
              borderLeft: `4px solid ${stage.color}`,
              borderRadius: 8,
              background: '#fff',
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: stage.color, flexShrink: 0,
              }} />
              <span style={{ fontSize: 15, fontWeight: 900, color: stage.color }}>
                {stage.label}
              </span>
              <span style={{
                fontSize: 13, color: COLORS.muted,
                fontWeight: 900, marginLeft: 'auto',
              }}>
                {stageLeads.length}
              </span>
            </div>

            {stageLeads.length === 0 ? (
              <div style={{
                fontSize: 14, color: COLORS.muted,
                textAlign: 'center', padding: '20px 10px', fontStyle: 'italic',
              }}>No leads</div>
            ) : (
              stageLeads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  {...cardProps}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

function smallButtonStyle() {
  return {
    padding: '8px 10px',
    fontSize: 13,
    fontWeight: 900,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    background: '#fff',
    color: COLORS.text,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
}

export function PipelineView({
  leads,
  onUpdate,
  onDelete,
  onReply,
  onMarkPosted,
  filter = 'all',
  viewMode = 'threads',
  apiKey,
  preferredModel,
}) {
  const filteredByStage = filter === 'all' ? leads : leads.filter(lead => lead.stage === filter);
  const cardProps = { onUpdate, onDelete, onReply, onMarkPosted, apiKey, preferredModel };

  if (viewMode === 'stages') {
    return <StagesView leads={leads} filter={filter} cardProps={cardProps} />;
  }

  if (viewMode === 'followup') {
    return <FollowUpView leads={filteredByStage} cardProps={cardProps} />;
  }

  return <ThreadsView leads={filteredByStage} cardProps={cardProps} />;
}

export { activityTime, groupLeadsByThread };

export default PipelineView;
