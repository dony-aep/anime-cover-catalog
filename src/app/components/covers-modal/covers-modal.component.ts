import { Component, ChangeDetectionStrategy, Input, inject, signal, computed } from '@angular/core';
import { Anime } from '../../models/anime.model';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-covers-modal',
  imports: [],
  templateUrl: './covers-modal.component.html',
  styleUrls: ['./covers-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoversModalComponent {
  @Input() anime!: Anime;
  private modalService = inject(ModalService);

  selectedCoverIndex = signal(0);
  coverCopyState = signal<'idle' | 'copied'>('idle');

  allCovers = computed(() => {
    if (!this.anime) return [];
    return [this.anime.imageUrl, ...(this.anime.alternativeCovers || [])];
  });

  selectCover(index: number) {
    this.selectedCoverIndex.set(index);
  }

  openCoverFullscreen() {
    const cover = this.allCovers()[this.selectedCoverIndex()];
    if (cover) window.open('assets/' + cover, '_blank');
  }

  downloadCover() {
    const cover = this.allCovers()[this.selectedCoverIndex()];
    if (cover) window.open('assets/' + cover, '_blank');
  }

  async copyCoverUrl() {
    if (this.coverCopyState() === 'copied') return;
    const cover = this.allCovers()[this.selectedCoverIndex()];
    if (!cover) return;
    try {
      await navigator.clipboard.writeText(new URL('assets/' + cover, window.location.origin).href);
      this.coverCopyState.set('copied');
      setTimeout(() => this.coverCopyState.set('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy cover URL:', err);
    }
  }

  close() {
    this.modalService.close();
  }
}
