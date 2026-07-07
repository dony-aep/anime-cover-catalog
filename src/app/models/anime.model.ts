/** An anime as returned by the catalog API (/api/v1). Image URLs are absolute. */
export interface Anime {
    slug: string;
    title: string;
    titleEnglish: string | null;
    titleJapanese: string | null;
    images: {
        cover: string;
        alternatives: string[];
    };
    releaseYear: number | null;
    studios: string[];
    type: string;
    demographic: string | null;
    themes: string[];
    genres: string[];
    explicitGenres: string[];
    episodes: number | null;
    synopsis: string;
    trailerUrl: string | null;
}

/** Envelope of GET /api/v1/animes. */
export interface AnimeListResponse {
    data: Anime[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export type FilterType = 'all' | 'genre' | 'theme' | 'demographic' | 'type' | 'explicitGenre';

export interface Filter {
    type: FilterType;
    value: string;
}

export type SortOrder = 'asc' | 'desc';
export type DateSortOrder = 'newest' | 'oldest';
