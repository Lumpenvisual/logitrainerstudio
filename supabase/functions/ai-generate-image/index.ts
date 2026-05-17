import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { GEMINI_IMAGE_MODELS, geminiGenerateImage } from "../_shared/gemini.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireUser(req);
    const { prompt, model } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3 || prompt.length > 2000) {
      return jsonResponse({ error: "Prompt must be 3-2000 characters" }, 400);
    }

    const selectedModel = (GEMINI_IMAGE_MODELS as readonly string[]).includes(model)
      ? model
      : "google/gemini-2.5-flash-image";

    const result = await geminiGenerateImage({
      prompt: `Generate a cinematic, high-quality image: ${prompt.trim().slice(0, 2000)}. Style: photorealistic, cinematic lighting, 16:9 aspect ratio.`,
      model: selectedModel,
    });

    return jsonResponse(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : msg.includes("GEMINI_API_KEY") ? 503 : 500;
    return jsonResponse({ error: msg }, status);
  }
});
