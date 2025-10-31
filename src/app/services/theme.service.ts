import { Injectable, signal, effect, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isBrowser = false;
  currentTheme = signal<'light' | 'dark'>('light');

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (storedTheme) {
        this.currentTheme.set(storedTheme);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.currentTheme.set(prefersDark ? 'dark' : 'light');
      }
    }

    effect(() => {
        if (this.isBrowser) {
            if (this.currentTheme() === 'dark') {
                document.documentElement.classList.add('dark-mode');
            } else {
                document.documentElement.classList.remove('dark-mode');
            }
            localStorage.setItem('theme', this.currentTheme());
        }
    });
  }

  toggleTheme() {
    this.currentTheme.update(theme => (theme === 'light' ? 'dark' : 'light'));
  }
} 