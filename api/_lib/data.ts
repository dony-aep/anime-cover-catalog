import rawAnimes from '../_data/animes.json' with { type: 'json' };
import type { Anime } from './schema.js';
import type { AnimeResponse } from './api-schema.js';

const animes = rawAnimes as Anime[];

export interface ListParams {
  q?: string;
  genre?: string;
  theme?: string;
  demographic?: string;
  type?: string;
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

export function findBySlug(slug: string): Anime | undefined {
  return animes.find((anime) => anime.slug === slug);
}

export function queryAnimes(params: ListParams): { items: Anime[]; total: number } {
  let result = animes;

  if (params.q) {
    const q = params.q.toLowerCase();
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.titleEnglish?.toLowerCase().includes(q) ?? false) ||
        (a.titleJapanese?.toLowerCase().includes(q) ?? false),
    );
  }
  if (params.genre) result = result.filter((a) => a.genres.includes(params.genre!));
  if (params.theme) result = result.filter((a) => a.themes.includes(params.theme!));
  if (params.demographic) result = result.filter((a) => a.demographic === params.demographic);
  if (params.type) result = result.filter((a) => a.type === params.type);
  if (params.year !== undefined) result = result.filter((a) => a.releaseYear === params.year);

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
