import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as guardrails from './guardrails/index.js';
import * as prawWrapper from './reddit/praw-wrapper.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

function requireAdminKey(req, res, next) {
  const adminKey = process.env.ADMIN_KEY;
  if (adminKey && req.headers['x-admin-key'] !== adminKey) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main Reddit posting endpoint
app.post('/reddit/post', async (req, res) => {
  const { lead, threadData, accountData, subreddit } = req.body;

  // Validate input
  if (!lead || !threadData || !accountData || !subreddit) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  try {
    // Run all guardrails
    const analysis = await guardrails.analyzePost(lead, threadData, accountData, {
      maxPostsPerDay: process.env.MAX_POSTS_PER_DAY || 3,
      minSecondsBetweenPosts: process.env.MIN_SECONDS_BETWEEN || 2,
      minAccountAgeDays: process.env.MIN_ACCOUNT_AGE_DAYS || 7,
      minThreadAgeDays: 1,
      minThreadComments: 5,
      rateLimit: true,
      spamFilterEnabled: true
    });

    // If blocked by guardrails, return early
    if (analysis.blocked) {
      return res.json({
        success: false,
        error: analysis.blockReason,
        blocked: true,
        checks: analysis.checks,
        cost: '$0'
      });
    }

    // Wait with humanized jitter
    await guardrails.warmupPost(2);

    // Post to Reddit using PRAW
    const postResult = await prawWrapper.postToReddit(
      subreddit,
      lead.name || 'Comment',
      lead.reply || lead.comment
    );

    // Check if post was successful
    if (postResult.error) {
      return res.json({
        success: false,
        error: postResult.error,
        blocked: false,
        checks: analysis.checks,
        cost: '$0'
      });
    }

    // Record the post
    guardrails.recordPost();

    // Return success
    return res.json({
      success: true,
      url: postResult.url,
      postId: postResult.post_id,
      timestamp: postResult.timestamp,
      blocked: false,
      checks: analysis.checks,
      cost: '$0',
      message: 'Posted successfully'
    });

  } catch (error) {
    console.error('Post endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      cost: '$0'
    });
  }
});

// Status endpoint (check guardrails status)
app.get('/status', (req, res) => {
  const status = guardrails.getStatus();
  res.json({
    status: 'ok',
    guardrails: status,
    cost: '$0'
  });
});

// Analyze post (run guardrails without posting)
app.post('/reddit/analyze', async (req, res) => {
  const { lead, threadData, accountData } = req.body;

  if (!lead || !threadData || !accountData) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const analysis = await guardrails.analyzePost(lead, threadData, accountData, {
      maxPostsPerDay: process.env.MAX_POSTS_PER_DAY || 3,
      minSecondsBetweenPosts: process.env.MIN_SECONDS_BETWEEN || 2,
      minAccountAgeDays: process.env.MIN_ACCOUNT_AGE_DAYS || 7,
      minThreadAgeDays: 1,
      minThreadComments: 5,
      rateLimit: true,
      spamFilterEnabled: true
    });

    return res.json({ success: true, ...analysis, cost: '$0' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Clear cache endpoint
app.post('/cache/clear', requireAdminKey, (req, res) => {
  const result = guardrails.clearCache();
  res.json({ cleared: true, result });
});

// Reset daily stats (admin endpoint)
app.post('/admin/reset-daily', requireAdminKey, (req, res) => {
  const result = guardrails.resetDaily();
  res.json({ reset: true, result });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    cost: '$0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    available: ['/health', '/reddit/post', '/reddit/analyze', '/status']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PracticeSight backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Reddit posting: POST http://localhost:${PORT}/reddit/post`);
  console.log(`🛡️ All guardrails active, $0 cost model`);
});

export default app;
