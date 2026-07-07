/**
 * Smoke test for the API — exercises app.fetch() without Vercel.
 *
 * Expected values are derived from the canonical dataset so the test keeps
 * passing when the catalog grows or changes.
 */
import { app } from '../index.js';
import rawAnimes from '../_data/animes.json' with { type: 'json' };
import type { Anime } from '../_lib/schema.js';

const animes = rawAnimes as Anime[];
const BASE = 'https://catalog.example.com';

const TOTAL = animes.length;
const DEFAULT_LIMIT = 24;
const TOTAL_PAGES = Math.ceil(TOTAL / DEFAULT_LIMIT);
const ROMANCE_TOTAL = animes.filter((a) => a.genres.includes('Romance')).length;
const BLUE_TOTAL = animes.filter((a) =>
  [a.title, a.titleEnglish, a.titleJapanese].some((t) => t?.toLowerCase().includes('blue')),
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

  // Search
  const search = await get('/api/v1/animes?q=blue');
  assert(search.status === 200, 'GET ?q=blue -> 200');
  assert(
    search.body.meta.total === BLUE_TOTAL,
    `search matches dataset (${BLUE_TOTAL}, got ${search.body?.meta?.total})`,
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

  // Detail (first anime with alternative covers, from the dataset)
  if (!WITH_ALTS) throw new Error('dataset has no anime with alternative covers');
  const detail = await get(`/api/v1/animes/${WITH_ALTS.slug}`);
  assert(detail.status === 200, `GET /api/v1/animes/${WITH_ALTS.slug} -> 200`);
  assert(detail.body.slug === WITH_ALTS.slug, 'detail slug matches');
  assert(
    detail.body.images.alternatives.length === WITH_ALTS.images.alternatives.length,
    `alt covers match dataset (${WITH_ALTS.images.alternatives.length}, got ${detail.body?.images?.alternatives?.length})`,
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
