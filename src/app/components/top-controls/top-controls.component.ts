import { Component, ChangeDetectionStrategy, computed, inject, input } from '@angular/core';
import { AnimeService } from '../../services/anime.service';
import { FavoritesService } from '../../services/favorites.service';
import { LucideArrowDown, LucideArrowUp, LucideTrash } from '@lucide/angular';

@Component({
  selector: 'app-top-controls',
  imports: [LucideArrowDown, LucideArrowUp, LucideTrash],
  templateUrl: './top-controls.component.html',
  styleUrls: ['./top-controls.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopControlsComponent {
  animeService = inject(AnimeService);
  private favoritesService = inject(FavoritesService);

  isFavoritesPage = input(false);

  animeCount = computed(() => this.animeService.filteredAnimes().length);
  animeCountText = computed(() => this.animeCount().toLocaleString('en-US'));
  favoritesCount = this.favoritesService.favoritesCount;

  sortBy = this.animeService.sortBy;

  dateSortLabel = computed(() =>
    this.animeService.dateSort() === 'newest' ? 'Newest' : 'Oldest'
  );
  nameSortLabel = computed(() =>
    this.animeService.nameSort() === 'asc' ? 'A–Z' : 'Z–A'
  );

  // Pulsar la opción activa invierte su sentido; pulsar la otra solo cambia el criterio.
  selectDateSort() {
    if (this.sortBy() === 'date') {
      this.animeService.toggleDateSort();
    } else {
      this.animeService.setSortBy('date');
    }
  }

  selectNameSort() {
    if (this.sortBy() === 'name') {
      this.animeService.toggleNameSort();
    } else {
      this.animeService.setSortBy('name');
    }
  }

  clearAllFavorites() {
    if (confirm('Are you sure you want to clear all favorites?')) {
      this.favoritesService.clearAllFavorites();
    }
  }
}
