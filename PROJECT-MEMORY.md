# Memoria del proyecto — LogiTrainer Studio

**Última actualización:** 2026-05-22 — deploy unificado verificado en prod  
**Repo:** https://github.com/Lumpenvisual/logitrainerstudio  
**Carpeta local:** `C:\proyectos\logitrainerstudio`  
**Git:** `main` @ `1db87f1` — sincronizado con `origin/main` y Vercel prod

---

## Qué es

Plataforma audiovisual con IA (Vite + React + Supabase + Gemini). **Un solo despliegue** en Vercel: Studio Pro en `/` con **Production Suite** integrada (vista `suite`, lazy `classic-studio`).

## Rutas (una app)

| Ruta | Descripción |
|------|-------------|
| `/` | Studio Pro + vista `suite` (Production Suite) |
| `/classic` | Redirect → `/` con `initialView: "suite"` |
| `/studio` | Hub acceso unificado — tarjeta “LogiTrainer Studio” |
| `/demo` | Demo pública (sin site gate) |
| `/auth`, `/profile`, `/about` | Tras site gate |

## URLs

| Servicio | URL |
|----------|-----|
| **Producción** | https://logitrainerstudio.vercel.app |
| Hub | `/studio` |
| Production Suite | Sidebar **Production Suite** o `/classic` |
| Supabase | `zghzhfheyawvbdddsybe` |

## Credenciales (pruebas)

| Uso | Valor |
|-----|--------|
| Hub / site gate | `LTS-Mayo2026-7kQ!` |
| Back-office | `backoffice@logitrainerstudio.app` / `LTS-BackOffice-2026!mX` |

## Comandos esenciales

```powershell
cd C:\proyectos\logitrainerstudio
npm start                    # :8080
npm run build
npm run verify:prod          # secrets + APIs + 14 E2E @ Vercel
npm run audit:lts
npx vercel deploy --prod --yes
```

## Arquitectura unificada

| Pieza | Ubicación |
|-------|-----------|
| Shell | `src/pages/Index.tsx` — `currentView === 'suite'` → `ClassicStudioWorkspace` |
| Suite | `src/components/classic-studio/ClassicStudioWorkspace.tsx` |
| Sidebar | `AppSidebar` — botón Production Suite |
| Salir suite | `StudioLayout` → `onExitToPro` |
| Auth suite | `Auth.tsx` + `sessionStorage` `lts-pending-view` |
| Chunk lazy | `classic-studio` (~1.9 MB gzip ~544 KB) |

## Verificación (2026-05-22)

| Check | Resultado |
|-------|-----------|
| Build local | OK |
| E2E local `:8080` | **14/14** |
| `verify:prod` | **14/14** + APIs Gemini OK |
| `audit:lts` | OK |
| Deploy Vercel | `1db87f1` → https://logitrainerstudio.vercel.app |

## Commit clave

`1db87f1` — *Unify Production Suite into Studio Pro single deploy.*

## Hub en Vercel

En prod el host es `.vercel.app`: la tarjeta app principal puede mostrar aviso “usa túnel”; la app unificada sigue en `/` tras site gate + Supabase.

## Documentación

`AGENTS.md` · `AUDIT-REPORT.md` · `docs/INTEGRATION-RAFAEL-REPO.md` · `.cursor/rules/project-context.mdc`

---

*Actualizar tras cambios mayores o nueva verificación completa.*
