import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { GEMINI_TEXT_MODELS, geminiAnalyzeImage } from "../_shared/gemini.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireUser(req);
    const { imageUrl, prompt, model } = await req.json();

    if (!imageUrl || typeof imageUrl !== "string" || imageUrl.length > 8_000_000) {
      return jsonResponse({ error: "Valid imageUrl required" }, 400);
    }
    if (!imageUrl.startsWith("data:")) {
      try {
        new URL(imageUrl);
      } catch {
        return jsonResponse({ error: "Invalid URL format" }, 400);
      }
    }
    if (prompt && (typeof prompt !== "string" || prompt.length > 2000)) {
      return jsonResponse({ error: "Prompt must be under 2000 chars" }, 400);
    }

    const selectedModel = (GEMINI_TEXT_MODELS as readonly string[]).includes(model)
      ? model
      : "google/gemini-2.5-flash";

    const analysisPrompt = (prompt && prompt.trim()) ||
      `Analyze this image for video production. Provide: Composition, Lighting, Color Palette, Cinematography, Mood & Tone, Improvements. Be concise and professional.`;

    const { analysis, model: usedModel } = await geminiAnalyzeImage({
      imageUrl,
      prompt: analysisPrompt,
      model: selectedModel,
    });

    return jsonResponse({ analysis, model: usedModel });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : msg.includes("GEMINI_API_KEY") ? 503 : 500;
    return jsonResponse({ error: msg }, status);
  }
});
