import { describe, expect, it } from 'vitest';
import { getOpenRouterKeyIssue, normalizeOpenRouterKey } from './openrouter';

describe('normalizeOpenRouterKey', () => {
  it('trims whitespace and strips a pasted Bearer prefix', () => {
    expect(normalizeOpenRouterKey('  Bearer sk-or-v1-test\n')).toBe('sk-or-v1-test');
  });
});

describe('getOpenRouterKeyIssue', () => {
  it('accepts OpenRouter-shaped keys', () => {
    expect(getOpenRouterKeyIssue('sk-or-v1-test')).toBe('');
  });

  it('warns when an OpenAI-shaped key is pasted', () => {
    expect(getOpenRouterKeyIssue('sk-proj-test')).toMatch(/OpenAI key/i);
  });
});
