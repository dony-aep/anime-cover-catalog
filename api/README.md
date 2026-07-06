# Anime Cover Catalog API

Public, read-only REST API over the curated anime catalog. Built with
[Hono](https://hono.dev) + `@hono/zod-openapi`, deployed as Vercel Functions
alongside the Angular app.

## Endpoints (base: `/api/v1`)

| Method | Path              | Description                                   |
| ------ | ----------------- | --------------------------------------------- |
| GET    | `/api/v1`         | Discovery index (links to endpoints + docs)   |
| GET    | `/animes`         | Paginated, filterable, sortable list          |
| GET    | `/animes/{slug}`  | Single anime by slug (404 if missing)         |
| GET    | `/filters`        | Distinct genres, themes, demographics, types, years |
| GET    | `/openapi.json`   | OpenAPI 3.0 spec                               |
| GET    | `/docs`           | Swagger UI                                     |

A branded, human-friendly guide also lives in the app at `/docs`
(`src/app/pages/api-docs-page`), with the Swagger UI linked from there.

### `GET /api/v1/animes` query params

`q` (search title/EN/JP) · `genre` · `theme` · `demographic` · `type` ·
`year` · `sort=title|year` · `order=asc|desc` · `page` (≥1) · `limit` (1–100, default 24)

Response envelope:

```json
{ "data": [ /* Anime[] */ ], "meta": { "page": 1, "limit": 24, "total": 254, "totalPages": 11 } }
```

Image fields (`images.cover`, `images.alternatives[]`) are returned as absolute
URLs derived from the request host, pointing at the static assets on the CDN.

## Data

The API reads `api/_data/animes.json`, generated from the app's source data:

```bash
npm run data:normalize   # src/assets/data/animes.json -> api/_data/animes.json
```

Re-run this whenever the source catalog changes. The output is validated against
`api/_lib/schema.ts` (unique slugs, typed fields).

Helper scripts live in `api/_scripts/` (the `_` prefix keeps Vercel from treating
them as functions).

## Verify

```bash
npm run api:smoke        # exercises every route via app.fetch()
```

## Notes

- Responses are cached at the edge (`Cache-Control: public, s-maxage=86400,
  stale-while-revalidate=604800`) since data changes only on deploy.
- CORS is open (`*`) — this is a public API.
- Limits: `limit` is capped at 100 per page (default 24). There is no hard rate
  limit today — the edge cache absorbs traffic. If abuse appears, add a per-IP
  limit (`@upstash/ratelimit`) or a Vercel Firewall rule.
- Routing: `vercel.json` rewrites `/api/(.*)` to the single `api/index.ts`
  function, which mounts the Hono app under `basePath('/api')`.
