import { Component, HostListener, signal } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-back-to-top-button',
  standalone: true,
  imports: [NgClass],
  templateUrl: './back-to-top-button.component.html',
  styleUrls: ['./back-to-top-button.component.css']
})
export class BackToTopButtonComponent {
  showButton = signal(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.showButton.set(scrollPosition > 400);
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
} 