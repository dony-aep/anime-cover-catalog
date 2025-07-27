import { Component, computed, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { AnimeService } from '../../services/anime.service';

@Component({
  selector: 'app-top-controls',
  standalone: true,
  imports: [CommonModule, NgIf],
  templateUrl: './top-controls.component.html',
  styleUrls: ['./top-controls.component.css']
})
export class TopControlsComponent {
  animeService = inject(AnimeService);

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
} 