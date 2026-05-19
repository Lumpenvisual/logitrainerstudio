# lts-studio-hub — Acceso unificado /studio + túnel

## Cuándo usar

Login único, dashboard de accesos, Cloudflare Quick Tunnel, persistencia local.

## URLs

| Entorno | URL |
|---------|-----|
| Producción | https://logitrainerstudio.vercel.app/studio |
| Quick Tunnel | `.cloudflared/quick-tunnel-url.txt` o `TRYCLOUDFLARE-URL.txt` |
| Local | http://localhost:8080/studio |

**Contraseña hub:** `LTS-Mayo2026-7kQ!` — `src/lib/studioHub.ts`, `localStorage` key `lts_studio_hub_session` (7 días, sync con `lts_site_access`).

## Código

| Pieza | Ruta |
|-------|------|
| Lógica sesión | `src/lib/studioHub.ts` |
| Login / dashboard | `src/pages/StudioHub.tsx` |
| Hook | `src/hooks/useStudioAuth.ts` |
| Guard rutas app | `src/components/SiteAccessGuard.tsx` → `/studio/login` |
| Redirect túnel `/` → `/studio` | `src/components/TunnelRootRedirect.tsx` |

## Comandos túnel

```powershell
npm run publish:trycloudflare   # Publicar :8080 en trycloudflare.com
npm run tunnel:verify           # E2E 4 tests vía túnel
npm run tunnel:stack            # Arrancar Vite + cloudflared
npm run tunnel:stack:stop
```

Persistencia Windows: `LogiTrainerStudio-TunnelStack`, `LogiTrainerStudio-TunnelWatchdog`.

## E2E

`tests/e2e/studio-hub.spec.ts`, `site-access.spec.ts` — `helpers/studio.ts` → `passSiteGate()` usa `/studio/login`.

## Dominio fijo

`studio.logitrainerstudio.com` requiere `cloudflared tunnel login` o `CLOUDFLARE_TUNNEL_TOKEN` en `.env.local` — ver `docs/CLOUDFLARE-TUNNEL.md`.
