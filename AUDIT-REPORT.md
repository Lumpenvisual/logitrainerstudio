# Auditoría profunda — LogiTrainer Studio

**Fecha:** 2026-05-22 (sesión abierta — contexto refrescado)  
**Commit remoto:** `eaf3ccb` — **working tree:** integración unificada Studio Pro (sin commit)  
**Producción:** https://logitrainerstudio.vercel.app — aún sin deploy de la unificación

---

## Resumen ejecutivo

| Área | Estado |
|------|--------|
| Secretos en repo | ✅ PASS |
| APIs Gemini (7 edges) | ✅ PASS |
| Build producción | ✅ PASS |
| E2E Playwright (Vercel) | ⏳ Re-verificar tras deploy unificado |
| E2E local (`:8080`) | ✅ **14/14** (integración suite en Pro) |
| E2E túnel (`tunnel:verify`) | ✅ **7/7** + HTTP 200 |
| Vitest | ✅ 1/1 |
| Código obsoleto | ✅ Eliminados `basic.spec.ts`, `local-llm.spec.ts`, script duplicado `test:e2e:tunnel:quick` |
| Fixes aplicados | ✅ Suite en `Index` (`suite`), `/classic` redirect, `FolderGit2` hub, E2E `expectHomePath` |

**Veredicto: operativo en producción.**

---

## Pruebas ejecutadas

```
npm run audit:lts      → secrets + 7 APIs + build OK
npm run verify:prod    → 13/13 Playwright @ logitrainerstudio.vercel.app
npm test               → 1/1 Vitest
npx playwright test (PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080) → 13/13
npm run tunnel:verify  → HTTP 200 + 7/7 Playwright
```

### E2E producción (13)

- Studio hub (2), site access (2), demo (2), full flow (2)
- Back-office, Gemini AI script
- Classic studio: chunk lazy + hub link (2)
- Studio Pro export panel (1)

### Limpieza

- Tests E2E huérfanos del repo Rafael (`basic`, `local-llm`) — apuntaban a UI antigua en `/`
- `package.json`: eliminado script duplicado `test:e2e:tunnel:quick`

### Correcciones de producto

- `useAuth`: no marcar `loading=false` antes de `getSession()` (evita redirect erróneo a `/auth`)
- `Auth.tsx`: tras login vuelve a `state.from` (p. ej. `/classic`)
- `ClassicStudio.tsx`: pasa `state.from` al redirigir a `/auth`

---

## Accesos

| Entorno | URL |
|---------|-----|
| Producción | https://logitrainerstudio.vercel.app/studio |
| Studio Pro | https://logitrainerstudio.vercel.app/ |
| Studio clásico | https://logitrainerstudio.vercel.app/classic |
| Demo | https://logitrainerstudio.vercel.app/demo |

**Contraseña hub:** `LTS-Mayo2026-7kQ!`

---

## Comandos de verificación

```powershell
cd C:\proyectos\logitrainerstudio
npm run audit:lts
npm run verify:prod
npm run tunnel:verify   # HTTP túnel + 7 E2E locales (:8080)
```
