---
name: lts-edge-client
description: >-
  LogiTrainer Studio edge function client layer. Use when adding API calls,
  panels calling AI/admin, or fixing fetch/header errors in this repo.
---

# LTS edge client

## Single path for Edge Functions

| Layer | Path | Role |
|-------|------|------|
| HTTP + headers | `src/lib/supabaseHttp.ts` | `getSupabaseAuthHeaders`, `invokeEdgeFunction` |
| Typed wrapper | `src/lib/edgeClient.ts` | `callEdge`, `fetchEdgeStream` |
| Feature APIs | `src/services/aiService.ts`, `adminService.ts` | Business methods |

**Never** use `supabase.functions.invoke` (ISO-8859-1 header issues).

**Never** duplicate raw `fetch` to `/functions/v1/` in panels — add a method in `aiService` or `adminService`.

## Headers

`src/lib/env.ts`: `cleanEnv`, `toHeaderValue` — strips BOM, ASCII-only header values.

## Adding a new edge function

1. Create `supabase/functions/<name>/index.ts`
2. Add `[functions.<name>]` in `supabase/config.toml` (`verify_jwt = false` if using manual auth)
3. `npx supabase functions deploy <name> --project-ref zghzhfheyawvbdddsybe`
4. Add `callEdge` wrapper in `aiService.ts` or `adminService.ts`
5. Call from UI via service only

## Streaming

Only `ai-chat` streams — use `fetchEdgeStream` from `edgeClient.ts`, not `invokeEdgeFunction`.
