const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const FALLBACK_REFERER = 'https://practicesightmarketing.vercel.app';

export const DEFAULT_OPENROUTER_MODELS = [
  'deepseek/deepseek-v4-flash:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'google/gemma-4-31b-it:free',
];

export function normalizeOpenRouterKey(key) {
  return String(key || '')
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/\s+/g, '');
}

export function getOpenRouterKeyIssue(key) {
  const normalized = normalizeOpenRouterKey(key);

  if (!normalized) return 'Add your OpenRouter API key first.';
  if (/^sk-(proj|live|test)-/i.test(normalized)) {
    return 'This looks like an OpenAI key. This app needs an OpenRouter key that starts with sk-or-v1-.';
  }
  if (!normalized.startsWith('sk-or-')) {
    return 'This should be an OpenRouter key that starts with sk-or-v1-.';
  }

  return '';
}

function appReferer() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return FALLBACK_REFERER;
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
  if (!failures.length) return 'OpenRouter did not return a reply.';

  const keyFailure = failures.find(f => f.stop);
  if (keyFailure) return keyFailure.message;

  const providerFailures = failures.filter(f => /provider returned error/i.test(f.message));
  if (providerFailures.length === failures.length) {
    return `OpenRouter accepted the key, but every free model route failed at the provider. Tried: ${failures.map(f => f.model).join(', ')}. Try again in a minute or pick a different OpenRouter model.`;
  }

  const last = failures[failures.length - 1];
  return `OpenRouter could not generate a reply. Last failure on ${last.model}: ${last.message}`;
}

function modelList(preferredModel, fallbackModels) {
  return [preferredModel, ...fallbackModels]
    .map(model => String(model || '').trim())
    .filter(Boolean)
    .filter((model, index, models) => models.indexOf(model) === index);
}

export async function chatCompletion({
  apiKey,
  messages,
  maxTokens = 300,
  temperature = 0.7,
  models = DEFAULT_OPENROUTER_MODELS,
  preferredModel = '',
}) {
  const normalizedKey = normalizeOpenRouterKey(apiKey);
  const keyIssue = getOpenRouterKeyIssue(normalizedKey);
  if (keyIssue) throw new Error(keyIssue);

  const failures = [];

  for (const model of modelList(preferredModel, models)) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${normalizedKey}`,
          'HTTP-Referer': appReferer(),
          'X-Title': 'PracticeSight Outreach',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          messages,
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

export async function testOpenRouterKey(apiKey, preferredModel = '') {
  const result = await chatCompletion({
    apiKey,
    maxTokens: 8,
    temperature: 0,
    messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    preferredModel,
  });

  return { ok: true, model: result.model };
}
