import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AnimeGalleryComponent } from './anime-gallery.component';
import { AnimeService } from '../../services/anime.service';
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

describe('AnimeGalleryComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  async function renderWithCatalog(animes: Anime[]) {
    const fixture = TestBed.createComponent(AnimeGalleryComponent);
    const response: AnimeListResponse = {
      data: animes,
      meta: { page: 1, limit: 100, total: animes.length, totalPages: 1 },
    };
    TestBed.tick();
    httpMock.expectOne('/api/v1/animes?limit=100&page=1').flush(response);
    await new Promise(resolve => setTimeout(resolve));
    return fixture;
  }

  it('links a search with no results to a prefilled anime request', async () => {
    const fixture = await renderWithCatalog([makeAnime({ slug: 'naruto', title: 'Naruto' })]);
    const term = "Kaguya-sama: Love is War? #2 & 'Ñ'";
    TestBed.inject(AnimeService).changeSearchTerm(`  ${term} `);
    await fixture.whenStable();

    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a.request-anime-link');
    expect(link).not.toBeNull();
    expect(link!.target).toBe('_blank');
    expect(link!.rel).toBe('noopener');

    const href = link!.getAttribute('href')!;
    expect(href).toBe(
      'https://github.com/dony-aep/anime-cover-catalog/issues/new' +
        '?template=anime-request.yml' +
        '&title=Request%3A+Kaguya-sama%3A+Love+is+War%3F+%232+%26+%27%C3%91%27' +
        '&anime-title=Kaguya-sama%3A+Love+is+War%3F+%232+%26+%27%C3%91%27',
    );
    const params = new URL(href).searchParams;
    expect(params.get('anime-title')).toBe(term);
    expect(params.get('title')).toBe(`Request: ${term}`);
  });

  it('leaves the request link out when the filter itself has no covers', async () => {
    const fixture = await renderWithCatalog([makeAnime({ slug: 'naruto', title: 'Naruto', genres: ['Action'] })]);
    const animeService = TestBed.inject(AnimeService);
    animeService.changeFilter({ type: 'genre', value: 'Romance' });
    animeService.changeSearchTerm('Frieren');
    await fixture.whenStable();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('.no-results h2')?.textContent).toBe('No covers available');
    expect(host.querySelector('a.request-anime-link')).toBeNull();
  });
});
