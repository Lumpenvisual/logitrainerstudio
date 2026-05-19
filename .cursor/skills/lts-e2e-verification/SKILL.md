---
name: lts-e2e-verification
description: >-
  Run LogiTrainer Studio end-to-end tests against production or local dev.
  Use after Supabase/Gemini/Vercel changes, before closing integration tasks.
---

# LTS E2E verification

## Commands

```powershell
cd c:\proyectos\logitrainerstudio
npm run check:secrets
npm run test:ai-apis         # All Gemini edge functions (aiService parity)
npm run test:gemini          # Quick script + marketing only
$env:PLAYWRIGHT_BASE_URL="https://logitrainerstudio.vercel.app"
npm run verify:prod          # secrets + ai-apis + Playwright (full gate)
```

## Test files

| File | Covers |
|------|--------|
| `tests/e2e/site-access.spec.ts` | Site password gate |
| `tests/e2e/back-office.spec.ts` | Admin login → workspace |
| `tests/e2e/full-flow.spec.ts` | Gate + auth + Gemini API health |
| `tests/e2e/gemini-ai.spec.ts` | UI script generation (Gemini) |
| `tests/e2e/demo-page.spec.ts` | Demo público `/demo` + manifest |

Helpers: `tests/e2e/helpers/studio.ts` — `skipOnboarding()` sets `lt-onboarding-complete`; `enterWorkspaceFromWelcome()` opens a recent project or **New Project → Create & Enter** (avoid template carousel clicks).

## Env (optional)

- `PLAYWRIGHT_BASE_URL` — default `https://logitrainerstudio.vercel.app`
- Túnel: `npm run tunnel:verify` (lee `.cloudflared/quick-tunnel-url.txt`)
- `STUDIO_ACCESS_PASSWORD` — default `LTS-Mayo2026-7kQ!`
- `BACK_OFFICE_EMAIL` / `BACK_OFFICE_PASSWORD` — admin test user

## Prerequisites

- Supabase `GEMINI_API_KEY` secret set
- Back-office user: `npm run seed:back-office`
- Vercel `VITE_SUPABASE_*` env vars populated

## Pass criteria

All Playwright tests green + `npm run test:gemini` OK + `npm run check:secrets` OK.
