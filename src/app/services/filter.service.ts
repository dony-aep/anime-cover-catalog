import { Injectable, computed, inject, signal } from '@angular/core';
import { FilterType } from '../models/anime.model';
import { AnimeService } from './anime.service';

export interface FilterOption {
  label: string;
  type: FilterType;
  value: string;
}

export type FacetType = Exclude<FilterType, 'all'>;

export interface FilterGroup {
  type: FacetType;
  label: string;
  options: FilterOption[];
}

export interface VisibleFilterGroup extends FilterGroup {
  /** Folded from its header: only the active filter, if it belongs here, stays visible. */
  collapsed: boolean;
  /** Long enough to be trimmed to its most used values behind «Show all». */
  truncatable: boolean;
  showingAll: boolean;
  hiddenCount: number;
}

const FACETS: { type: FacetType; label: string }[] = [
  { type: 'type', label: 'Type' },
  { type: 'demographic', label: 'Demographic' },
  { type: 'genre', label: 'Genres' },
  { type: 'theme', label: 'Themes' },
  { type: 'explicitGenre', label: 'Explicit' },
];

// Géneros y temas superan los 15 valores; se muestran solo los más usados hasta que se pide «Show all».
const TRUNCATABLE: ReadonlySet<FacetType> = new Set(['genre', 'theme']);
const TRUNCATED_LIMIT = 8;

const COLLAPSED_STORAGE_KEY = 'filter_groups_collapsed';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private animeService = inject(AnimeService);

  /** Groups folded from their header; shared by the sidebar and the mobile menu and kept between visits. */
  collapsedGroups = signal<ReadonlySet<FacetType>>(this.loadCollapsedGroups());

  toggleCollapsed(type: FacetType) {
    this.collapsedGroups.update(current => {
      const next = new Set(current);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
    this.saveCollapsedGroups();
  }

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

  /**
   * Filters grouped by facet, each group sorted by how many animes use the
   * value (catalog-wide, so the order doesn't jump while searching).
   */
  filterGroups = computed<FilterGroup[]>(() => {
    const usage = new Map<string, number>();
    const bump = (type: FacetType, value: string | null) => {
      if (!value) return;
      const key = `${type}-${value}`;
      usage.set(key, (usage.get(key) ?? 0) + 1);
    };

    for (const anime of this.animeService.animes()) {
      bump('type', anime.type);
      bump('demographic', anime.demographic);
      anime.genres.forEach(g => bump('genre', g));
      anime.themes.forEach(t => bump('theme', t));
      anime.explicitGenres.forEach(e => bump('explicitGenre', e));
    }

    const uses = (option: FilterOption) => usage.get(`${option.type}-${option.value}`) ?? 0;

    return FACETS
      .map(facet => ({
        ...facet,
        options: this.filters()
          .filter(f => f.type === facet.type)
          .sort((a, b) => uses(b) - uses(a) || a.label.localeCompare(b.label)),
      }))
      .filter(group => group.options.length > 0);
  });

  /**
   * Hides the folded groups and trims the long ones to their most used values
   * unless the group is in `showAll`. The active filter always stays visible
   * so the user can see what is applied.
   */
  visibleGroups(showAll: ReadonlySet<FacetType>): VisibleFilterGroup[] {
    const active = this.animeService.activeFilter();
    const collapsed = this.collapsedGroups();
    const isActive = (option: FilterOption) => option.type === active.type && option.value === active.value;

    return this.filterGroups().map(group => {
      if (collapsed.has(group.type)) {
        const options = group.options.filter(isActive);
        return { ...group, options, collapsed: true, truncatable: false, showingAll: false, hiddenCount: group.options.length - options.length };
      }

      const truncatable = TRUNCATABLE.has(group.type) && group.options.length > TRUNCATED_LIMIT;
      if (!truncatable || showAll.has(group.type)) {
        return { ...group, collapsed: false, truncatable, showingAll: truncatable, hiddenCount: 0 };
      }

      const options = group.options.filter((option, index) => index < TRUNCATED_LIMIT || isActive(option));
      return { ...group, options, collapsed: false, truncatable, showingAll: false, hiddenCount: group.options.length - options.length };
    });
  }

  private loadCollapsedGroups(): Set<FacetType> {
    try {
      const stored = JSON.parse(localStorage.getItem(COLLAPSED_STORAGE_KEY) ?? '[]');
      if (Array.isArray(stored)) {
        return new Set(FACETS.map(f => f.type).filter(type => stored.includes(type)));
      }
    } catch (error) {
      console.error('Error loading collapsed filter groups from localStorage:', error);
    }
    return new Set();
  }

  private saveCollapsedGroups(): void {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify([...this.collapsedGroups()]));
    } catch (error) {
      console.error('Error saving collapsed filter groups to localStorage:', error);
    }
  }

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
