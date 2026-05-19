import { z } from 'zod';

// Lead validation
export const leadSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name required').max(100),
  ch: z.enum(['reddit', 'facebook', 'linkedin', 'whatsapp', 'dm']),
  comment: z.string().min(5, 'Comment too short').max(5000),
  stage: z.enum(['saw_it', 'engaged', 'warm', 'hot', 'testing', 'feedback', 'not_fit']),
  reply: z.string().optional().default(''),
  date: z.string().optional(),
  actions: z.array(z.string()).optional().default([]),
  posted: z.boolean().optional().default(false),
  postUrl: z.string().url().or(z.literal('')).optional().default('')
});

export const leadsArraySchema = z.array(leadSchema);

// Settings validation
export const settingsSchema = z.object({
  maxPostsPerDay: z.number().min(1).max(10).default(3),
  minSecondsBetweenPosts: z.number().min(1).max(300).default(2),
  minAccountAgeDays: z.number().min(1).max(30).default(7),
  rateLimit: z.boolean().default(true),
  backendUrl: z.string().url().optional().or(z.literal(''))
});

// Reddit stats validation
export const redditStatsSchema = z.object({
  postsToday: z.number().min(0).default(0),
  lastPostTime: z.number().nullable().optional(),
  accountAge: z.number().min(0).optional()
});

// API request/response validation
export const redditPostRequestSchema = z.object({
  subreddit: z.string().min(2).max(50),
  title: z.string().min(5).max(300),
  content: z.string().min(10).max(40000),
  leadId: z.number().optional()
});

export const redditPostResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().url().optional(),
  postTime: z.string().optional(),
  error: z.string().optional(),
  message: z.string().optional()
});

// Thread data validation (from Reddit API)
export const threadDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  author: z.string(),
  createdAt: z.number(),
  ageHours: z.number().optional(),
  comments: z.number().min(0),
  score: z.number().optional()
});

// Relevance check response (from Llama)
export const relevanceResponseSchema = z.object({
  score: z.number().min(0).max(1),
  reason: z.string(),
  cached: z.boolean().optional().default(false)
});

// Reply generation response (from Llama)
export const replyResponseSchema = z.object({
  text: z.string().min(10).max(5000),
  cached: z.boolean().optional().default(false),
  confidence: z.number().min(0).max(1).optional()
});

// Cost tracker entry
export const costEntrySchema = z.object({
  timestamp: z.string(),
  type: z.enum(['local', 'cached', 'api']),
  cost: z.number().default(0),
  details: z.string().optional()
});

// Guardrail check result
export const guardrailCheckSchema = z.object({
  passed: z.boolean(),
  name: z.string(),
  reason: z.string().optional(),
  costType: z.enum(['local', 'cached', 'api']).default('local')
});

// Full analysis result
export const analysisResultSchema = z.object({
  blocked: z.boolean(),
  reason: z.string().optional(),
  reply: z.string().optional(),
  cost: z.enum(['$0', '$0 (cached)', '$0 (free tier)']).default('$0'),
  checks: z.array(guardrailCheckSchema).optional()
});

// Validation helper function
export function validateInput(schema, data) {
  try {
    return { valid: true, data: schema.parse(data) };
  } catch (error) {
    return { 
      valid: false, 
      error: error.errors?.[0]?.message || 'Validation failed',
      details: error.errors 
    };
  }
}

// Sanitize user input (prevent injection)
export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .slice(0, 5000); // Cap at 5000 chars
}
