import { Component, computed, inject, signal } from '@angular/core';
import { AnimeService } from '../../services/anime.service';
import { NgFor, NgIf } from '@angular/common';
import { Anime } from '../../models/anime.model';
import { ModalService } from '../../services/modal.service';
import { AnimeInfoModalComponent } from '../anime-info-modal/anime-info-modal.component';
import { TrailerModalComponent } from '../trailer-modal/trailer-modal.component';

@Component({
  selector: 'app-anime-gallery',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './anime-gallery.component.html',
  styleUrl: './anime-gallery.component.css'
})
export class AnimeGalleryComponent {
  animeService = inject(AnimeService);
  modalService = inject(ModalService);
  imageResolutions = signal<Map<string, string>>(new Map());
  copiedStatus = signal<Record<string, 'title' | 'url' | 'none'>>({});

  remainingCount = computed(() => {
    const filteredCount = this.animeService.filteredAnimes().length;
    const visibleCount = this.animeService.visibleAnimes().length;
    return filteredCount - visibleCount;
  });

  showLoadMoreButton = computed(() => {
    return this.remainingCount() > 0 && !this.animeService.allAnimesLoaded();
  });

  onImageLoad(event: Event, anime: Anime) {
    const img = event.target as HTMLImageElement;
    const resolution = `${img.naturalWidth}x${img.naturalHeight}`;
    
    this.imageResolutions.update(currentMap => {
      const newMap = new Map(currentMap);
      newMap.set(anime.imageUrl, resolution);
      return newMap;
    });
  }

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

  async copyImageUrl(anime: Anime, event: MouseEvent) {
    try {
      const fullImageUrl = new URL('assets/' + anime.imageUrl, window.location.origin).href;
      await navigator.clipboard.writeText(fullImageUrl);
      this.copiedStatus.update(status => ({ ...status, [anime.imageUrl]: 'url' }));
      setTimeout(() => {
        this.copiedStatus.update(status => ({ ...status, [anime.imageUrl]: 'none' }));
      }, 1500);
    } catch (err) {
      console.error('Failed to copy image URL: ', err);
    }
  }

  downloadImage(anime: Anime) {
    window.open('assets/' + anime.imageUrl, '_blank');
  }

  async copyTitle(anime: Anime, event: MouseEvent) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(anime.title);
      this.copiedStatus.update(status => ({ ...status, [anime.imageUrl]: 'title' }));
      setTimeout(() => {
        this.copiedStatus.update(status => ({ ...status, [anime.imageUrl]: 'none' }));
      }, 1500);
    } catch (err) {
      console.error('Failed to copy title: ', err);
    }
  }

  loadAll() {
    this.animeService.loadAllAnimes();
  }
} 