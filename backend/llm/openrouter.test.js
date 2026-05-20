import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeOpenRouterKey, validateOpenRouterKey } from './openrouter.js';

test('normalizeOpenRouterKey strips whitespace and Bearer prefix', () => {
  assert.equal(normalizeOpenRouterKey(' Bearer sk-or-v1-test\n'), 'sk-or-v1-test');
});

test('validateOpenRouterKey only accepts OpenRouter-shaped keys', () => {
  assert.equal(validateOpenRouterKey('sk-or-v1-12345678901234567890'), true);
  assert.equal(validateOpenRouterKey('sk-proj-12345678901234567890'), false);
});
