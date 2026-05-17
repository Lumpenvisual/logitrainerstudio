// API service layer — all Supabase Edge Function calls
import { callEdge, fetchEdgeStream, type EdgeCallResult } from "@/lib/edgeClient";

export interface ScriptScene {
  sceneNumber: number;
  sceneType: string;
  durationTargetSec: number;
  visualPrompt: string;
  voiceOverScript: string;
}

export type APICallResult<T = unknown> = EdgeCallResult<T>;

export async function generateScript(
  brief: string,
  model?: string,
  sceneCount?: number,
): Promise<APICallResult<{ scenes: ScriptScene[] }>> {
  const res = await callEdge<{ scenes: ScriptScene[]; model?: string }>("ai-generate-script", {
    brief,
    model,
    sceneCount,
  });
  if (res.error) return res;
  return { data: { scenes: res.data?.scenes ?? [] }, model: res.data?.model, latencyMs: res.latencyMs };
}

export async function streamChat(params: {
  messages: { role: string; content: string }[];
  model?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const res = await fetchEdgeStream("ai-chat", {
      messages: params.messages,
      model: params.model,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      params.onError((data as { error?: string }).error || `Error ${res.status}`);
      return;
    }

    if (!res.body) {
      params.onError("No response body");
      return;
    }

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
        if (jsonStr === "[DONE]") {
          params.onDone();
          return;
        }
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

export async function generateAudio(
  text: string,
  model?: string,
  language?: string,
): Promise<APICallResult<{ audioUrl: string; mimeType: string }>> {
  const res = await callEdge<{ audioUrl: string; mimeType: string; model?: string }>("ai-generate-audio", {
    text,
    model,
    language,
  });
  if (res.error) return res;
  return {
    data: { audioUrl: res.data?.audioUrl ?? "", mimeType: res.data?.mimeType ?? "audio/wav" },
    model: res.data?.model,
    latencyMs: res.latencyMs,
  };
}

export async function generateImage(
  prompt: string,
  model?: string,
): Promise<APICallResult<{ imageUrl: string; description: string }>> {
  const res = await callEdge<{ imageUrl: string; description: string; model?: string }>(
    "ai-generate-image",
    { prompt, model },
  );
  if (res.error) return res;
  return {
    data: {
      imageUrl: res.data?.imageUrl ?? "",
      description: res.data?.description ?? "",
    },
    model: res.data?.model,
    latencyMs: res.latencyMs,
  };
}

export async function analyzeImage(
  imageUrl: string,
  prompt?: string,
  model?: string,
): Promise<APICallResult<{ analysis: string }>> {
  const res = await callEdge<{ analysis: string; model?: string }>("ai-analyze-image", {
    imageUrl,
    prompt,
    model,
  });
  if (res.error) return res;
  return {
    data: { analysis: res.data?.analysis ?? "" },
    model: res.data?.model,
    latencyMs: res.latencyMs,
  };
}

export async function generateMarketingContent(params: {
  contentType: string;
  prompt: string;
  platform?: string;
  model?: string;
}): Promise<APICallResult<{ content: string }>> {
  const res = await callEdge<{ content: string }>("ai-marketing-content", {
    contentType: params.contentType,
    prompt: params.prompt,
    platform: params.platform,
    model: params.model ?? "google/gemini-2.5-flash",
  });
  if (res.error) return res;
  return { data: { content: res.data?.content ?? "" }, latencyMs: res.latencyMs };
}

export async function generateEmailSequence(params: {
  topic: string;
  framework: string;
  audience?: string;
}): Promise<APICallResult<{ sequence: { name?: string; description?: string; emails: unknown[] } }>> {
  const res = await callEdge<{ sequence: { name?: string; description?: string; emails: unknown[] } }>(
    "ai-email-sequence",
    params,
  );
  if (res.error) return res;
  return { data: { sequence: res.data?.sequence ?? { emails: [] } }, latencyMs: res.latencyMs };
}

export async function runAgentOrchestrator(params: {
  mode: "agent" | "crew";
  agentId?: string;
  crewId?: string;
  input: string;
}): Promise<
  APICallResult<{
    executionId?: string;
    tokens?: number;
    totalTokens?: number;
    latency?: number;
    results?: unknown[];
  }>
> {
  const body =
    params.mode === "agent"
      ? { mode: "agent", agentId: params.agentId, input: params.input }
      : { mode: "crew", crewId: params.crewId, input: params.input };
  return callEdge("agent-orchestrator", body);
}

export async function verifySiteAccess(password: string): Promise<APICallResult<{ success: boolean }>> {
  const res = await callEdge<{ success?: boolean }>("verify-site-access", { password });
  if (res.error) return res;
  return { data: { success: res.data?.success === true }, latencyMs: res.latencyMs };
}
