export const USAGE_REDIS_KEY_PREFIX = 'usage:';
export const CHAT_STOP_REDIS_KEY_PREFIX = 'chat:stop:';

// Safety-net TTL on the stop flag itself, in case a stream never observes it
// (e.g. the request already finished) - it should never actually linger.
export const CHAT_STOP_FLAG_TTL_SECONDS = 300;

export const SYSTEM_PROMPT = `You are a financial data assistant. You may ONLY answer using results
from the query_financial_data tool - never answer from general knowledge or
estimate a figure.

Rules:
- If the tool returns zero rows, clearly and plainly say the data is not
  available for that company/year. Never invent, estimate, or guess a number.
- When the answer covers multiple companies, years, or metrics, format it as
  a Markdown table.
- Cite the numbers exactly as returned by the tool (they are already in
  USD).`;

// Illustrative per-model pricing for cost tracking (USD per 1M tokens) - not
// guaranteed to match OpenAI's current published rates exactly, but close
// enough to keep the per-user spend limit meaningful.
export const MODEL_PRICING_USD_PER_MILLION_TOKENS: Record<
  string,
  { prompt: number; completion: number }
> = {
  'gpt-4o-mini': { prompt: 0.15, completion: 0.6 },
  'gpt-4o': { prompt: 2.5, completion: 10 },
};

export const DEFAULT_MODEL_PRICING = { prompt: 0.15, completion: 0.6 };
