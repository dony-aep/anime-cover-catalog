# API Proposals — flexibility improvements

Proposals for making the public API more flexible for consumers. Each entry
notes its status, explains the behavior before the change (verified against
production), why the change is worth it, and a minimal design consistent with
the existing code (`@hono/zod-openapi` validation, `{ error }` failures,
edge-cached responses).

Verification standard for every proposal: extend `api/_scripts/smoke-api.ts`
with cases that fail before the change and pass after, then confirm on a
preview deploy.

---

## 1. Sparse fieldsets — `fields` query param

**Status: implemented (2026-07-07).** `fields` works on both `GET /animes` and
`GET /animes/{slug}`; unknown names → `400 { error }`. Open decision resolved:
the response contains exactly the requested fields — `slug` is not implicitly
added.

**Behavior before the change (verified 2026-07-07):** `GET /api/v1/animes?fields=genres`
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

**Status: implemented (2026-07-07)**, together with proposal 6. Applies to
`genre`, `theme`, `demographic` and `type`; `year` stays single-valued.
Repeating a param (`?genre=A&genre=B`) still fails with 400 — the supported
form is the comma-separated list.

**Behavior before the change (verified 2026-07-07):** each filter accepts a single value.
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

**Status: implemented (2026-07-07).** One SHA-1 of the dataset per deploy,
set on every 200 GET; `If-None-Match` (list and `W/` forms accepted) → `304`
with no content headers. HEAD requests initially kept the old GET-only
behavior; fixed alongside proposal 4 — HEAD now mirrors GET caching headers.

**Behavior before the change:** responses carry `Cache-Control: public, s-maxage=86400,
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

**Status: implemented (2026-07-07).** Honors the list filters and `fields`,
`Cache-Control: no-store`, registered before `/{slug}`, empty pool → 404.

**Behavior before the change:** no way to get a random pick; a client must fetch a page
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

## 6. Case-insensitive filter matching

**Status: implemented (2026-07-07), shipped with proposal 2.**

**Behavior before the change (verified 2026-07-07):** filter values must match the
dataset casing exactly: `?genre=Comedy` → 109 results, but `?genre=comedy`,
`?genre=COMEDY` and `?type=tv` → `200` with 0 results, silently. A consumer
that doesn't reproduce the exact casing concludes there is no data.

**Design:** compare lowercased values in the `queryAnimes` predicates (`genre`,
`theme`, `demographic`, `type`). Backward compatible: exact-cased values keep
working.

**Touched files:** `_lib/data.ts`, `_scripts/smoke-api.ts`.

---

## 7. Accent-insensitive search

**Status: implemented (2026-07-07).** `NFD` + strip of combining marks
`U+0300–U+036F` on both sides of the comparison; the range excludes kana
voicing marks, so Japanese titles are unaffected.

**Behavior before the change (verified 2026-07-07):** the dataset contains accented
titles (*Code Geass: Dakkan no Rozé*, *Megami no Café Terrace*). `?q=rozé`
→ 1 result, but `?q=roze` and `?q=cafe` → 0. Nobody types the accent when
searching.

**Design:** normalize with `NFD` and strip combining marks on both the title
fields and `q` before the `includes` comparison.

**Touched files:** `_lib/data.ts`, `_scripts/smoke-api.ts`.

---

## 8. Reject unknown facet values

**Status: implemented (2026-07-07).** Applies to the string facets (`genre`,
`theme`, `demographic`, `type`) on both the list and random routes, matching
case-insensitively against the precomputed facets. `year` stays a plain
predicate (asking for a year with no entries is a valid empty result, and it
doubles as the empty-pool case for `/animes/random`).

**Behavior before the change (verified 2026-07-07):** `?genre=Comedia` (not a
real facet) → `200` with 0 results, indistinguishable from "valid but empty".
Now: `400 { "error": "Unknown genre: Comedia. Valid values are listed at
/api/v1/filters" }`.

---

## 9. Pagination links — open discussion

Add `next` / `prev` absolute URLs to `meta` (or a `links` object) so clients
don't build pagination URLs by hand. Cheap, but grows every list response;
decide together with 8.

---

## Suggested order

1. **Sparse fieldsets** — ✅ implemented (2026-07-07).
2. **Multi-value filters + 6 (case-insensitive)** — ✅ implemented (2026-07-07).
3. **ETag** — ✅ implemented (2026-07-07).
4. **Accent-insensitive search (7)** — ✅ implemented (2026-07-07).
5. **Random endpoint** — ✅ implemented (2026-07-07), plus the HEAD-headers fix.
6. **Rate limiting** — reactive; ship when traffic justifies it.
7. **Reject unknown facet values (8)** — ✅ implemented (2026-07-07).
8. **Pagination links (9)** — open discussion.
