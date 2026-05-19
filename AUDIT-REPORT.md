# Auditoría profunda — LogiTrainer Studio

**Fecha:** 2026-05-19  
**Commit verificado:** `main` (post tunnel + studio hub)  
**Producción:** https://logitrainerstudio.vercel.app

---

## Resumen ejecutivo

| Área | Estado |
|------|--------|
| Secretos en repo | ✅ PASS |
| APIs Gemini (7 edges) | ✅ PASS |
| Build producción | ✅ PASS |
| E2E Playwright (Vercel) | ✅ **10/10** |
| E2E túnel trycloudflare | ✅ **4/4** |
| Vitest | ✅ 1/1 |
| Túnel local :8080 | ✅ Activo (ver `TRYCLOUDFLARE-URL.txt`) |
| ESLint | ⚠️ Deuda técnica (no bloquea deploy) |

**Veredicto: operativo en producción y túnel local.**

---

## Pruebas ejecutadas

```
npm run audit:lts      → secrets + 7 APIs + build OK
npm run verify:prod    → 10/10 Playwright @ logitrainerstudio.vercel.app
npm run tunnel:verify  → 4/4 Playwright @ trycloudflare (localhost:8080)
```

### E2E producción (10)

- Studio hub: login, logout, dashboard
- Site access gate ×2
- Demo page ×2
- Full flow: studio → auth → workspace + API health
- Back-office admin
- Gemini AI script generation

### E2E túnel (4)

- Mismo flujo hub + site access vía URL pública trycloudflare

---

## Accesos

| Entorno | URL |
|---------|-----|
| Producción | https://logitrainerstudio.vercel.app/studio |
| Demo | https://logitrainerstudio.vercel.app/demo |
| Túnel local | `TRYCLOUDFLARE-URL.txt` (Quick Tunnel, URL puede cambiar al reiniciar cloudflared) |

**Contraseña hub:** `LTS-Mayo2026-7kQ!`

---

## Memoria del proyecto

- `PROJECT-MEMORY.md` — referencia rápida
- `AGENTS.md` — agentes Cursor
- `.cursor/rules/project-context.mdc` — regla always-on
- `.cursor/skills/lts-*` — skills especializados

---

## Deuda técnica

1. ESLint: ~77 errores `no-explicit-any` (legacy)
2. Bundle JS ~1.7 MB — code-split recomendado
3. Dominio fijo túnel: pendiente `cloudflared tunnel login` o `CLOUDFLARE_TUNNEL_TOKEN`
4. `agent-orchestrator`: skip sin fila agents en DB

---

*Generado tras verificación completa previa a commit de memoria.*
