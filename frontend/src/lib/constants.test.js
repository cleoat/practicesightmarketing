import { describe, it, expect } from 'vitest';
import { STAGES, COLORS, CHANNELS, DEFAULT_LEAD, SPAM_KEYWORDS } from './constants';

describe('STAGES', () => {
  it('has 7 stages', () => {
    expect(STAGES).toHaveLength(7);
  });

  it('every stage has id, label, color', () => {
    STAGES.forEach(s => {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('label');
      expect(s).toHaveProperty('color');
    });
  });

  it('stage ids are unique', () => {
    const ids = STAGES.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes saw_it and hot stages', () => {
    const ids = STAGES.map(s => s.id);
    expect(ids).toContain('saw_it');
    expect(ids).toContain('hot');
  });
});

describe('COLORS', () => {
  it('has all required color keys', () => {
    ['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'bg', 'border', 'muted', 'text'].forEach(key => {
      expect(COLORS).toHaveProperty(key);
    });
  });

  it('all values are hex color strings', () => {
    Object.values(COLORS).forEach(val => {
      expect(val).toMatch(/^#[0-9A-Fa-f]{3,6}$/);
    });
  });
});

describe('CHANNELS', () => {
  it('includes reddit and facebook', () => {
    expect(CHANNELS).toHaveProperty('reddit');
    expect(CHANNELS).toHaveProperty('facebook');
  });
});

describe('DEFAULT_LEAD', () => {
  it('has all required fields', () => {
    ['name', 'ch', 'comment', 'stage', 'reply', 'replyApproved', 'followUps', 'conversation', 'posted', 'postUrl'].forEach(key => {
      expect(DEFAULT_LEAD).toHaveProperty(key);
    });
  });

  it('defaults to reddit channel', () => {
    expect(DEFAULT_LEAD.ch).toBe('reddit');
  });

  it('defaults to saw_it stage', () => {
    expect(DEFAULT_LEAD.stage).toBe('saw_it');
  });

  it('followUps defaults to empty array', () => {
    expect(Array.isArray(DEFAULT_LEAD.followUps)).toBe(true);
    expect(DEFAULT_LEAD.followUps).toHaveLength(0);
  });

  it('conversation defaults to empty array', () => {
    expect(Array.isArray(DEFAULT_LEAD.conversation)).toBe(true);
    expect(DEFAULT_LEAD.conversation).toHaveLength(0);
  });
});

describe('SPAM_KEYWORDS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(SPAM_KEYWORDS)).toBe(true);
    expect(SPAM_KEYWORDS.length).toBeGreaterThan(0);
  });

  it('contains buy now and click here', () => {
    expect(SPAM_KEYWORDS).toContain('buy now');
    expect(SPAM_KEYWORDS).toContain('click here');
  });
});
