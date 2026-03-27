import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONTENT_TYPES = {
  "ad-copy": {
    system: `You are an elite digital marketing copywriter. Generate high-converting ad copy.
Return JSON: {"headline":"...","primaryText":"...","description":"...","callToAction":"...","variations":[{"headline":"...","primaryText":"..."}]}`,
    userPrefix: "Create ad copy for",
  },
  "email-sequence": {
    system: `You are an expert email marketing strategist. Create a compelling email sequence.
Return JSON: {"subject":"...","preheader":"...","emails":[{"day":1,"subject":"...","body":"...","cta":"..."}]}`,
    userPrefix: "Create an email sequence for",
  },
  "landing-page": {
    system: `You are a conversion-focused landing page copywriter. Generate landing page copy.
Return JSON: {"headline":"...","subheadline":"...","heroText":"...","features":[{"title":"...","description":"..."}],"testimonialPrompt":"...","ctaText":"...","ctaSubtext":"..."}`,
    userPrefix: "Create landing page copy for",
  },
  "social-calendar": {
    system: `You are a social media strategist. Create a content calendar.
Return JSON: {"posts":[{"day":"Monday","platform":"...","type":"...","caption":"...","hashtags":["..."],"bestTime":"..."}]}`,
    userPrefix: "Create a 7-day social media calendar for",
  },
  "short-script": {
    system: `You are a viral short-form video scriptwriter. Create scripts for Reels/TikTok/Shorts.
Return JSON: {"hook":"...","script":"...","duration":"...","visualCues":["..."],"soundtrack":"...","hashtags":["..."]}`,
    userPrefix: "Create a short-form video script for",
  },
  "seo-keywords": {
    system: `You are an SEO expert. Generate keyword strategy and hashtag recommendations.
Return JSON: {"primaryKeywords":["..."],"longTailKeywords":["..."],"hashtags":["..."],"contentIdeas":["..."],"difficulty":"...","searchVolume":"..."}`,
    userPrefix: "Generate SEO keywords and hashtags for",
  },
  "lead-magnet": {
    system: `You are a lead generation expert. Create a compelling lead magnet concept with full outline.
Return JSON: {"title":"...","type":"...","description":"...","targetAudience":"...","outline":["..."],"landingPageHeadline":"...","optInCTA":"...","deliveryEmail":{"subject":"...","body":"..."}}`,
    userPrefix: "Create a lead magnet concept for",
  },
  "landing-template": {
    system: `You are a world-class landing page architect. Create a complete high-converting landing page structure with all sections.
Return JSON: {"heroSection":{"headline":"...","subheadline":"...","ctaButton":"...","socialProof":"..."},"problemSection":{"headline":"...","painPoints":["..."]},"solutionSection":{"headline":"...","benefits":[{"title":"...","description":"...","icon":"..."}]},"socialProofSection":{"testimonials":[{"name":"...","role":"...","quote":"..."}],"stats":[{"number":"...","label":"..."}]},"pricingSection":{"headline":"...","plans":[{"name":"...","price":"...","features":["..."],"cta":"..."}]},"faqSection":{"questions":[{"q":"...","a":"..."}]},"finalCTA":{"headline":"...","subtext":"...","buttonText":"..."}}`,
    userPrefix: "Create a complete landing page structure for",
  },
  "webhook-trigger": {
    system: `You are a marketing automation architect. Design webhook triggers and automation flows.
Return JSON: {"triggers":[{"event":"...","description":"...","payload":{"fields":["..."]},"suggestedActions":["..."]}],"automationFlow":{"name":"...","steps":[{"type":"...","config":"...","delay":"..."}]}}`,
    userPrefix: "Design automation triggers and flows for",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { contentType, prompt, platform, model } = await req.json();

    if (!contentType || !CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES]) {
      return new Response(JSON.stringify({ error: "Invalid content type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!prompt || typeof prompt !== "string" || prompt.length < 3 || prompt.length > 3000) {
      return new Response(JSON.stringify({ error: "Prompt must be 3-3000 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const config = CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES];
    const allowedModels = [
      "google/gemini-3-flash-preview", "google/gemini-2.5-pro", "google/gemini-2.5-flash",
      "openai/gpt-5", "openai/gpt-5-mini", "openai/gpt-5-nano", "openai/gpt-5.2",
    ];
    const selectedModel = allowedModels.includes(model) ? model : "google/gemini-3-flash-preview";

    const platformContext = platform ? ` for ${platform}` : "";
    const userMessage = `${config.userPrefix}${platformContext}: ${prompt.trim().slice(0, 3000)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: config.system },
          { role: "user", content: userMessage },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Usage limit reached." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      else parsed = { raw: content };
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify({ content: parsed, model: selectedModel, contentType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : 500;
    return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
