# Auditoría profunda — LogiTrainer Studio

**Fecha:** 2026-05-21  
**Commit:** `main` (integración Rafael + Studio clásico + fixes auth/E2E)  
**Producción:** https://logitrainerstudio.vercel.app

---

## Resumen ejecutivo

| Área | Estado |
|------|--------|
| Secretos en repo | ✅ PASS |
| APIs Gemini (7 edges) | ✅ PASS |
| Build producción | ✅ PASS |
| E2E Playwright (Vercel) | ✅ **13/13** |
| Vitest | ✅ 1/1 |
| Código obsoleto | ✅ Eliminados `basic.spec.ts`, `local-llm.spec.ts`, script duplicado `test:e2e:tunnel:quick` |
| Fixes aplicados | ✅ Race `useAuth`, redirect `/auth` → `/classic`, E2E por chunk lazy |

**Veredicto: operativo en producción.**

---

## Pruebas ejecutadas

```
npm run audit:lts      → secrets + 7 APIs + build OK
npm run verify:prod    → 13/13 Playwright @ logitrainerstudio.vercel.app
npm test               → 1/1 Vitest
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
