import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Anime } from '../../models/anime.model';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-anime-info-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './anime-info-modal.component.html',
  styleUrls: ['./anime-info-modal.component.css']
})
export class AnimeInfoModalComponent {
  @Input() anime!: Anime;
  modalService = inject(ModalService);
  copyState = signal<'idle' | 'copied'>('idle');

  close() {
    this.modalService.close();
  }

  async copyInfo() {
    if (this.copyState() === 'copied') return;

    const textToCopy = [
        `Title: ${this.anime.title}`,
        `Release Year: ${this.anime.releaseYear}`,
        `Studio: ${this.anime.studio}`,
        `Type: ${this.anime.type}`,
        `Episodes: ${this.anime.episodes || 'Unknown'}`,
        `Demographic: ${this.anime.demographic || 'Unknown'}`,
        `Theme: ${this.anime.theme || 'Unknown'}`,
        `Genres: ${this.anime.genres || 'Unknown'}`,
        `Synopsis: ${this.anime.synopsis}`
    ].join('\n');
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