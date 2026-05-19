# Auditoría LogiTrainer Studio

Generado: automático tras `npm run audit:lts` + `npm run demo:generate`.

## Checks

| Check | Comando | Estado |
|-------|---------|--------|
| Secretos en repo | `npm run check:secrets` | ✓ |
| APIs Gemini (7 edges) | `npm run test:ai-apis` | ✓ |
| Build producción | `npm run build` | ✓ |
| E2E Playwright (prod) | `npm run verify:prod` | ✓ 10/10 (incl. `/demo`, `/studio`) |
| Demo video | `npm run demo:generate` | ✓ `logitrainer-promo.mp4` |

## Pipeline demo

1. `ai-generate-script` — guion 4 escenas (brief LogiTrainer)
2. Por escena: `ai-generate-image` + `ai-generate-audio` (Gemini TTS)
3. FFmpeg — segmentos MP4 + concat final

## Ver demo

- Local: `npm run dev` → http://localhost:8080/demo
- Producción (tras deploy): https://logitrainerstudio.vercel.app/demo

## Regenerar

```powershell
npm run demo:generate
```
