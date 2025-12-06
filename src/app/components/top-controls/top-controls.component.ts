import { Component, ChangeDetectionStrategy, computed, inject, input } from '@angular/core';
import { AnimeService } from '../../services/anime.service';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-top-controls',
  imports: [],
  templateUrl: './top-controls.component.html',
  styleUrls: ['./top-controls.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopControlsComponent {
  animeService = inject(AnimeService);
  private favoritesService = inject(FavoritesService);

  isFavoritesPage = input(false);

  animeCount = computed(() => this.animeService.filteredAnimes().length);
  favoritesCount = this.favoritesService.favoritesCount;

  nameSortButtonText = computed(() => 
    this.animeService.nameSort() === 'asc' ? 'Sort A-Z' : 'Sort Z-A'
  );
  nameSortButtonIcon = computed(() => 
    this.animeService.nameSort() === 'asc' ? 'arrow_upward' : 'arrow_downward'
  );

  dateSortButtonText = computed(() => 
    this.animeService.dateSort() === 'newest' ? 'Sort Newest' : 'Sort Oldest'
  );
  dateSortButtonIcon = computed(() => 
    this.animeService.dateSort() === 'newest' ? 'arrow_downward' : 'arrow_upward'
  );

  toggleNameSort() {
    this.animeService.toggleNameSort();
  }

  toggleDateSort() {
    this.animeService.toggleDateSort();
  }

  clearAllFavorites() {
    if (confirm('Are you sure you want to clear all favorites?')) {
      this.favoritesService.clearAllFavorites();
    }
  }
} 