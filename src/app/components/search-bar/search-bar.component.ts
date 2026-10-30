import { Component, ChangeDetectionStrategy, ElementRef, computed, inject, viewChild } from '@angular/core';
import { LucideSearch, LucideX } from '@lucide/angular';
import { AnimeService } from '../../services/anime.service';

@Component({
  selector: 'app-search-bar',
  imports: [LucideSearch, LucideX],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onDocumentKeydown($event)'
  }
})
export class SearchBarComponent {
  animeService = inject(AnimeService);
  private searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  placeholderText = computed(() => {
    const count = this.animeService.animesByFilter().length;
    const titleText = count === 1 ? 'title' : 'titles';

    return `Search ${count.toLocaleString('en-US')} ${titleText}`;
  });

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.animeService.changeSearchTerm(input.value);
  }

  clearSearch() {
    this.animeService.changeSearchTerm('');
    this.searchInput().nativeElement.focus();
  }

  // «/» enfoca el buscador desde cualquier parte, salvo cuando ya se está escribiendo en un campo.
  onDocumentKeydown(event: KeyboardEvent) {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;

    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

    event.preventDefault();
    this.searchInput().nativeElement.focus();
  }
}
