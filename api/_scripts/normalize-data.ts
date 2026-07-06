/**
 * One-off migration: converts the legacy src/assets/data/animes.json into the
 * canonical API schema and writes it to api/_data/animes.json.
 *
 * Run: npm run data:normalize
 *
 * Transformations:
 *  - adds a stable, unique `slug` derived from the title
 *  - splits comma-separated strings (genres, themes, studios) into arrays
 *  - parses releaseYear / episodes into number | null
 *  - restructures images into { cover, alternatives } with server paths
 *  - normalizes missing/"Not available" sentinels to null or []
 *
 * The output is validated against AnimeSchema before being written.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AnimeListSchema, type Anime } from '../_lib/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const SOURCE = resolve(ROOT, 'src/assets/data/animes.json');
const OUTPUT = resolve(ROOT, 'api/_data/animes.json');

const NULLISH = new Set(['', 'not available', 'n/a', 'unknown', 'none']);

/** A legacy record as it appears in the source JSON. All fields are strings. */
interface LegacyAnime {
  title: string;
  titleEnglish?: string;
  titleJapanese?: string;
  imageUrl: string;
  alternativeCovers?: string[];
  releaseYear?: string;
  studio?: string;
  type?: string;
  demographic?: string;
  theme?: string;
  episodes?: string;
  genres?: string;
  explicitGenres?: string;
  synopsis?: string;
  trailerUrl?: string;
}

function cleanStr(value: string | undefined | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return NULLISH.has(trimmed.toLowerCase()) ? null : trimmed;
}

function toArray(value: string | undefined | null): string[] {
  const clean = cleanStr(value);
  if (!clean) return [];
  return clean
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function toIntOrNull(value: string | undefined | null): number | null {
  const clean = cleanStr(value);
  if (!clean) return null;
  const match = clean.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : null;
}

function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toServerPath(assetPath: string): string {
  // Legacy paths look like "AnimeImages/x.jpg"; images are served under /assets.
  const clean = assetPath.replace(/^\/+/, '');
  return clean.startsWith('assets/') ? clean : `assets/${clean}`;
}

function main(): void {
  const legacy = JSON.parse(readFileSync(SOURCE, 'utf-8')) as LegacyAnime[];

  const usedSlugs = new Map<string, number>();
  const makeUniqueSlug = (title: string): string => {
    const base = slugify(title) || 'anime';
    const count = usedSlugs.get(base) ?? 0;
    usedSlugs.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };

  const normalized: Anime[] = legacy.map((item) => ({
    slug: makeUniqueSlug(item.title),
    title: item.title.trim(),
    titleEnglish: cleanStr(item.titleEnglish),
    titleJapanese: cleanStr(item.titleJapanese),
    images: {
      cover: toServerPath(item.imageUrl),
      alternatives: (item.alternativeCovers ?? []).map(toServerPath),
    },
    releaseYear: toIntOrNull(item.releaseYear),
    studios: toArray(item.studio),
    type: cleanStr(item.type) ?? 'Unknown',
    demographic: cleanStr(item.demographic),
    themes: toArray(item.theme),
    genres: toArray(item.genres),
    explicitGenres: toArray(item.explicitGenres),
    episodes: toIntOrNull(item.episodes),
    synopsis: cleanStr(item.synopsis) ?? '',
    trailerUrl: cleanStr(item.trailerUrl),
  }));

  // Validate against the canonical schema before writing.
  const result = AnimeListSchema.safeParse(normalized);
  if (!result.success) {
    console.error('❌ Validation failed:');
    console.error(result.error.issues.slice(0, 10));
    process.exit(1);
  }

  // Sanity check: no duplicate slugs.
  const slugs = new Set<string>();
  const duplicates: string[] = [];
  for (const anime of normalized) {
    if (slugs.has(anime.slug)) duplicates.push(anime.slug);
    slugs.add(anime.slug);
  }
  if (duplicates.length > 0) {
    console.error(`❌ Duplicate slugs found: ${duplicates.join(', ')}`);
    process.exit(1);
  }

  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(normalized, null, 2) + '\n', 'utf-8');

  console.log(`✅ Normalized ${normalized.length} animes -> ${OUTPUT}`);
  console.log(`   Unique slugs: ${slugs.size}`);
  console.log(`   With alternative covers: ${normalized.filter((a) => a.images.alternatives.length > 0).length}`);
  console.log(`   Missing releaseYear: ${normalized.filter((a) => a.releaseYear === null).length}`);
}

main();
