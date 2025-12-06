import { Injectable, signal, computed } from '@angular/core';
import { Anime } from '../models/anime.model';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'anime_favorites';
  
  private favoriteTitles = signal<Set<string>>(this.loadFavorites());

  favorites = computed(() => this.favoriteTitles());
  
  favoritesCount = computed(() => this.favoriteTitles().size);

  private loadFavorites(): Set<string> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
    }
    return new Set();
  }

  private saveFavorites(): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEY, 
        JSON.stringify([...this.favoriteTitles()])
      );
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  }

  isFavorite(anime: Anime): boolean {
    return this.favoriteTitles().has(anime.title);
  }

  toggleFavorite(anime: Anime): void {
    const currentFavorites = new Set(this.favoriteTitles());
    
    if (currentFavorites.has(anime.title)) {
      currentFavorites.delete(anime.title);
    } else {
      currentFavorites.add(anime.title);
    }
    
    this.favoriteTitles.set(currentFavorites);
    this.saveFavorites();
  }

  addFavorite(anime: Anime): void {
    if (!this.isFavorite(anime)) {
      const currentFavorites = new Set(this.favoriteTitles());
      currentFavorites.add(anime.title);
      this.favoriteTitles.set(currentFavorites);
      this.saveFavorites();
    }
  }

  removeFavorite(anime: Anime): void {
    if (this.isFavorite(anime)) {
      const currentFavorites = new Set(this.favoriteTitles());
      currentFavorites.delete(anime.title);
      this.favoriteTitles.set(currentFavorites);
      this.saveFavorites();
    }
  }

  clearAllFavorites(): void {
    this.favoriteTitles.set(new Set());
    this.saveFavorites();
  }

  getFavoriteTitles(): string[] {
    return [...this.favoriteTitles()];
  }
}
