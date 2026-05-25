import { describe, expect, it } from 'vitest';
import {
  communityPostKey,
  getCommunityPostStats,
  getCommunityPostStatus,
  recordCommunityPost,
} from './communityPosts';

const fbGroup = {
  platform: 'facebook',
  name: 'Mental Health Billing Support',
  url: 'https://www.facebook.com/groups/1487216331977931/',
};

const subreddit = {
  platform: 'reddit',
  name: 'r/TherapistsInPractice',
  url: 'https://www.reddit.com/r/TherapistsInPractice/',
};

describe('community posting tracker', () => {
  it('builds stable keys from group and subreddit names', () => {
    expect(communityPostKey(fbGroup)).toBe('facebook:mental health billing support');
    expect(communityPostKey(subreddit)).toBe('reddit:r/therapistsinpractice');
  });

  it('records posts and reports whether a community was posted today', () => {
    const now = new Date('2026-05-25T14:30:00Z').getTime();
    const records = recordCommunityPost([], fbGroup, {
      now,
      templateId: 1,
      templateTitle: 'Month-end review question',
      body: 'How do you do your month-end review?',
    });

    const status = getCommunityPostStatus(fbGroup, records, now);
    expect(status.postedToday).toBe(true);
    expect(status.todayCount).toBe(1);
    expect(status.lastPost.templateTitle).toBe('Month-end review question');
  });

  it('separates original posts from lead replies in daily stats', () => {
    const now = new Date('2026-05-25T14:30:00Z').getTime();
    let records = recordCommunityPost([], subreddit, { now, kind: 'post' });
    records = recordCommunityPost(records, subreddit, { now: now + 10000, kind: 'reply' });

    const stats = getCommunityPostStats(records, now);
    expect(stats.postedToday).toBe(1);
    expect(stats.repliesToday).toBe(1);
    expect(stats.communitiesPostedToday).toBe(1);
  });
});
