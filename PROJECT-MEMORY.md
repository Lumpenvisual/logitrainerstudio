# Memoria del proyecto — LogiTrainer Studio

**Última actualización:** 2026-05-22 — cuenta unificada + UI responsive  
**Git:** `main` (pendiente commit de esta sesión)  
**Producción:** https://logitrainerstudio.vercel.app

---

## Cuenta unificada (una sola para todo)

| Campo | Valor |
|-------|--------|
| **Correo** | `backoffice@logitrainerstudio.app` |
| **Contraseña** | `LTS-Mayo2026-7kQ!` |

Usada en: hub `/studio/login`, site gate, Supabase Auth, E2E.

**Código:** `src/lib/unifiedCredentials.ts`  
**Login UI:** `src/components/auth/UnifiedLoginScreen.tsx`  
**Hook:** `src/hooks/useUnifiedLogin.ts` (gate + Supabase; fallback legacy hasta `sync:unified-password`)

```bash
# Sincronizar contraseña Supabase (requiere .env.local con SUPABASE_SERVICE_ROLE_KEY)
npm run sync:unified-password
```

Variables opcionales: `VITE_UNIFIED_EMAIL`, `VITE_UNIFIED_PASSWORD`

---

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/studio/login` | **Login unificado** (correo + contraseña) |
| `/auth` | Redirect → `/studio/login` |
| `/` | Studio Pro + Production Suite (`suite`) |
| `/classic` | Redirect → `/` vista suite |

---

## Responsive

- Login: `lts-auth-shell`, inputs ≥16px en móvil (`index.css`)
- TopBar: breadcrumb truncado, acciones ocultas en pantallas pequeñas
- Index: `100dvh`, `max-w-[100vw]`, sin overflow horizontal
- Production Suite: `StudioLayout` ya usa Sheet/bottom nav móvil

---

## Verificación

```powershell
npm start
npm run verify:prod   # 14 E2E + APIs
```

---

## Skills Cursor (6)

Índice: `.cursor/skills/README.md` · Resumen: `docs/SKILLS-LEARNED.md`

| Skill | Tema |
|-------|------|
| `lts-studio-hub` | Login, túnel, hub |
| `lts-e2e-verification` | 14 E2E, verify:prod |
| `lts-supabase-backend` | DB, functions, secrets |
| `lts-edge-client` | edgeClient + aiService |
| `lts-gemini-api` | Gemini en edge |
| `lts-demo` | `/demo` público |

---

*Ver `AUDIT-REPORT.md` para última auditoría completa.*
