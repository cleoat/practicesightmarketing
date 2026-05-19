import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit, recordPost, getStats, resetDaily } from './rateLimiter.js';

describe('rateLimiter', () => {
  beforeEach(() => {
    resetDaily();
  });

  it('passes on first request', () => {
    const r = checkRateLimit({ maxPostsPerDay: 3, minSecondsBetweenPosts: 0 });
    assert.equal(r.safe, true);
    assert.equal(r.remaining, 2);
  });

  it('blocks after daily limit is reached', () => {
    recordPost();
    recordPost();
    recordPost();
    const r = checkRateLimit({ maxPostsPerDay: 3, minSecondsBetweenPosts: 0 });
    assert.equal(r.safe, false);
    assert.match(r.reason, /daily limit/i);
    assert.equal(r.remaining, 0);
  });

  it('blocks when posting too soon', () => {
    recordPost();
    const r = checkRateLimit({ maxPostsPerDay: 10, minSecondsBetweenPosts: 60 });
    assert.equal(r.safe, false);
    assert.match(r.reason, /too soon/i);
    assert.ok(r.canRetryIn > 0);
  });

  it('passes when disabled', () => {
    recordPost(); recordPost(); recordPost();
    const r = checkRateLimit({ enabled: false });
    assert.equal(r.safe, true);
  });

  it('getStats reflects posted count', () => {
    recordPost();
    recordPost();
    const stats = getStats();
    assert.equal(stats.postsToday, 2);
  });

  it('resetDaily clears the count', () => {
    recordPost();
    recordPost();
    resetDaily();
    const stats = getStats();
    assert.equal(stats.postsToday, 0);
  });
});
