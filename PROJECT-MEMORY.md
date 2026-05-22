# Memoria del proyecto — LogiTrainer Studio

**Última actualización:** 2026-05-22 (sesión abierta)  
**Repo:** https://github.com/Lumpenvisual/logitrainerstudio  
**Carpeta local:** `C:\proyectos\logitrainerstudio`  
**Git:** `main` = `origin/main` @ `eaf3ccb` · **working tree:** integración unificada sin commit (18 M, 1 nuevo, 1 borrado)

---

## Qué es

Plataforma audiovisual con IA (Vite + React + Supabase + Gemini): guion por escenas, imágenes, audio TTS, timeline, marketing, agentes. **Una sola app** en `/` (Studio Pro) con vista integrada **Production Suite** (antes “Studio clásico”).

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | **Studio Pro** — Zustand, timeline, paneles marketing, export canvas; vista `suite` = Production Suite (lazy `classic-studio`) |
| `/classic` | **Solo redirect** → `/` con `state.initialView: "suite"` (compatibilidad bookmarks) |
| `/studio` | Hub de acceso unificado (login + dashboard) — una tarjeta “LogiTrainer Studio” |
| `/demo` | Demo promocional pública |
| `/auth`, `/profile`, `/about` | Auth y perfil (tras site gate) |

## URLs

| Servicio | URL |
|----------|-----|
| Producción | https://logitrainerstudio.vercel.app *(pendiente redeploy con integración unificada)* |
| Login unificado | `/studio` |
| Demo pública | `/demo` |
| Production Suite | Sidebar → **Production Suite** o `/classic` (redirect) |
| Supabase | `zghzhfheyawvbdddsybe` |
| Túnel local (variable) | `TRYCLOUDFLARE-URL.txt` |

## Credenciales (pruebas)

| Uso | Valor |
|-----|--------|
| Hub / site gate | `LTS-Mayo2026-7kQ!` |
| Back-office | `backoffice@logitrainerstudio.app` / `LTS-BackOffice-2026!mX` |

`GEMINI_API_KEY` solo en Supabase Secrets.

## Comandos esenciales

```powershell
cd C:\proyectos\logitrainerstudio
npm install
npm start                    # :8080 (E2E local exigen este puerto)
npm run build                # chunk classic-studio ~1.9MB lazy; main ~465KB
npm run audit:lts            # secrets + APIs + build
npm run verify:prod          # E2E Playwright vs Vercel (tras deploy)
npm run tunnel:verify        # HTTP túnel + 7 tests Playwright
npx playwright test          # local: PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080
npx vercel deploy --prod --yes
```

## Arquitectura clave (unificada)

| Área | Ubicación |
|------|-----------|
| Shell Studio Pro | `src/pages/Index.tsx` — `currentView === 'suite'` → `ClassicStudioWorkspace` |
| Production Suite | `src/components/classic-studio/ClassicStudioWorkspace.tsx` (sin página `/classic` aparte) |
| Salir de suite | `StudioLayout` → `onExitToPro` → vista `architect` |
| Sidebar Pro | `AppSidebar` — botón **Production Suite** (`setView('suite')`), `aria-label` |
| Auth + suite | `Auth.tsx` + `sessionStorage` `lts-pending-view` si redirect desde `/classic` |
| IA cliente Studio Pro | `src/services/aiService.ts` → `src/lib/edgeClient.ts` |
| IA suite | `src/services/classic/apiService.ts` (edge `ai-*`) |
| Hub acceso | `src/lib/studioHub.ts`, `src/pages/StudioHub.tsx` (fix import `FolderGit2`) |
| Export video canvas | `src/lib/videoRenderer.ts`, `src/lib/sceneAdapters.ts` |
| Classic UI | `src/components/classic-studio/` (~52 componentes) |
| Edge Gemini | `supabase/functions/_shared/gemini.ts` |
| Code split | `vite.config.ts` → chunks `classic-studio`, `video-renderer` |
| E2E | `tests/e2e/` — `helpers/studio.ts` (`enterClassicStudio`, `expectHomePath`) |

## Integración repo Rafael

Ver **`docs/INTEGRATION-RAFAEL-REPO.md`**. Origen: [rafaelcastro7/logitrainer-a65fca34](https://github.com/rafaelcastro7/logitrainer-a65fca34).

- **Ya no hay app separada en `/classic`** — todo en Studio Pro
- Navegación: sidebar **Production Suite**; header suite → **Studio Pro**
- Eliminado: `src/pages/ClassicStudio.tsx`

## Estado al abrir (sesión actual)

| Item | Estado |
|------|--------|
| Integración unificada (Studio Pro + Production Suite) | Working tree listo; **prod aún en `eaf3ccb`** |
| Dev server | **http://localhost:8080** — Vite activo (PID en `:8080`) |
| E2E local (última corrida) | 14/14 con código actual |
| Commit sugerido | `Unify Production Suite into Studio Pro; remove separate /classic app` |

### Cambios pendientes de commit

- **App:** `App.tsx`, `Index.tsx`, `Auth.tsx`, `ClassicStudioWorkspace.tsx` (nuevo), eliminado `ClassicStudio.tsx`
- **UI:** `AppSidebar.tsx`, `StudioLayout.tsx`, `StudioHub.tsx` (+ fix `FolderGit2`)
- **Store:** `useProjectStore.ts` (`ViewMode` incluye `suite`)
- **Tests:** `classic-studio.spec.ts`, `helpers/studio.ts`, `studio-hub.spec.ts`
- **Docs:** `PROJECT-MEMORY.md`, `AUDIT-REPORT.md`, `README.md`, `INTEGRATION-RAFAEL-REPO.md`, `.cursor/rules/project-context.mdc`

**Pipeline pendiente:** commit → push → `npx vercel deploy --prod` → `npm run verify:prod`

## E2E (última verificación local 2026-05-21)

| Suite | Resultado |
|-------|-----------|
| Playwright local `:8080` | **14/14** (tras fix assert hub + `FolderGit2`) |
| `audit:lts` | OK |
| `verify:prod` | Pendiente hasta deploy unificado |

## Persistencia túnel (Windows)

- `LogiTrainerStudio-TunnelStack` — al iniciar sesión (`tunnel:disable` para desactivar)
- Scripts: `tunnel-helpers.ps1`, `tunnel-stack-start.ps1`, `run-hidden.vbs`, `silence-tunnel-tasks.ps1`

## Documentación

| Archivo | Contenido |
|---------|-----------|
| `AGENTS.md` | Guía agentes |
| `AUDIT-REPORT.md` | Última auditoría |
| `docs/INTEGRATION-RAFAEL-REPO.md` | Fusión Production Suite |
| `docs/CLOUDFLARE-TUNNEL.md` | Túnel Cloudflare |
| `README.md` | Inicio rápido |
| `.cursor/rules/project-context.mdc` | Regla Cursor always-on |

## Skills Cursor

`lts-supabase-backend`, `lts-edge-client`, `lts-gemini-api`, `lts-e2e-verification`, `lts-demo`, `lts-studio-hub`

---

*Actualizar este archivo tras commit/deploy o verificación completa en prod.*
