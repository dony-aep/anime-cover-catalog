import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AnimeService } from './anime.service';
import { Anime, AnimeListResponse } from '../models/anime.model';

function makeAnime(overrides: Partial<Anime> & { slug: string; title: string }): Anime {
  return {
    titleEnglish: null,
    titleJapanese: null,
    images: { cover: `https://example.com/assets/AnimeImages/${overrides.slug}.jpg`, alternatives: [] },
    releaseYear: 2020,
    studios: [],
    type: 'TV',
    demographic: null,
    themes: [],
    genres: [],
    explicitGenres: [],
    episodes: 12,
    synopsis: '',
    trailerUrl: null,
    ...overrides,
  };
}

function pageResponse(data: Anime[], page: number, total: number): AnimeListResponse {
  return {
    data,
    meta: { page, limit: 100, total, totalPages: Math.ceil(total / 100) },
  };
}

describe('AnimeService', () => {
  let service: AnimeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(AnimeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads a single-page catalog with one request', () => {
    const animes = [makeAnime({ slug: 'a', title: 'A' }), makeAnime({ slug: 'b', title: 'B' })];

    httpMock.expectOne('/api/v1/animes?limit=100&page=1').flush(pageResponse(animes, 1, 2));

    expect(service.animes().length).toBe(2);
  });

  it('loads all pages in parallel and concatenates them', () => {
    const page1 = Array.from({ length: 100 }, (_, i) => makeAnime({ slug: `p1-${i}`, title: `P1 ${i}` }));
    const page2 = Array.from({ length: 100 }, (_, i) => makeAnime({ slug: `p2-${i}`, title: `P2 ${i}` }));
    const page3 = Array.from({ length: 54 }, (_, i) => makeAnime({ slug: `p3-${i}`, title: `P3 ${i}` }));

    httpMock.expectOne('/api/v1/animes?limit=100&page=1').flush(pageResponse(page1, 1, 254));
    httpMock.expectOne('/api/v1/animes?limit=100&page=2').flush(pageResponse(page2, 2, 254));
    httpMock.expectOne('/api/v1/animes?limit=100&page=3').flush(pageResponse(page3, 3, 254));

    expect(service.animes().length).toBe(254);
    expect(service.animes()[0].slug).toBe('p1-0');
    expect(service.animes()[253].slug).toBe('p3-53');
  });

  it('filters by exact array element, not by substring', () => {
    const animes = [
      makeAnime({ slug: 'romance', title: 'Romance Anime', genres: ['Romance'] }),
      makeAnime({ slug: 'other', title: 'Other', genres: ['Romantic Subtext'] }),
    ];
    httpMock.expectOne('/api/v1/animes?limit=100&page=1').flush(pageResponse(animes, 1, 2));

    service.changeFilter({ type: 'genre', value: 'Romance' });

    expect(service.animesByFilter().length).toBe(1);
    expect(service.animesByFilter()[0].slug).toBe('romance');
  });

  it('searches across title, titleEnglish and titleJapanese', () => {
    const animes = [
      makeAnime({ slug: 'a', title: 'Ao no Hako', titleEnglish: 'Blue Box' }),
      makeAnime({ slug: 'b', title: 'Unrelated' }),
    ];
    httpMock.expectOne('/api/v1/animes?limit=100&page=1').flush(pageResponse(animes, 1, 2));

    service.changeSearchTerm('blue');

    expect(service.filteredAnimes().length).toBe(1);
    expect(service.filteredAnimes()[0].slug).toBe('a');
  });

  it('sorts null releaseYear as oldest', () => {
    const animes = [
      makeAnime({ slug: 'nueva', title: 'Nueva', releaseYear: 2024 }),
      makeAnime({ slug: 'sin-anio', title: 'Sin Año', releaseYear: null }),
      makeAnime({ slug: 'vieja', title: 'Vieja', releaseYear: 1999 }),
    ];
    httpMock.expectOne('/api/v1/animes?limit=100&page=1').flush(pageResponse(animes, 1, 3));

    // Default sort is newest first: null (treated as 0) goes last.
    expect(service.sortedAnimes().map(a => a.slug)).toEqual(['nueva', 'vieja', 'sin-anio']);
  });
});
