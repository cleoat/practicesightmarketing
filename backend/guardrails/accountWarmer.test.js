import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkAccountAge, calculateAccountAge, getAccountStatus, isAccountWarmed } from './accountWarmer.js';

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

describe('checkAccountAge', () => {
  it('passes a 30-day-old account', () => {
    const r = checkAccountAge({ created: daysAgo(30) });
    assert.equal(r.safe, true);
    assert.ok(r.accountAgeDays >= 30);
  });

  it('blocks a 3-day-old account', () => {
    const r = checkAccountAge({ created: daysAgo(3) });
    assert.equal(r.safe, false);
    assert.match(r.reason, /too new/i);
    assert.ok(r.daysUntilActive > 0);
  });

  it('blocks missing accountData', () => {
    const r = checkAccountAge(null);
    assert.equal(r.safe, false);
  });

  it('blocks missing created field', () => {
    const r = checkAccountAge({});
    assert.equal(r.safe, false);
  });

  it('passes when disabled', () => {
    const r = checkAccountAge({ created: daysAgo(1) }, { enabled: false });
    assert.equal(r.safe, true);
  });

  it('respects custom minAccountAgeDays', () => {
    const r = checkAccountAge({ created: daysAgo(3) }, { minAccountAgeDays: 2 });
    assert.equal(r.safe, true);
  });
});

describe('calculateAccountAge', () => {
  it('returns 0 for brand new account', () => {
    assert.equal(calculateAccountAge(new Date().toISOString()), 0);
  });

  it('returns ~30 for a 30-day-old account', () => {
    const age = calculateAccountAge(daysAgo(30));
    assert.ok(age >= 29 && age <= 30);
  });
});

describe('getAccountStatus', () => {
  it('returns brand_new for today', () => {
    const s = getAccountStatus({ created: daysAgo(0) });
    assert.equal(s.status, 'brand_new');
    assert.equal(s.ready, false);
  });

  it('returns warming_up for 10-day-old account', () => {
    const s = getAccountStatus({ created: daysAgo(10) });
    assert.equal(s.status, 'warming_up');
    assert.equal(s.ready, true);
  });

  it('returns established for 60-day-old account', () => {
    const s = getAccountStatus({ created: daysAgo(60) });
    assert.equal(s.status, 'established');
  });
});

describe('isAccountWarmed', () => {
  it('returns true for old enough account', () => {
    assert.equal(isAccountWarmed({ created: daysAgo(10) }), true);
  });

  it('returns false for new account', () => {
    assert.equal(isAccountWarmed({ created: daysAgo(2) }), false);
  });
});
