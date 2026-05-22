# Memoria del proyecto — LogiTrainer Studio

**Última actualización:** 2026-05-22 (contexto guardado — proyecto cerrado)  
**Repo:** https://github.com/Lumpenvisual/logitrainerstudio  
**Carpeta:** `C:\proyectos\logitrainerstudio`  
**Git:** `main` @ `ec1f0bb` — sincronizado con `origin/main`, working tree limpio  
**Producción:** https://logitrainerstudio.vercel.app

---

## Qué es

Una plataforma audiovisual con IA (Vite + React + Supabase + Gemini). **Un solo despliegue** en Vercel: Studio Pro en `/` con **Production Suite** integrada (vista `suite`, lazy `classic-studio`).

---

## Cuenta unificada

| Campo | Valor |
|-------|--------|
| **Correo** | `backoffice@logitrainerstudio.app` |
| **Contraseña** | `LTS-Mayo2026-7kQ!` |

- Login: https://logitrainerstudio.vercel.app/studio/login  
- Código: `src/lib/unifiedCredentials.ts`, `UnifiedLoginScreen.tsx`, `useUnifiedLogin.ts`  
- `/auth` → redirect a `/studio/login`  
- Sync Supabase: `npm run sync:unified-password` (requiere `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`)

---

## Rutas

| Ruta | Comportamiento |
|------|----------------|
| `/studio/login` | Login unificado (correo + contraseña) |
| `/studio/dashboard` | Hub de acceso |
| `/` | Studio Pro (+ vista `suite` = Production Suite) |
| `/classic` | Redirect → `/` con `initialView: suite` |
| `/demo` | Demo pública (sin login) |

---

## Arquitectura clave

| Pieza | Ubicación |
|-------|-----------|
| Shell app | `src/pages/Index.tsx` |
| Production Suite | `src/components/classic-studio/ClassicStudioWorkspace.tsx` |
| Sidebar suite | `AppSidebar` → `setView('suite')` |
| Edge / IA | `edgeClient.ts` → `aiService.ts` |
| Supabase | `zghzhfheyawvbdddsybe` |
| E2E | `tests/e2e/` (14 tests) |

---

## Comandos esenciales

```powershell
cd C:\proyectos\logitrainerstudio
npm start                    # :8080
npm run verify:prod          # 14 E2E + APIs @ Vercel
npm run audit:lts
npm run sync:unified-password
npm run tunnel:verify
npx vercel deploy --prod --yes
```

---

## Verificación (última conocida)

| Check | Resultado |
|-------|-----------|
| `verify:prod` | 14/14 + APIs OK |
| E2E local `:8080` | 14/14 |
| `tunnel:verify` | 8/8 + HTTP 200 |
| `audit:lts` | OK |

---

## Commits recientes

| Commit | Resumen |
|--------|---------|
| `ec1f0bb` | Skills consolidados + `docs/SKILLS-LEARNED.md` |
| `642d1f6` | Login unificado + UI responsive |
| `1db87f1` | Production Suite integrada en Studio Pro |
| `c5896a1` | Auditoría E2E documentada |

---

## Documentación

| Archivo | Uso |
|---------|-----|
| `docs/SKILLS-LEARNED.md` | Resumen de los 6 skills Cursor |
| `.cursor/skills/README.md` | Índice skills |
| `AGENTS.md` | Guía para agentes |
| `AUDIT-REPORT.md` | Última auditoría |
| `docs/INTEGRATION-RAFAEL-REPO.md` | Integración suite |
| `.cursor/rules/project-context.mdc` | Regla always-on |

## Skills (6)

`lts-studio-hub` · `lts-e2e-verification` · `lts-supabase-backend` · `lts-edge-client` · `lts-gemini-api` · `lts-demo`

---

*Proyecto guardado y listo para retomar desde `main` @ `ec1f0bb`.*
