import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkEngagement, getEngagementScore, isIdealThread } from './engagementFilter.js';

const goodThread = { ageHours: 48, comments: 10, score: 50 };

describe('checkEngagement', () => {
  it('passes a good thread', () => {
    const r = checkEngagement(goodThread);
    assert.equal(r.safe, true);
  });

  it('blocks thread under 1 day old', () => {
    const r = checkEngagement({ ...goodThread, ageHours: 12 });
    assert.equal(r.safe, false);
    assert.match(r.reason, /too new/i);
  });

  it('blocks thread over 7 days old', () => {
    const r = checkEngagement({ ...goodThread, ageHours: 200 });
    assert.equal(r.safe, false);
    assert.match(r.reason, /too old/i);
  });

  it('blocks thread with fewer than 5 comments', () => {
    const r = checkEngagement({ ...goodThread, comments: 3 });
    assert.equal(r.safe, false);
    assert.match(r.reason, /engagement/i);
  });

  it('passes when disabled', () => {
    const r = checkEngagement({ ageHours: 1, comments: 0 }, { enabled: false });
    assert.equal(r.safe, true);
  });

  it('uses custom config thresholds', () => {
    const r = checkEngagement(
      { ageHours: 36, comments: 2, score: 5 },
      { minThreadAgeDays: 1, minThreadComments: 2 }
    );
    assert.equal(r.safe, true);
  });
});

describe('getEngagementScore', () => {
  it('returns a number between 0 and 100', () => {
    const score = getEngagementScore(goodThread);
    assert.ok(score >= 0 && score <= 100);
  });

  it('scores an active thread higher than a dead one', () => {
    const active = getEngagementScore({ ageHours: 72, comments: 30, score: 200 });
    const dead = getEngagementScore({ ageHours: 1, comments: 0, score: 0 });
    assert.ok(active > dead);
  });
});

describe('isIdealThread', () => {
  it('returns true for good thread', () => {
    assert.equal(isIdealThread(goodThread), true);
  });

  it('returns false for brand new thread', () => {
    assert.equal(isIdealThread({ ageHours: 6, comments: 10 }), false);
  });

  it('returns false for low comment thread', () => {
    assert.equal(isIdealThread({ ageHours: 48, comments: 2 }), false);
  });
});
