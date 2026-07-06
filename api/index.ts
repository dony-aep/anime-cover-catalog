import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { handle } from 'hono/vercel';
import {
  AnimeListResponseSchema,
  AnimeResponseSchema,
  ErrorSchema,
  FiltersResponseSchema,
  ListQuerySchema,
  SlugParamSchema,
} from './_lib/api-schema';
import { findBySlug, getFilters, queryAnimes, toApiAnime } from './_lib/data';

const app = new OpenAPIHono().basePath('/api');

// Public API: allow any origin.
app.use('/v1/*', cors());

// Data is immutable between deploys, so let the edge cache absorb the load.
app.use('/v1/*', async (c, next) => {
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

// OpenAPI spec + interactive docs.
app.doc('/v1/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'Anime Cover Catalog API',
    version: '1.0.0',
    description: 'Public, read-only API to browse the curated anime cover catalog.',
  },
});

app.get('/v1/docs', swaggerUI({ url: '/api/v1/openapi.json' }));

export { app };
export default handle(app);
