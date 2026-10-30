import { Component, ChangeDetectionStrategy, ElementRef, computed, effect, inject, signal, input, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AnimeService } from '../../services/anime.service';
import { FavoritesService } from '../../services/favorites.service';
import { Anime } from '../../models/anime.model';
import { ModalService } from '../../services/modal.service';
import { AnimeInfoModalComponent } from '../anime-info-modal/anime-info-modal.component';
import { TrailerModalComponent } from '../trailer-modal/trailer-modal.component';
import {
  LucideArrowDown,
  LucideCheck,
  LucideCirclePlay,
  LucideCopy,
  LucideDownload,
  LucideFolderX,
  LucideFunnelX,
  LucideHeart,
  LucideInfo,
  LucideLink,
  LucideRotateCcw,
  LucideSearchX,
} from '@lucide/angular';

@Component({
  selector: 'app-anime-gallery',
  imports: [
    LucideArrowDown,
    LucideCheck,
    LucideCirclePlay,
    LucideCopy,
    LucideDownload,
    LucideFolderX,
    LucideFunnelX,
    LucideHeart,
    LucideInfo,
    LucideLink,
    LucideRotateCcw,
    LucideSearchX,
  ],
  templateUrl: './anime-gallery.component.html',
  styleUrl: './anime-gallery.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimeGalleryComponent {
  animeService = inject(AnimeService);
  private router = inject(Router);
  private modalService = inject(ModalService);
  private favoritesService = inject(FavoritesService);
  
  showOnlyFavorites = input(false);
  
  copiedStatus = signal<Record<string, 'title' | 'url' | 'none'>>({});

  private gallery = viewChild<ElementRef<HTMLElement>>('gallery');

  constructor() {
    // Las columnas las decide el CSS (auto-fill); se leen del grid ya pintado para que el
    // servicio complete la última fila de la primera tanda.
    effect(onCleanup => {
      const grid = this.gallery()?.nativeElement;
      if (!grid || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(() => {
        const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
        this.animeService.setGalleryColumns(columns);
      });
      observer.observe(grid);
      onCleanup(() => observer.disconnect());
    });
  }

  // Cache the favorites set for efficient lookups
  private favoriteTitlesSet = computed(() => this.favoritesService.favorites());

  displayedAnimes = computed(() => {
    if (this.showOnlyFavorites()) {
      const favoriteTitles = this.favoritesService.getFavoriteTitles();
      return this.animeService.animes().filter(anime => favoriteTitles.includes(anime.title));
    }
    return this.animeService.visibleAnimes();
  });

  noResults = computed(() => {
    if (this.showOnlyFavorites()) {
      return this.displayedAnimes().length === 0;
    }
    return this.animeService.noResults();
  });

  // Check if the filter itself has no animes (vs search not finding anything)
  isFilterEmpty = computed(() => this.animeService.filterHasNoAnimes());

  remainingCount = computed(() => {
    const filteredCount = this.animeService.filteredAnimes().length;
    const visibleCount = this.animeService.visibleAnimes().length;
    return filteredCount - visibleCount;
  });

  remainingCountText = computed(() => this.remainingCount().toLocaleString('en-US'));

  showLoadMoreButton = computed(() => {
    if (this.showOnlyFavorites()) {
      return false;
    }
    return this.remainingCount() > 0 && !this.animeService.allAnimesLoaded();
  });

  onCardClick(anime: Anime) {
    if (window.innerWidth > 768) {
      this.showInfo(anime);
    }
  }

  showInfo(anime: Anime) {
    this.modalService.open(AnimeInfoModalComponent, { anime: anime });
  }

  showTrailer(anime: Anime) {
    this.modalService.open(TrailerModalComponent, { anime: anime });
  }

  toggleFavorite(anime: Anime, event: MouseEvent) {
    event.stopPropagation();
    this.favoritesService.toggleFavorite(anime);
  }

  isFavorite(anime: Anime): boolean {
    return this.favoriteTitlesSet().has(anime.title);
  }

  async copyImageUrl(anime: Anime, event: MouseEvent) {
    try {
      await navigator.clipboard.writeText(anime.images.cover);
      this.copiedStatus.update(status => ({ ...status, [anime.slug]: 'url' }));
      setTimeout(() => {
        this.copiedStatus.update(status => ({ ...status, [anime.slug]: 'none' }));
      }, 1500);
    } catch (err) {
      console.error('Failed to copy image URL: ', err);
    }
  }

  downloadImage(anime: Anime) {
    window.open(anime.images.cover, '_blank');
  }

  async copyTitle(anime: Anime, event: MouseEvent) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(anime.title);
      this.copiedStatus.update(status => ({ ...status, [anime.slug]: 'title' }));
      setTimeout(() => {
        this.copiedStatus.update(status => ({ ...status, [anime.slug]: 'none' }));
      }, 1500);
    } catch (err) {
      console.error('Failed to copy title: ', err);
    }
  }

  loadAll() {
    this.animeService.loadAllAnimes();
  }

  clearFilters() {
    this.animeService.clearSearchAndFilters();
    this.router.navigate(['/']);
  }
} 