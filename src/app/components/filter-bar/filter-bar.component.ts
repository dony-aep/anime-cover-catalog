import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { AnimeService } from '../../services/anime.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FilterService, FilterOption } from '../../services/filter.service';
import { NavigationTabsComponent } from '../navigation-tabs/navigation-tabs.component';

@Component({
  selector: 'app-filter-bar',
  imports: [RouterLink, RouterLinkActive, NavigationTabsComponent],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterBarComponent {
  private animeService = inject(AnimeService);
  private filterService = inject(FilterService);

  filters: FilterOption[] = this.filterService.getFilters();

  filterCounts = computed(() => {
    const counts: { [key: string]: number } = {};
    const animes = this.animeService.animes();
    const searchTerm = this.animeService.searchTerm().toLowerCase();

    for (const anime of animes) {
        if (searchTerm && !anime.title.toLowerCase().includes(searchTerm)) {
            continue;
        }

        (anime.genres?.split(', ') ?? []).forEach(g => counts[g] = (counts[g] || 0) + 1);
        (anime.theme?.split(', ') ?? []).forEach(t => counts[t] = (counts[t] || 0) + 1);
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