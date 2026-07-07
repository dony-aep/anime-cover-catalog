import { createHash } from 'node:crypto';
import rawAnimes from '../_data/animes.json' with { type: 'json' };
import type { Anime } from './schema.js';
import type { AnimeField, AnimeResponse } from './api-schema.js';

const animes = rawAnimes as Anime[];

// The dataset is immutable between deploys, so one validator per deploy is
// enough for every response derived from it (quoted, per the ETag grammar).
export const datasetEtag = `"${createHash('sha1')
  .update(JSON.stringify(animes))
  .digest('hex')}"`;

export interface ListParams {
  q?: string;
  genre?: string[];
  theme?: string[];
  demographic?: string[];
  type?: string[];
  year?: number;
  sort: 'title' | 'year';
  order: 'asc' | 'desc';
  page: number;
  limit: number;
}

/** Converts a stored anime into its API representation with absolute image URLs. */
export function toApiAnime(anime: Anime, origin: string): AnimeResponse {
  const toUrl = (path: string) => `${origin}/${encodeURI(path)}`;
  return {
    ...anime,
    images: {
      cover: toUrl(anime.images.cover),
      alternatives: anime.images.alternatives.map(toUrl),
    },
  };
}

/** Projects an anime onto the requested fields (sparse fieldset). */
export function pickFields(anime: AnimeResponse, fields: AnimeField[]): Partial<AnimeResponse> {
  return Object.fromEntries(fields.map((f) => [f, anime[f]])) as Partial<AnimeResponse>;
}

export function findBySlug(slug: string): Anime | undefined {
  return animes.find((anime) => anime.slug === slug);
}

/**
 * Lowercases and strips Latin combining diacritics so "roze" matches "Rozé".
 * The stripped range excludes kana voicing marks, so Japanese titles are untouched.
 */
export function foldForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** The filtering subset of ListParams, shared by the list and random routes. */
export type FilterParams = Pick<
  ListParams,
  'q' | 'genre' | 'theme' | 'demographic' | 'type' | 'year'
>;

function applyFilters(params: FilterParams): Anime[] {
  let result = animes;

  if (params.q) {
    const q = foldForSearch(params.q);
    result = result.filter(
      (a) =>
        foldForSearch(a.title).includes(q) ||
        (a.titleEnglish ? foldForSearch(a.titleEnglish).includes(q) : false) ||
        (a.titleJapanese ? foldForSearch(a.titleJapanese).includes(q) : false),
    );
  }
  // Multi-value filters: OR within a param, AND across params, case-insensitive.
  const wanted = (values: string[]) => new Set(values.map((v) => v.toLowerCase()));
  if (params.genre?.length) {
    const set = wanted(params.genre);
    result = result.filter((a) => a.genres.some((g) => set.has(g.toLowerCase())));
  }
  if (params.theme?.length) {
    const set = wanted(params.theme);
    result = result.filter((a) => a.themes.some((t) => set.has(t.toLowerCase())));
  }
  if (params.demographic?.length) {
    const set = wanted(params.demographic);
    result = result.filter((a) => a.demographic !== null && set.has(a.demographic.toLowerCase()));
  }
  if (params.type?.length) {
    const set = wanted(params.type);
    result = result.filter((a) => set.has(a.type.toLowerCase()));
  }
  if (params.year !== undefined) result = result.filter((a) => a.releaseYear === params.year);

  return result;
}

/** Picks one random anime from the filtered set (undefined when nothing matches). */
export function pickRandom(params: FilterParams): Anime | undefined {
  const pool = applyFilters(params);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function queryAnimes(params: ListParams): { items: Anime[]; total: number } {
  const result = applyFilters(params);

  const dir = params.order === 'asc' ? 1 : -1;
  const sorted = [...result].sort((a, b) => {
    if (params.sort === 'year') {
      const diff = (a.releaseYear ?? 0) - (b.releaseYear ?? 0);
      if (diff !== 0) return diff * dir;
    }
    return a.title.localeCompare(b.title) * dir;
  });

  const total = sorted.length;
  const start = (params.page - 1) * params.limit;
  const items = sorted.slice(start, start + params.limit);
  return { items, total };
}

function buildFilters() {
  const genres = new Set<string>();
  const themes = new Set<string>();
  const demographics = new Set<string>();
  const types = new Set<string>();
  const years = new Set<number>();

  for (const a of animes) {
    a.genres.forEach((g) => genres.add(g));
    a.themes.forEach((t) => themes.add(t));
    if (a.demographic) demographics.add(a.demographic);
    if (a.type) types.add(a.type);
    if (a.releaseYear !== null) years.add(a.releaseYear);
  }

  const sortStr = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b));
  return {
    genres: sortStr(genres),
    themes: sortStr(themes),
    demographics: sortStr(demographics),
    types: sortStr(types),
    years: [...years].sort((a, b) => b - a),
  };
}

// The dataset is immutable between deploys, so compute the facets once.
const filters = buildFilters();

export function getFilters() {
  return filters;
}
