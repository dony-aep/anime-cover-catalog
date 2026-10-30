import { Component, ChangeDetectionStrategy, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideCheck,
  LucideCirclePlay,
  LucideCopy,
  LucideDownload,
  LucideHeart,
  LucideLink,
  LucideX,
} from '@lucide/angular';
import { Anime, FilterType } from '../../models/anime.model';
import { ModalService } from '../../services/modal.service';
import { FavoritesService } from '../../services/favorites.service';
import { FilterService } from '../../services/filter.service';
import { TrailerModalComponent } from '../trailer-modal/trailer-modal.component';

interface CoverOption {
  full: string;
  thumb: string;
}

interface FacetLink {
  label: string;
  link: string[];
}

// Por encima de este largo la sinopsis no cabe en las 4 líneas visibles y se ofrece «Read more».
const SYNOPSIS_CLAMP_CHARS = 320;

@Component({
  selector: 'app-anime-info-modal',
  imports: [
    RouterLink,
    LucideCheck,
    LucideCirclePlay,
    LucideCopy,
    LucideDownload,
    LucideHeart,
    LucideLink,
    LucideX,
  ],
  templateUrl: './anime-info-modal.component.html',
  styleUrls: ['./anime-info-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimeInfoModalComponent {
  anime = input.required<Anime>();

  private modalService = inject(ModalService);
  private favoritesService = inject(FavoritesService);
  private filterService = inject(FilterService);

  copyState = signal<'idle' | 'copied'>('idle');
  linkState = signal<'idle' | 'copied'>('idle');
  selectedIndex = signal(0);
  synopsisExpanded = signal(false);

  // La portada principal y sus alternativas comparten la misma tira; la elegida es la que se descarga y se copia.
  covers = computed<CoverOption[]>(() => {
    const { images } = this.anime();
    return [
      { full: images.cover, thumb: images.thumb },
      ...images.alternatives.map((full, i) => ({ full, thumb: images.alternativesThumbs[i] ?? full })),
    ];
  });

  selectedCover = computed(() => this.covers()[this.selectedIndex()] ?? this.covers()[0]);

  coverFormat = computed(() => {
    const extension = this.selectedCover().full.split('?')[0].split('.').pop() ?? '';
    return extension.toUpperCase();
  });

  positionText = computed(() => `Cover ${this.selectedIndex() + 1} of ${this.covers().length}`);

  metaText = computed(() => {
    const anime = this.anime();
    const parts = [anime.type, anime.releaseYear?.toString()];
    if (anime.episodes) {
      parts.push(`${anime.episodes} ${anime.episodes === 1 ? 'episode' : 'episodes'}`);
    }
    return parts.filter(Boolean).join(' · ');
  });

  studiosText = computed(() => this.anime().studios.join(', '));

  demographicLink = computed(() => {
    const demographic = this.anime().demographic;
    return demographic ? this.facetLink('demographic', demographic) : null;
  });
  genreLinks = computed(() => this.anime().genres.map(g => this.facetLink('genre', g)));
  themeLinks = computed(() => this.anime().themes.map(t => this.facetLink('theme', t)));

  isFavorite = computed(() => this.favoritesService.favorites().has(this.anime().title));

  synopsisIsLong = computed(() => this.anime().synopsis.length > SYNOPSIS_CLAMP_CHARS);

  selectCover(index: number) {
    this.selectedIndex.set(index);
  }

  downloadCover() {
    window.open(this.selectedCover().full, '_blank');
  }

  async copyCoverUrl() {
    if (this.linkState() === 'copied') return;
    try {
      await navigator.clipboard.writeText(this.selectedCover().full);
      this.linkState.set('copied');
      setTimeout(() => this.linkState.set('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy cover URL:', err);
    }
  }

  showTrailer() {
    this.modalService.open(TrailerModalComponent, { anime: this.anime() });
  }

  toggleFavorite() {
    this.favoritesService.toggleFavorite(this.anime());
  }

  toggleSynopsis() {
    this.synopsisExpanded.update(expanded => !expanded);
  }

  close() {
    this.modalService.close();
  }

  async copyInfo() {
    if (this.copyState() === 'copied') return;

    const anime = this.anime();
    const lines = [
        `Title: ${anime.title}`,
    ];
    if (anime.titleEnglish) lines.push(`English: ${anime.titleEnglish}`);
    if (anime.titleJapanese) lines.push(`Japanese: ${anime.titleJapanese}`);
    lines.push(
        `Release Year: ${anime.releaseYear ?? 'Unknown'}`,
        `Studio: ${this.studiosText() || 'Unknown'}`,
        `Type: ${anime.type}`,
        `Episodes: ${anime.episodes ?? 'Unknown'}`,
        `Demographic: ${anime.demographic || 'Unknown'}`,
        `Theme: ${anime.themes.join(', ') || 'Unknown'}`,
        `Genres: ${anime.genres.join(', ') || 'Unknown'}`,
        `Synopsis: ${anime.synopsis}`
    );
    const textToCopy = lines.join('\n');
    try {
        await navigator.clipboard.writeText(textToCopy);
        this.copyState.set('copied');
        setTimeout(() => {
          this.copyState.set('idle');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
  }

  private facetLink(type: Exclude<FilterType, 'all'>, value: string): FacetLink {
    const param = this.filterService.getRouteParamFromValue(value);
    return { label: value, link: param ? ['/catalog', type, param] : ['/'] };
  }
}
