/**
 * Ocean chat via the Google Gemini API (Generative Language API).
 * Docs: https://ai.google.dev/gemini-api/docs
 *   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=<VITE_GEMINI_API_KEY>
 */

const SYSTEM_PROMPT =
  "You are the OceanEmbed Assistant, a friendly expert on oceanography, marine science, " +
  "sea surface temperature, salinity, currents, sea level, ARGO floats, and ocean-climate topics. " +
  "Answer ocean-related questions clearly and concisely (under 150 words unless asked for more). " +
  "If a question is not about oceans, seas, marine life, or climate, politely say you only cover " +
  "ocean topics and invite an ocean question.";

export function getChatConfig() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  const model = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
  return { apiKey, model };
}

export async function sendOceanChat(history) {
  const { apiKey, model } = getChatConfig();
  if (!apiKey) {
    const err = new Error("missing_key");
    err.code = "missing_key";
    throw err;
  }

  const contents = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-20)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
      }),
    });
  } catch (e) {
    const err = new Error("network");
    err.code = "network";
    throw err;
  }

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    const err = new Error("api_error");
    err.code = res.status === 429 ? "rate_limited" : "unauthorized";
    err.status = res.status;
    // Surface Gemini's own message (e.g. "API key not valid", model-not-found…)
    const detail = data?.error?.message;
    if (typeof detail === "string" && detail.trim()) {
      err.detail = detail.trim().slice(0, 220);
    }
    throw err;
  }
  const parts = data?.candidates?.[0]?.content?.parts;
  const content = Array.isArray(parts)
    ? parts.map((p) => p?.text || "").join("").trim()
    : "";
  if (!content) {
    const err = new Error("empty");
    err.code = data?.promptFeedback?.blockReason ? "blocked" : "empty";
    throw err;
  }
  return content;
}
