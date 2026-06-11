/**
 * lumiContentFilter — lightweight, dependency-free content safety for Lumi.
 *
 * Two layers (no AI cost):
 *   screenInput(text)  -> { allow, reason } : block obvious prompt-injection / jailbreak before the model.
 *   screenOutput(text) -> { allow, text, reason } : catch prompt-leakage / secret-looking output before it's returned.
 *
 * Design notes:
 *  - Conservative by intent: it FLAGS clear attacks; the hardened system prompt (metaprompt) is the real guard.
 *  - Fails OPEN: any internal error returns allow:true so a filter bug never breaks the app.
 *  - This is layer 1. The same interface can later call a managed service (e.g. Azure AI Content Safety
 *    Prompt Shields) by swapping the body of these functions.
 */

// High-confidence prompt-injection / jailbreak patterns.
const INJECTION_PATTERNS = [
  /\bignore\s+(all\s+|any\s+)?(the\s+)?(previous|prior|above|earlier)\s+(instructions|messages|rules|prompts?)\b/i,
  /\bdisregard\s+(all\s+|your\s+|any\s+)?(previous\s+)?(instructions|rules|prompt|guidelines)\b/i,
  /\b(reveal|show|print|repeat|expose|display|output|tell\s+me)\b.{0,40}\b(your\s+)?(system\s+)?(prompt|instructions|rules|guidelines|configuration)\b/i,
  /\bwhat\s+(is|are)\s+your\s+(system\s+)?(prompt|instructions|rules)\b/i,
  /\b(developer|debug|god|dan)\s+mode\b/i,
  /\bjailbreak\b/i,
  /\byou\s+are\s+now\s+(a|an|the)\b/i,
  /\bpretend\s+(you\s+(are|have)|to\s+be)\b.{0,40}\b(no\s+rules|unrestricted|jailbroken|different\s+ai)\b/i,
  /\b(forget|override|bypass)\s+(your\s+)?(rules|instructions|guidelines|restrictions|safety)\b/i,
  /\bact\s+as\s+(if\s+you\s+have\s+no|an\s+unrestricted)\b/i,
];

// Things that should never appear in OUTPUT (signs the system prompt leaked).
const PROMPT_LEAK_MARKERS = [
  /SECURITY\s*&\s*BOUNDARIES/i,
  /VALID ACTION TYPES/i,
  /You are Lumi\s*[—-]\s*the AI best friend/i,
  /Respond ONLY with this exact JSON/i,
];

// Secret-looking strings that should never be echoed to a user.
const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9]{16,}\b/,        // OpenAI-style keys
  /\bya29\.[A-Za-z0-9_\-]+/,         // Google OAuth tokens
  /\bAIza[0-9A-Za-z_\-]{30,}\b/,     // Google API keys
  /\bgsk_[A-Za-z0-9]{20,}\b/,        // Groq keys
  /\beyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/, // JWTs
];

function screenInput(text) {
  try {
    if (!text || typeof text !== 'string') return { allow: true };
    // Only consider it an attack on high-confidence matches to keep false positives low.
    for (const re of INJECTION_PATTERNS) {
      if (re.test(text)) {
        return { allow: false, reason: 'prompt_injection' };
      }
    }
    return { allow: true };
  } catch {
    return { allow: true }; // fail open
  }
}

function screenOutput(text) {
  try {
    if (!text || typeof text !== 'string') return { allow: true, text };
    for (const re of PROMPT_LEAK_MARKERS) {
      if (re.test(text)) {
        return { allow: false, text: "Let's keep going with your day — what would help most right now?", reason: 'prompt_leak' };
      }
    }
    let out = text;
    let redacted = false;
    for (const re of SECRET_PATTERNS) {
      if (re.test(out)) { out = out.replace(re, '[redacted]'); redacted = true; }
    }
    if (redacted) return { allow: true, text: out, reason: 'secret_redacted' };
    return { allow: true, text };
  } catch {
    return { allow: true, text }; // fail open
  }
}

module.exports = { screenInput, screenOutput };
