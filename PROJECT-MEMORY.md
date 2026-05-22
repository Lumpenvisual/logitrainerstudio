# Memoria del proyecto — LogiTrainer Studio

**Última actualización:** 2026-05-22 — auditoría E2E completa OK  
**Repo:** https://github.com/Lumpenvisual/logitrainerstudio  
**Carpeta local:** `C:\proyectos\logitrainerstudio`  
**Git:** `main` @ `53b8427` — limpio, sincronizado con `origin/main`

---

## Qué es

Plataforma audiovisual con IA (Vite + React + Supabase + Gemini). **Un solo despliegue** en Vercel: Studio Pro en `/` con **Production Suite** integrada (vista `suite`).

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Studio Pro + vista `suite` (Production Suite, lazy) |
| `/classic` | Redirect → `/` con `initialView: "suite"` |
| `/studio` | Hub acceso unificado |
| `/demo` | Demo pública (sin site gate) |

## URLs

| Servicio | URL |
|----------|-----|
| **Producción** | https://logitrainerstudio.vercel.app |
| Hub | `/studio` |
| Supabase | `zghzhfheyawvbdddsybe` |
| Túnel quick (efímero) | `TRYCLOUDFLARE-URL.txt` o `npm run publish:trycloudflare` |

## Credenciales (pruebas)

| Uso | Valor |
|-----|--------|
| Hub / site gate | `LTS-Mayo2026-7kQ!` |
| Back-office | `backoffice@logitrainerstudio.app` / `LTS-BackOffice-2026!mX` |

## Comandos de verificación

```powershell
npm run verify:prod      # prod: secrets + APIs + 14 E2E
npm run audit:lts        # secrets + APIs + build
npm run tunnel:verify    # HTTP túnel + 8 E2E (arranca quick tunnel si hace falta)
# Local: npm start → :8080 → npx playwright test
```

## Última auditoría E2E (2026-05-22)

| Check | Resultado |
|-------|-----------|
| `verify:prod` | **14/14** + APIs OK |
| E2E local `:8080` | **14/14** |
| `audit:lts` | OK |
| `npm test` (Vitest) | 1/1 |
| `tunnel:verify` | HTTP 200 + **8/8** |

## Arquitectura

| Pieza | Ubicación |
|-------|-----------|
| Shell | `src/pages/Index.tsx` |
| Suite | `src/components/classic-studio/ClassicStudioWorkspace.tsx` |
| Sidebar | `AppSidebar` — Production Suite |
| Commits clave | `1db87f1` (unificación), `53b8427` (docs verificación) |

## Documentación

`AUDIT-REPORT.md` · `docs/INTEGRATION-RAFAEL-REPO.md` · `.cursor/rules/project-context.mdc` · `AGENTS.md`

---

*Actualizar tras cambios mayores o nueva auditoría.*
