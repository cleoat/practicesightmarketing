import { describe, it, expect } from 'vitest';
import {
  leadSchema,
  settingsSchema,
  validateInput,
  sanitizeInput
} from './validators';

describe('leadSchema', () => {
  const valid = {
    name: 'Dr. Smith',
    ch: 'reddit',
    comment: 'Struggling with insurance billing for months',
    stage: 'warm',
    reply: '',
    posted: false,
    postUrl: ''
  };

  it('accepts a valid lead', () => {
    const result = validateInput(leadSchema, valid);
    expect(result.valid).toBe(true);
  });

  it('accepts empty postUrl', () => {
    const result = validateInput(leadSchema, { ...valid, postUrl: '' });
    expect(result.valid).toBe(true);
  });

  it('accepts a real URL as postUrl', () => {
    const result = validateInput(leadSchema, {
      ...valid,
      postUrl: 'https://reddit.com/r/therapy/comments/abc'
    });
    expect(result.valid).toBe(true);
  });

  it('rejects missing name', () => {
    const result = validateInput(leadSchema, { ...valid, name: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it('rejects comment shorter than 5 chars', () => {
    const result = validateInput(leadSchema, { ...valid, comment: 'hi' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/short/i);
  });

  it('rejects unknown stage', () => {
    const result = validateInput(leadSchema, { ...valid, stage: 'unknown' });
    expect(result.valid).toBe(false);
  });

  it('rejects unknown channel', () => {
    const result = validateInput(leadSchema, { ...valid, ch: 'tiktok' });
    expect(result.valid).toBe(false);
  });
});

describe('settingsSchema', () => {
  const valid = {
    maxPostsPerDay: 3,
    minSecondsBetweenPosts: 2,
    minAccountAgeDays: 7,
    rateLimit: true,
    backendUrl: ''
  };

  it('accepts valid settings', () => {
    expect(validateInput(settingsSchema, valid).valid).toBe(true);
  });

  it('rejects maxPostsPerDay above 10', () => {
    expect(validateInput(settingsSchema, { ...valid, maxPostsPerDay: 11 }).valid).toBe(false);
  });

  it('rejects maxPostsPerDay below 1', () => {
    expect(validateInput(settingsSchema, { ...valid, maxPostsPerDay: 0 }).valid).toBe(false);
  });

  it('accepts empty backendUrl', () => {
    expect(validateInput(settingsSchema, { ...valid, backendUrl: '' }).valid).toBe(true);
  });
});

describe('sanitizeInput', () => {
  it('removes angle brackets', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('caps at 5000 chars', () => {
    expect(sanitizeInput('a'.repeat(6000)).length).toBe(5000);
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(42)).toBe('');
  });
});
