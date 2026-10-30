import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FilterService } from './filter.service';
import { AnimeService } from './anime.service';
import { Anime, AnimeListResponse } from '../models/anime.model';

function makeAnime(overrides: Partial<Anime> & { slug: string; title: string }): Anime {
  return {
    titleEnglish: null,
    titleJapanese: null,
    images: {
      cover: `https://example.com/assets/AnimeImages/${overrides.slug}.jpg`,
      thumb: `https://example.com/assets/AnimeImages_thumbs/${overrides.slug}.webp`,
      alternatives: [],
      alternativesThumbs: [],
    },
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
    // El servicio lee los grupos plegados al crearse: sin limpiar, un test arrastraría el estado del anterior.
    localStorage.removeItem('filter_groups_collapsed');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    service = TestBed.inject(FilterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // El catálogo llega vía resource(): el loader arranca en un effect
  // (TestBed.tick) y resuelve promesas tras el flush, de ahí el settle().
  async function flushCatalog(animes: Anime[]) {
    const response: AnimeListResponse = {
      data: animes,
      meta: { page: 1, limit: 100, total: animes.length, totalPages: 1 },
    };
    TestBed.tick();
    httpMock.expectOne('/api/v1/animes?limit=100&page=1').flush(response);
    await new Promise(resolve => setTimeout(resolve));
  }

  it('derives filters from the loaded catalog, sorted and deduplicated', async () => {
    await flushCatalog([
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

  it('appears automatically when a new facet value enters the catalog', async () => {
    await flushCatalog([makeAnime({ slug: 'a', title: 'A', themes: ['Villainess'] })]);

    expect(service.filters()).toContainEqual({ label: 'Villainess', type: 'theme', value: 'Villainess' });
  });

  it('groups filters by facet, most used first', async () => {
    await flushCatalog([
      makeAnime({ slug: 'a', title: 'A', genres: ['Romance'], explicitGenres: ['Ecchi'] }),
      makeAnime({ slug: 'b', title: 'B', genres: ['Romance', 'Comedy'], type: 'Movie' }),
      makeAnime({ slug: 'c', title: 'C', genres: ['Action', 'Romance'], demographic: 'Seinen' }),
    ]);

    const groups = service.filterGroups();

    expect(groups.map(g => g.type)).toEqual(['type', 'demographic', 'genre', 'explicitGenre']);
    expect(groups.find(g => g.type === 'type')!.options.map(o => o.value)).toEqual(['TV', 'Movie']);
    // Romance (3) primero; Action y Comedy empatan a 1 y van por orden alfabético.
    expect(groups.find(g => g.type === 'genre')!.options.map(o => o.value)).toEqual(['Romance', 'Action', 'Comedy']);
  });

  it('collapses long groups but keeps the active filter visible', async () => {
    const genres = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10'];
    await flushCatalog(genres.map((g, i) => makeAnime({
      slug: `s${i}`,
      title: `T${i}`,
      // G1 aparece en 10 animes, G2 en 9... así el orden por uso es G1..G10.
      genres: genres.slice(0, genres.length - i),
    })));
    const animeService = TestBed.inject(AnimeService);

    const collapsed = service.visibleGroups(new Set()).find(g => g.type === 'genre')!;
    expect(collapsed.options.map(o => o.value)).toEqual(genres.slice(0, 8));
    expect(collapsed.hiddenCount).toBe(2);

    animeService.changeFilter({ type: 'genre', value: 'G10' });
    const withActive = service.visibleGroups(new Set()).find(g => g.type === 'genre')!;
    expect(withActive.options.map(o => o.value)).toEqual([...genres.slice(0, 8), 'G10']);

    const expanded = service.visibleGroups(new Set(['genre'])).find(g => g.type === 'genre')!;
    expect(expanded.options.length).toBe(10);
    expect(expanded.hiddenCount).toBe(0);
  });

  it('folds a group down to its active filter and remembers it', async () => {
    await flushCatalog([
      makeAnime({ slug: 'a', title: 'A', genres: ['Romance', 'Comedy'] }),
      makeAnime({ slug: 'b', title: 'B', genres: ['Romance'] }),
    ]);
    const animeService = TestBed.inject(AnimeService);
    const genreGroup = () => service.visibleGroups(new Set()).find(g => g.type === 'genre')!;

    service.toggleCollapsed('genre');
    expect(genreGroup().collapsed).toBe(true);
    expect(genreGroup().options).toEqual([]);
    expect(JSON.parse(localStorage.getItem('filter_groups_collapsed')!)).toEqual(['genre']);

    animeService.changeFilter({ type: 'genre', value: 'Comedy' });
    expect(genreGroup().options.map(o => o.value)).toEqual(['Comedy']);

    service.toggleCollapsed('genre');
    expect(genreGroup().collapsed).toBe(false);
    expect(genreGroup().options.map(o => o.value)).toEqual(['Romance', 'Comedy']);
    expect(JSON.parse(localStorage.getItem('filter_groups_collapsed')!)).toEqual([]);
  });

  it('starts with the groups folded in a previous visit', () => {
    localStorage.setItem('filter_groups_collapsed', JSON.stringify(['theme', 'no-such-facet']));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    const fresh = TestBed.inject(FilterService);

    expect([...fresh.collapsedGroups()]).toEqual(['theme']);
  });

  it('resolves route params back to values (round-trip)', async () => {
    await flushCatalog([
      makeAnime({ slug: 'a', title: 'A', genres: ['Sci-Fi'], themes: ['Idols (Female)'] }),
    ]);

    expect(service.getRouteParamFromValue('Sci-Fi')).toBe('sci-fi');
    expect(service.getValueFromRouteParam('sci-fi')).toBe('Sci-Fi');
    expect(service.getRouteParamFromValue('Idols (Female)')).toBe('idols-female');
    expect(service.getValueFromRouteParam('idols-female')).toBe('Idols (Female)');
    expect(service.getValueFromRouteParam('no-existe')).toBeUndefined();
  });
});
