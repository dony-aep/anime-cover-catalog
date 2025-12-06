import { Component, ChangeDetectionStrategy, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AnimeService } from '../../services/anime.service';
import { FilterService, FilterOption } from '../../services/filter.service';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive]
})
export class SideMenuComponent {
  private animeService = inject(AnimeService);
  private filterService = inject(FilterService);
  private favoritesService = inject(FavoritesService);

  isOpen = input<boolean>(false);
  menuClosed = output<void>();

  favoritesCount = this.favoritesService.favoritesCount;
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

  closeMenu(): void {
    this.menuClosed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('side-menu-overlay')) {
      this.closeMenu();
    }
  }

  onFilterClick(): void {
    this.closeMenu();
  }
}
