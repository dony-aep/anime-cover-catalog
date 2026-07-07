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

/** Field names a client may request through the `fields` query param. */
export const ANIME_FIELDS = AnimeResponseSchema.keyof().options;

export type AnimeField = (typeof ANIME_FIELDS)[number];

const FieldsSchema = z
  .string()
  .transform((value) => value.split(',').map((f) => f.trim()).filter(Boolean))
  .pipe(
    z
      .array(
        z.enum(ANIME_FIELDS, {
          errorMap: (_issue, ctx) => ({ message: `Unknown field: ${ctx.data}` }),
        }),
      )
      .min(1, { message: 'fields must name at least one field' }),
  )
  .optional()
  .openapi({
    param: {
      name: 'fields',
      in: 'query',
      description:
        'Comma-separated subset of fields to return. When present, response objects ' +
        `contain only the requested fields. Valid names: ${ANIME_FIELDS.join(', ')}.`,
    },
    example: 'slug,title,genres',
    type: 'string',
  });

export const MetaSchema = z
  .object({
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 24 }),
    total: z.number().int().openapi({ example: 254 }),
    totalPages: z.number().int().openapi({ example: 11 }),
  })
  .openapi('Meta');

export const LinksSchema = z
  .object({
    next: z
      .string()
      .nullable()
      .openapi({ example: 'https://example.com/api/v1/animes?page=2' }),
    prev: z.string().nullable().openapi({ example: null }),
  })
  .openapi('Links');

export const AnimeListResponseSchema = z
  .object({
    data: z.array(AnimeResponseSchema),
    meta: MetaSchema,
    links: LinksSchema,
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

/**
 * A filter that accepts one value or a comma-separated list (OR semantics),
 * e.g. `?genre=Romance,Comedy`. Matching is case-insensitive.
 */
const multiValueFilter = (name: string, example: string) =>
  z
    .string()
    .transform((value) => value.split(',').map((v) => v.trim()).filter(Boolean))
    .pipe(z.array(z.string()).min(1, { message: `${name} must name at least one value` }))
    .optional()
    .openapi({
      param: {
        name,
        in: 'query',
        description:
          'One value or a comma-separated list; any listed value matches (OR). Case-insensitive.',
      },
      example,
      type: 'string',
    });

/** Query parameters accepted by GET /v1/animes. */
export const ListQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .openapi({ param: { name: 'q', in: 'query' }, example: 'blue' }),
  genre: multiValueFilter('genre', 'Romance,Comedy'),
  theme: multiValueFilter('theme', 'School'),
  demographic: multiValueFilter('demographic', 'Shounen'),
  type: multiValueFilter('type', 'TV'),
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
  fields: FieldsSchema,
});

/** Query parameters accepted by GET /v1/animes/{slug}. */
export const DetailQuerySchema = z.object({
  fields: FieldsSchema,
});

/** Query parameters accepted by GET /v1/animes/random: the list filters + fields. */
export const RandomQuerySchema = ListQuerySchema.pick({
  q: true,
  genre: true,
  theme: true,
  demographic: true,
  type: true,
  year: true,
  fields: true,
});

export const SlugParamSchema = z.object({
  slug: z.string().max(120).openapi({ param: { name: 'slug', in: 'path' }, example: 'ao-no-hako' }),
});
