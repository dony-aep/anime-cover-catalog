import { Injectable, computed, inject } from '@angular/core';
import { FilterType } from '../models/anime.model';
import { AnimeService } from './anime.service';

export interface FilterOption {
  label: string;
  type: FilterType;
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private animeService = inject(AnimeService);

  /**
   * Filter list derived from the loaded catalog: one option per distinct
   * facet value actually present in the data. Adding an anime with a new
   * genre/theme makes its filter appear automatically.
   */
  filters = computed<FilterOption[]>(() => {
    const seen = new Set<string>();
    const options: FilterOption[] = [];
    const add = (type: FilterType, value: string) => {
      const key = `${type}-${value}`;
      if (!value || seen.has(key)) return;
      seen.add(key);
      options.push({ label: value, type, value });
    };

    for (const anime of this.animeService.animes()) {
      anime.genres.forEach(g => add('genre', g));
      anime.themes.forEach(t => add('theme', t));
      anime.explicitGenres.forEach(e => add('explicitGenre', e));
      add('type', anime.type);
      if (anime.demographic) add('demographic', anime.demographic);
    }

    options.sort((a, b) => a.label.localeCompare(b.label));
    return [{ label: 'All', type: 'all', value: '' }, ...options];
  });

  private routeParamToValueMap = computed(() => {
    const map = new Map<string, string>();
    for (const filter of this.filters()) {
      if (filter.value) {
        map.set(this.createRouteParam(filter.value), filter.value);
      }
    }
    return map;
  });

  private createRouteParam(value: string): string {
    return value.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
  }

  getRouteParamFromValue(value: string): string | undefined {
    return value ? this.createRouteParam(value) : undefined;
  }

  getValueFromRouteParam(routeParam: string): string | undefined {
    return this.routeParamToValueMap().get(routeParam);
  }
}
