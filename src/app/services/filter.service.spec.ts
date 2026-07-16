import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FilterService } from './filter.service';
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

describe('FilterService', () => {
  let service: FilterService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(FilterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushCatalog(animes: Anime[]) {
    const response: AnimeListResponse = {
      data: animes,
      meta: { page: 1, limit: 100, total: animes.length, totalPages: 1 },
    };
    httpMock.expectOne('/api/v1/animes?limit=100&page=1').flush(response);
  }

  it('derives filters from the loaded catalog, sorted and deduplicated', () => {
    flushCatalog([
      makeAnime({ slug: 'a', title: 'A', genres: ['Romance'], themes: ['School'], demographic: 'Shounen' }),
      makeAnime({ slug: 'b', title: 'B', genres: ['Romance', 'Comedy'], type: 'Movie' }),
    ]);

    const filters = service.filters();

    expect(filters[0]).toEqual({ label: 'All', type: 'all', value: '' });
    expect(filters).toContainEqual({ label: 'Romance', type: 'genre', value: 'Romance' });
    expect(filters).toContainEqual({ label: 'School', type: 'theme', value: 'School' });
    expect(filters).toContainEqual({ label: 'Shounen', type: 'demographic', value: 'Shounen' });
    expect(filters).toContainEqual({ label: 'Movie', type: 'type', value: 'Movie' });
    // 'Romance' appears in two animes but only once in the list.
    expect(filters.filter(f => f.value === 'Romance').length).toBe(1);
    // Alphabetical after 'All'.
    const labels = filters.slice(1).map(f => f.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
  });

  it('appears automatically when a new facet value enters the catalog', () => {
    flushCatalog([makeAnime({ slug: 'a', title: 'A', themes: ['Villainess'] })]);

    expect(service.filters()).toContainEqual({ label: 'Villainess', type: 'theme', value: 'Villainess' });
  });

  it('resolves route params back to values (round-trip)', () => {
    flushCatalog([
      makeAnime({ slug: 'a', title: 'A', genres: ['Sci-Fi'], themes: ['Idols (Female)'] }),
    ]);

    expect(service.getRouteParamFromValue('Sci-Fi')).toBe('sci-fi');
    expect(service.getValueFromRouteParam('sci-fi')).toBe('Sci-Fi');
    expect(service.getRouteParamFromValue('Idols (Female)')).toBe('idols-female');
    expect(service.getValueFromRouteParam('idols-female')).toBe('Idols (Female)');
    expect(service.getValueFromRouteParam('no-existe')).toBeUndefined();
  });
});
