---
name: lts-e2e-verification
description: >-
  Run LogiTrainer Studio end-to-end tests against production or local dev.
  Use after Supabase/Gemini/Vercel/UI changes, before closing integration tasks.
---

# LTS E2E verification

## Commands

```powershell
cd c:\proyectos\logitrainerstudio
npm run check:secrets
npm run test:ai-apis
$env:PLAYWRIGHT_BASE_URL="https://logitrainerstudio.vercel.app"
npm run verify:prod          # secrets + ai-apis + 14 Playwright tests
$env:PLAYWRIGHT_BASE_URL="http://127.0.0.1:8080"
npx playwright test          # local (npm start en :8080)
npm run tunnel:verify        # túnel + 8 E2E subset
npm run audit:lts            # secrets + APIs + build
```

## Test files (14 total)

| File | Covers |
|------|--------|
| `studio-hub.spec.ts` | Login unificado, logout |
| `site-access.spec.ts` | Gate → app |
| `back-office.spec.ts` | Admin → workspace |
| `classic-studio.spec.ts` | Suite integrada, `/classic` redirect, hub |
| `full-flow.spec.ts` | Unified login + Gemini API |
| `gemini-ai.spec.ts` | UI script generation |
| `demo-page.spec.ts` | `/demo` público |

Helpers: `tests/e2e/helpers/studio.ts`

- `unifiedLogin()` — correo + contraseña en `/studio/login`
- `passSiteGate()` — alias de unifiedLogin
- `loginAsBackOffice()` — hub + `/` workspace
- `enterClassicStudio()` — vista `suite`
- `supabasePasswordLogin(request)` — API con fallback legacy
- `skipOnboarding()` — `lt-onboarding-complete`

## Env (optional)

| Variable | Default |
|----------|---------|
| `PLAYWRIGHT_BASE_URL` | `https://logitrainerstudio.vercel.app` |
| `STUDIO_ACCESS_PASSWORD` | `LTS-Mayo2026-7kQ!` |
| `BACK_OFFICE_EMAIL` | `backoffice@logitrainerstudio.app` |
| `BACK_OFFICE_PASSWORD` | mismo que `STUDIO_ACCESS_PASSWORD` |

## Prerequisites

- `GEMINI_API_KEY` en Supabase Secrets
- Back-office: `npm run sync:unified-password` (service role en `.env.local`)
- Vercel `VITE_SUPABASE_*` configurado

## Pass criteria

**14/14** Playwright + `test:ai-apis` OK + `check:secrets` OK.
