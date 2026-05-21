# Memoria del proyecto — LogiTrainer Studio

**Última actualización:** 2026-05-19  
**Repo:** https://github.com/Lumpenvisual/logitrainerstudio  
**Carpeta local:** `C:\proyectos\logitrainerstudio`  
**Git local:** `main` — **2 commits por delante de `origin/main`** (sin push aún)

---

## Qué es

Plataforma audiovisual con IA (Vite + React + Supabase + Gemini): guion por escenas, imágenes, audio TTS, timeline, marketing, agentes. Incluye **dos editores** en un solo repo.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | **Studio Pro** — Zustand, timeline, paneles marketing, export canvas (`RenderExportPanel`) |
| `/classic` | **Studio clásico** — UI Lovable integrada (repo Rafael), lazy-loaded |
| `/studio` | Hub de acceso unificado (login + dashboard) |
| `/demo` | Demo promocional pública |
| `/auth`, `/profile`, `/about` | Auth y perfil (tras site gate) |

## URLs

| Servicio | URL |
|----------|-----|
| Producción | https://logitrainerstudio.vercel.app |
| Login unificado | `/studio` |
| Demo pública | `/demo` |
| Studio clásico | `/classic` |
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
npm start                    # :8080
npm run build                # chunk classic-studio ~1.9MB lazy; main ~465KB
npm run audit:lts            # secrets + APIs + build
npm run verify:prod          # E2E Playwright vs Vercel (suite completa)
npm run tunnel:verify        # HTTP túnel + 7 tests Playwright (hub, gate, classic)
npm run tunnel:silence       # tareas Windows sin ventanas cmd
npm run tunnel:disable       # desactivar stack local
npm run publish:trycloudflare
npx vercel deploy --prod --yes
```

## Arquitectura clave

| Área | Ubicación |
|------|-----------|
| IA cliente Studio Pro | `src/services/aiService.ts` → `src/lib/edgeClient.ts` |
| IA clásico | `src/services/classic/apiService.ts` (edge `ai-*`) |
| Hub acceso | `src/lib/studioHub.ts`, `src/pages/StudioHub.tsx` |
| Export video canvas | `src/lib/videoRenderer.ts`, `src/lib/sceneAdapters.ts` |
| Classic UI | `src/components/classic-studio/` (52), `src/pages/ClassicStudio.tsx` |
| Edge Gemini | `supabase/functions/_shared/gemini.ts` |
| Code split | `vite.config.ts` → chunks `classic-studio`, `video-renderer` |
| E2E | `tests/e2e/` |

## Integración repo Rafael

Ver **`docs/INTEGRATION-RAFAEL-REPO.md`**. Origen: [rafaelcastro7/logitrainer-a65fca34](https://github.com/rafaelcastro7/logitrainer-a65fca34).

- Navegación cruzada: sidebar Pro (icono cuadrícula) → `/classic`; header clásico → **Studio Pro** → `/`
- Migración `generated_content`; función `generate-music`

## Persistencia túnel (Windows)

- `LogiTrainerStudio-TunnelStack` — al iniciar sesión (puede desactivarse con `tunnel:disable`)
- Scripts: `tunnel-helpers.ps1`, `tunnel-stack-start.ps1`, `run-hidden.vbs`, `silence-tunnel-tasks.ps1`
- Vite sin ventana `cmd`: `Start-LtsViteHidden` en helpers

## Commits recientes (local, sin push)

| Commit | Resumen |
|--------|---------|
| `1a0c405` | Integración Rafael, export canvas, túnel silencioso, E2E |
| `6ef37ad` | Lazy `/classic`, manualChunks, navegación Pro ↔ clásico |

## Documentación

| Archivo | Contenido |
|---------|-----------|
| `AGENTS.md` | Guía agentes |
| `AUDIT-REPORT.md` | Última auditoría |
| `docs/INTEGRATION-RAFAEL-REPO.md` | Fusión Studio clásico |
| `docs/CLOUDFLARE-TUNNEL.md` | Túnel Cloudflare |
| `README.md` | Inicio rápido |
| `.cursor/rules/project-context.mdc` | Regla Cursor always-on |

## Skills Cursor

`lts-supabase-backend`, `lts-edge-client`, `lts-gemini-api`, `lts-e2e-verification`, `lts-demo`, `lts-studio-hub`

## E2E (última verificación 2026-05-21)

| Suite | Resultado |
|-------|-----------|
| `verify:prod` | **13/13** vs Vercel |
| `audit:lts` | OK (secrets + APIs + build) |
| `tunnel:verify` | HTTP túnel + 7 E2E locales (`:8080`) |

*Usar siempre `http://127.0.0.1:8080` para E2E local (no mezclar con Vite en :8081).*

---

*Actualizar este archivo tras cambios mayores de arquitectura o verificación completa.*
