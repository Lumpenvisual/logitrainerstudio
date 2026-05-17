import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { GEMINI_TTS_MODELS, geminiGenerateSpeech } from "../_shared/gemini.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireUser(req);
    const { text, model, language } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length < 2 || text.length > 1500) {
      return jsonResponse({ error: "Text must be 2-1500 characters" }, 400);
    }

    const selectedModel = (GEMINI_TTS_MODELS as readonly string[]).includes(model)
      ? model
      : "google/gemini-2.5-flash-preview-tts";

    const result = await geminiGenerateSpeech({
      text: text.trim(),
      model: selectedModel,
      language: typeof language === "string" ? language : "es",
    });

    return jsonResponse(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : msg.includes("GEMINI_API_KEY") ? 503 : 500;
    return jsonResponse({ error: msg }, status);
  }
});
