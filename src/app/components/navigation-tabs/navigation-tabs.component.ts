import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-navigation-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navigation-tabs.component.html',
  styleUrl: './navigation-tabs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigationTabsComponent {
  private favoritesService = inject(FavoritesService);
  
  favoritesCount = this.favoritesService.favoritesCount;
}
