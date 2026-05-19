# Memoria del proyecto — LogiTrainer Studio

**Última verificación:** 2026-05-19  
**Repo:** https://github.com/Lumpenvisual/logitrainerstudio  
**Carpeta local:** `C:\proyectos\logitrainerstudio`

---

## Qué es

Plataforma audiovisual con IA (Vite + React + Supabase + Gemini): guion por escenas, imágenes, audio TTS, timeline, marketing, agentes.

## URLs

| Servicio | URL |
|----------|-----|
| Producción | https://logitrainerstudio.vercel.app |
| Login unificado | `/studio` |
| Demo pública | `/demo` |
| Supabase | `zghzhfheyawvbdddsybe` |
| Túnel local (variable) | Ver `TRYCLOUDFLARE-URL.txt` |

## Credenciales (pruebas)

| Uso | Valor |
|-----|--------|
| Hub / site gate | `LTS-Mayo2026-7kQ!` |
| Back-office | `backoffice@logitrainerstudio.app` / `LTS-BackOffice-2026!mX` |

`GEMINI_API_KEY` solo en Supabase Secrets.

## Comandos esenciales

```powershell
npm install
npm start                    # :8080
npm run audit:lts            # secrets + APIs + build
npm run verify:prod          # + E2E 10 tests producción
npm run publish:trycloudflare  # túnel :8080 → trycloudflare.com
npm run tunnel:verify        # E2E 4 tests vía túnel
npx vercel deploy --prod --yes
```

## Arquitectura clave

- **IA cliente:** `src/services/aiService.ts` → `src/lib/edgeClient.ts`
- **Hub acceso:** `src/lib/studioHub.ts`, `src/pages/StudioHub.tsx`
- **Edge Gemini:** `supabase/functions/_shared/gemini.ts`
- **E2E:** `tests/e2e/`, `npm run verify:prod`

## Persistencia túnel (Windows)

- `LogiTrainerStudio-TunnelStack` — al iniciar sesión
- `LogiTrainerStudio-TunnelWatchdog` — cada 5 min
- Scripts: `scripts/tunnel-stack.ps1`, `publish-trycloudflare.ps1`

## Documentación

| Archivo | Contenido |
|---------|-----------|
| `AGENTS.md` | Guía agentes |
| `AUDIT-REPORT.md` | Última auditoría |
| `docs/CLOUDFLARE-TUNNEL.md` | Túnel Cloudflare |
| `README.md` | Inicio rápido |
| `.cursor/rules/project-context.mdc` | Regla Cursor always-on |

## Skills Cursor

`lts-supabase-backend`, `lts-edge-client`, `lts-gemini-api`, `lts-e2e-verification`, `lts-demo`, `lts-studio-hub`

## Últimos resultados E2E

| Suite | Resultado |
|-------|-----------|
| `verify:prod` (Vercel) | 10/10 |
| `tunnel:verify` (trycloudflare) | 4/4 |
| `audit:lts` | OK |

---

*Actualizar este archivo tras cambios mayores de arquitectura o verificación completa.*
