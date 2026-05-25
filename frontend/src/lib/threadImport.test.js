import { describe, expect, it } from 'vitest';
import { importCopiedThread, parseCopiedThread } from './threadImport';

const communities = [
  {
    name: 'Mental Health Billing Support',
    platform: 'facebook',
    url: 'https://www.facebook.com/groups/1487216331977931/',
  },
  {
    name: 'Simple Practice Billing',
    platform: 'facebook',
    url: 'https://www.facebook.com/groups/2070605980012816/',
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

const fullFacebookPageCopy = `
Home
Create a post
What's on your mind, Leonardo?
Stories
Create story
Jake Van Clief
Atlantis University
Feed posts
Facebook
ACT Made Simple - Acceptance & Commitment Therapy for Practitioners
Florencia Allegretti
 ·
Sponsored
 ·
Hi all, I am a newbie to ACT and I am trying to use this approach with a client who has a history of chronic pain & trauma. As they put it, they are used to white-knuckling/burying their feelings and pushing through their discomfort in order to engage in valued actions such as work or family, but they see this as incredibly exhausting and it comes at a cost.
9
12
Copy Link
Facebook
Facebook
Leonardo Aguilar's Post
Facebook
Facebook
Mental Health Billing Support
Leonardo Aguilar
 ·
s
n
o
e
p
r
o
S
t
d
8
a
c
t
m
9
0
4
h
0
l
 :
m
f
 3
9
A
4
a
1
M
M
c
 ·
Hello Group, For those of you in private practice who do your own insurance billing, how do you do your month-end review? Do you have like a system or is it more just knowing your numbers very well to catch things? Genuinely curious what works for you!
7
21
All comments﻿
Hamza Ali
We do entire billing and entering payments into the system for whole month and then export the payment report at the end of the month and reconcile the checks and balances looks perfect. Happy to help just send me a message.
3d
Like
Reply
Send message
Share
Anonymous participant 177
Please check ib
3d
Like
Reply
Share
1
View 1 reply
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
That’s why strong billing visibility matters so much in systems like ClinikEHR, TherapyNotes, etc.
3d
Like
Reply
Send message
Share
2
View 1 reply
Musawir Khan
 ·
Follow
A good month-end review usually includes checking total charges, payments, denials, aging AR, unsubmitted claims, and insurance balances to catch anything missed. Having a consistent report/reconciliation process helps much more than just memorizing numbers. We also help practices with billing audits, AR review, and month-end reporting support.
3d
Like
Reply
Send message
Share
David Shahzad
Send me text. I will let you know all the process and also share you information how itself work
3d
Like
Reply
Send message
Share
Claire Lah
I would first be in a set routine with your billing. Then you would run a charge lay report and days in ar for basics let me know if I can help
3d
Like
Reply
Send message
Share
Brenda Adams
Run reports in ur billing system and reconcile bank deposits to posted /closed claims. On the billing system, run an a/r aging report and work all open claims. A lot can be done on ur clearinghouse platform as well.
Pivot RCM Solutions, LLC
b.adams@pivotrcm.com
3d
Like
Reply
Send message
Share
Edited
Hallee Nelson
Routine is so important in billing! Reports inside your EHR should be a great asset to see what is outstanding and being able to match up any payments helps.
3d
Like
Reply
Send message
Share
View 1 reply
Anonymous participant 617
I use InvoQuest
3d
Like
Reply
Share
Aisha Khan
Collection report
3d
Like
Reply
Send message
Share
View all 4 replies
Facebook
Facebook
Comment as Leonardo
Adam Robin
Active 35m ago
Messages
Adam Robin
Enter, Conversation details
Hey Leonardo, not sure if you saw my comment on your post but that’s honestly a really important question.
Compose
Write to Adam Robin
`;

const simplePracticeFeedCopy = `
Simple Practice Billing
Public group
 ·
6.3K members
Facebook
Facebook
Leonardo Aguilar
4 hours ago
 ·
Hey group, For those of you in private practice who do your own insurance billing how do you actually do your month-end billing review?
Do you have a specific routine, or is it more just knowing your numbers well enough to catch things?
Genuinely curious what works for people.
Facebook
Facebook
Dominique Caldwell
6 hours ago
 ·
Medical billing services for pediatric practices
Memorial Day Reminder
See more
unitybillingsolutions.com
Unity Billing Solutions
Facebook
Facebook
MV Assist - Your Medical Virtual Assistant Service
a day ago
 ·
Hi everyone!
If you're a practice owner or healthcare provider looking for reliable virtual support, I'd be happy to help.
Let's connect!
See more
Facebook
Facebook
Anonymous participant
3 days ago
 ·
Hello has anyone experienced this. We keep submitting Z.62.82 and continue to get the scrub.
Anonymous participant 290
z codes can't be the primary code.
3d
Reply
Share
Kris Ann Blaine
It can't be the primary/only diagnosis
3d
Reply
Share
Facebook
Facebook
Leonardo Aguilar's Post
Facebook
Facebook
Simple Practice Billing
Leonardo Aguilar
 ·
4 hours ago
 ·
Hey group, For those of you in private practice who do your own insurance billing how do you actually do your month-end billing review?
Do you have a specific routine, or is it more just knowing your numbers well enough to catch things?
Genuinely curious what works for people.
Kristi Lynn Taylor
I try and watch my clinicians claims filed daily but at the end of the month I have a spreadsheet I have of all clients with all data that can be verified.
51m
Reply
Send message
Share
Michael Nichols
1)Daily review any, scrub, rejected or denied claim
2) weekly export client aging, export report, sort by team member and solve any unpaid $
3) bi weekly export unpaid insurance claim, sort by team member, solve any claim over 2 weeks old
4) print allocation report bi weekly and send checks
3h
Reply
Send message
Share
TurquoiseParsnip2059
I hired a billing company . She really good Unity Billing Solutions LLC
3h
Reply
Share
Ximena Alyssa Herriges-Dalsing
I touch my numbers every day, so the month end audit is really just about double checking my work.
3h
Reply
Send message
Share
Musawir Khan
 ·
Most people end up doing a mix of both. There's usually a set routine, run aging reports, check unpaid claims over 30/60/90 days, review denials, and match deposits against EOBs/ERAs. After a while, you also just get familiar enough with your numbers that anything "off" stands out quickly.
We also help practices with insurance billing, AR cleanup, and month-end reconciliation so nothing slips through the cracks.
3h
Reply
Send message
Share
Facebook
No file chosen
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

  it('anchors a full Facebook page paste to the detected post and ignores surrounding posts/messages', () => {
    const result = parseCopiedThread(fullFacebookPageCopy, communities);

    expect(result.source).toBe('Mental Health Billing Support');
    expect(result.postAuthor).toBe('Leonardo Aguilar');
    expect(result.postText).toContain('Hello Group');
    expect(result.postText).not.toContain('ACT');
    expect(result.postText).not.toContain('Florencia');
    expect(result.comments.map(comment => comment.name)).toEqual([
      'Hamza Ali',
      'Anonymous participant 177',
      'Jethro Magaji',
      'Musawir Khan',
      'David Shahzad',
      'Claire Lah',
      'Brenda Adams',
      'Hallee Nelson',
      'Anonymous participant 617',
      'Aisha Khan',
    ]);
    expect(result.comments.find(comment => comment.name === 'Adam Robin')).toBeUndefined();
  });

  it('anchors a Facebook group feed copy to Leonardo post even without an all-comments marker', () => {
    const result = parseCopiedThread(simplePracticeFeedCopy, communities);

    expect(result.source).toBe('Simple Practice Billing');
    expect(result.postAuthor).toBe('Leonardo Aguilar');
    expect(result.postText).toContain('month-end billing review');
    expect(result.postText).not.toContain('Dominique Caldwell');
    expect(result.postText).not.toContain('MV Assist');
    expect(result.comments.map(comment => comment.name)).toEqual([
      'Kristi Lynn Taylor',
      'Michael Nichols',
      'TurquoiseParsnip2059',
      'Ximena Alyssa Herriges-Dalsing',
      'Musawir Khan',
    ]);
    expect(result.comments.find(comment => comment.name === 'Dominique Caldwell')).toBeUndefined();
    expect(result.comments.find(comment => comment.name === 'Anonymous participant 290')).toBeUndefined();
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

  it('updates an existing thread from a full page paste and adds only new commenters', () => {
    const first = importCopiedThread(rawFacebookCopy, [], {
      communities,
      now: new Date('2026-05-21T12:00:00Z').getTime(),
    });
    const second = importCopiedThread(fullFacebookPageCopy, first.leads, {
      communities,
      now: new Date('2026-05-23T12:00:00Z').getTime(),
    });

    const hamza = second.leads.find(lead => lead.name === 'Hamza Ali');
    expect(second.threadMatched).toBe(true);
    expect(second.added).toBe(1);
    expect(second.updated).toBe(0);
    expect(second.skipped).toBe(9);
    expect(second.addedNames).toEqual(['Hamza Ali']);
    expect(hamza.stage).toBe('not_fit');
    expect(hamza.leadType).toBe('billing_vendor');
    expect(second.leads.find(lead => lead.name === 'Adam Robin')).toBeUndefined();
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
    expect(hallee.reply).toBe('');
    expect(hallee.replyApproved).toBe(false);
    expect(hallee.posted).toBe(false);
  });

  it('imports a Simple Practice Billing feed copy with source and vendor filtering', () => {
    const result = importCopiedThread(simplePracticeFeedCopy, [], {
      communities,
      now: new Date('2026-05-25T16:00:00Z').getTime(),
    });

    expect(result.parsed.source).toBe('Simple Practice Billing');
    expect(result.added).toBe(5);
    expect(result.importedAt).toBe('May 25, 2026');

    const turquoise = result.leads.find(lead => lead.name === 'TurquoiseParsnip2059');
    const ximenia = result.leads.find(lead => lead.name === 'Ximena Alyssa Herriges-Dalsing');
    const musawir = result.leads.find(lead => lead.name === 'Musawir Khan');
    expect(turquoise.stage).toBe('not_fit');
    expect(musawir.stage).toBe('not_fit');
    expect(ximenia.stage).toBe('engaged');
    expect(ximenia.source).toBe('Simple Practice Billing');
    expect(ximenia.postText).toContain('Genuinely curious');
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
