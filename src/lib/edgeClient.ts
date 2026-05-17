/**
 * Unified Supabase Edge Function client.
 * All server calls from the app should go through this module or aiService.ts.
 */
import { SUPABASE_URL } from "@/lib/env";
import { getSupabaseAuthHeaders, invokeEdgeFunction, type InvokeResult } from "@/lib/supabaseHttp";

export type EdgeCallResult<T> = {
  data?: T;
  error?: string;
  latencyMs?: number;
};

export { getSupabaseAuthHeaders, invokeEdgeFunction, type InvokeResult };

export async function callEdge<T>(
  functionName: string,
  body?: unknown,
): Promise<EdgeCallResult<T>> {
  const start = performance.now();
  const { data, error } = await invokeEdgeFunction<T & { error?: string }>(functionName, body);
  const latencyMs = Math.round(performance.now() - start);
  if (error) return { error: error.message, latencyMs };
  if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
    return { error: data.error, latencyMs };
  }
  return { data: data as T, latencyMs };
}

/** Streaming endpoints (ai-chat) — fetch with auth headers. */
export async function fetchEdgeStream(
  functionName: string,
  body: unknown,
): Promise<Response> {
  const headers = await getSupabaseAuthHeaders();
  return fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}
