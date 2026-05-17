import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { GEMINI_TEXT_MODELS, geminiGenerateText } from "../_shared/gemini.ts";

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
    await requireUser(req);
    const { contentType, prompt, platform, model } = await req.json();

    if (!contentType || !CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES]) {
      return jsonResponse({ error: "Invalid content type" }, 400);
    }
    if (!prompt || typeof prompt !== "string" || prompt.length < 3 || prompt.length > 3000) {
      return jsonResponse({ error: "Prompt must be 3-3000 characters" }, 400);
    }

    const config = CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES];
    const allowed = [...GEMINI_TEXT_MODELS, "openai/gpt-5", "openai/gpt-5-mini", "openai/gpt-5-nano", "openai/gpt-5.2"] as string[];
    const selectedModel = allowed.includes(model) ? model : "google/gemini-2.5-flash";

    const platformContext = platform ? ` for ${platform}` : "";
    const userMessage = `${config.userPrefix}${platformContext}: ${prompt.trim().slice(0, 3000)}`;

    const { text, model: usedModel } = await geminiGenerateText({
      model: selectedModel,
      messages: [{ role: "system", content: config.system }, { role: "user", content: userMessage }],
      temperature: 0.8,
    });

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };
    } catch {
      parsed = { raw: text };
    }

    return jsonResponse({ content: parsed, model: usedModel, contentType });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "Unauthorized" ? 401 : msg.includes("GEMINI_API_KEY") ? 503 : 500;
    return jsonResponse({ error: msg }, status);
  }
});
