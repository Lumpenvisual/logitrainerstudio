import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { GEMINI_TEXT_MODELS, geminiGenerateText } from "../_shared/gemini.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireUser(req);
    const { brief, model, sceneCount } = await req.json();

    if (!brief || typeof brief !== "string" || brief.trim().length < 3 || brief.length > 2000) {
      return jsonResponse({ error: "Brief must be 3-2000 characters" }, 400);
    }
    const count = Math.min(Math.max(Math.round(Number(sceneCount) || 4), 1), 12);
    const allowed = [...GEMINI_TEXT_MODELS] as string[];
    const selectedModel = allowed.includes(model) ? model : "google/gemini-2.5-flash";

    const systemPrompt = `You are a professional video script writer. Generate exactly ${count} scenes for a video production.
Return ONLY a valid JSON array with this structure:
[{"sceneNumber":1,"sceneType":"Establishing","durationTargetSec":8,"visualPrompt":"Detailed visual description","voiceOverScript":"Narration text"}]
sceneType: one of "Establishing","Interior","Detail","Action","Closing","Transition". durationTargetSec: 4-12.`;

    const { text, model: usedModel } = await geminiGenerateText({
      model: selectedModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a ${count}-scene video script for: ${brief.trim().slice(0, 2000)}` },
      ],
      temperature: 0.7,
    });

    let scenes;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) scenes = JSON.parse(jsonMatch[0]);
      else throw new Error("No JSON array found");
    } catch {
      throw new Error("Failed to parse script from AI response");
    }

    return jsonResponse({ scenes, model: usedModel });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : msg.includes("GEMINI_API_KEY") ? 503 : 500;
    return jsonResponse({ error: msg }, status);
  }
});
