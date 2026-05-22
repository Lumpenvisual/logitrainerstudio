---
name: lts-supabase-backend
description: >-
  LogiTrainer Studio Supabase backend — project zghzhfheyawvbdddsybe, edge
  functions, migrations, back-office admin, site gate. Use when changing auth,
  RLS, hooks, edge functions, seeds, or Vercel env for this repo.
---

# LTS Supabase backend

## Project

| Item | Value |
|------|--------|
| Supabase ref | `zghzhfheyawvbdddsybe` |
| URL | `https://zghzhfheyawvbdddsybe.supabase.co` |
| Production app | https://logitrainerstudio.vercel.app |
| Cuenta unificada | `backoffice@logitrainerstudio.app` / `LTS-Mayo2026-7kQ!` |

Do **not** use Lovable project `bcobgfxepxmmcheuliai` (no CLI access).

## CLI workflow

```powershell
cd c:\proyectos\logitrainerstudio
npx supabase link --project-ref zghzhfheyawvbdddsybe
echo y | npx supabase db push
npx supabase functions deploy <name> --project-ref zghzhfheyawvbdddsybe
npx supabase secrets set GEMINI_API_KEY="..." SITE_ACCESS_PASSWORD=LTS-Mayo2026-7kQ! BACK_OFFICE_SETUP_SECRET=LTS-Bootstrap-2026-xK9 --project-ref zghzhfheyawvbdddsybe
npx supabase functions deploy ai-chat ai-generate-script ai-generate-image ai-analyze-image ai-marketing-content ai-email-sequence agent-orchestrator admin-approve-user verify-site-access seed-back-office --project-ref zghzhfheyawvbdddsybe
npm run sync:unified-password   # alias seed:back-office — alinea Supabase
npm run test:ai-apis
npm run verify:prod
```

See also: `.cursor/skills/lts-gemini-api`, `.cursor/skills/lts-e2e-verification`.

## Migrations (order matters)

- `20260516150000` — site_access_config + `verify_site_access` (extensions.crypt)
- `20260516170000` — back_office_config, triggers, `bootstrap_back_office`
- `20260516171000` — hardened signup triggers
- `20260516180000` — drop duplicate `on_auth_user_created` profile trigger
- `20260516190000` — GRANT verify_site_access TO authenticated

## Edge secrets

| Secret | Used by |
|--------|---------|
| `GEMINI_API_KEY` | **Required** — all `ai-*`, `agent-orchestrator` via `_shared/gemini.ts` (Google AI Studio, `x-goog-api-key`) |
| `GOOGLE_API_KEY` | Alias for `GEMINI_API_KEY` |
| `SITE_ACCESS_PASSWORD` | `verify-site-access` (optional plaintext bypass) |
| `BACK_OFFICE_SETUP_SECRET` | `seed-back-office` header `x-setup-secret` |

```powershell
npx supabase secrets set GEMINI_API_KEY="your-key-from-aistudio" --project-ref zghzhfheyawvbdddsybe
```

Never commit `GEMINI_API_KEY` in `.env` or source files. Optional local only: `.env.local` (gitignored).

Auto: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## Admin / back-office

- `admin-approve-user` grants `user_roles.admin` if caller email matches `back_office_config.admin_email` and role missing.
- Client `useApproval`: `isBackOfficeEmail()` + `user_roles` / `user_approvals`.
- Seed / sync password: `npm run sync:unified-password` (needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`) or POST `seed-back-office` with `x-setup-secret`.

## Site gate + login

- Contraseña unificada: `LTS-Mayo2026-7kQ!` — edge → RPC → SHA-256 (`VITE_SITE_ACCESS_SHA256`).
- UI: `/studio/login` (`useUnifiedLogin`); `/auth` redirects there.
- Back-office Supabase session skips gate (`useSiteAccess`).

## pgcrypto

Use `extensions.crypt` and `extensions.gen_salt` in SQL (not bare `crypt`).
