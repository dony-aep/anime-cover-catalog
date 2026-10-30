import { Injectable, signal } from '@angular/core';

export interface DocsSection {
  id: string;
  label: string;
  method?: 'GET';
}

export interface DocsSectionGroup {
  name: string;
  items: DocsSection[];
}

export const DOCS_SECTION_GROUPS: DocsSectionGroup[] = [
  {
    name: 'Endpoints',
    items: [
      { id: 'ep-list', label: '/animes', method: 'GET' },
      { id: 'ep-detail', label: '/animes/{slug}', method: 'GET' },
      { id: 'ep-random', label: '/animes/random', method: 'GET' },
      { id: 'ep-filters', label: '/filters', method: 'GET' },
    ],
  },
  {
    name: 'Guides',
    items: [
      { id: 'ep-limits', label: 'Limits & fair use' },
      { id: 'ep-errors', label: 'Errors' },
      { id: 'ep-license', label: 'License & attribution' },
    ],
  },
];

export const DOCS_SECTION_IDS = DOCS_SECTION_GROUPS.flatMap(group => group.items.map(item => item.id));

/** Índice de la página de API: la página marca la sección visible y la columna lateral lo muestra. */
@Injectable({ providedIn: 'root' })
export class DocsNavService {
  readonly groups = DOCS_SECTION_GROUPS;
  readonly activeId = signal<string | null>(null);

  /**
   * Mientras dura el scroll que provoca un clic en el índice, la página no recalcula la sección
   * activa: las últimas secciones no llegan a la parte alta del panel y se marcaría otra.
   */
  scrollingToSection = false;

  scrollTo(id: string): void {
    this.activeId.set(id);
    this.scrollingToSection = true;
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }
}
