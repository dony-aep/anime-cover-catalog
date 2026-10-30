import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';
import { ModalComponent } from './components/modal/modal.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { FilterBarComponent } from './components/filter-bar/filter-bar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    HeaderComponent,
    ModalComponent,
    SearchBarComponent,
    FilterBarComponent
  ],
})
export class AppComponent {
  title = 'anime-cover-catalog-angular';

  private router = inject(Router);

  // El buscador y la columna de filtros viven aquí y no en cada página: así no se destruyen
  // y se vuelven a crear al navegar, que era lo que hacía parpadear la interfaz.
  private url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  // En /docs no hay buscador y la columna lateral muestra el índice de la página.
  isDocs = computed(() => this.url().startsWith('/docs'));
}
