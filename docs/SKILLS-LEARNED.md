# Skills aprendidos — LogiTrainer Studio

Resumen consolidado de los 6 skills en `.cursor/skills/`.  
**Proyecto guardado:** `main` @ `ec1f0bb` · Prod: https://logitrainerstudio.vercel.app

---

## 1. `lts-studio-hub` — Acceso y túnel

**Aprendí:**
- Login único en `/studio/login` con `UnifiedLoginScreen` + `useUnifiedLogin` (no solo contraseña del hub).
- Sesión: `lts_studio_hub_session` + `lts_site_access` (7 días), sincronizados en `studioHub.ts` / `siteAccess.ts`.
- `SiteAccessGuard` redirige rutas protegidas (`/`, `/profile`, etc.) a `/studio/login`.
- `TunnelRootRedirect`: en host túnel, `/` → `/studio`.
- Hub en Vercel: tarjeta “LogiTrainer Studio” activa (misma app en prod).
- Túnel: `npm run publish:trycloudflare`, `tunnel:verify` (8 E2E + HTTP 200).

**Archivos:** `StudioHub.tsx`, `studioHub.ts`, `UnifiedLoginScreen.tsx`, `TunnelRootRedirect.tsx`

---

## 2. `lts-e2e-verification` — Verificación E2E

**Aprendí:**
- Gate completo: `npm run verify:prod` = secrets + `test:ai-apis` + **14** tests Playwright.
- Base URL prod: `https://logitrainerstudio.vercel.app` (`playwright.config.ts`).
- Local: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080`, puerto **8080** obligatorio.
- Helpers: `unifiedLogin()`, `passSiteGate()`, `loginAsBackOffice()`, `enterClassicStudio()`, `expectHomePath()`.
- Cuenta tests: `backoffice@logitrainerstudio.app` / `LTS-Mayo2026-7kQ!` (`helpers/studio.ts`).
- Suites: hub, site-access, back-office, classic-studio (suite integrada), full-flow, gemini-ai, demo.

**Criterio de cierre:** 14/14 Playwright + `audit:lts` OK.

---

## 3. `lts-supabase-backend` — Backend Supabase

**Aprendí:**
- Proyecto canónico: `zghzhfheyawvbdddsybe` (no Lovable `bcobgfxepxmmcheuliai`).
- Migraciones: site gate, back_office_config, `verify_site_access`, `bootstrap_back_office`.
- Secrets: `GEMINI_API_KEY`, `SITE_ACCESS_PASSWORD`, `BACK_OFFICE_SETUP_SECRET`.
- Back-office: `useApproval`, `admin-approve-user`, seed `npm run sync:unified-password` (= `seed-back-office`).
- Site gate: edge → RPC → hash cliente; sesión back-office salta gate.

**Deploy functions:** ver lista en skill `lts-supabase-backend/SKILL.md`.

---

## 4. `lts-edge-client` — Cliente Edge

**Aprendí:**
- Flujo único: `supabaseHttp.ts` → `edgeClient.ts` (`callEdge`, `fetchEdgeStream`) → `aiService.ts` / `adminService.ts`.
- **Prohibido:** `supabase.functions.invoke` (headers ISO-8859-1).
- **Prohibido:** `fetch` directo a `/functions/v1/` desde paneles.
- Streaming solo en `ai-chat` vía `fetchEdgeStream`.
- Nueva función: deploy + wrapper en `aiService` + UI vía servicio.

---

## 5. `lts-gemini-api` — Gemini en Edge

**Aprendí:**
- Todo en `supabase/functions/_shared/gemini.ts`, header `x-goog-api-key`, base `generativelanguage.googleapis.com/v1beta`.
- Funciones: script, chat (SSE), imagen, visión, marketing, email, `agent-orchestrator`.
- Claves `AQ.*` de AI Studio — no usar endpoint OpenAI con Bearer.
- Probar: `npm run test:ai-apis`; nunca commitear `GEMINI_API_KEY`.

---

## 6. `lts-demo` — Demo pública

**Aprendí:**
- `/demo` fuera de `SiteAccessGuard` — sin login.
- Assets: `public/demo/logitrainer/` (MP4 + manifest).
- Generar: `npm run demo:generate` (guion → imágenes → TTS → FFmpeg).
- `prebuild` / `ensure-demo.mjs` valida assets antes del build.

---

## Cuenta unificada (transversal a skills)

| Campo | Valor |
|-------|--------|
| Correo | `backoffice@logitrainerstudio.app` |
| Contraseña | `LTS-Mayo2026-7kQ!` |

Definido en `src/lib/unifiedCredentials.ts`. `/auth` redirige a `/studio/login`.

---

## Comandos que los skills asumen

```powershell
npm run audit:lts
npm run verify:prod
npm run sync:unified-password   # .env.local + SUPABASE_SERVICE_ROLE_KEY
npm run publish:trycloudflare
npm run tunnel:verify
npx vercel deploy --prod --yes
```

---

*Regenerar este doc si se añaden skills o cambia la arquitectura.*
