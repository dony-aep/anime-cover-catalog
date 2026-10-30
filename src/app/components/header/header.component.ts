import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { LucideGlobe, LucideMenu, LucideMoon, LucideSun } from '@lucide/angular';

@Component({
  selector: 'app-header',
  imports: [RouterLink, SideMenuComponent, LucideGlobe, LucideMenu, LucideMoon, LucideSun],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  themeService = inject(ThemeService);
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