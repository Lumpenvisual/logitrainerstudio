# Integración: logitrainer-a65fca34 → logitrainerstudio

Repositorio origen: [rafaelcastro7/logitrainer-a65fca34](https://github.com/rafaelcastro7/logitrainer-a65fca34)

## Resultado: un solo proyecto

Todo vive en **`C:\proyectos\logitrainerstudio`**. El repo clonado era una variante Lovable con marketing y editor clásico; la base de producción sigue siendo logitrainerstudio (hub `/studio`, túnel, Gemini edge, E2E).

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | **Studio Pro** — Zustand, timeline, paneles marketing, hub Gemini |
| `/classic` | **Studio clásico** — UI integrada del repo Rafael (tabs, DnD, ebooks, funnels, `videoRenderer`) |
| `/studio` | Hub de acceso unificado |
| `/demo` | Demo promocional |

## Qué se integró del repo Rafael

- `src/components/classic-studio/` — 52 componentes (editor, marketing, agentes)
- `src/pages/ClassicStudio.tsx` — shell principal clásico
- `src/hooks/classic/` — `useProject`, autosave, streaming, contenido generado
- `src/services/classic/` — API adaptada a edge functions `ai-*` de este proyecto
- `src/lib/videoRenderer.ts` — export de video en canvas
- `src/types/project.ts` — modelo de proyecto clásico
- `src/i18n/classicTranslations.ts` + `LanguageContext` para la UI clásica
- Migración `generated_content` + función `generate-music` (si no existía)

## Qué se conservó de logitrainerstudio

- Infra: túnel Cloudflare, scripts, `verify:prod`, back-office, site gate
- Edge functions Gemini (`ai-generate-script`, `ai-chat`, etc.)
- Studio Pro en `/` con Zustand y paneles actuales

## Desarrollo

```bash
npm install
npm run dev
# Studio Pro:  http://localhost:8080/
# Studio clásico: http://localhost:8080/classic
npm run tunnel:verify   # túnel + E2E unificado (7 tests)
```

## Fusionado en Studio Pro (`/`)

- **Render & Export** usa `videoRenderer` (export WebM canvas + SRT + JSON).
- Adaptador `src/lib/sceneAdapters.ts` entre Zustand y el modelo clásico.

## Nota sobre `.env` del repo origen

El repo Rafael incluía `.env` en GitHub — **no** se copió. Usa `.env.local` en logitrainerstudio (sin commitear secretos).
