/**
 * Smoke test for the API — exercises app.fetch() without Vercel.
 *
 * Expected values are derived from the canonical dataset so the test keeps
 * passing when the catalog grows or changes.
 */
import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from '../index.js';
import rawAnimes from '../_data/animes.json' with { type: 'json' };
import type { Anime } from '../_lib/schema.js';

const animes = rawAnimes as Anime[];
const BASE = 'https://catalog.example.com';

const TOTAL = animes.length;
const DEFAULT_LIMIT = 24;
const TOTAL_PAGES = Math.ceil(TOTAL / DEFAULT_LIMIT);
const ROMANCE_TOTAL = animes.filter((a) => a.genres.includes('Romance')).length;
const COMEDY_TOTAL = animes.filter((a) => a.genres.includes('Comedy')).length;
const ROMANCE_OR_COMEDY_TOTAL = animes.filter(
  (a) => a.genres.includes('Romance') || a.genres.includes('Comedy'),
).length;
const ROMCOM_SCHOOL_TOTAL = animes.filter(
  (a) =>
    (a.genres.includes('Romance') || a.genres.includes('Comedy')) &&
    a.themes.includes('School'),
).length;
const TV_TOTAL = animes.filter((a) => a.type === 'TV').length;
const BLUE_TOTAL = animes.filter((a) =>
  [a.title, a.titleEnglish, a.titleJapanese].some((t) => t?.toLowerCase().includes('blue')),
).length;
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const CAFE_TOTAL = animes.filter((a) =>
  [a.title, a.titleEnglish, a.titleJapanese].some((t) => t && fold(t).includes('cafe')),
).length;
const WITH_ALTS = animes.find((a) => a.images.alternatives.length > 0);

async function get(path: string) {
  const res = await app.fetch(new Request(BASE + path));
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function getRaw(path: string) {
  const res = await app.fetch(new Request(BASE + path));
  const text = await res.text();
  return { status: res.status, contentType: res.headers.get('content-type') ?? '', text };
}

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('❌ FAIL:', msg);
    process.exitCode = 1;
  } else {
    console.log('✅', msg);
  }
}

async function main() {
  // List: default pagination
  const list = await get('/api/v1/animes');
  assert(list.status === 200, 'GET /api/v1/animes -> 200');
  assert(
    list.body.data.length === Math.min(DEFAULT_LIMIT, TOTAL),
    `default limit ${DEFAULT_LIMIT} (got ${list.body?.data?.length})`,
  );
  assert(list.body.meta.total === TOTAL, `total ${TOTAL} (got ${list.body?.meta?.total})`);
  assert(
    list.body.meta.totalPages === TOTAL_PAGES,
    `totalPages ${TOTAL_PAGES} (got ${list.body?.meta?.totalPages})`,
  );
  assert(
    typeof list.body.data[0].images.cover === 'string' &&
      list.body.data[0].images.cover.startsWith('https://catalog.example.com/assets/'),
    `absolute image URL (got ${list.body?.data?.[0]?.images?.cover})`,
  );

  // Thumbnails: optimized variants exposed next to the originals
  const firstImages = list.body.data[0].images;
  assert(
    typeof firstImages.thumb === 'string' &&
      firstImages.thumb.startsWith(`${BASE}/assets/AnimeImages_thumbs/`),
    `thumb is absolute under /assets/AnimeImages_thumbs/ (got ${firstImages?.thumb})`,
  );
  assert(
    firstImages.thumb?.split('/').pop() === firstImages.cover.split('/').pop(),
    'thumb keeps the cover filename',
  );
  assert(
    Array.isArray(firstImages.alternativesThumbs) &&
      firstImages.alternativesThumbs.length === firstImages.alternatives.length,
    'alternativesThumbs parallels alternatives',
  );

  // Thumbnail coverage: every image the dataset references has a same-named
  // thumb, and the thumbs directory carries no orphans, so the derived thumb
  // URLs never 404.
  const assetsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/assets');
  const coverFiles = new Set(readdirSync(resolve(assetsRoot, 'AnimeImages')));
  const thumbFiles = new Set(readdirSync(resolve(assetsRoot, 'AnimeImages_thumbs')));
  const referenced = animes
    .flatMap((a) => [a.images.cover, ...a.images.alternatives])
    .map((p) => p.split('/').pop()!);
  const missingThumbs = referenced.filter((f) => !thumbFiles.has(f));
  assert(
    missingThumbs.length === 0,
    `every dataset image has a thumb (missing: ${missingThumbs.slice(0, 3).join(', ') || 'none'})`,
  );
  const orphanThumbs = [...thumbFiles].filter((f) => !coverFiles.has(f));
  assert(
    orphanThumbs.length === 0,
    `no orphan thumbs (found: ${orphanThumbs.slice(0, 3).join(', ') || 'none'})`,
  );

  // Filter by genre
  const romance = await get('/api/v1/animes?genre=Romance&limit=100');
  assert(romance.status === 200, 'GET ?genre=Romance -> 200');
  assert(
    romance.body.data.every((a: any) => a.genres.includes('Romance')),
    'all results include genre Romance',
  );
  assert(
    romance.body.meta.total === ROMANCE_TOTAL,
    `Romance subset matches dataset (${ROMANCE_TOTAL}, got ${romance.body?.meta?.total})`,
  );

  // Multi-value filters: OR within a param…
  const romCom = await get('/api/v1/animes?genre=Romance,Comedy&limit=1');
  assert(romCom.status === 200, 'GET ?genre=Romance,Comedy -> 200');
  assert(
    romCom.body.meta.total === ROMANCE_OR_COMEDY_TOTAL,
    `Romance OR Comedy matches dataset (${ROMANCE_OR_COMEDY_TOTAL}, got ${romCom.body?.meta?.total})`,
  );
  // …AND across params
  const romComSchool = await get('/api/v1/animes?genre=Romance,Comedy&theme=School&limit=100');
  assert(
    romComSchool.body.meta.total === ROMCOM_SCHOOL_TOTAL,
    `(Romance OR Comedy) AND School matches dataset (${ROMCOM_SCHOOL_TOTAL}, got ${romComSchool.body?.meta?.total})`,
  );
  assert(
    romComSchool.body.data.every(
      (a: any) =>
        (a.genres.includes('Romance') || a.genres.includes('Comedy')) &&
        a.themes.includes('School'),
    ),
    'combined filter results satisfy both predicates',
  );

  // Case-insensitive filter matching
  const lowerGenre = await get('/api/v1/animes?genre=comedy&limit=1');
  assert(
    lowerGenre.body.meta.total === COMEDY_TOTAL,
    `?genre=comedy matches Comedy case-insensitively (${COMEDY_TOTAL}, got ${lowerGenre.body?.meta?.total})`,
  );
  const lowerType = await get('/api/v1/animes?type=tv&limit=1');
  assert(
    lowerType.body.meta.total === TV_TOTAL,
    `?type=tv matches TV case-insensitively (${TV_TOTAL}, got ${lowerType.body?.meta?.total})`,
  );

  // Unknown facet values -> 400 with a hint, instead of a silent empty result
  const badGenre = await get('/api/v1/animes?genre=Comedia');
  assert(badGenre.status === 400, `unknown genre rejected -> 400 (got ${badGenre.status})`);
  assert(
    typeof badGenre.body.error === 'string' &&
      badGenre.body.error.includes('Comedia') &&
      badGenre.body.error.includes('/filters'),
    `400 names the value and points at /filters (${badGenre.body?.error})`,
  );
  const badMixed = await get('/api/v1/animes?genre=Romance,NoExiste');
  assert(badMixed.status === 400, 'unknown value inside a multi-value list -> 400');
  const badRandomFacet = await get('/api/v1/animes/random?theme=NoExiste');
  assert(badRandomFacet.status === 400, `random rejects unknown facets too (got ${badRandomFacet.status})`);

  // Search
  const search = await get('/api/v1/animes?q=blue');
  assert(search.status === 200, 'GET ?q=blue -> 200');
  assert(
    search.body.meta.total === BLUE_TOTAL,
    `search matches dataset (${BLUE_TOTAL}, got ${search.body?.meta?.total})`,
  );

  // Accent-insensitive search: plain "cafe" finds accented "Café" titles,
  // and the accented query returns the same subset.
  const cafe = await get('/api/v1/animes?q=cafe');
  assert(
    cafe.body.meta.total === CAFE_TOTAL && CAFE_TOTAL > 0,
    `q=cafe matches accented titles (${CAFE_TOTAL}, got ${cafe.body?.meta?.total})`,
  );
  const cafeAccent = await get(`/api/v1/animes?q=${encodeURIComponent('café')}`);
  assert(
    cafeAccent.body.meta.total === CAFE_TOTAL,
    `q=café returns the same subset (${CAFE_TOTAL}, got ${cafeAccent.body?.meta?.total})`,
  );

  // Sorting by year desc
  const byYear = await get('/api/v1/animes?sort=year&order=desc&limit=5');
  const years = byYear.body.data.map((a: any) => a.releaseYear ?? 0);
  assert(
    years.every((y: number, i: number) => i === 0 || years[i - 1] >= y),
    `sorted by year desc (${years.join(',')})`,
  );

  // Pagination page 2
  const page2 = await get('/api/v1/animes?page=2&limit=10');
  const expectedPage2 = Math.min(10, Math.max(0, TOTAL - 10));
  assert(
    page2.body.meta.page === 2 && page2.body.data.length === expectedPage2,
    `page 2 returns ${expectedPage2} items`,
  );
  assert(page2.body.data[0].slug !== list.body.data[0].slug, 'page 2 differs from page 1');

  // Pagination links: absolute, preserve query params, null at the edges
  assert(
    list.body.links?.prev === null && typeof list.body.links?.next === 'string',
    `page 1 links: prev null, next set (${JSON.stringify(list.body?.links)})`,
  );
  assert(
    list.body.links.next.startsWith(BASE) && list.body.links.next.includes('page=2'),
    `next is absolute and points at page 2 (${list.body?.links?.next})`,
  );
  assert(
    page2.body.links?.prev?.includes('page=1') && page2.body.links?.prev?.includes('limit=10'),
    `page 2 prev keeps page and limit (${page2.body?.links?.prev})`,
  );
  const lastPage = await get(`/api/v1/animes?page=${TOTAL_PAGES}`);
  assert(
    lastPage.body.links?.next === null && lastPage.body.links?.prev !== null,
    `last page links: next null, prev set (${JSON.stringify(lastPage.body?.links)})`,
  );
  const filteredLinks = await get('/api/v1/animes?genre=Romance&limit=10');
  assert(
    filteredLinks.body.links?.next?.includes('genre=Romance'),
    `links preserve active filters (${filteredLinks.body?.links?.next})`,
  );

  // Detail (first anime with alternative covers, from the dataset)
  if (!WITH_ALTS) throw new Error('dataset has no anime with alternative covers');
  const detail = await get(`/api/v1/animes/${WITH_ALTS.slug}`);
  assert(detail.status === 200, `GET /api/v1/animes/${WITH_ALTS.slug} -> 200`);
  assert(detail.body.slug === WITH_ALTS.slug, 'detail slug matches');
  assert(
    detail.body.images.alternatives.length === WITH_ALTS.images.alternatives.length,
    `alt covers match dataset (${WITH_ALTS.images.alternatives.length}, got ${detail.body?.images?.alternatives?.length})`,
  );
  assert(
    detail.body.images.alternativesThumbs?.length === WITH_ALTS.images.alternatives.length &&
      detail.body.images.alternativesThumbs.every((u: string) =>
        u.startsWith(`${BASE}/assets/AnimeImages_thumbs/`),
      ),
    'alternativesThumbs are thumb URLs, one per alternative',
  );
  const sparseImages = await get(`/api/v1/animes/${WITH_ALTS.slug}?fields=images`);
  assert(
    Object.keys(sparseImages.body?.images ?? {}).sort().join(',') ===
      'alternatives,alternativesThumbs,cover,thumb',
    `fields=images includes the thumb fields (${Object.keys(sparseImages.body?.images ?? {}).join(',')})`,
  );

  // Sparse fieldsets
  const sparse = await get('/api/v1/animes?fields=slug,title,genres&limit=5');
  assert(sparse.status === 200, 'GET ?fields=slug,title,genres -> 200');
  assert(
    sparse.body.data.every(
      (a: any) => Object.keys(a).sort().join(',') === 'genres,slug,title',
    ),
    'list items contain exactly the requested fields',
  );
  const sparseDetail = await get(`/api/v1/animes/${WITH_ALTS.slug}?fields=title,synopsis`);
  assert(sparseDetail.status === 200, 'detail with ?fields -> 200');
  assert(
    Object.keys(sparseDetail.body).sort().join(',') === 'synopsis,title',
    'detail contains exactly the requested fields',
  );
  const badField = await get('/api/v1/animes?fields=slug,nope');
  assert(badField.status === 400, `unknown field rejected -> 400 (got ${badField.status})`);
  assert(
    typeof badField.body.error === 'string' && badField.body.error.includes('nope'),
    `400 names the unknown field (${badField.body?.error})`,
  );
  const emptyFields = await get('/api/v1/animes?fields=');
  assert(emptyFields.status === 400, `empty fields rejected -> 400 (got ${emptyFields.status})`);

  // Random pick — registered before /{slug}, so "random" is not a slug
  const random = await get('/api/v1/animes/random');
  assert(random.status === 200, 'GET /api/v1/animes/random -> 200');
  assert(
    animes.some((a) => a.slug === random.body?.slug),
    `random returns a catalog anime (${random.body?.slug})`,
  );
  const randomFiltered = await get('/api/v1/animes/random?genre=Romance&fields=slug,genres');
  assert(
    randomFiltered.body?.genres?.includes('Romance') === true,
    'random honors the list filters',
  );
  assert(
    Object.keys(randomFiltered.body ?? {}).sort().join(',') === 'genres,slug',
    'random supports sparse fieldsets',
  );
  const randomEmpty = await get('/api/v1/animes/random?year=1800');
  assert(randomEmpty.status === 404, `random with empty pool -> 404 (got ${randomEmpty.status})`);
  const randomRes = await app.fetch(new Request(BASE + '/api/v1/animes/random'));
  assert(
    randomRes.headers.get('cache-control') === 'no-store',
    `random opts out of the cache (${randomRes.headers.get('cache-control')})`,
  );
  assert(!randomRes.headers.get('etag'), 'random carries no ETag');

  // HEAD mirrors GET caching headers
  const head = await app.fetch(new Request(BASE + '/api/v1/animes?limit=1', { method: 'HEAD' }));
  assert(
    head.status === 200 && !!head.headers.get('etag'),
    `HEAD gets the ETag (status ${head.status})`,
  );
  assert(
    (head.headers.get('cache-control') ?? '').includes('s-maxage=86400'),
    'HEAD gets Cache-Control',
  );

  // 404
  const missing = await get('/api/v1/animes/does-not-exist');
  assert(missing.status === 404, 'GET unknown slug -> 404');
  assert(typeof missing.body.error === 'string', '404 returns error message');

  // Filters
  const filters = await get('/api/v1/filters');
  assert(filters.status === 200, 'GET /api/v1/filters -> 200');
  assert(
    Array.isArray(filters.body.genres) && filters.body.genres.length > 0,
    `filters.genres non-empty (${filters.body?.genres?.length})`,
  );
  assert(
    Array.isArray(filters.body.years) && filters.body.years[0] >= filters.body.years[1],
    'filters.years sorted desc',
  );

  // Validation: bad query
  const badLimit = await get('/api/v1/animes?limit=9999');
  assert(badLimit.status === 400, `limit>100 rejected -> 400 (got ${badLimit.status})`);
  assert(typeof badLimit.body.error === 'string', '400 returns standardized { error } body');

  const longQ = await get('/api/v1/animes?q=' + 'a'.repeat(101));
  assert(longQ.status === 400, `q over 100 chars rejected -> 400 (got ${longQ.status})`);

  // x-forwarded-proto: behind Vercel the socket is plain http; image URLs
  // must still come out with the original (https) scheme.
  const fwd = await app.fetch(
    new Request('http://internal.host/api/v1/animes?limit=1', {
      headers: { 'x-forwarded-proto': 'https' },
    }),
  );
  const fwdBody = await fwd.json();
  assert(
    fwdBody.data[0].images.cover.startsWith('https://internal.host/'),
    `image URLs honor x-forwarded-proto (got ${fwdBody?.data?.[0]?.images?.cover})`,
  );

  // ETag / If-None-Match: 200 exposes the validator, replaying it gives 304
  const tagged = await app.fetch(new Request(BASE + '/api/v1/animes?limit=1'));
  const etag = tagged.headers.get('etag');
  assert(!!etag && /^"[0-9a-f]{40}"$/.test(etag), `200 carries a quoted ETag (${etag})`);
  // The validator must cover the response shape, not just the data: hashing
  // the dataset alone lets a shape change (new derived fields) answer 304 and
  // pin the stale body in client caches indefinitely.
  const datasetOnlyEtag = `"${createHash('sha1').update(JSON.stringify(animes)).digest('hex')}"`;
  assert(etag !== datasetOnlyEtag, 'ETag includes the response shape version, not just the dataset');
  const revalidated = await app.fetch(
    new Request(BASE + '/api/v1/animes?limit=1', { headers: { 'If-None-Match': etag! } }),
  );
  assert(revalidated.status === 304, `If-None-Match replay -> 304 (got ${revalidated.status})`);
  assert((await revalidated.text()) === '', '304 has an empty body');
  assert(revalidated.headers.get('etag') === etag, '304 keeps the ETag');
  assert(
    (revalidated.headers.get('cache-control') ?? '').includes('s-maxage=86400'),
    '304 keeps Cache-Control',
  );
  const stale = await app.fetch(
    new Request(BASE + '/api/v1/animes?limit=1', { headers: { 'If-None-Match': '"stale-tag"' } }),
  );
  assert(stale.status === 200, `non-matching If-None-Match -> 200 (got ${stale.status})`);
  const missTag = await app.fetch(
    new Request(BASE + '/api/v1/animes/does-not-exist', { headers: { 'If-None-Match': etag! } }),
  );
  assert(missTag.status === 404 && !missTag.headers.get('etag'), '404 is never revalidated');

  // CORS + cache headers
  const headed = await app.fetch(new Request(BASE + '/api/v1/animes'));
  assert(headed.headers.get('access-control-allow-origin') === '*', 'CORS allows any origin');
  assert(
    (headed.headers.get('cache-control') ?? '').includes('s-maxage=86400'),
    `Cache-Control set (${headed.headers.get('cache-control')})`,
  );
  const preflight = await app.fetch(
    new Request(BASE + '/api/v1/animes', {
      method: 'OPTIONS',
      headers: { Origin: 'https://other.com', 'Access-Control-Request-Method': 'GET' },
    }),
  );
  assert(
    preflight.headers.get('access-control-allow-origin') === '*',
    `preflight returns CORS headers (${preflight.status})`,
  );

  // Discovery index
  const index = await get('/api/v1');
  assert(index.status === 200, 'GET /api/v1 -> 200');
  assert(!!index.body.documentation && !!index.body.endpoints, 'index exposes documentation + endpoints');
  assert(typeof index.body.endpoints.animes === 'string', 'index links the animes endpoint');
  assert(
    index.body.llms === `${BASE}/llms.txt`,
    `index links the LLM-friendly docs (${index.body?.llms})`,
  );

  // OpenAPI spec
  const spec = await get('/api/v1/openapi.json');
  assert(spec.status === 200, 'GET /api/v1/openapi.json -> 200');
  assert(spec.body.openapi === '3.0.0', 'spec has openapi version');
  assert(Array.isArray(spec.body.servers) && spec.body.servers.length > 0, 'spec declares servers');
  assert(!!spec.body.paths['/api/v1/animes'], 'spec documents /api/v1/animes');
  assert(!!spec.body.paths['/api/v1/animes/{slug}'], 'spec documents detail route');
  assert(!!spec.body.paths['/api/v1/filters'], 'spec documents /api/v1/filters');
  assert(!!spec.body.components.schemas.Anime, 'spec has Anime schema component');

  // Swagger UI
  const docs = await getRaw('/api/v1/docs');
  assert(docs.status === 200, 'GET /api/v1/docs -> 200');
  assert(docs.contentType.includes('text/html'), 'docs served as HTML');
  assert(docs.text.toLowerCase().includes('swagger'), 'docs page references swagger');

  console.log('\nDone.');
}

main();
