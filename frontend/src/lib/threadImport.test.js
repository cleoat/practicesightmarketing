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

const rawFacebookCopy = `
Mental Health Billing Support
Leonardo Aguilar
 ·
srponStedo
1
0ti
a
e
M
3mc
r
4
m0
:
f
y
4
t
d
0
s
Y
81fl4fg2
e
1tf
a
4
06
A
11l
t
a
m2
 ·
Hello Group, For those of you in private practice who do your own insurance billing, how do you do your month-end review? Do you have like a system or is it more just knowing your numbers very well to catch things? Genuinely curious what works for you!
Zuraiz Khan
Lets connect?
20h
Reply
Send message
Share
Anonymous participant 177
Please check ib
1d
Reply
Share
Jethro Magaji
Most people who do their own billing eventually develop a simple monthly reconciliation system.
Typical month end workflow:
- Claims submitted = compare against claims paid
- ERA/EOB = match against bank deposits
- Check unpaid/denied claims
- Review aging reports (30/60/90 days)
- Compare scheduled sessions vs billed sessions
Some people know their numbers really well, but most successful practices rely on:
- EHR reporting
- spreadsheets/dashboard tracking
- weekly reconciliation habits
That's why strong billing visibility matters so much in systems like ClinikEHR, TherapyNotes, etc.
1d
Reply
Send message
Share
Anonymous participant 617
I use InvoQuest
23h
Reply
Share
Hallee Nelson
Routine is so important in billing! Reports inside your EHR should be a great asset to see what is outstanding and being able to match up any payments helps.
1d
Reply
Send message
Share
Brenda Adams
Run reports in ur billing system and reconcile bank deposits to posted /closed claims. On the billing system, run an a/r aging report and work all open claims. A lot can be done on ur clearinghouse platform as well.
Pivot RCM Solutions, LLC
b.adams@pivotrcm.com
1d
Reply
Send message
Share
Edited
Claire Lah
I would first be in a set routine with your billing. Then you would run a charge lay report and days in ar for basics let me know if I can help
1d
Reply
Send message
Share
Musawir Khan
  ·
A good month-end review usually includes checking total charges, payments, denials, aging AR, unsubmitted claims, and insurance balances to catch anything missed. Having a consistent report/reconciliation process helps much more than just memorizing numbers. We also help practices with billing audits, AR review, and month-end reporting support.
1d
Reply
Send message
Share
Aisha Khan
Collection report
22h
Reply
Send message
Share
David Shahzad
Send me text. I will let you know all the process and also share you information how itself work
1d
Reply
Send message
Share
Facebook
Facebook
Facebook
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

  it('extracts comments and post context from raw Facebook copied data without a marker', () => {
    const result = parseCopiedThread(rawFacebookCopy, communities);

    expect(result.channel).toBe('facebook');
    expect(result.source).toBe('Mental Health Billing Support');
    expect(result.postAuthor).toBe('Leonardo Aguilar');
    expect(result.postText).toContain('Hello Group');
    expect(result.threadKey).toContain('mental health billing support');
    expect(result.comments.map(comment => comment.name)).toEqual([
      'Zuraiz Khan',
      'Anonymous participant 177',
      'Jethro Magaji',
      'Anonymous participant 617',
      'Hallee Nelson',
      'Brenda Adams',
      'Claire Lah',
      'Musawir Khan',
      'Aisha Khan',
      'David Shahzad',
    ]);
    expect(result.comments.find(comment => comment.name === 'Mental Health Billing Support')).toBeUndefined();
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

  it('imports raw Facebook data with source, author, counts, and date', () => {
    const result = importCopiedThread(rawFacebookCopy, [], {
      communities,
      now: new Date('2026-05-21T12:00:00Z').getTime(),
    });

    expect(result.added).toBe(10);
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.importedAt).toBe('May 21, 2026');
    expect(result.parsed.source).toBe('Mental Health Billing Support');
    expect(result.parsed.postAuthor).toBe('Leonardo Aguilar');
    expect(result.threadKey).toBe(result.parsed.threadKey);

    const david = result.leads.find(lead => lead.name === 'David Shahzad');
    expect(david.date).toBe('May 21, 2026');
    expect(david.source).toBe('Mental Health Billing Support');
    expect(david.threadKey).toBe(result.threadKey);
    expect(david.postAuthor).toBe('Leonardo Aguilar');
    expect(david.stage).toBe('not_fit');
    expect(david.conversation).toEqual([
      {
        id: `${new Date('2026-05-21T12:00:00Z').getTime() + 9}-lead-0`,
        role: 'lead',
        text: 'Send me text. I will let you know all the process and also share you information how itself work',
        at: 'May 21, 2026',
      },
    ]);
  });

  it('recognizes the same copied thread and skips already-saved comments', () => {
    const first = importCopiedThread(rawFacebookCopy, [], {
      communities,
      now: new Date('2026-05-21T12:00:00Z').getTime(),
    });
    const second = importCopiedThread(rawFacebookCopy, first.leads, {
      communities,
      now: new Date('2026-05-22T12:00:00Z').getTime(),
    });

    expect(second.threadMatched).toBe(true);
    expect(second.added).toBe(0);
    expect(second.updated).toBe(0);
    expect(second.skipped).toBe(10);
    expect(second.matched).toBe(10);
    expect(second.duplicateComments).toBe(10);
  });

  it('adds only newer replies from a later paste of the same thread', () => {
    const first = importCopiedThread(rawFacebookCopy, [], {
      communities,
      now: new Date('2026-05-21T12:00:00Z').getTime(),
    });
    const laterCopy = rawFacebookCopy.replace(
      'David Shahzad\nSend me text. I will let you know all the process and also share you information how itself work',
      `Hallee Nelson
I also started checking the 60 day aging bucket every Friday before month end.
2h
Reply
Send message
Share
David Shahzad
Send me text. I will let you know all the process and also share you information how itself work`
    );

    const second = importCopiedThread(laterCopy, first.leads, {
      communities,
      now: new Date('2026-05-22T12:00:00Z').getTime(),
    });

    const hallee = second.leads.find(lead => lead.name === 'Hallee Nelson');
    expect(second.threadMatched).toBe(true);
    expect(second.added).toBe(0);
    expect(second.updated).toBe(1);
    expect(second.skipped).toBe(10);
    expect(second.updatedNames).toEqual(['Hallee Nelson']);
    expect(hallee.conversation.map(message => message.text)).toContain('I also started checking the 60 day aging bucket every Friday before month end.');
  });

  it('does not merge the same commenter across different source posts', () => {
    const first = importCopiedThread(rawFacebookCopy, [], {
      communities,
      now: new Date('2026-05-21T12:00:00Z').getTime(),
    });
    const differentThread = `
Mental Health Billing Support
Leonardo Aguilar
How do you handle unpaid insurance balances before closing the month?
Hallee Nelson
I run a separate unpaid claims report and compare it to deposits.
4h
Reply
Send message
Share
`;

    const second = importCopiedThread(differentThread, first.leads, {
      communities,
      now: new Date('2026-05-22T12:00:00Z').getTime(),
    });

    const halleeLeads = second.leads.filter(lead => lead.name === 'Hallee Nelson');
    expect(second.threadMatched).toBe(false);
    expect(second.added).toBe(1);
    expect(second.updated).toBe(0);
    expect(halleeLeads).toHaveLength(2);
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
    expect(jethro.conversation.map(message => message.text)).toContain('I also check unpaid claims weekly before month end.');
  });
});
