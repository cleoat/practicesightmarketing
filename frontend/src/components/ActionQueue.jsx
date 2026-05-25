import React from 'react';
import { COLORS } from '../lib/constants';
import { formatPostedAt, getCommunityPostStats } from '../lib/communityPosts';

function leadAction(lead) {
  if (lead.stage === 'not_fit') {
    return null;
  }

  const hasUsableReply = Boolean(lead.reply && !/^Error:/i.test(lead.reply));
  const approved = Boolean(lead.replyApproved && lead.lastApprovedReply === lead.reply);

  if (!hasUsableReply) {
    return {
      label: 'Draft',
      color: COLORS.secondary,
      detail: lead.stage === 'engaged'
        ? 'Ask a pain-finding question'
        : 'Generate the next response',
      priority: 1,
    };
  }
  if (!approved) {
    return {
      label: 'Approve',
      color: COLORS.primary,
      detail: 'Edit, approve, and save to thread',
      priority: 2,
    };
  }
  if (!lead.posted) {
    return {
      label: 'Post',
      color: COLORS.accent,
      detail: `Post in ${lead.source || lead.ch || 'source'}`,
      priority: 3,
    };
  }
  if (lead.stage === 'hot') {
    return {
      label: 'Check trial',
      color: COLORS.warning,
      detail: lead.nextFollowUpAt ? `Follow up ${lead.nextFollowUpAt}` : 'Ask if they were able to try it',
      priority: 4,
    };
  }
  if (lead.stage === 'testing') {
    return {
      label: 'Feedback',
      color: COLORS.success,
      detail: lead.nextFollowUpAt ? `Follow up ${lead.nextFollowUpAt}` : 'Ask what it found or missed',
      priority: 4,
    };
  }
  if (['warm', 'engaged'].includes(lead.stage)) {
    return {
      label: 'Watch',
      color: COLORS.warning,
      detail: lead.nextFollowUpAt ? `Follow up ${lead.nextFollowUpAt}` : 'Log their next response when it lands',
      priority: 5,
    };
  }
  return null;
}

export function getActionStats(leads, communityPosts = []) {
  const activeLeads = leads.filter(lead => lead.stage !== 'not_fit');
  const needsDraft = activeLeads.filter(lead => !lead.reply || /^Error:/i.test(lead.reply)).length;
  const needsApproval = activeLeads.filter(lead =>
    lead.reply &&
    !/^Error:/i.test(lead.reply) &&
    !(lead.replyApproved && lead.lastApprovedReply === lead.reply)
  ).length;
  const readyToPost = activeLeads.filter(lead =>
    lead.reply &&
    !/^Error:/i.test(lead.reply) &&
    lead.replyApproved &&
    lead.lastApprovedReply === lead.reply &&
    !lead.posted
  ).length;
  const followUps = activeLeads.filter(lead => lead.posted && ['warm', 'hot', 'testing'].includes(lead.stage)).length;
  const wins = leads.filter(lead => lead.stage === 'feedback').length;
  const postedCommunities = getCommunityPostStats(communityPosts).communitiesPostedToday;

  return { needsDraft, needsApproval, readyToPost, followUps, wins, postedCommunities };
}

export function ActionQueue({ leads, communityPosts = [] }) {
  const actions = leads
    .map(lead => ({ lead, action: leadAction(lead) }))
    .filter(item => item.action)
    .sort((a, b) => a.action.priority - b.action.priority)
    .slice(0, 5);

  const stats = getActionStats(leads, communityPosts);
  const communityStats = getCommunityPostStats(communityPosts);
  const blocks = [
    { label: 'Draft', value: stats.needsDraft, color: COLORS.secondary },
    { label: 'Approve', value: stats.needsApproval, color: COLORS.primary },
    { label: 'Post', value: stats.readyToPost, color: COLORS.accent },
    { label: 'Follow up', value: stats.followUps, color: COLORS.warning },
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
          CRM today
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
        <div style={{
          marginTop: 12,
          padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.14)',
          fontSize: 13,
          fontWeight: 800,
          color: '#E5E7EB',
        }}>
          {communityStats.communitiesPostedToday} target{plural(communityStats.communitiesPostedToday)} posted today
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
            <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>Draft, approve, post, then track the next response.</div>
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

        {communityStats.recent.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: COLORS.text, marginBottom: 8 }}>
              Recent community activity
            </div>
            <div style={{ display: 'grid', gap: 7 }}>
              {communityStats.recent.slice(0, 4).map(record => (
                <div key={record.id} style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: 8,
                  padding: '8px 10px',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  background: '#fff',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {record.communityName}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {record.templateTitle || (record.kind === 'reply' ? 'Lead reply' : 'Post')}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {formatPostedAt(record.postedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function plural(count) {
  return count === 1 ? '' : 's';
}

export default ActionQueue;
