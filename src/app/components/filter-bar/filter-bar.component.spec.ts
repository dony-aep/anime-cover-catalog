import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FilterBarComponent } from './filter-bar.component';
import { Anime, AnimeListResponse } from '../../models/anime.model';

function makeAnime(overrides: Partial<Anime> & { slug: string; title: string }): Anime {
  return {
    titleEnglish: null,
    titleJapanese: null,
    images: { cover: '', thumb: '', alternatives: [], alternativesThumbs: [] },
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

describe('FilterBarComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function flushCatalog(animes: Anime[]) {
    const response: AnimeListResponse = {
      data: animes,
      meta: { page: 1, limit: 100, total: animes.length, totalPages: 1 },
    };
    TestBed.tick();
    httpMock.expectOne('/api/v1/animes?limit=100&page=1').flush(response);
    await new Promise(resolve => setTimeout(resolve));
  }

  it('counts explicit genres like any other facet', async () => {
    const component = TestBed.createComponent(FilterBarComponent).componentInstance;
    await flushCatalog([
      makeAnime({ slug: 'a', title: 'A', genres: ['Comedy'], explicitGenres: ['Ecchi'] }),
      makeAnime({ slug: 'b', title: 'B', explicitGenres: ['Ecchi', 'Erotica'] }),
    ]);

    expect(component.filterCounts()['Ecchi']).toBe(2);
    expect(component.filterCounts()['Erotica']).toBe(1);
    expect(component.filterCounts()['Comedy']).toBe(1);
  });
});
