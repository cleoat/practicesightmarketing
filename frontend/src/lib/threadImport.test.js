import { describe, expect, it } from 'vitest';
import { importCopiedThread, parseCopiedThread } from './threadImport';

const communities = [
  {
    name: 'Mental Health Billing Support',
    platform: 'facebook',
    url: 'https://www.facebook.com/groups/1487216331977931/',
  },
];

const copiedPost = `
Facebook
Mental Health Billing Support
Leonardo Aguilar
Hello Group, For those of you in private practice who do your own insurance billing, how do you do your month-end review?
6
13
Most relevant
Zuraiz Khan
Lets connect?
19h
Like
Reply
Send message
Share
Reply as Leonardo
Anonymous participant 177
Please check ib
1d
Like
Reply
Share
Anonymous participant 617
I use InvoQuest
22h
Like
Reply
Share
Jethro Magaji
Most people who do their own billing eventually develop a simple monthly reconciliation system.
Typical month end workflow:
- Claims submitted = compare against claims paid
- ERA/EOB = match against bank deposits
- Check unpaid/denied claims
That’s why strong billing visibility matters so much in systems like ClinikEHR, TherapyNotes, etc.
1d
Like
Reply
Send message
Share
Brenda Adams
Run reports in ur billing system and reconcile bank deposits to posted /closed claims. On the billing system, run an a/r aging report and work all open claims.
Pivot RCM Solutions, LLC
b.adams@pivotrcm.com
1d
Like
Reply
Send message
Share
Musawir Khan
 ·
Follow
A good month-end review usually includes checking total charges, payments, denials, aging AR, unsubmitted claims, and insurance balances to catch anything missed. We also help practices with billing audits, AR review, and month-end reporting support.
1d
Like
Reply
Send message
Share
Aisha Khan
Collection report
21h
Like
Reply
Send message
Share
David Shahzad
Send me text. I will let you know all the process and also share you information how itself work
1d
Like
Reply
Send message
Share
Comment as Leonardo
`;

describe('parseCopiedThread', () => {
  it('extracts Facebook comments from noisy copied thread text', () => {
    const result = parseCopiedThread(copiedPost, communities);

    expect(result.channel).toBe('facebook');
    expect(result.source).toBe('Mental Health Billing Support');
    expect(result.comments.map(comment => comment.name)).toEqual([
      'Zuraiz Khan',
      'Anonymous participant 177',
      'Anonymous participant 617',
      'Jethro Magaji',
      'Brenda Adams',
      'Musawir Khan',
      'Aisha Khan',
      'David Shahzad',
    ]);
    expect(result.comments.find(comment => comment.name === 'Jethro Magaji').comment).toContain('monthly reconciliation system');
    expect(result.comments.find(comment => comment.name === 'Brenda Adams').comment).toContain('Pivot RCM Solutions');
  });

  it('detects verified communities from direct links in the copied text', () => {
    const result = parseCopiedThread(`
https://www.facebook.com/groups/1487216331977931/
Most relevant
Zuraiz Khan
Lets connect?
19h
Comment as Leonardo
`, communities);

    expect(result.source).toBe('Mental Health Billing Support');
    expect(result.channel).toBe('facebook');
    expect(result.threadUrl).toBe('https://www.facebook.com/groups/1487216331977931/');
  });

  it('extracts Reddit handles and keeps the subreddit source', () => {
    const redditCommunities = [
      {
        name: 'r/TherapistsInPractice',
        platform: 'reddit',
        url: 'https://www.reddit.com/r/TherapistsInPractice/',
      },
    ];

    const result = parseCopiedThread(`
r/TherapistsInPractice
u/Visual-Few
I do my own billing in SimplePractice and claims keep getting stuck.
2d
BillingHelp_23
We help practices with AR cleanup and month-end reporting.
1d
`, redditCommunities);

    expect(result.source).toBe('r/TherapistsInPractice');
    expect(result.channel).toBe('reddit');
    expect(result.comments.map(comment => comment.name)).toEqual(['u/Visual-Few', 'BillingHelp_23']);
  });
});

describe('importCopiedThread', () => {
  it('adds new leads with analyzer metadata', () => {
    const result = importCopiedThread(copiedPost, [], { communities, now: new Date('2026-05-21').getTime() });

    expect(result.added).toBe(8);
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(0);

    const musawir = result.leads.find(lead => lead.name === 'Musawir Khan');
    expect(musawir.stage).toBe('not_fit');
    expect(musawir.leadType).toBe('billing_vendor');

    const invoquest = result.leads.find(lead => lead.name === 'Anonymous participant 617');
    expect(invoquest.stage).toBe('not_fit');
    expect(invoquest.leadType).toBe('outsourced_billing');
  });

  it('skips exact duplicates and appends new comments to existing lead history', () => {
    const first = importCopiedThread(copiedPost, [], { communities, now: 1000 });
    const secondCopiedText = `
Most relevant
Jethro Magaji
Most people who do their own billing eventually develop a simple monthly reconciliation system.
Typical month end workflow:
- Claims submitted = compare against claims paid
- ERA/EOB = match against bank deposits
- Check unpaid/denied claims
That’s why strong billing visibility matters so much in systems like ClinikEHR, TherapyNotes, etc.
1d
Jethro Magaji
I also check unpaid claims weekly before month end.
2h
Comment as Leonardo
`;

    const second = importCopiedThread(secondCopiedText, first.leads, {
      communities,
      defaultSource: 'Mental Health Billing Support',
      defaultChannel: 'facebook',
      now: 2000,
    });

    const jethro = second.leads.find(lead => lead.name === 'Jethro Magaji');
    expect(second.added).toBe(0);
    expect(second.updated).toBe(1);
    expect(second.skipped).toBe(1);
    expect(jethro.followUps).toContain('I also check unpaid claims weekly before month end.');
  });
});
