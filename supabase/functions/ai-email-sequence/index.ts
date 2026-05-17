import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { geminiGenerateText } from "../_shared/gemini.ts";

const SYSTEM = `You are an elite email marketing strategist. Generate a complete welcome/nurture email sequence using the requested copywriting framework.
Return STRICT JSON: {"name":"...","description":"...","emails":[{"day":0,"subject":"...","preheader":"...","body":"...","cta":"..."}]}
Generate 7 emails total spanning days 0-14. Body should be 200-400 words each, conversational, story-driven.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireUser(req);
    const { topic, framework = "AIDA", audience = "" } = await req.json();

    if (!topic || typeof topic !== "string" || topic.length < 3 || topic.length > 1000) {
      return jsonResponse({ error: "Topic must be 3-1000 chars" }, 400);
    }

    const userMsg = `Create a 7-email sequence for: "${topic.trim()}". Audience: ${audience || "general"}. Use the ${framework} copywriting framework throughout.`;

    const { text, model } = await geminiGenerateText({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMsg }],
      temperature: 0.8,
    });

    let parsed;
    try {
      const m = text.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { raw: text };
    } catch {
      parsed = { raw: text };
    }

    return jsonResponse({ sequence: parsed, framework, model });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : msg.includes("GEMINI_API_KEY") ? 503 : 500;
    return jsonResponse({ error: msg }, status);
  }
});
