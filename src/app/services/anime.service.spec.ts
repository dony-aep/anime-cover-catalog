import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
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

  // Drena las microtareas pendientes para que el loader del resource avance.
  const settle = () => new Promise(resolve => setTimeout(resolve));

  // El loader del resource arranca en un effect (TestBed.tick) y resuelve
  // promesas entre peticiones, de ahí los settle() tras cada flush.
  async function flushFirstPage(response: AnimeListResponse) {
    TestBed.tick();
    httpMock.expectOne('/api/v1/animes?limit=100&page=1').flush(response);
    await settle();
  }

  it('loads a single-page catalog with one request', async () => {
    const animes = [makeAnime({ slug: 'a', title: 'A' }), makeAnime({ slug: 'b', title: 'B' })];

    await flushFirstPage(pageResponse(animes, 1, 2));

    expect(service.animes().length).toBe(2);
  });

  it('loads all pages in parallel and concatenates them', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => makeAnime({ slug: `p1-${i}`, title: `P1 ${i}` }));
    const page2 = Array.from({ length: 100 }, (_, i) => makeAnime({ slug: `p2-${i}`, title: `P2 ${i}` }));
    const page3 = Array.from({ length: 54 }, (_, i) => makeAnime({ slug: `p3-${i}`, title: `P3 ${i}` }));

    await flushFirstPage(pageResponse(page1, 1, 254));
    httpMock.expectOne('/api/v1/animes?limit=100&page=2').flush(pageResponse(page2, 2, 254));
    httpMock.expectOne('/api/v1/animes?limit=100&page=3').flush(pageResponse(page3, 3, 254));
    await settle();

    expect(service.animes().length).toBe(254);
    expect(service.animes()[0].slug).toBe('p1-0');
    expect(service.animes()[253].slug).toBe('p3-53');
  });

  it('filters by exact array element, not by substring', async () => {
    const animes = [
      makeAnime({ slug: 'romance', title: 'Romance Anime', genres: ['Romance'] }),
      makeAnime({ slug: 'other', title: 'Other', genres: ['Romantic Subtext'] }),
    ];
    await flushFirstPage(pageResponse(animes, 1, 2));

    service.changeFilter({ type: 'genre', value: 'Romance' });

    expect(service.animesByFilter().length).toBe(1);
    expect(service.animesByFilter()[0].slug).toBe('romance');
  });

  it('searches across title, titleEnglish and titleJapanese', async () => {
    const animes = [
      makeAnime({ slug: 'a', title: 'Ao no Hako', titleEnglish: 'Blue Box' }),
      makeAnime({ slug: 'b', title: 'Unrelated' }),
    ];
    await flushFirstPage(pageResponse(animes, 1, 2));

    service.changeSearchTerm('blue');

    expect(service.filteredAnimes().length).toBe(1);
    expect(service.filteredAnimes()[0].slug).toBe('a');
  });

  it('sorts null releaseYear as oldest', async () => {
    const animes = [
      makeAnime({ slug: 'nueva', title: 'Nueva', releaseYear: 2024 }),
      makeAnime({ slug: 'sin-anio', title: 'Sin Año', releaseYear: null }),
      makeAnime({ slug: 'vieja', title: 'Vieja', releaseYear: 1999 }),
    ];
    await flushFirstPage(pageResponse(animes, 1, 3));

    // Default sort is newest first: null (treated as 0) goes last.
    expect(service.sortedAnimes().map(a => a.slug)).toEqual(['nueva', 'vieja', 'sin-anio']);
  });

  // El modo por nombre ignora el año: antes «Sort A-Z» solo desempataba dentro del mismo año.
  it('sorts by title alone when sorting by name', async () => {
    const animes = [
      makeAnime({ slug: 'b', title: 'Beta', releaseYear: 2024 }),
      makeAnime({ slug: 'c', title: 'Gamma', releaseYear: 1999 }),
      makeAnime({ slug: 'a', title: 'Alpha', releaseYear: 2010 }),
    ];
    await flushFirstPage(pageResponse(animes, 1, 3));

    service.setSortBy('name');
    expect(service.sortedAnimes().map(a => a.slug)).toEqual(['a', 'b', 'c']);

    service.toggleNameSort();
    expect(service.sortedAnimes().map(a => a.slug)).toEqual(['c', 'b', 'a']);

    service.setSortBy('date');
    expect(service.sortedAnimes().map(a => a.slug)).toEqual(['b', 'a', 'c']);

    // Volver al modo por nombre empieza otra vez en A-Z.
    service.setSortBy('name');
    expect(service.nameSort()).toBe('asc');
    expect(service.sortedAnimes().map(a => a.slug)).toEqual(['a', 'b', 'c']);
  });

  // A 1920 px la galería tiene 7 columnas: con 24 fijas la última fila quedaba con 3 portadas.
  it('rounds the first batch up to whole rows of the gallery, never below 24', async () => {
    const animes = Array.from({ length: 60 }, (_, i) => makeAnime({ slug: `a${i}`, title: `A ${i}` }));
    await flushFirstPage(pageResponse(animes, 1, 60));

    const firstBatch = (columns: number) => {
      service.setGalleryColumns(columns);
      return service.visibleAnimes().length;
    };
    expect(firstBatch(7)).toBe(28);
    expect(firstBatch(5)).toBe(25);
    expect(firstBatch(6)).toBe(24);
    expect(firstBatch(2)).toBe(24);

    service.loadAllAnimes();
    expect(service.visibleAnimes().length).toBe(60);
  });

  it('breaks ties within a year A-Z regardless of the last name order', async () => {
    const animes = [
      makeAnime({ slug: 'z', title: 'Zeta', releaseYear: 2024 }),
      makeAnime({ slug: 'a', title: 'Alpha', releaseYear: 2024 }),
    ];
    await flushFirstPage(pageResponse(animes, 1, 2));

    service.setSortBy('name');
    service.toggleNameSort();
    service.setSortBy('date');

    expect(service.sortedAnimes().map(a => a.slug)).toEqual(['a', 'z']);
  });
});
