import { z } from 'zod';

/**
 * Canonical schema for a stored anime record (api/_data/animes.json).
 *
 * Image fields hold a path relative to the site root (e.g.
 * "assets/AnimeImages/Ao_no_hako.jpeg"). The API turns them into absolute
 * URLs at response time based on the request host, so the stored data stays
 * host-agnostic.
 */
export const AnimeSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  titleEnglish: z.string().nullable(),
  titleJapanese: z.string().nullable(),
  images: z.object({
    cover: z.string().min(1),
    alternatives: z.array(z.string()),
  }),
  releaseYear: z.number().int().nullable(),
  studios: z.array(z.string()),
  type: z.string(),
  demographic: z.string().nullable(),
  themes: z.array(z.string()),
  genres: z.array(z.string()),
  explicitGenres: z.array(z.string()),
  episodes: z.number().int().nullable(),
  synopsis: z.string(),
  trailerUrl: z.string().nullable(),
});

export type Anime = z.infer<typeof AnimeSchema>;

export const AnimeListSchema = z.array(AnimeSchema);
