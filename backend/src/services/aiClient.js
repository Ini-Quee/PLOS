/**
 * aiClient.js — Unified AI provider wrapper
 *
 * Prefers Gemini Flash (1M free tokens/day) over Groq (100K/day).
 * Falls back to Groq if GEMINI_API_KEY is not set.
 *
 * Exposes a single function: chat(messages, options)
 * where messages is the OpenAI-style array:
 *   [{ role: 'system'|'user'|'assistant', content: string }]
 *
 * Returns: { content: string } — the assistant's reply text.
 */

const { pool } = require('../db/connection');

// ─── Gemini ────────────────────────────────────────────────────────────────────
async function chatGemini(messages, { temperature = 0.3, maxTokens = 2000 } = {}) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  // Separate system prompt from conversation
  const systemMsg = messages.find(m => m.role === 'system');
  const convMsgs  = messages.filter(m => m.role !== 'system');

  // Gemini uses 'user'/'model' roles (not 'assistant')
  const history = convMsgs.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastMsg = convMsgs[convMsgs.length - 1];
  const userText = lastMsg?.content || '';

  const chat = model.startChat({
    history,
    systemInstruction: systemMsg?.content,
  });

  const result = await chat.sendMessage(userText);
  return { content: result.response.text() };
}

// ─── Groq fallback ─────────────────────────────────────────────────────────────
async function chatGroq(messages, { model = 'llama-3.3-70b-versatile', temperature = 0.3, maxTokens = 2000 } = {}) {
  const { Groq } = require('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy-key' });

  const completion = await groq.chat.completions.create({
    messages,
    model,
    temperature,
    max_tokens: maxTokens,
  });
  return { content: completion.choices[0]?.message?.content || '' };
}

// ─── Public API ────────────────────────────────────────────────────────────────
async function chat(messages, options = {}) {
  if (process.env.GEMINI_API_KEY) {
    return chatGemini(messages, options);
  }
  return chatGroq(messages, options);
}

/**
 * Groq-compatible drop-in: creates an object with
 * .chat.completions.create(opts) so existing code changes minimally.
 */
function getLegacyClient() {
  if (process.env.GEMINI_API_KEY) {
    return {
      chat: {
        completions: {
          create: async ({ messages, temperature, max_tokens }) => {
            const result = await chatGemini(messages, { temperature, maxTokens: max_tokens });
            return { choices: [{ message: { content: result.content } }] };
          },
        },
      },
    };
  }
  // Groq native
  const { Groq } = require('groq-sdk');
  return new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy-key' });
}

module.exports = { chat, getLegacyClient };
