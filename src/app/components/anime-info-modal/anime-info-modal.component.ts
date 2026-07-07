import { Component, ChangeDetectionStrategy, Input, inject, signal } from '@angular/core';
import { Anime } from '../../models/anime.model';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-anime-info-modal',
  imports: [],
  templateUrl: './anime-info-modal.component.html',
  styleUrls: ['./anime-info-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimeInfoModalComponent {
  @Input() anime!: Anime;
  private modalService = inject(ModalService);
  copyState = signal<'idle' | 'copied'>('idle');

  close() {
    this.modalService.close();
  }

  studiosText(): string {
    return this.anime.studios.join(', ') || 'Unknown';
  }

  themesText(): string {
    return this.anime.themes.join(', ') || 'Unknown';
  }

  async copyInfo() {
    if (this.copyState() === 'copied') return;

    const lines = [
        `Title: ${this.anime.title}`,
    ];
    if (this.anime.titleEnglish) lines.push(`English: ${this.anime.titleEnglish}`);
    if (this.anime.titleJapanese) lines.push(`Japanese: ${this.anime.titleJapanese}`);
    lines.push(
        `Release Year: ${this.anime.releaseYear ?? 'Unknown'}`,
        `Studio: ${this.studiosText()}`,
        `Type: ${this.anime.type}`,
        `Episodes: ${this.anime.episodes ?? 'Unknown'}`,
        `Demographic: ${this.anime.demographic || 'Unknown'}`,
        `Theme: ${this.themesText()}`,
        `Genres: ${this.anime.genres.join(', ') || 'Unknown'}`,
        `Synopsis: ${this.anime.synopsis}`
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
} 