import { describe, expect, it } from 'vitest';
import {
  appendConversationMessage,
  conversationForLead,
  conversationPromptContext,
  isLastConversationMessage,
  latestLeadMessage,
} from './conversation';

describe('conversationForLead', () => {
  it('builds a conversation from older lead fields', () => {
    const lead = {
      id: 1,
      name: 'Hallee',
      comment: 'Routine is important in billing.',
      date: 'May 21, 2026',
      followUps: ['I check aging weekly.'],
    };

    expect(conversationForLead(lead)).toEqual([
      { id: '1-initial', role: 'lead', text: 'Routine is important in billing.', at: 'May 21, 2026' },
      { id: '1-followup-0', role: 'lead', text: 'I check aging weekly.', at: '' },
    ]);
  });

  it('appends approved user replies without duplicating the last message', () => {
    const lead = {
      id: 2,
      name: 'Jethro',
      conversation: [
        { id: 'a', role: 'lead', text: 'I reconcile monthly.', at: 'May 21, 2026' },
      ],
    };

    const once = appendConversationMessage(lead, 'me', 'How do you catch missed sessions?', {
      now: new Date('2026-05-22T12:00:00Z').getTime(),
      at: 'May 22, 2026, 8:00 AM',
    });
    const twice = appendConversationMessage({ ...lead, conversation: once }, 'me', 'How do you catch missed sessions?', {
      now: new Date('2026-05-22T12:01:00Z').getTime(),
    });

    expect(once).toHaveLength(2);
    expect(twice).toHaveLength(2);
    expect(isLastConversationMessage({ conversation: once }, 'me', 'How do you catch missed sessions?')).toBe(true);
  });

  it('returns latest lead message and compact prompt context', () => {
    const lead = {
      name: 'Claire',
      conversation: [
        { id: '1', role: 'lead', text: 'I run days in AR.', at: '' },
        { id: '2', role: 'me', text: 'What do you look for first?', at: '' },
        { id: '3', role: 'lead', text: 'Anything over 60 days.', at: '' },
      ],
    };

    expect(latestLeadMessage(lead).text).toBe('Anything over 60 days.');
    expect(conversationPromptContext(lead)).toContain('You replied: What do you look for first?');
  });
});
