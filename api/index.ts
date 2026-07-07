import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { getRequestListener } from '@hono/node-server';
import {
  AnimeListResponseSchema,
  AnimeResponseSchema,
  DetailQuerySchema,
  ErrorSchema,
  FiltersResponseSchema,
  ListQuerySchema,
  RandomQuerySchema,
  SlugParamSchema,
  type AnimeResponse,
} from './_lib/api-schema.js';
import {
  datasetEtag,
  findBySlug,
  findUnknownFacetValue,
  getFilters,
  pickFields,
  pickRandom,
  queryAnimes,
  toApiAnime,
} from './_lib/data.js';

const app = new OpenAPIHono({
  // Standardize request-validation failures to the same { error } shape as the
  // rest of the API (instead of the raw Zod error).
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        { error: result.error.issues[0]?.message ?? 'Invalid request parameters' },
        400,
      );
    }
  },
}).basePath('/api');

// Public API: allow any origin.
app.use('/*', cors());

// Data is immutable between deploys, so let the edge cache absorb the load
// and give clients a validator: one ETag per deploy, 304 on revalidation.
// HEAD mirrors GET headers per the HTTP spec. Routes that set their own
// Cache-Control (e.g. /animes/random with no-store) are left untouched.
app.use('/*', async (c, next) => {
  await next();
  if (
    (c.req.method === 'GET' || c.req.method === 'HEAD') &&
    c.res.status === 200 &&
    !c.res.headers.has('cache-control')
  ) {
    c.header('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    c.header('ETag', datasetEtag);
    const ifNoneMatch = c.req.header('if-none-match');
    const matches =
      ifNoneMatch !== undefined &&
      (ifNoneMatch === '*' ||
        ifNoneMatch.split(',').some((tag) => tag.trim().replace(/^W\//, '') === datasetEtag));
    if (matches) {
      const headers = new Headers(c.res.headers);
      headers.delete('content-type');
      headers.delete('content-length');
      c.res = new Response(null, { status: 304, headers });
    }
  }
});

// Vercel terminates TLS upstream, so the request reaches the function over a
// plain socket and c.req.url comes out as http://; x-forwarded-proto carries
// the original scheme.
const withForwardedProto = (c: Context) => {
  const url = new URL(c.req.url);
  const proto = c.req.header('x-forwarded-proto')?.split(',')[0]?.trim();
  if (proto) url.protocol = `${proto}:`;
  return url;
};

const originOf = (c: Context) => withForwardedProto(c).origin;

/** Absolute URL of the current request with `page` swapped, for pagination links. */
const pageUrl = (c: Context, page: number) => {
  const url = withForwardedProto(c);
  url.searchParams.set('page', String(page));
  return url.toString();
};

const listRoute = createRoute({
  method: 'get',
  path: '/v1/animes',
  tags: ['Animes'],
  summary: 'List animes',
  description: 'Returns a paginated, filterable and sortable list of animes.',
  request: { query: ListQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: AnimeListResponseSchema } },
      description: 'Paginated list of animes',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid query parameters',
    },
  },
});

app.openapi(listRoute, (c) => {
  const params = c.req.valid('query');
  const unknownFacet = findUnknownFacetValue(params);
  if (unknownFacet) {
    return c.json({ error: unknownFacet }, 400);
  }
  const origin = originOf(c);
  const { items, total } = queryAnimes(params);
  const data = items.map((a) => toApiAnime(a, origin));
  const totalPages = Math.ceil(total / params.limit);
  return c.json(
    {
      // The documented schema is the full Anime; `fields` projects it, so the
      // partial objects are cast back to satisfy the route typing.
      data: (params.fields ? data.map((a) => pickFields(a, params.fields!)) : data) as AnimeResponse[],
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
      },
      links: {
        next: params.page < totalPages ? pageUrl(c, params.page + 1) : null,
        prev: params.page > 1 ? pageUrl(c, params.page - 1) : null,
      },
    },
    200,
  );
});

// Registered before the detail route so "random" is not matched as a slug.
const randomRoute = createRoute({
  method: 'get',
  path: '/v1/animes/random',
  tags: ['Animes'],
  summary: 'Get a random anime',
  description:
    'Returns one random anime. Honors the list filters (q, genre, theme, demographic, ' +
    'type, year) and `fields`. Not cached: every request gets a fresh pick.',
  request: { query: RandomQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: AnimeResponseSchema } },
      description: 'A random anime',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid query parameters',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'No anime matches the requested filters',
    },
  },
});

app.openapi(randomRoute, (c) => {
  const params = c.req.valid('query');
  const unknownFacet = findUnknownFacetValue(params);
  if (unknownFacet) {
    return c.json({ error: unknownFacet }, 400);
  }
  const anime = pickRandom(params);
  if (!anime) {
    return c.json({ error: 'No anime matches the requested filters' }, 404);
  }
  // Opt out of the edge cache: a cached "random" would pin one pick for a day.
  c.header('Cache-Control', 'no-store');
  const full = toApiAnime(anime, originOf(c));
  return c.json((params.fields ? pickFields(full, params.fields) : full) as AnimeResponse, 200);
});

const detailRoute = createRoute({
  method: 'get',
  path: '/v1/animes/{slug}',
  tags: ['Animes'],
  summary: 'Get anime by slug',
  request: { params: SlugParamSchema, query: DetailQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: AnimeResponseSchema } },
      description: 'The requested anime',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid query parameters',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Anime not found',
    },
  },
});

app.openapi(detailRoute, (c) => {
  const { slug } = c.req.valid('param');
  const { fields } = c.req.valid('query');
  const anime = findBySlug(slug);
  if (!anime) {
    return c.json({ error: `Anime not found: ${slug}` }, 404);
  }
  const full = toApiAnime(anime, originOf(c));
  // Same cast rationale as the list route: `fields` projects the documented shape.
  return c.json((fields ? pickFields(full, fields) : full) as AnimeResponse, 200);
});

const filtersRoute = createRoute({
  method: 'get',
  path: '/v1/filters',
  tags: ['Filters'],
  summary: 'List available filter facets',
  description: 'Returns the distinct genres, themes, demographics, types and years in the catalog.',
  responses: {
    200: {
      content: { 'application/json': { schema: FiltersResponseSchema } },
      description: 'Available filter facets',
    },
  },
});

app.openapi(filtersRoute, (c) => c.json(getFilters(), 200));

// Discovery index — what a client hitting the API root should find.
app.get('/v1', (c) => {
  const origin = originOf(c);
  return c.json({
    name: 'Anime Cover Catalog API',
    version: '1.0.0',
    description: 'Public, read-only API to browse the curated anime cover catalog.',
    documentation: `${origin}/docs`,
    openapi: `${origin}/api/v1/openapi.json`,
    swagger: `${origin}/api/v1/docs`,
    endpoints: {
      animes: `${origin}/api/v1/animes`,
      anime: `${origin}/api/v1/animes/{slug}`,
      random: `${origin}/api/v1/animes/random`,
      filters: `${origin}/api/v1/filters`,
    },
    attribution:
      'Metadata extracted from public sources (e.g. MyAnimeList); cover images sourced from various providers. Curated, stored and served by this project for educational, non-commercial use.',
  });
});

// OpenAPI spec + interactive docs.
app.doc('/v1/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'Anime Cover Catalog API',
    version: '1.0.0',
    description: 'Public, read-only API to browse the curated anime cover catalog.',
  },
  servers: [{ url: '/', description: 'Current host' }],
});

app.get('/v1/docs', swaggerUI({ url: '/api/v1/openapi.json' }));

export { app };

// Vercel invokes Node-runtime functions with (req, res); getRequestListener
// bridges those to the Web-standard fetch handler the Hono app exposes.
export default getRequestListener((request) => app.fetch(request));
