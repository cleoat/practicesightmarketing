// OpenRouter API calls to free tier models for relevance checking
// No cost ($0), free-routed models only

const OPENROUTER_API_KEY = normalizeOpenRouterKey(process.env.OPENROUTER_API_KEY);
const API_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-20b:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
];

export function normalizeOpenRouterKey(key) {
  return String(key || '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/\s+/g, '');
}

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text.slice(0, 300) } };
  }
}

function errorMessage(data, response) {
  const error = data?.error;
  if (typeof error === 'string') return error;
  return error?.message || data?.message || response.statusText || 'OpenRouter request failed';
}

function isKeyOrBillingError(status, message) {
  return (
    status === 401 ||
    status === 402 ||
    /api key|auth|unauthorized|invalid key|credits|billing/i.test(message)
  );
}

function summarizeFailures(failures) {
  if (!failures.length) return 'OpenRouter did not return a reply';

  const keyFailure = failures.find(f => f.stop);
  if (keyFailure) return keyFailure.message;

  const providerFailures = failures.filter(f => /provider returned error/i.test(f.message));
  if (providerFailures.length === failures.length) {
    return `OpenRouter accepted the key, but every free model route failed at the provider. Tried: ${failures.map(f => f.model).join(', ')}`;
  }

  const last = failures[failures.length - 1];
  return `OpenRouter failed on ${last.model}: ${last.message}`;
}

function parseJsonObject(text) {
  const jsonText = text.match(/\{[\s\S]*\}/)?.[0] || text;
  return JSON.parse(jsonText);
}

async function chatCompletion(messages, maxTokens, temperature = 0.2) {
  const failures = [];

  for (const model of MODELS) {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
          'X-Title': 'PracticeSight Outreach',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      });

      const data = await readJsonSafely(response);
      if (!response.ok || data.error) {
        const message = errorMessage(data, response);
        const stop = isKeyOrBillingError(response.status, message);
        failures.push({ model, message, status: response.status, stop });
        if (stop) break;
        continue;
      }

      const text = (data.choices?.[0]?.message?.content || '').trim();
      if (text) return { text, model };

      failures.push({ model, message: 'Empty response', status: response.status });
    } catch (error) {
      failures.push({ model, message: error.message || 'Network error', status: 0 });
    }
  }

  throw new Error(summarizeFailures(failures));
}

export async function checkRelevance(comment, threadContent) {
  if (!OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY not set, skipping LLM check');
    return { score: 0.5, reason: 'API key missing', cached: false };
  }

  try {
    const prompt = `You are a relevance checker for Reddit comments.

Read this Reddit thread and the proposed comment. Return ONLY a JSON object (no markdown):
{
  "score": <number 0-1>,
  "reason": "<brief reason>"
}

Thread: "${threadContent.slice(0, 500)}"

Proposed comment: "${comment.slice(0, 500)}"

Score 0-1 where:
- 0.9-1.0 = Directly relevant, adds value
- 0.6-0.9 = Relevant, helpful
- 0.3-0.6 = Marginally related
- 0.0-0.3 = Off-topic or spam-like`;

    const completion = await chatCompletion([{ role: 'user', content: prompt }], 100, 0);
    const result = parseJsonObject(completion.text);

    return {
      score: Math.max(0, Math.min(1, result.score)),
      reason: result.reason || '',
      cached: false,
      cost: '$0'
    };
  } catch (error) {
    console.error('Relevance check error:', error.message);
    return { score: 0.5, reason: error.message, cached: false, cost: '$0' };
  }
}

export async function generateReply(threadContent, userContext) {
  if (!OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY not set, skipping LLM call');
    return { text: '', confidence: 0, cached: false };
  }

  try {
    const prompt = `You are helping someone reply to this Reddit thread.

Thread: "${threadContent.slice(0, 500)}"

User context: "${userContext}"

Generate a helpful, natural 2-3 sentence reply that:
1. Directly addresses the thread
2. Adds real value
3. Sounds human, not bot-like
4. Never includes links or self-promotion

Return ONLY the reply text, no other formatting.`;

    const result = await chatCompletion([{ role: 'user', content: prompt }], 200, 0.7);
    const text = result.text;

    return {
      text,
      confidence: text.length > 50 ? 0.8 : 0.3,
      cached: false,
      cost: '$0'
    };
  } catch (error) {
    console.error('Reply generation error:', error.message);
    return { text: '', confidence: 0, cached: false, cost: '$0' };
  }
}

export function validateOpenRouterKey(key) {
  const normalized = normalizeOpenRouterKey(key);
  return normalized.length > 20 && normalized.startsWith('sk-or-');
}

export function getModelInfo() {
  return {
    models: MODELS,
    type: 'free-tier',
    provider: 'openrouter',
    cost: '$0',
    maxTokens: 2000
  };
}
