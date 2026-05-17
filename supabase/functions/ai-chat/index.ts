import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { GEMINI_TEXT_MODELS, geminiStreamAsOpenAI } from "../_shared/gemini.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireUser(req);
    const { messages, model } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return jsonResponse({ error: "Invalid messages array (1-50 messages)" }, 400);
    }
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== "string" || msg.content.length > 10000) {
        return jsonResponse({ error: "Invalid message format" }, 400);
      }
    }

    const allowed = [...GEMINI_TEXT_MODELS] as string[];
    const selectedModel = allowed.includes(model) ? model : "google/gemini-2.5-flash";
    // Prefer stable flash over preview for chat latency
    const systemMessage = {
      role: "system",
      content: `You are the Neural Assistant for LogiTrainer AI Studio 2.0 Pro — a professional AI video production IDE.
You help with script refinement, visual prompt engineering, voiceover writing, video production workflow, color grading, and sound design.
Be concise, creative, and professional. Use markdown formatting for clarity.`,
    };

    const stream = geminiStreamAsOpenAI({
      model: selectedModel,
      messages: [systemMessage, ...messages],
    });

    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : msg.includes("GEMINI_API_KEY") ? 503 : 500;
    return jsonResponse({ error: msg }, status);
  }
});
