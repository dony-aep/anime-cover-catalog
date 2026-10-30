import { Component, ChangeDetectionStrategy, computed, inject, input, signal } from '@angular/core';
import { AnimeService } from '../../services/anime.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FilterService, FilterOption, FacetType } from '../../services/filter.service';
import { DocsNavService } from '../../services/docs-nav.service';
import { NavigationTabsComponent } from '../navigation-tabs/navigation-tabs.component';
import { LucideChevronDown, LucideChevronUp } from '@lucide/angular';

@Component({
  selector: 'app-filter-bar',
  imports: [RouterLink, RouterLinkActive, NavigationTabsComponent, LucideChevronDown, LucideChevronUp],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterBarComponent {
  private animeService = inject(AnimeService);
  private filterService = inject(FilterService);
  docsNav = inject(DocsNavService);

  /** En la página de API la columna muestra el índice de la página en lugar de los filtros. */
  docsIndex = input(false);

  private showAllGroups = signal<ReadonlySet<FacetType>>(new Set());
  groups = computed(() => this.filterService.visibleGroups(this.showAllGroups()));

  toggleCollapsed(type: FacetType) {
    this.filterService.toggleCollapsed(type);
  }

  toggleShowAll(type: FacetType) {
    this.showAllGroups.update(current => {
      const next = new Set(current);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  filterCounts = computed(() => {
    const counts: { [key: string]: number } = {};
    const animes = this.animeService.animes();
    const searchTerm = this.animeService.searchTerm().toLowerCase();

    for (const anime of animes) {
        if (searchTerm && !anime.title.toLowerCase().includes(searchTerm)) {
            continue;
        }

        anime.genres.forEach(g => counts[g] = (counts[g] || 0) + 1);
        anime.themes.forEach(t => counts[t] = (counts[t] || 0) + 1);
        anime.explicitGenres.forEach(e => counts[e] = (counts[e] || 0) + 1);
        if (anime.type) counts[anime.type] = (counts[anime.type] || 0) + 1;
        if (anime.demographic) counts[anime.demographic] = (counts[anime.demographic] || 0) + 1;
    }
    return counts;
  });

  totalCount = computed(() => {
    const searchTerm = this.animeService.searchTerm().toLowerCase();
    if (!searchTerm) {
      return this.animeService.animes().length;
    }
    return this.animeService.animes().filter(a => a.title.toLowerCase().includes(searchTerm)).length;
  });

  getRouterLinkForFilter(filter: FilterOption): any[] {
    if (filter.type === 'all') {
      return ['/'];
    }
    const routeParam = this.filterService.getRouteParamFromValue(filter.value);
    return routeParam ? ['/catalog', filter.type, routeParam] : ['/'];
  }
} 