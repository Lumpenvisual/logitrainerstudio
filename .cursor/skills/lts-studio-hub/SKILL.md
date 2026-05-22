---
name: lts-studio-hub
description: >-
  LogiTrainer Studio unified login /studio, hub dashboard, Cloudflare tunnel,
  site gate. Use for access control, tunnel scripts, or StudioHub pages.
---

# lts-studio-hub — Acceso unificado /studio + túnel

## Cuándo usar

Login único, dashboard de accesos, Cloudflare Quick Tunnel, site gate, redirect túnel.

## Cuenta unificada

| Campo | Valor |
|-------|--------|
| Correo | `backoffice@logitrainerstudio.app` |
| Contraseña | `LTS-Mayo2026-7kQ!` |

Definición: `src/lib/unifiedCredentials.ts`. Login UI: `src/components/auth/UnifiedLoginScreen.tsx`, hook `src/hooks/useUnifiedLogin.ts` (gate + Supabase).

## URLs

| Entorno | URL |
|---------|-----|
| Producción | https://logitrainerstudio.vercel.app/studio/login |
| App unificada | `/` (Studio Pro + Production Suite vista `suite`) |
| Quick Tunnel | `TRYCLOUDFLARE-URL.txt` |
| Local | http://localhost:8080/studio |

## Sesión

- `lts_studio_hub_session` + `lts_site_access` (7 días) — `src/lib/studioHub.ts`, `src/lib/siteAccess.ts`
- Logout: `signOutUnified()` en `src/lib/unifiedSession.ts`

## Código

| Pieza | Ruta |
|-------|------|
| Hub login / dashboard | `src/pages/StudioHub.tsx` |
| Credenciales | `src/lib/unifiedCredentials.ts` |
| Guard app | `src/components/SiteAccessGuard.tsx` → `/studio/login` |
| `/auth` | Redirect a `/studio/login` (`src/pages/Auth.tsx`) |
| Redirect túnel | `src/components/TunnelRootRedirect.tsx` |

## Comandos túnel

```powershell
npm run publish:trycloudflare
npm run tunnel:verify      # HTTP 200 + 8 E2E
npm run tunnel:stack
npm run tunnel:stack:stop
```

## E2E

`tests/e2e/studio-hub.spec.ts`, `site-access.spec.ts` — `helpers/studio.ts` → `unifiedLogin()` / `passSiteGate()`.

## Dominio fijo

`studio.logitrainerstudio.com` — `docs/CLOUDFLARE-TUNNEL.md`, `CLOUDFLARE_TUNNEL_TOKEN` en `.env.local`.
