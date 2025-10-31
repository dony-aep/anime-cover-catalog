import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Anime, DateSortOrder, Filter, SortOrder } from '../models/anime.model';

@Injectable({
  providedIn: 'root'
})
export class AnimeService {
  private http = inject(HttpClient);
  private readonly INITIAL_LOAD_COUNT = 20;

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

    return animes.filter(a => a.title.toLowerCase().includes(searchTerm));
  });

  sortedAnimes = computed(() => {
    const animes = this.filteredAnimes();
    const nameSortOrder = this.nameSort();
    const dateSortOrder = this.dateSort();

    return [...animes].sort((a, b) => {
      const yearA = parseInt(a.releaseYear, 10) || 0;
      const yearB = parseInt(b.releaseYear, 10) || 0;
      if (yearA !== yearB) {
        return dateSortOrder === 'newest' ? yearB - yearA : yearA - yearB;
      }

      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      if (titleA < titleB) return nameSortOrder === 'asc' ? -1 : 1;
      if (titleA > titleB) return nameSortOrder === 'asc' ? 1 : -1;
      
      return 0;
    });
  });

  noResults = computed(() => {
    const searchActive = this.searchTerm().length > 0;
    const filterActive = this.activeFilter().type !== 'all';
    return this.filteredAnimes().length === 0 && (searchActive || filterActive);
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
} 