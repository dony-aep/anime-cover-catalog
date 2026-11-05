import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FilterBarComponent } from './filter-bar.component';
import { DocsNavService } from '../../services/docs-nav.service';
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

  it('shows a Year group with counts, «Show all years» and upcoming years marked', async () => {
    const next = new Date().getFullYear() + 1;
    const years = Array.from({ length: 10 }, (_, i) => next - i);
    const fixture = TestBed.createComponent(FilterBarComponent);
    await flushCatalog([
      ...years.map(y => makeAnime({ slug: `s${y}`, title: `T${y}`, releaseYear: y })),
      makeAnime({ slug: 'extra', title: 'Extra', releaseYear: next - 1 }),
      makeAnime({ slug: 'sin-anio', title: 'Sin año', releaseYear: null }),
    ]);
    await fixture.whenStable();

    expect(fixture.componentInstance.filterCounts()[String(next - 1)]).toBe(2);
    const host: HTMLElement = fixture.nativeElement;
    const group = Array.from(host.querySelectorAll('.filter-group'))
      .find(g => g.querySelector('.group-header')?.textContent?.trim() === 'Year')!;
    const rows = Array.from(group.querySelectorAll<HTMLAnchorElement>('.filter-button'));
    expect(rows).toHaveLength(8);
    expect(rows[0].getAttribute('href')).toBe(`/catalog/year/${next}`);
    expect(rows[0].querySelector('.upcoming')?.textContent?.trim()).toBe('upcoming');
    expect(rows[1].querySelector('.upcoming')).toBeNull();
    expect(group.querySelector('.group-toggle')?.textContent?.trim()).toBe('Show all years');
  });

  it('shows the API page index instead of the filters and marks the clicked section', async () => {
    const fixture = TestBed.createComponent(FilterBarComponent);
    fixture.componentRef.setInput('docsIndex', true);
    await flushCatalog([makeAnime({ slug: 'a', title: 'A', genres: ['Comedy'] })]);
    await fixture.whenStable();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('nav[aria-label="Filters"]')).toBeNull();
    const items = Array.from(host.querySelectorAll<HTMLButtonElement>('nav[aria-label="On this page"] .index-item'));
    const labels = items.map(item => {
      const method = item.querySelector('.index-method')?.textContent;
      const path = item.querySelector('.index-path')?.textContent;
      return method ? `${method} ${path}` : item.textContent?.trim();
    });
    expect(labels).toEqual([
      'GET /animes',
      'GET /animes/{slug}',
      'GET /animes/random',
      'GET /filters',
      'Limits & fair use',
      'Errors',
      'License & attribution',
    ]);

    items[5].click();
    await fixture.whenStable();

    expect(TestBed.inject(DocsNavService).activeId()).toBe('ep-errors');
    expect(items[5].getAttribute('aria-current')).toBe('location');
    expect(items.filter(item => item.hasAttribute('aria-current'))).toHaveLength(1);
  });
});
