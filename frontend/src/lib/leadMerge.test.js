import { describe, expect, it } from 'vitest';
import { findPotentialDuplicateGroups, mergeDuplicateLeads, mergeLeadIds } from './leadMerge';

describe('mergeDuplicateLeads', () => {
  it('merges duplicate leads from the same thread into one conversation', () => {
    const result = mergeDuplicateLeads([
      {
        id: 2,
        name: 'Hallee Nelson',
        ch: 'facebook',
        source: 'Mental Health Billing Support',
        threadKey: 'thread-1',
        comment: 'I check reports weekly.',
        stage: 'engaged',
        followUps: [],
        conversation: [{ id: '2-a', role: 'lead', text: 'I check reports weekly.', at: 'May 22, 2026' }],
      },
      {
        id: 1,
        name: 'Hallee Nelson',
        ch: 'facebook',
        source: 'Mental Health Billing Support',
        threadKey: 'thread-1',
        comment: 'I also review aging before month end.',
        stage: 'engaged',
        followUps: [],
        conversation: [{ id: '1-a', role: 'lead', text: 'I also review aging before month end.', at: 'May 23, 2026' }],
      },
    ]);

    expect(result.removed).toBe(1);
    expect(result.leads).toHaveLength(1);
    expect(result.leads[0].conversation.map(message => message.text)).toEqual([
      'I check reports weekly.',
      'I also review aging before month end.',
    ]);
  });

  it('does not merge the same person from different threads', () => {
    const result = mergeDuplicateLeads([
      { id: 2, name: 'Hallee Nelson', ch: 'facebook', source: 'Mental Health Billing Support', threadKey: 'thread-1', comment: 'First thread', stage: 'saw_it' },
      { id: 1, name: 'Hallee Nelson', ch: 'facebook', source: 'Mental Health Billing Support', threadKey: 'thread-2', comment: 'Second thread', stage: 'saw_it' },
    ]);

    expect(result.removed).toBe(0);
    expect(result.leads).toHaveLength(2);
  });

  it('surfaces possible duplicates when thread proof is missing', () => {
    const leads = [
      { id: 2, name: 'Hallee Nelson', ch: 'facebook', source: 'Mental Health Billing Support', comment: 'First comment', stage: 'saw_it' },
      { id: 1, name: 'Hallee Nelson', ch: 'facebook', source: 'Mental Health Billing Support', comment: 'Second comment', stage: 'saw_it' },
    ];

    const groups = findPotentialDuplicateGroups(leads);

    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Hallee Nelson');
    expect(groups[0].leadIds).toEqual([2, 1]);
  });

  it('merges a user-selected possible duplicate group', () => {
    const result = mergeLeadIds([
      { id: 2, name: 'Hallee Nelson', ch: 'facebook', source: 'Mental Health Billing Support', comment: 'First comment', stage: 'saw_it' },
      { id: 1, name: 'Hallee Nelson', ch: 'facebook', source: 'Mental Health Billing Support', comment: 'Second comment', stage: 'engaged' },
      { id: 3, name: 'Other Person', ch: 'facebook', source: 'Mental Health Billing Support', comment: 'Other', stage: 'saw_it' },
    ], [2, 1]);

    expect(result.removed).toBe(1);
    expect(result.leads).toHaveLength(2);
    expect(result.mergedLead.name).toBe('Hallee Nelson');
    expect(result.mergedLead.conversation.map(message => message.text)).toEqual(['First comment', 'Second comment']);
  });
});
