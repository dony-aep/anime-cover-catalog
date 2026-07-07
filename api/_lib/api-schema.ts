import { z } from '@hono/zod-openapi';

/** A single anime as returned by the API (image fields are absolute URLs). */
export const AnimeResponseSchema = z
  .object({
    slug: z.string().openapi({ example: 'ao-no-hako' }),
    title: z.string().openapi({ example: 'Ao no Hako' }),
    titleEnglish: z.string().nullable().openapi({ example: 'Blue Box' }),
    titleJapanese: z.string().nullable().openapi({ example: 'アオのハコ' }),
    images: z
      .object({
        cover: z.string().url(),
        alternatives: z.array(z.string().url()),
      })
      .openapi('AnimeImages'),
    releaseYear: z.number().int().nullable().openapi({ example: 2024 }),
    studios: z.array(z.string()),
    type: z.string().openapi({ example: 'TV' }),
    demographic: z.string().nullable().openapi({ example: 'Shounen' }),
    themes: z.array(z.string()),
    genres: z.array(z.string()),
    explicitGenres: z.array(z.string()),
    episodes: z.number().int().nullable().openapi({ example: 25 }),
    synopsis: z.string(),
    trailerUrl: z.string().nullable(),
  })
  .openapi('Anime');

export type AnimeResponse = z.infer<typeof AnimeResponseSchema>;

export const MetaSchema = z
  .object({
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 24 }),
    total: z.number().int().openapi({ example: 254 }),
    totalPages: z.number().int().openapi({ example: 11 }),
  })
  .openapi('Meta');

export const AnimeListResponseSchema = z
  .object({
    data: z.array(AnimeResponseSchema),
    meta: MetaSchema,
  })
  .openapi('AnimeList');

export const FiltersResponseSchema = z
  .object({
    genres: z.array(z.string()),
    themes: z.array(z.string()),
    demographics: z.array(z.string()),
    types: z.array(z.string()),
    years: z.array(z.number().int()),
  })
  .openapi('Filters');

export const ErrorSchema = z
  .object({
    error: z.string().openapi({ example: 'Not found' }),
  })
  .openapi('Error');

/** Query parameters accepted by GET /v1/animes. */
export const ListQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .openapi({ param: { name: 'q', in: 'query' }, example: 'blue' }),
  genre: z.string().optional().openapi({ param: { name: 'genre', in: 'query' }, example: 'Romance' }),
  theme: z.string().optional().openapi({ param: { name: 'theme', in: 'query' }, example: 'School' }),
  demographic: z
    .string()
    .optional()
    .openapi({ param: { name: 'demographic', in: 'query' }, example: 'Shounen' }),
  type: z.string().optional().openapi({ param: { name: 'type', in: 'query' }, example: 'TV' }),
  year: z.coerce
    .number()
    .int()
    .optional()
    .openapi({ param: { name: 'year', in: 'query' }, example: 2024 }),
  sort: z
    .enum(['title', 'year'])
    .default('title')
    .openapi({ param: { name: 'sort', in: 'query' } }),
  order: z
    .enum(['asc', 'desc'])
    .default('asc')
    .openapi({ param: { name: 'order', in: 'query' } }),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1)
    .openapi({ param: { name: 'page', in: 'query' }, example: 1 }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(24)
    .openapi({ param: { name: 'limit', in: 'query' }, example: 24 }),
});

export const SlugParamSchema = z.object({
  slug: z.string().max(120).openapi({ param: { name: 'slug', in: 'path' }, example: 'ao-no-hako' }),
});
