# Auditoría end-to-end — LogiTrainer Studio

**Fecha:** 2026-05-22 (auditoría completa)  
**Commit:** `53b8427` (`main` = `origin/main`)  
**Producción:** https://logitrainerstudio.vercel.app

---

## Resumen ejecutivo

| Área | Estado |
|------|--------|
| Secretos en repo (`check:secrets`) | ✅ PASS |
| APIs Gemini (7 edges + orchestrator skip) | ✅ PASS |
| Build producción | ✅ PASS |
| Vitest | ✅ 1/1 |
| E2E Playwright — **Vercel** (`verify:prod`) | ✅ **14/14** |
| E2E Playwright — **local** `:8080` | ✅ **14/14** |
| Túnel (`tunnel:verify`) | ✅ HTTP 200 + **8/8** E2E |
| Deploy unificado | ✅ Studio Pro + Production Suite en `/` |

**Veredicto: operativo — prod, local y túnel OK.**

---

## Comandos ejecutados

```text
npm run verify:prod     → secrets + APIs + 14/14 @ logitrainerstudio.vercel.app (~39s)
npm run audit:lts       → secrets + APIs + build OK
npm test                → 1/1 Vitest
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 npx playwright test → 14/14 (~39s)
npm run tunnel:verify   → HTTP 200 (/studio/login, /classic, /) + 8/8 E2E
```

---

## E2E producción (14)

| Suite | Tests |
|-------|-------|
| Back-office | 1 |
| Production Suite integrado | 3 |
| Export panel | 1 |
| Demo | 2 |
| Full flow + Gemini API | 2 |
| Gemini AI edge | 1 |
| Site access | 2 |
| Studio hub | 2 |

---

## E2E túnel (8)

Subconjunto unificado: classic-studio (4), site-access (2), studio-hub (2).  
Túnel quick (sesión): `https://omaha-softball-kentucky-shared.trycloudflare.com` — URL efímera; regenerar con `npm run publish:trycloudflare`.

---

## Arquitectura verificada

- `/` — Studio Pro; vista `suite` = Production Suite (lazy `classic-studio`)
- `/classic` — redirect → `/` con `initialView: "suite"`
- `/studio` — hub unificado
- Sin página `ClassicStudio.tsx` separada

---

*Regenerar tras cada auditoría completa.*
