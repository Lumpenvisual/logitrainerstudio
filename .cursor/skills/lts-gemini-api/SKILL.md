---
name: lts-gemini-api
description: >-
  LogiTrainer Studio Google Gemini integration in Supabase Edge Functions.
  Use when changing AI features, models, GEMINI_API_KEY, or debugging
  generateContent / image / vision in this repo.
---

# LTS Gemini API

## Architecture

All AI edge functions import `supabase/functions/_shared/gemini.ts`:

- **Auth header:** `x-goog-api-key` (keys with `AQ.` prefix from Google AI Studio)
- **Base URL:** `https://generativelanguage.googleapis.com/v1beta`
- **Not** OpenAI-compatible endpoint (AQ keys fail with Bearer there)

## Functions

| Export | Use |
|--------|-----|
| `geminiGenerateText` | Script, marketing, email, agents |
| `geminiStreamAsOpenAI` | Chat copilot (SSE → OpenAI format) |
| `geminiGenerateImage` | Image lab (`gemini-2.5-flash-image`) |
| `geminiAnalyzeImage` | Vision analysis |

## Model registry IDs → Gemini API

App uses `google/gemini-*` IDs in `apiRegistry.ts`; `_shared/gemini.ts` maps to `gemini-2.5-flash`, `gemini-3-flash-preview`, etc.

## Deploy after changes

```powershell
npx supabase functions deploy ai-chat ai-generate-script ai-generate-image ai-analyze-image ai-marketing-content ai-email-sequence agent-orchestrator --project-ref zghzhfheyawvbdddsybe
```

## Secrets policy

- **Production:** `GEMINI_API_KEY` in Supabase Secrets only (`npx supabase secrets set ...`).
- **Local optional:** `.env.local` (gitignored) — copy from `.env.local.example`.
- **Never** commit keys in `.env`, source, or skills.

## Local test (requires key in env, not in repo)

```powershell
$env:GEMINI_API_KEY = "paste-from-aistudio"
node -e "fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts:[{text:'OK'}]}]})}).then(r=>r.json()).then(console.log)"
```

Prefer `npm run test:ai-apis` (all aiService edges) or `npm run test:gemini` (quick). Full gate: `npm run verify:prod`.
