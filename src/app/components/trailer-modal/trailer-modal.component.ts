import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ModalService } from '../../services/modal.service';
import { Anime } from '../../models/anime.model';

@Component({
  selector: 'app-trailer-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trailer-modal.component.html',
  styleUrls: ['./trailer-modal.component.css']
})
export class TrailerModalComponent implements OnInit {
  @Input() anime!: Anime;
  
  sanitizedTrailerUrl: SafeResourceUrl | null = null;
  videoId: string | null = null;
  copyState = signal<'idle' | 'copied'>('idle');

  private sanitizer = inject(DomSanitizer);
  private modalService = inject(ModalService);

  ngOnInit() {
    this.videoId = this.extractYouTubeId(this.anime.trailerUrl);
    if (this.videoId) {
      const embedUrl = `https://www.youtube.com/embed/${this.videoId}?autoplay=0&rel=0&modestbranding=1&color=white`;
      this.sanitizedTrailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
  }
  
  extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  close() {
    this.modalService.close();
  }

  async copyTrailerUrl() {
    if (this.copyState() === 'copied' || !this.anime.trailerUrl) return;

    try {
        await navigator.clipboard.writeText(this.anime.trailerUrl);
        this.copyState.set('copied');
        setTimeout(() => {
          this.copyState.set('idle');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy trailer URL: ', err);
    }
  }
} 