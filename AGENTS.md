# LogiTrainer Studio — guía para agentes

Agencia audiovisual automatizada: guion por escenas, assets, timeline, marketing y agentes IA. **Una app** en `/` (Studio Pro + Production Suite integrada).

## Inicio rápido

```powershell
cd c:\proyectos\logitrainerstudio
npm install
npm start          # :8080
```

**Producción:** https://logitrainerstudio.vercel.app  
**Login unificado:** https://logitrainerstudio.vercel.app/studio/login  
**Cuenta:** `backoffice@logitrainerstudio.app` / `LTS-Mayo2026-7kQ!`  
**Supabase:** `zghzhfheyawvbdddsybe`  
**Memoria:** `PROJECT-MEMORY.md` | **Skills:** `docs/SKILLS-LEARNED.md` | **Auditoría:** `AUDIT-REPORT.md`

## Verificación obligatoria tras cambios

```powershell
npm run audit:lts
npm run verify:prod    # 14 E2E + APIs
npm run tunnel:verify
npm run demo:generate
```

## Dónde tocar código

| Tarea | Archivos |
|-------|----------|
| App shell / suite | `src/pages/Index.tsx`, `ClassicStudioWorkspace.tsx` |
| Login unificado | `UnifiedLoginScreen.tsx`, `useUnifiedLogin.ts`, `unifiedCredentials.ts` |
| Hub / gate | `StudioHub.tsx`, `SiteAccessGuard.tsx`, `studioHub.ts` |
| Estado Pro | `src/store/useProjectStore.ts` |
| IA cliente | `src/services/aiService.ts`, `src/lib/edgeClient.ts` |
| Edge Functions | `supabase/functions/*/index.ts` |
| E2E | `tests/e2e/*.spec.ts`, `helpers/studio.ts` |

## APIs IA (Gemini vía Supabase Edge)

| Función edge | Uso en UI |
|--------------|-----------|
| `ai-generate-script` | Architect |
| `ai-chat` | ChatPanel (SSE) |
| `ai-generate-image` | Studio / Image Lab |
| `ai-analyze-image` | Visión |
| `ai-marketing-content` | Marketing |
| `ai-email-sequence` | Email Builder |
| `agent-orchestrator` | Agent Crew |

**Secret:** `GEMINI_API_KEY` solo en Supabase Secrets.

## Skills Cursor (guardados en `.cursor/skills/`)

| Skill | Tema |
|-------|------|
| `lts-studio-hub` | `/studio`, túnel, login unificado |
| `lts-e2e-verification` | Playwright 14 tests, verify:prod |
| `lts-supabase-backend` | Migraciones, functions, back-office |
| `lts-edge-client` | edgeClient, aiService |
| `lts-gemini-api` | Gemini _shared/gemini.ts |
| `lts-demo` | `/demo`, demo:generate |

Índice: `.cursor/skills/README.md` · Resumen aprendido: `docs/SKILLS-LEARNED.md`

Reglas: `.cursor/rules/project-context.mdc`, `lts-backend.mdc`

## Reglas

- Cambios mínimos; no refactors amplios no pedidos
- No commitear secretos
- Tras backend/IA: `verify:prod` antes de cerrar tarea
