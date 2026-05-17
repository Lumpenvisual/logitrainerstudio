/** Google Gemini API (native generateContent) — keys with AQ. prefix use x-goog-api-key. */
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const GEMINI_TEXT_MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-3.1-pro-preview",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-flash-latest",
] as const;

export const GEMINI_IMAGE_MODELS = [
  "google/gemini-2.5-flash-image",
  "google/gemini-3-pro-image-preview",
  "google/gemini-3.1-flash-image-preview",
] as const;

export const GEMINI_TTS_MODELS = [
  "google/gemini-2.5-flash-preview-tts",
] as const;

const TEXT_FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"] as const;

const MODEL_MAP: Record<string, string> = {
  "google/gemini-3-flash-preview": "gemini-3-flash-preview",
  "google/gemini-3.1-pro-preview": "gemini-2.5-pro",
  "google/gemini-2.5-pro": "gemini-2.5-pro",
  "google/gemini-2.5-flash": "gemini-2.5-flash",
  "google/gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
  "google/gemini-flash-latest": "gemini-flash-latest",
  "google/gemini-2.5-flash-image": "gemini-2.5-flash-image",
  "google/gemini-3-pro-image-preview": "gemini-3-pro-image-preview",
  "google/gemini-3.1-flash-image-preview": "gemini-3.1-flash-image-preview",
  "google/gemini-2.5-flash-preview-tts": "gemini-2.5-flash-preview-tts",
  "openai/gpt-5": "gemini-2.5-pro",
  "openai/gpt-5-mini": "gemini-2.5-flash",
  "openai/gpt-5-nano": "gemini-2.5-flash-lite",
  "openai/gpt-5.2": "gemini-2.5-pro",
};

export function getGeminiApiKey(): string {
  const key = Deno.env.get("GEMINI_API_KEY") ?? Deno.env.get("GOOGLE_API_KEY");
  if (!key?.trim()) throw new Error("GEMINI_API_KEY is not configured");
  return key.trim();
}

export function resolveGeminiModel(registryId: string | undefined, fallback: string): string {
  if (registryId && MODEL_MAP[registryId]) return MODEL_MAP[registryId];
  if (registryId?.startsWith("gemini-")) return registryId.replace(/^models\//, "");
  return fallback;
}

type GeminiMessage = { role: string; content: string };

function toGeminiContents(messages: GeminiMessage[]) {
  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const msg of messages) {
    if (msg.role === "system") continue;
    const role = msg.role === "assistant" ? "model" : "user";
    contents.push({ role, parts: [{ text: msg.content }] });
  }
  return contents;
}

function systemFromMessages(messages: GeminiMessage[]): string | undefined {
  const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  return sys || undefined;
}

async function geminiGenerateTextOnce(params: {
  model: string;
  messages: GeminiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<{ text: string; model: string; totalTokens: number }> {
  const apiKey = getGeminiApiKey();
  const model = resolveGeminiModel(params.model, "gemini-2.5-flash");
  const systemInstruction = systemFromMessages(params.messages);
  const body: Record<string, unknown> = {
    contents: toGeminiContents(params.messages),
    generationConfig: {
      temperature: params.temperature ?? 0.7,
      maxOutputTokens: params.maxOutputTokens ?? 8192,
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error("Rate limit exceeded.");
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("") ?? "";
  const totalTokens = data.usageMetadata?.totalTokenCount ?? 0;
  return { text, model: `google/${model}`, totalTokens };
}

/** Text generation with automatic fallback when preview models fail or rate-limit. */
export async function geminiGenerateText(params: {
  model: string;
  messages: GeminiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<{ text: string; model: string; totalTokens: number }> {
  const primary = resolveGeminiModel(params.model, "gemini-2.5-flash");
  const chain = [primary, ...TEXT_FALLBACK_MODELS.filter((m) => m !== primary)];
  let lastErr: Error | undefined;
  for (const modelId of chain) {
    try {
      return await geminiGenerateTextOnce({ ...params, model: `google/${modelId}` });
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      const retryable =
        lastErr.message.includes("429") ||
        lastErr.message.includes("503") ||
        lastErr.message.includes("404") ||
        lastErr.message.includes("not found");
      if (!retryable) throw lastErr;
    }
  }
  throw lastErr ?? new Error("Gemini text generation failed");
}

/** OpenAI-style SSE for existing ChatPanel stream parser. */
export function geminiStreamAsOpenAI(params: {
  model: string;
  messages: GeminiMessage[];
  temperature?: number;
}): ReadableStream<Uint8Array> {
  const apiKey = getGeminiApiKey();
  const model = resolveGeminiModel(params.model, "gemini-2.5-flash");
  const systemInstruction = systemFromMessages(params.messages);
  const body: Record<string, unknown> = {
    contents: toGeminiContents(params.messages),
    generationConfig: { temperature: params.temperature ?? 0.7 },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(`${GEMINI_BASE}/models/${model}:streamGenerateContent?alt=sse`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errText = await res.text();
          const payload = JSON.stringify({ error: `Gemini ${res.status}: ${errText.slice(0, 200)}` });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          controller.close();
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let lineEnd: number;
          while ((lineEnd = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);
            if (!line.startsWith("data:")) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (chunk) {
                const oai = JSON.stringify({ choices: [{ delta: { content: chunk } }] });
                controller.enqueue(encoder.encode(`data: ${oai}\n\n`));
              }
            } catch {
              /* partial json */
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Stream failed";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        controller.close();
      }
    },
  });
}

export async function geminiGenerateImage(params: {
  prompt: string;
  model?: string;
}): Promise<{ imageUrl: string; description: string; model: string }> {
  const apiKey = getGeminiApiKey();
  const model = resolveGeminiModel(params.model, "gemini-2.5-flash-image");

  const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: params.prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error("Rate limit exceeded.");
    throw new Error(`Gemini image error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  let imageUrl = "";
  let description = "";
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType || "image/png";
      imageUrl = `data:${mime};base64,${part.inlineData.data}`;
    }
    if (part.text) description += part.text;
  }
  if (!imageUrl) throw new Error("No image returned from Gemini");
  return { imageUrl, description, model: `google/${model}` };
}

export async function geminiGenerateSpeech(params: {
  text: string;
  model?: string;
  language?: string;
}): Promise<{ audioUrl: string; mimeType: string; model: string }> {
  const apiKey = getGeminiApiKey();
  const model = resolveGeminiModel(params.model, "gemini-2.5-flash-preview-tts");
  const script = params.text.trim().slice(0, 1500);
  if (script.length < 2) throw new Error("Script must be at least 2 characters");

  const lang = params.language?.trim() || "es";
  const prompt =
    lang.startsWith("es")
      ? `Lee en voz clara y profesional, tono cálido de locutor:\n\n${script}`
      : `Read clearly in a warm professional narrator voice:\n\n${script}`;

  const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: lang.startsWith("es") ? "Aoede" : "Kore" },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error("Rate limit exceeded.");
    throw new Error(`Gemini TTS error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mimeType = part.inlineData.mimeType || "audio/wav";
      return {
        audioUrl: `data:${mimeType};base64,${part.inlineData.data}`,
        mimeType,
        model: `google/${model}`,
      };
    }
  }
  throw new Error("No audio returned from Gemini TTS");
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function urlToInlinePart(imageUrl: string): Promise<{ inlineData: { mimeType: string; data: string } }> {
  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid data URL");
    return { inlineData: { mimeType: match[1], data: match[2] } };
  }
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error("Failed to fetch image for analysis");
  const buf = new Uint8Array(await res.arrayBuffer());
  const mime = res.headers.get("content-type") || "image/jpeg";
  return { inlineData: { mimeType: mime, data: bytesToBase64(buf) } };
}

export async function geminiAnalyzeImage(params: {
  imageUrl: string;
  prompt?: string;
  model?: string;
}): Promise<{ analysis: string; model: string }> {
  const apiKey = getGeminiApiKey();
  const model = resolveGeminiModel(params.model, "gemini-2.5-flash");
  const imagePart = await urlToInlinePart(params.imageUrl);
  const text = params.prompt?.trim() || "Describe this image in detail for video production.";

  const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [imagePart, { text }] }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini vision error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const analysis = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  return { analysis, model: `google/${model}` };
}
