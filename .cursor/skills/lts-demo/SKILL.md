---
name: lts-demo
description: >-
  LogiTrainer Studio public demo — generate promo video, deploy assets, /demo route.
  Use when building or fixing the showcase video, demo page, or npm run demo:generate.
---

# LTS Demo

## URLs

- **Página:** `/demo` (pública, sin site gate)
- **Video:** `/demo/logitrainer/logitrainer-promo.mp4`
- **Manifiesto:** `/demo/logitrainer/manifest.json`

## Generar demo

```powershell
cd c:\proyectos\logitrainerstudio
npm run demo:generate
```

Pipeline: guion (4 escenas) → imagen + TTS por escena → FFmpeg → MP4 en `public/demo/logitrainer/`.

## Arranque local

```powershell
npm start
# http://localhost:8080/demo
```

`prebuild` / `ensure-demo.mjs` comprueba que exista el MP4 antes del build.

## Deploy

Los assets en `public/demo/` se incluyen en Vercel. Tras cambios:

```powershell
npx vercel deploy --prod --yes
```

## Archivos clave

| Archivo | Rol |
|---------|-----|
| `scripts/generate-logitrainer-demo.mjs` | Generador completo |
| `src/pages/Demo.tsx` | UI showcase |
| `src/App.tsx` | `/demo` fuera de `SiteAccessGuard` |
| `vercel.json` | SPA rewrite excluye archivos con extensión |
