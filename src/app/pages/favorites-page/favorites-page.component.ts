import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { AnimeService } from '../../services/anime.service';
import { FavoritesService } from '../../services/favorites.service';
import { FilterBarComponent } from '../../components/filter-bar/filter-bar.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { TopControlsComponent } from '../../components/top-controls/top-controls.component';
import { AnimeGalleryComponent } from '../../components/anime-gallery/anime-gallery.component';

@Component({
  selector: 'app-favorites-page',
  imports: [
    FilterBarComponent,
    SearchBarComponent,
    TopControlsComponent,
    AnimeGalleryComponent,
  ],
  templateUrl: './favorites-page.component.html',
  styleUrls: ['./favorites-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesPageComponent {
  private animeService = inject(AnimeService);
  private favoritesService = inject(FavoritesService);

  favoritesCount = this.favoritesService.favoritesCount;

  hasFavorites = computed(() => this.favoritesCount() > 0);
}
