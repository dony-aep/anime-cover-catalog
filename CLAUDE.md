# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Local development requires **two servers** (the Angular dev server proxies `/api` to the local API via `proxy.conf.json`):

```bash
npm run api:dev   # terminal 1 — Hono API on http://localhost:8787
npm start         # terminal 2 — Angular app on http://localhost:4200
```

- Build: `npm run build`
- Frontend tests (Karma/Jasmine): `npx ng test --watch=false --browsers=ChromeHeadless`
- Single spec: `npx ng test --include='**/anime.service.spec.ts' --watch=false --browsers=ChromeHeadless`
- API smoke test (exercises every route via `app.fetch()`, no server needed): `npm run api:smoke`

CI (`.github/workflows/ci.yml`) runs: `api:smoke` → frontend tests → production build. All three must pass.

`package.json` uses an `allowScripts` policy: if a new dependency has install scripts, `npm install` will warn and skip them — approve with `npm approve-scripts <pkg>`.

## Architecture

Angular 21 SPA + Hono REST API deployed together on Vercel:

- **Frontend** (`src/`): standalone components, signals for state, plain CSS with CSS variables for theming. Pages in `src/app/pages/`, shared components in `src/app/components/`, singleton services in `src/app/services/`.
- **API** (`api/`): Hono + `@hono/zod-openapi`, deployed as a **single Vercel function** — `vercel.json` rewrites `/api/(.*)` to `api/index.ts`, which mounts the app under `basePath('/api')`. The `_` prefix on `api/_data`, `api/_lib`, `api/_scripts` keeps Vercel from treating them as functions.
- **Data**: `api/_data/animes.json` is the **single canonical data source** for the whole project. The API serves it; the Angular app consumes it only through `/api/v1` (`AnimeService` fetches page 1, then loads remaining pages in parallel). Records must conform to `api/_lib/schema.ts` (unique slugs, typed fields).
- **Caching**: responses are edge-cached with a deploy-scoped `ETag` (hash of the dataset) since data only changes on deploy. `/animes/random` is the exception (`no-store`).

`scripts/` contains Python utilities for image scraping/processing of cover art — not part of the app build.

## API documentation lives in three places

When the API surface changes, update **all three**:

1. `api/README.md` (full reference)
2. The in-app `/docs` page (`src/app/pages/api-docs-page`)
3. `public/llms.txt` (ASCII-only — it's rendered as plain text)

## Conventions

- Commit messages: conventional commits with the description in **Spanish** (e.g. `feat(api): exponer thumbnails optimizados`).
- Images have optimized thumbnail counterparts in `/assets/AnimeImages_thumbs/` (`images.thumb`, `images.alternativesThumbs[]`) — prefer them for lists and grids.
