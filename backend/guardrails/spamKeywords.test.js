import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkSpamKeywords, getSpamScore, isLikelySpam } from './spamKeywords.js';

describe('checkSpamKeywords', () => {
  it('passes clean therapy text', () => {
    const r = checkSpamKeywords('I understand billing can be really stressful. Have you tried calling the insurance directly?');
    assert.equal(r.safe, true);
  });

  it('blocks "buy now"', () => {
    const r = checkSpamKeywords('You should buy now before the offer expires!');
    assert.equal(r.safe, false);
    assert.match(r.reason, /buy now/i);
  });

  it('blocks URLs with https://', () => {
    const r = checkSpamKeywords('Check https://mysite.com for details');
    assert.equal(r.safe, false);
  });

  it('blocks .com domains', () => {
    const r = checkSpamKeywords('Visit practicesight.com today');
    assert.equal(r.safe, false);
  });

  it('passes when disabled', () => {
    const r = checkSpamKeywords('buy now click here free money', false);
    assert.equal(r.safe, true);
  });

  it('passes empty string', () => {
    const r = checkSpamKeywords('');
    assert.equal(r.safe, true);
  });

  it('is case-insensitive', () => {
    const r = checkSpamKeywords('BUY NOW');
    assert.equal(r.safe, false);
  });
});

describe('getSpamScore', () => {
  it('scores clean text as 0', () => {
    assert.equal(getSpamScore('This is a thoughtful reply about therapy billing.'), 0);
  });

  it('scores spam text higher than clean text', () => {
    const spam = getSpamScore('BUY NOW! CLICK HERE! FREE MONEY GUARANTEED!!!');
    const clean = getSpamScore('I hope this helps with your billing question.');
    assert.ok(spam > clean);
  });

  it('returns 0 for empty string', () => {
    assert.equal(getSpamScore(''), 0);
  });
});

describe('isLikelySpam', () => {
  it('returns false for clean text', () => {
    assert.equal(isLikelySpam('Happy to help with your insurance question.'), false);
  });

  it('returns true for obvious spam', () => {
    assert.equal(isLikelySpam('BUY NOW! FREE MONEY! GUARANTEED! CLICK HERE!'), true);
  });
});
