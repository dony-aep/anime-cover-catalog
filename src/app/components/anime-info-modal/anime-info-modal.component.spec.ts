import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AnimeInfoModalComponent } from './anime-info-modal.component';
import { Anime } from '../../models/anime.model';

function makeAnime(overrides: Partial<Anime> = {}): Anime {
  return {
    slug: 'a',
    title: 'A',
    titleEnglish: null,
    titleJapanese: null,
    images: {
      cover: 'https://example.com/assets/AnimeImages/a.jpeg',
      thumb: 'https://example.com/assets/AnimeImages_thumbs/a.webp',
      alternatives: [],
      alternativesThumbs: [],
    },
    releaseYear: 2026,
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

describe('AnimeInfoModalComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
  });

  function create(anime: Anime) {
    const fixture = TestBed.createComponent(AnimeInfoModalComponent);
    fixture.componentRef.setInput('anime', anime);
    return fixture.componentInstance;
  }

  // La descarga y el enlace copiado siguen a la portada elegida en la tira, no siempre a la principal.
  it('acts on the cover picked in the strip', () => {
    const component = create(makeAnime({
      images: {
        cover: 'https://example.com/a.jpeg',
        thumb: 'https://example.com/a.webp',
        alternatives: ['https://example.com/a_alt1.png'],
        alternativesThumbs: ['https://example.com/a_alt1.webp'],
      },
    }));

    expect(component.covers().length).toBe(2);
    expect(component.coverFormat()).toBe('JPEG');
    expect(component.positionText()).toBe('Cover 1 of 2');

    component.selectCover(1);

    expect(component.selectedCover()).toEqual({ full: 'https://example.com/a_alt1.png', thumb: 'https://example.com/a_alt1.webp' });
    expect(component.coverFormat()).toBe('PNG');
    expect(component.positionText()).toBe('Cover 2 of 2');
  });

  it('links each facet to its filter route', () => {
    const component = create(makeAnime({ genres: ['Sci-Fi'], themes: ['Idols (Female)'], demographic: 'Seinen', episodes: 1 }));

    expect(component.metaText()).toBe('TV · 2026 · 1 episode');
    expect(component.demographicLink()).toEqual({ label: 'Seinen', link: ['/catalog', 'demographic', 'seinen'] });
    expect(component.genreLinks()).toEqual([{ label: 'Sci-Fi', link: ['/catalog', 'genre', 'sci-fi'] }]);
    expect(component.themeLinks()).toEqual([{ label: 'Idols (Female)', link: ['/catalog', 'theme', 'idols-female'] }]);
  });
});
