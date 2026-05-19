// OpenRouter API calls to free tier Llama 2 7B for relevance checking
// No cost ($0), open-source LLM only

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-2-7b-chat'; // Free tier model

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

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100
      })
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', response.statusText);
      return { score: 0.5, reason: 'API error', cached: false };
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    const result = JSON.parse(text);

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

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200
      })
    });

    if (!response.ok) {
      return { text: '', confidence: 0, cached: false, cost: '$0' };
    }

    const data = await response.json();
    const text = (data.choices[0].message.content || '').trim();

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
  return key && key.length > 20 && key.startsWith('sk-');
}

export function getModelInfo() {
  return {
    model: MODEL,
    type: 'free-tier',
    provider: 'meta',
    cost: '$0',
    maxTokens: 2000
  };
}
