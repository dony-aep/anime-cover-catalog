import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AnimeService } from '../../services/anime.service';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { KiraLogoComponent } from '../kira-logo/kira-logo.component';
import { LucideGlobe, LucideMenu, LucideMoon, LucideSun } from '@lucide/angular';

@Component({
  selector: 'app-header',
  imports: [RouterLink, SideMenuComponent, KiraLogoComponent, LucideGlobe, LucideMenu, LucideMoon, LucideSun],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  themeService = inject(ThemeService);
  // El logo hace de indicador mientras llega el catálogo.
  catalogLoading = inject(AnimeService).catalogLoading;
  isSideMenuOpen = signal(false);

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  openSideMenu() {
    this.isSideMenuOpen.set(true);
  }

  closeSideMenu() {
    this.isSideMenuOpen.set(false);
  }
} 