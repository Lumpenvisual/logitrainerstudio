# Auditoría profunda — LogiTrainer Studio

**Fecha:** 2026-05-19  
**Entorno:** `main` @ producción Vercel  
**URL:** https://logitrainerstudio.vercel.app

---

## Resumen ejecutivo

| Área | Estado | Detalle |
|------|--------|---------|
| Secretos en repo | ✅ PASS | Sin API keys prohibidas en archivos trackeados |
| APIs Gemini (Edge) | ✅ PASS | 7/7 funciones OK (+ orchestrator skip sin fila agents) |
| Build producción | ✅ PASS | Vite build ~6s, bundle JS ~1.7 MB |
| E2E Playwright (prod) | ✅ PASS | **10/10** tests |
| Vitest unitarios | ✅ PASS | 1/1 |
| ESLint | ⚠️ WARN | 77 errores preexistentes (`no-explicit-any`, etc.) — no bloquean build |
| Túnel Cloudflare | ⚠️ INFO | Quick tunnel OK; dominio fijo requiere `cloudflared tunnel login` o `CLOUDFLARE_TUNNEL_TOKEN` |
| Bundle size | ⚠️ WARN | Chunk principal >500 kB — considerar code-splitting |

**Veredicto: listo para producción** (criterios operativos LTS cumplidos).

---

## 1. Seguridad

- `npm run check:secrets` — sin `GEMINI_API_KEY`, `sk-*`, ni service role en código commiteado.
- Contraseña hub en cliente (`studioHub.ts`) — capa de acceso ligera; no sustituye auth fuerte.
- Supabase: anon key en frontend (esperado); Gemini solo en Edge Secrets.
- `.env.local` gitignored; credenciales back-office solo en E2E env.

---

## 2. APIs Supabase Edge (Gemini)

| Función | Estado |
|---------|--------|
| ai-generate-script | ✅ |
| ai-marketing-content | ✅ |
| ai-email-sequence | ✅ |
| ai-chat (SSE) | ✅ |
| ai-analyze-image | ✅ |
| ai-generate-audio | ✅ |
| ai-generate-image | ✅ |
| agent-orchestrator | ⏭ skip (sin agents en DB) |
| verify-site-access | ✅ (vía flujo /studio) |

Proyecto Supabase: `zghzhfheyawvbdddsybe`

---

## 3. E2E producción (Playwright)

| Test | Estado |
|------|--------|
| Studio access gate ×2 | ✅ |
| Studio hub ×2 | ✅ |
| Demo page ×2 | ✅ |
| Full flow ×2 | ✅ |
| Back-office admin | ✅ |
| Gemini AI script | ✅ |

Hub: `/studio` — contraseña unificada + localStorage 7 días.

---

## 4. Build y assets

- Demo: `public/demo/logitrainer/` — video + manifest presentes (`ensure-demo.mjs`).
- `tunnel-info.json` generado en prebuild (gitignored).
- Imagen hero ~187 kB en bundle.

---

## 5. Accesos unificados

| Entorno | URL |
|---------|-----|
| Producción | https://logitrainerstudio.vercel.app/studio |
| App | https://logitrainerstudio.vercel.app/ |
| Demo | https://logitrainerstudio.vercel.app/demo |
| Túnel (config) | https://studio.logitrainerstudio.com/studio (pendiente DNS/login CF) |

---

## 6. Deuda técnica (no bloqueante)

1. **ESLint:** 77 errores — mayoría `@typescript-eslint/no-explicit-any` en panels/hooks legacy.
2. **Bundle:** `index-*.js` ~1.7 MB — dynamic imports recomendados.
3. **Cloudflare:** cert.pem ausente — ejecutar `scripts\open-cloudflare-login.bat` + `npm run tunnel:persistent`.
4. **agent-orchestrator:** seed de agents opcional en Supabase.

---

## Comandos de re-auditoría

```powershell
npm run audit:lts      # secrets + APIs + build
npm run verify:prod    # + E2E 10 tests
npm run tunnel:verify  # E2E vía túnel local
```

---

*Generado tras auditoría automatizada previa a deploy.*
