/**
 * aiClient.js - Unified AI provider wrapper.
 *
 * Defaults to Gemini Flash when GEMINI_API_KEY is set.
 * Set AI_PROVIDER=groq to roll back to Groq without a code change.
 *
 * Exposes a single function: chat(messages, options)
 * where messages is the OpenAI-style array:
 *   [{ role: 'system'|'user'|'assistant', content: string }]
 *
 * Returns: { content: string } - the assistant's reply text.
 */

function normalizeProvider(value) {
  const provider = String(value || '').trim().toLowerCase();
  return provider === 'gemini' || provider === 'groq' ? provider : null;
}

function getSelectedProvider() {
  const configured = normalizeProvider(process.env.AI_PROVIDER);
  if (configured) return configured;
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.GROQ_API_KEY) return 'groq';
  return 'gemini';
}

function looksLikeJsonRequest(messages = []) {
  return messages.some((message) =>
    /respond\s+only\s+with.*json|return\s+(only\s+)?(valid\s+)?json|return\s+a\s+json\s+(array|object)/i
      .test(message?.content || '')
  );
}

function assertConfigured(provider) {
  const key = provider === 'gemini' ? 'GEMINI_API_KEY' : 'GROQ_API_KEY';
  if (process.env[key]) return;

  const err = new Error(`AI provider ${provider} is not configured: set ${key}`);
  err.code = 'AI_NOT_CONFIGURED';
  err.statusCode = 503;
  throw err;
}

async function chatGemini(messages, {
  temperature = 0.3,
  maxTokens = 2000,
  responseMimeType,
} = {}) {
  assertConfigured('gemini');

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const mimeType = responseMimeType || (looksLikeJsonRequest(messages) ? 'application/json' : undefined);

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      ...(mimeType ? { responseMimeType: mimeType } : {}),
    },
  });

  const systemMsg = messages.find((m) => m.role === 'system');
  const convMsgs = messages.filter((m) => m.role !== 'system');

  const history = convMsgs.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastMsg = convMsgs[convMsgs.length - 1];
  const userText = lastMsg?.content || '';

  const chatSession = model.startChat({
    history,
    systemInstruction: systemMsg?.content,
  });

  const result = await chatSession.sendMessage(userText);
  return { content: result.response.text() };
}

async function chatGroq(messages, {
  model = 'llama-3.3-70b-versatile',
  temperature = 0.3,
  maxTokens = 2000,
} = {}) {
  assertConfigured('groq');

  const { Groq } = require('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    messages,
    model,
    temperature,
    max_tokens: maxTokens,
  });
  return { content: completion.choices[0]?.message?.content || '' };
}

async function chat(messages, options = {}) {
  if (getSelectedProvider() === 'gemini') {
    return chatGemini(messages, options);
  }
  return chatGroq(messages, options);
}

/**
 * Groq-compatible drop-in: creates an object with
 * .chat.completions.create(opts) so existing code changes minimally.
 */
function getLegacyClient() {
  if (getSelectedProvider() === 'gemini') {
    assertConfigured('gemini');
    return {
      chat: {
        completions: {
          create: async ({ messages, temperature, max_tokens, response_format }) => {
            const responseMimeType =
              response_format?.type === 'json_object' ? 'application/json' : undefined;
            const result = await chatGemini(messages, {
              temperature,
              maxTokens: max_tokens,
              responseMimeType,
            });
            return { choices: [{ message: { content: result.content } }] };
          },
        },
      },
    };
  }

  assertConfigured('groq');
  const { Groq } = require('groq-sdk');
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

module.exports = { chat, getLegacyClient, getSelectedProvider };
