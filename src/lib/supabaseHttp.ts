import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_ANON_KEY, SUPABASE_URL, toHeaderValue } from "@/lib/env";

export async function getSupabaseAuthHeaders(): Promise<Headers> {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("apikey", toHeaderValue(SUPABASE_ANON_KEY));

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (token) {
    headers.set("Authorization", `Bearer ${toHeaderValue(token)}`);
  }
  return headers;
}

export type InvokeResult<T> = { data: T | null; error: Error | null };

export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body?: unknown,
): Promise<InvokeResult<T>> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { data: null, error: new Error("Supabase is not configured") };
  }

  try {
    const headers = await getSupabaseAuthHeaders();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await res.text();
    let data: T | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        return { data: null, error: new Error("Invalid response from server") };
      }
    }

    if (!res.ok) {
      const message =
        (data && typeof data === "object" && "error" in data && typeof (data as { error: string }).error === "string"
          ? (data as { error: string }).error
          : null) || `Request failed (${res.status})`;
      return { data, error: new Error(message) };
    }

    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}
