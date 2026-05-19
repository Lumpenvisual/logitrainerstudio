# LogiTrainer Studio

Plataforma de producción audiovisual con IA (Vite + React + Supabase + Gemini).

## Enlaces

| Entorno | URL |
|---------|-----|
| Producción | https://logitrainerstudio.vercel.app |
| Acceso unificado | `/studio` (login + dashboard) |
| Demo | `/demo` |
| Túnel Cloudflare | https://studio.logitrainerstudio.com/studio |

**Contraseña hub:** `LTS-Mayo2026-7kQ!`

## Desarrollo local

```sh
npm install
npm start          # http://localhost:8080
```

## Cloudflare Tunnel

Para exponer tu máquina local con dominio fijo y acceso unificado:

1. `scripts\install-cloudflared.bat`
2. `npm run tunnel:setup` (login Cloudflare + DNS)
3. `npm run tunnel:platform` (app + túnel)

Documentación completa: **[docs/CLOUDFLARE-TUNNEL.md](docs/CLOUDFLARE-TUNNEL.md)**

## Scripts útiles

```sh
npm run build
npm run verify:prod      # E2E contra producción
npm run tunnel:start     # Solo túnel (app en :8080)
npm run tunnel:stop
```

## Stack

- Vite, TypeScript, React, shadcn-ui, Tailwind
- Supabase Edge Functions + Gemini
- Playwright E2E

Ver también `AGENTS.md` para convenciones del repositorio.
