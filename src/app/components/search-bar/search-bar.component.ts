import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { AnimeService } from '../../services/anime.service';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent {
  animeService = inject(AnimeService);

  placeholderText = computed(() => {
    const count = this.animeService.animesByFilter().length;
    const animeText = count === 1 ? 'anime' : 'animes';

    return `Search among ${count} ${animeText}...`;
  });

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.animeService.changeSearchTerm(input.value);
  }

  clearSearch() {
    this.animeService.changeSearchTerm('');
  }
} 