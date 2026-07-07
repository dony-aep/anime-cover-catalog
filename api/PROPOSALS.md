# API Proposals — flexibility improvements

Proposals for making the public API more flexible for consumers. None of these
are implemented yet; each entry explains the current behavior (verified against
production), why the change is worth it, and a minimal design consistent with
the existing code (`@hono/zod-openapi` validation, `{ error }` failures,
edge-cached responses).

Verification standard for every proposal: extend `api/_scripts/smoke-api.ts`
with cases that fail before the change and pass after, then confirm on a
preview deploy.

---

## 1. Sparse fieldsets — `fields` query param

**Current behavior (verified 2026-07-07):** `GET /api/v1/animes?fields=genres`
returns `200` with all 15 fields per anime. Unknown query params are silently
stripped by the Zod schema, so the client has no way to trim the payload.

**Why it's worth it:** a list response at `limit=100` is dominated by
`synopsis` and `images`. A client that only needs titles and genres (e.g. a
tag cloud, an autocomplete, a stats script) downloads the full payload anyway.
The edge cache absorbs the server cost but not the client's bandwidth or parse
time.

**Design:**

```
GET /api/v1/animes?fields=slug,title,genres
→ { "data": [ { "slug": "…", "title": "…", "genres": […] } ], "meta": { … } }
```

- `fields` is a comma-separated list validated against the key names of
  `AnimeResponseSchema`; an unknown field name → `400 { error }`, consistent
  with the rest of the request validation.
- Applies to both `GET /animes` and `GET /animes/{slug}`.
- Open decision: whether `slug` is always included as the identifier even when
  not requested.

**Touched files:** `_lib/api-schema.ts` (new param + response typing),
`index.ts` or `_lib/data.ts` (projection), `_scripts/smoke-api.ts` (cases:
valid subset, unknown field → 400, detail route).

---

## 2. Multiple values per filter

**Current behavior (verified 2026-07-07):** each filter accepts a single value.
`?genre=Romance` works; `?genre=Romance,Comedy` treats the comma as a literal
(matches nothing → `total: 0`), and repeating the param (`?genre=A&genre=B`)
fails with `400 { "error": "Expected string, received array" }`.

**Why it's worth it:** the Angular app's filter UI allows multi-selection
concepts (genres, themes), and any consumer building a similar UI must fire N
requests and merge client-side — N cache entries at the edge instead of one.

**Design:** accept comma-separated values, OR within a param, AND across
params (matches how faceted catalogs conventionally behave):

```
GET /api/v1/animes?genre=Romance,Comedy&theme=School
→ (Romance OR Comedy) AND School
```

Backward compatible: single values keep working unchanged.

**Touched files:** `_lib/api-schema.ts` (transform `string → string[]`),
`_lib/data.ts` (`queryAnimes` filter predicates), `_scripts/smoke-api.ts`.

---

## 3. Conditional requests — `ETag` / `If-None-Match`

**Current behavior:** responses carry `Cache-Control: public, s-maxage=86400,
stale-while-revalidate=604800`, which Vercel's edge consumes (clients see
`Cache-Control: public`). There is no validator, so a client re-fetching gets
the full body every time its own cache expires.

**Why it's worth it:** the dataset is immutable between deploys — the ideal
case for ETags. Repeat clients get `304 Not Modified` with an empty body. Very
cheap to implement precisely because immutability makes the tag trivial.

**Design:** derive one ETag per deploy (e.g. hash of `animes.json` computed
once at module load, like `buildFilters()` does) and set it on every 200 GET in
the existing cache middleware; return `304` when `If-None-Match` matches.

**Touched files:** `index.ts` (middleware), `_scripts/smoke-api.ts`
(200-with-ETag, then 304 on replay).

---

## 4. Random anime — `GET /animes/random`

**Current behavior:** no way to get a random pick; a client must fetch a page
and choose locally, or know `total` and request a random page.

**Why it's worth it:** enables "surprise me" / daily-pick features in the app
or any consumer with a single call. Small, self-contained, good API ergonomics.

**Design:** `GET /api/v1/animes/random` returns one `Anime` (same shape as the
detail route). Optionally honors the same filter params as the list
(`?genre=…` → random pick within the filtered set; empty result → 404).
Caveat: the route must opt out of the edge cache (`Cache-Control: no-store`)
or every client gets the same "random" anime for 24h. Route order matters:
register it before `/{slug}` so `random` isn't matched as a slug.

**Touched files:** `index.ts` (new route), `_lib/data.ts` (pick helper),
`_scripts/smoke-api.ts`.

---

## 5. Rate limiting (already noted in `README.md`)

**Current behavior:** no rate limit; the edge cache absorbs traffic, but any
uncached path (unique query-param combinations) reaches the function.

**Why it's worth it:** `fields` and multi-value filters (proposals 1–2)
multiply the space of distinct URLs, which multiplies cache misses. If the API
gets abusive traffic, a per-IP limit protects function invocations.

**Design:** per the existing note in `api/README.md` — `@upstash/ratelimit`
backed by a Marketplace Redis, or a Vercel Firewall rule (no code). Prefer the
Firewall rule first: zero code, adjustable without a deploy.

**Touched files:** none (Firewall) or `index.ts` middleware (Upstash).

---

## Suggested order

1. **Sparse fieldsets** — the original motivation, immediate client value.
2. **Multi-value filters** — complements 1; both touch the same validation layer.
3. **ETag** — cheap, independent, pure win given immutable data.
4. **Random endpoint** — nice-to-have, do when a consumer feature needs it.
5. **Rate limiting** — reactive; ship when traffic justifies it (revisit after 1–2).
