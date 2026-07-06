import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { getRequestListener } from '@hono/node-server';
import {
  AnimeListResponseSchema,
  AnimeResponseSchema,
  ErrorSchema,
  FiltersResponseSchema,
  ListQuerySchema,
  SlugParamSchema,
} from './_lib/api-schema.js';
import { findBySlug, getFilters, queryAnimes, toApiAnime } from './_lib/data.js';

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

// Data is immutable between deploys, so let the edge cache absorb the load.
app.use('/*', async (c, next) => {
  await next();
  if (c.req.method === 'GET' && c.res.status === 200) {
    c.header('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  }
});

const originOf = (url: string) => new URL(url).origin;

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
  const origin = originOf(c.req.url);
  const { items, total } = queryAnimes(params);
  return c.json(
    {
      data: items.map((a) => toApiAnime(a, origin)),
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    },
    200,
  );
});

const detailRoute = createRoute({
  method: 'get',
  path: '/v1/animes/{slug}',
  tags: ['Animes'],
  summary: 'Get anime by slug',
  request: { params: SlugParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: AnimeResponseSchema } },
      description: 'The requested anime',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Anime not found',
    },
  },
});

app.openapi(detailRoute, (c) => {
  const { slug } = c.req.valid('param');
  const anime = findBySlug(slug);
  if (!anime) {
    return c.json({ error: `Anime not found: ${slug}` }, 404);
  }
  return c.json(toApiAnime(anime, originOf(c.req.url)), 200);
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
  const origin = originOf(c.req.url);
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
