import { describe, expect, it } from 'vitest';
import { findCommunity, getCommunityRule, inferChannelFromText } from './communityRules';

const communities = [
  { platform: 'reddit', name: 'r/therapists', url: 'https://reddit.com/r/therapists/new', safe: false },
  { platform: 'reddit', name: 'r/privatepractice', safe: true },
  { platform: 'facebook', name: 'Therapists in Private Practice', search: 'Therapists in Private Practice', safe: true },
];

describe('community rules', () => {
  it('matches reddit URLs to known communities', () => {
    expect(findCommunity('https://reddit.com/r/therapists/new', communities)?.name).toBe('r/therapists');
  });

  it('keeps strict reddit communities no-promo', () => {
    expect(getCommunityRule('r/therapists', 'reddit', communities).strict).toBe(true);
  });

  it('defaults unmatched reddit sources to no-promo', () => {
    const rule = getCommunityRule('r/newtherapygroup', 'reddit', communities);
    expect(rule.strict).toBe(true);
    expect(rule.assumed).toBe(true);
  });

  it('allows known safe facebook groups to mention products when stage logic allows it', () => {
    expect(getCommunityRule('Therapists in Private Practice', 'facebook', communities).canMentionProduct).toBe(true);
  });
});

describe('inferChannelFromText', () => {
  it('infers reddit from subreddit text', () => {
    expect(inferChannelFromText('r/privatepractice', communities)).toBe('reddit');
  });

  it('infers facebook from known group names', () => {
    expect(inferChannelFromText('Therapists in Private Practice', communities)).toBe('facebook');
  });
});
