import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { brief, model, sceneCount } = await req.json();

    // Input validation
    if (!brief || typeof brief !== "string" || brief.trim().length < 3 || brief.length > 2000) {
      return new Response(JSON.stringify({ error: "Brief must be 3-2000 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const count = Math.min(Math.max(Math.round(Number(sceneCount) || 4), 1), 12);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const allowedModels = [
      "google/gemini-3-flash-preview", "google/gemini-2.5-pro", "google/gemini-2.5-flash",
      "openai/gpt-5", "openai/gpt-5-mini",
    ];
    const selectedModel = allowedModels.includes(model) ? model : "google/gemini-3-flash-preview";

    const systemPrompt = `You are a professional video script writer. Generate exactly ${count} scenes for a video production.
Return ONLY a valid JSON array with this structure:
[{"sceneNumber":1,"sceneType":"Establishing","durationTargetSec":8,"visualPrompt":"Detailed visual description","voiceOverScript":"Narration text"}]
sceneType: one of "Establishing","Interior","Detail","Action","Closing","Transition". durationTargetSec: 4-12.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a ${count}-scene video script for: ${brief.trim().slice(0, 2000)}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let scenes;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) scenes = JSON.parse(jsonMatch[0]);
      else throw new Error("No JSON array found");
    } catch {
      throw new Error("Failed to parse script from AI response");
    }

    return new Response(JSON.stringify({ scenes, model: selectedModel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
