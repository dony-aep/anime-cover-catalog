import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Anime, DateSortOrder, Filter, SortOrder } from '../models/anime.model';

type SortKey = `${SortOrder}-${DateSortOrder}`;

@Injectable({
  providedIn: 'root'
})
export class AnimeService {
  private http = inject(HttpClient);
  private readonly INITIAL_LOAD_COUNT = 24;

  private animes$ = this.http.get<Anime[]>('assets/data/animes.json');
  
  animes = toSignal(this.animes$, { initialValue: [] });
  searchTerm = signal<string>('');
  activeFilter = signal<Filter>({ type: 'all', value: '' });
  nameSort = signal<SortOrder>('asc');
  dateSort = signal<DateSortOrder>('newest');
  allAnimesLoaded = signal(false);

  animesByFilter = computed(() => {
    const animes = this.animes();
    const filter = this.activeFilter();

    if (filter.type === 'all') {
      return animes;
    }

    return animes.filter(anime => {
      switch (filter.type) {
        case 'genre':
          return anime.genres?.includes(filter.value);
        case 'theme':
          return anime.theme?.includes(filter.value);
        case 'type':
          return anime.type === filter.value;
        case 'demographic':
          return anime.demographic === filter.value;
        case 'explicitGenre':
          return anime.explicitGenres?.includes(filter.value);
        default:
          return true;
      }
    });
  });

  filteredAnimes = computed(() => {
    const animes = this.animesByFilter();
    const searchTerm = this.searchTerm().toLowerCase();

    if (!searchTerm) {
      return animes;
    }

    return animes.filter(a => {
      const term = searchTerm;
      return a.title.toLowerCase().includes(term)
        || (a.titleEnglish?.toLowerCase().includes(term) ?? false)
        || (a.titleJapanese?.toLowerCase().includes(term) ?? false);
    });
  });

  // Pre-compute all 4 sort combinations and cache them
  private sortedAnimesCache = computed(() => {
    const animes = this.filteredAnimes();
    const cache = new Map<SortKey, Anime[]>();
    
    // Helper function to sort once
    const sortAnimes = (nameOrder: SortOrder, dateOrder: DateSortOrder): Anime[] => {
      return [...animes].sort((a, b) => {
        const yearA = parseInt(a.releaseYear, 10) || 0;
        const yearB = parseInt(b.releaseYear, 10) || 0;
        if (yearA !== yearB) {
          return dateOrder === 'newest' ? yearB - yearA : yearA - yearB;
        }

        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        if (titleA < titleB) return nameOrder === 'asc' ? -1 : 1;
        if (titleA > titleB) return nameOrder === 'asc' ? 1 : -1;
        
        return 0;
      });
    };

    // Pre-compute all 4 combinations
    cache.set('asc-newest', sortAnimes('asc', 'newest'));
    cache.set('asc-oldest', sortAnimes('asc', 'oldest'));
    cache.set('desc-newest', sortAnimes('desc', 'newest'));
    cache.set('desc-oldest', sortAnimes('desc', 'oldest'));

    return cache;
  });

  // Simply retrieve from cache - O(1) lookup
  sortedAnimes = computed(() => {
    const cache = this.sortedAnimesCache();
    const key: SortKey = `${this.nameSort()}-${this.dateSort()}`;
    return cache.get(key) ?? [];
  });

  noResults = computed(() => {
    const searchActive = this.searchTerm().length > 0;
    const filterActive = this.activeFilter().type !== 'all';
    return this.filteredAnimes().length === 0 && (searchActive || filterActive);
  });

  // Detects if the current filter has no animes at all (before search)
  filterHasNoAnimes = computed(() => {
    const filter = this.activeFilter();
    if (filter.type === 'all') return false;
    return this.animesByFilter().length === 0;
  });

  visibleAnimes = computed(() => {
    const animes = this.sortedAnimes();
    if (this.allAnimesLoaded()) {
      return animes;
    }
    return animes.slice(0, this.INITIAL_LOAD_COUNT);
  });

  constructor() { }

  changeSearchTerm(term: string) {
    this.searchTerm.set(term);
    this.allAnimesLoaded.set(false);
  }

  changeFilter(filter: Filter) {
    this.activeFilter.set(filter);
    this.allAnimesLoaded.set(false);
  }

  toggleNameSort() {
    this.nameSort.update(current => (current === 'asc' ? 'desc' : 'asc'));
  }

  toggleDateSort() {
    this.dateSort.update(current => (current === 'newest' ? 'oldest' : 'newest'));
  }

  loadAllAnimes() {
    this.allAnimesLoaded.set(true);
  }

  clearSearchAndFilters() {
    this.searchTerm.set('');
    this.activeFilter.set({ type: 'all', value: '' });
    this.allAnimesLoaded.set(false);
  }
} 