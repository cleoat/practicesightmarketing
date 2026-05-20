import { z } from 'zod';

export const leadSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name required').max(100),
  ch: z.enum(['reddit', 'facebook', 'linkedin', 'x', 'whatsapp', 'dm']),
  comment: z.string().min(5, 'Comment too short').max(5000),
  stage: z.enum(['saw_it', 'engaged', 'warm', 'hot', 'testing', 'feedback', 'not_fit']),
  leadType: z.string().optional().default('unknown'),
  responseType: z.string().optional().default(''),
  intent: z.string().optional().default(''),
  analysisReason: z.string().optional().default(''),
  source: z.string().optional().default(''),
  threadUrl: z.string().optional().default(''),
  reply: z.string().optional().default(''),
  followUps: z.array(z.string()).optional().default([]),
  date: z.string().optional(),
  actions: z.array(z.string()).optional().default([]),
  posted: z.boolean().optional().default(false),
  postUrl: z.string().url().or(z.literal('')).optional().default('')
});

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

export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim().slice(0, 5000);
}
