import { Component, ChangeDetectionStrategy, ElementRef, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LucideArrowUpRight, LucideCheck, LucideCopy } from '@lucide/angular';
import { DOCS_SECTION_IDS, DocsNavService } from '../../services/docs-nav.service';

type ListTab = 'curl' | 'js';

/** Distancia desde el borde superior del panel a partir de la cual una sección cuenta como la visible. */
const ACTIVE_SECTION_OFFSET = 96;

@Component({
  selector: 'app-api-docs-page',
  imports: [LucideArrowUpRight, LucideCheck, LucideCopy],
  templateUrl: './api-docs-page.component.html',
  styleUrl: './api-docs-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiDocsPageComponent {
  private doc = inject(DOCUMENT);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private docsNav = inject(DocsNavService);

  readonly origin = this.doc.location.origin;
  readonly baseUrl = `${this.origin}/api/v1`;

  /** Copy snippets, keyed by id, with transient "copied" feedback. */
  copiedId = signal<string | null>(null);
  listTab = signal<ListTab>('curl');

  readonly listTabs: { id: ListTab; label: string }[] = [
    { id: 'curl', label: 'cURL' },
    { id: 'js', label: 'JavaScript' },
  ];

  readonly listRequest: Record<ListTab, string> = {
    curl: `curl "${this.baseUrl}/animes?type=TV&year=2025&fields=slug,title,genres&limit=3"`,
    js: `const res = await fetch("${this.baseUrl}/animes?type=TV&year=2025&limit=3");\nconst { data, meta, links } = await res.json();\nconsole.log(meta.total, data[0].title, links.next);`,
  };

  readonly listResponse = `{
  "data": [
    {
      "slug": "9-ruler-s-crown",
      "title": "9: Ruler's Crown",
      "genres": ["Mystery", "Romance"]
    },
    {
      "slug": "a-rank-party-wo-ridatsu-shita-ore-wa-…",
      "title": "A-Rank Party wo Ridatsu shita Ore wa, …",
      "genres": ["Action", "Adventure", "Fantasy", "Romance"]
    },
    {
      "slug": "ame-to-kimi-to",
      "title": "Ame to Kimi to",
      "genres": ["Slice of Life"]
    }
  ],
  "meta": { "page": 1, "limit": 3, "total": 93, "totalPages": 31 },
  "links": {
    "next": "${this.baseUrl}/animes?type=TV&year=2025&fields=slug%2Ctitle%2Cgenres&limit=3&page=2",
    "prev": null
  }
}`;

  readonly detailRequest = `curl "${this.baseUrl}/animes/ame-to-kimi-to?fields=title,titleEnglish,studios,genres,themes"`;
  readonly detailResponse = `{
  "title": "Ame to Kimi to",
  "titleEnglish": "With You and the Rain",
  "studios": ["Lesprit"],
  "genres": ["Slice of Life"],
  "themes": ["Adult Cast", "Pets"]
}`;

  readonly randomRequest = `curl "${this.baseUrl}/animes/random?genre=Romance&fields=slug,title"`;
  readonly randomResponse = `{ "slug": "9-ruler-s-crown", "title": "9: Ruler's Crown" }`;

  readonly filtersRequest = `curl "${this.baseUrl}/filters"`;
  readonly filtersResponse = `{
  "genres": ["Action", "Adventure", "Avant Garde", …],
  "themes": ["Adult Cast", "Anthropomorphic", "CGDCT", …],
  "demographics": ["Josei", "Kids", "Seinen", "Shoujo", "Shounen"],
  "types": ["Movie", "ONA", "OVA", "Special", "TV", "TV Special"],
  "years": [2026, 2025, 2024, …]
}`;

  readonly etagRequest = `curl -i \\\n  -H 'If-None-Match: "ed8cac3b…"' \\\n  "${this.baseUrl}/animes?type=TV"`;
  readonly etagResponse = `HTTP/2 304\ncache-control: public, s-maxage=86400, stale-while-revalidate=604800\netag: "ed8cac3b…"`;

  readonly errorRequest = `curl "${this.baseUrl}/animes/does-not-exist"`;
  readonly errorResponse = `{ "error": "Anime not found: does-not-exist" }`;

  constructor() {
    // El índice vive en la columna lateral, que no se destruye al salir de esta página.
    this.docsNav.activeId.set(null);
  }

  async copy(id: string, text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copiedId.set(id);
      setTimeout(() => this.copiedId.set(null), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — no-op.
    }
  }

  onScroll(panel: HTMLElement): void {
    if (!this.docsNav.scrollingToSection) {
      this.updateActiveSection(panel);
    }
  }

  onScrollEnd(panel: HTMLElement): void {
    if (this.docsNav.scrollingToSection) {
      this.docsNav.scrollingToSection = false;
      return;
    }
    this.updateActiveSection(panel);
  }

  /** Marca la última sección cuyo título ya pasó por la parte alta del panel. */
  private updateActiveSection(panel: HTMLElement): void {
    const limit = panel.getBoundingClientRect().top + ACTIVE_SECTION_OFFSET;
    let active: string | null = null;
    for (const id of DOCS_SECTION_IDS) {
      const section = this.host.nativeElement.querySelector<HTMLElement>(`#${id}`);
      if (section && section.getBoundingClientRect().top <= limit) {
        active = id;
      }
    }
    this.docsNav.activeId.set(active);
  }
}
