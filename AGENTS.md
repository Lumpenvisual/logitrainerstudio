# LogiTrainer Studio — guía para agentes

Agencia audiovisual automatizada: guion por escenas, assets, timeline, marketing y agentes IA.

## Inicio rápido

```powershell
cd c:\proyectos\logitrainerstudio
npm install
npm run dev
```

**Producción:** https://logitrainerstudio.vercel.app  
**Supabase:** `zghzhfheyawvbdddsybe` (no usar Lovable `bcobgfxepxmmcheuliai`)

## Verificación obligatoria tras cambios de backend/IA

```powershell
npm run audit:lts      # secrets + APIs + build
npm run verify:prod    # audit + Playwright producción
npm run demo:generate  # video demo LogiTrainer → public/demo/logitrainer/
```

Demo en app: `/demo` (reproductor + escenas + features).

## Dónde tocar código

| Tarea | Archivos |
|-------|----------|
| UI principal / vistas | `src/pages/Index.tsx`, `src/components/views/*` |
| Estado del proyecto | `src/store/useProjectStore.ts` |
| Auth / aprobación | `src/hooks/useAuth.tsx`, `useApproval.ts` |
| IA cliente | `src/services/aiService.ts` |
| HTTP edge (sin ISO-8859-1) | `src/lib/edgeClient.ts`, `supabaseHttp.ts` |
| Contexto copilot | `src/lib/studioContext.ts` |
| Edge Functions | `supabase/functions/*/index.ts` |
| E2E | `tests/e2e/*.spec.ts`, `helpers/studio.ts` |

## APIs IA (Gemini vía Supabase Edge)

Todas pasan por `aiService.ts` → `callEdge` / `fetchEdgeStream`:

| Función edge | Uso en UI |
|--------------|-----------|
| `ai-generate-script` | Architect → Generate Script |
| `ai-chat` | ChatPanel copilot (SSE) |
| `ai-generate-image` | Studio / Image Lab |
| `ai-analyze-image` | Análisis de imagen |
| `ai-marketing-content` | Vista Marketing |
| `ai-email-sequence` | Email Builder |
| `agent-orchestrator` | Agent Crew |

**Secret:** `GEMINI_API_KEY` solo en Supabase Secrets (nunca en el repo).

## Credenciales de prueba (producción)

| Uso | Valor |
|-----|--------|
| Site gate | `LTS-Mayo2026-7kQ!` (env `STUDIO_ACCESS_PASSWORD`) |
| Back-office | `backoffice@logitrainerstudio.app` / `LTS-BackOffice-2026!mX` |
| Seed admin | `npm run seed:back-office` |

## Skills Cursor

- `lts-supabase-backend` — Supabase, migraciones, deploy functions
- `lts-edge-client` — `edgeClient.ts`, sin ISO-8859-1
- `lts-gemini-api` — `GEMINI_API_KEY` solo en Secrets
- `lts-e2e-verification` — `verify:prod`, Playwright
- `lts-demo` — video promo, `/demo`, `demo:generate`

Reglas: `.cursor/rules/project-context.mdc`, `lts-backend.mdc`

## Reglas

- Cambios mínimos; no refactors amplios no pedidos
- `npm run build` antes de cerrar cambios grandes
- Variables `VITE_*` requieren redeploy en Vercel
- Rotar claves si se exponen en chat
