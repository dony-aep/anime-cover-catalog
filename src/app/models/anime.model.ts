export interface Anime {
    title: string;
    imageUrl: string;
    releaseYear: string;
    studio: string;
    type: string;
    demographic: string;
    theme: string;
    episodes: string;
    genres: string;
    synopsis: string;
    trailerUrl: string;
    explicitGenres?: string;
}

export type FilterType = 'all' | 'genre' | 'theme' | 'demographic' | 'type' | 'explicitGenre';

export interface Filter {
    type: FilterType;
    value: string;
}

export type SortOrder = 'asc' | 'desc';
export type DateSortOrder = 'newest' | 'oldest'; 