// API service layer for all AI functions — secured with auth tokens
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ScriptScene {
  sceneNumber: number;
  sceneType: string;
  durationTargetSec: number;
  visualPrompt: string;
  voiceOverScript: string;
}

export interface APICallResult<T = unknown> {
  data?: T;
  error?: string;
  model?: string;
  latencyMs?: number;
}

// ─── Script Generation ─────────────────────────────────────────────
export async function generateScript(
  brief: string,
  model?: string,
  sceneCount?: number
): Promise<APICallResult<{ scenes: ScriptScene[] }>> {
  const start = performance.now();
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-generate-script`, {
      method: "POST",
      headers,
      body: JSON.stringify({ brief, model, sceneCount }),
    });
    const latencyMs = Math.round(performance.now() - start);
    const data = await res.json();
    if (!res.ok) return { error: data.error || `Error ${res.status}`, latencyMs };
    return { data: { scenes: data.scenes }, model: data.model, latencyMs };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error", latencyMs: Math.round(performance.now() - start) };
  }
}

// ─── Chat (Streaming) ──────────────────────────────────────────────
export async function streamChat(params: {
  messages: { role: string; content: string }[];
  model?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages: params.messages, model: params.model }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      params.onError(data.error || `Error ${res.status}`);
      return;
    }

    if (!res.body) { params.onError("No response body"); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { params.onDone(); return; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) params.onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
    params.onDone();
  } catch (e) {
    params.onError(e instanceof Error ? e.message : "Network error");
  }
}

// ─── Image Generation ───────────────────────────────────────────────
export async function generateImage(
  prompt: string,
  model?: string
): Promise<APICallResult<{ imageUrl: string; description: string }>> {
  const start = performance.now();
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-generate-image`, {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt, model }),
    });
    const latencyMs = Math.round(performance.now() - start);
    const data = await res.json();
    if (!res.ok) return { error: data.error || `Error ${res.status}`, latencyMs };
    return { data: { imageUrl: data.imageUrl, description: data.description }, model: data.model, latencyMs };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error", latencyMs: Math.round(performance.now() - start) };
  }
}

// ─── Image Analysis ─────────────────────────────────────────────────
export async function analyzeImage(
  imageUrl: string,
  prompt?: string,
  model?: string
): Promise<APICallResult<{ analysis: string }>> {
  const start = performance.now();
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-analyze-image`, {
      method: "POST",
      headers,
      body: JSON.stringify({ imageUrl, prompt, model }),
    });
    const latencyMs = Math.round(performance.now() - start);
    const data = await res.json();
    if (!res.ok) return { error: data.error || `Error ${res.status}`, latencyMs };
    return { data: { analysis: data.analysis }, model: data.model, latencyMs };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error", latencyMs: Math.round(performance.now() - start) };
  }
}
