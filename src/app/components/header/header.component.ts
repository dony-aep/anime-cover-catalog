import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { SideMenuComponent } from '../side-menu/side-menu.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, SideMenuComponent],
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