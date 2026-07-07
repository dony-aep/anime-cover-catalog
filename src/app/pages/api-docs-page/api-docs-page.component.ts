import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FilterBarComponent } from '../../components/filter-bar/filter-bar.component';

@Component({
  selector: 'app-api-docs-page',
  imports: [FilterBarComponent],
  templateUrl: './api-docs-page.component.html',
  styleUrl: './api-docs-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiDocsPageComponent {
  private doc = inject(DOCUMENT);

  readonly origin = this.doc.location.origin;
  readonly baseUrl = `${this.origin}/api/v1`;

  /** Copy snippets, keyed by id, with transient "copied" feedback. */
  copiedId = signal<string | null>(null);

  readonly examples: { id: string; label: string; code: string }[] = [
    {
      id: 'list-curl',
      label: 'cURL',
      code: `curl "${this.baseUrl}/animes?genre=Romance,Comedy&fields=slug,title,genres&sort=year&order=desc&limit=5"`,
    },
    {
      id: 'list-js',
      label: 'JavaScript',
      code: `const res = await fetch("${this.baseUrl}/animes?genre=Romance&limit=5");\nconst { data, meta, links } = await res.json();\nconsole.log(meta.total, data[0].title, links.next);`,
    },
    {
      id: 'detail-curl',
      label: 'cURL',
      code: `curl "${this.baseUrl}/animes/ao-no-hako?fields=title,synopsis,studios"`,
    },
    {
      id: 'random-curl',
      label: 'cURL',
      code: `curl "${this.baseUrl}/animes/random?genre=Romance&fields=slug,title"`,
    },
    {
      id: 'filters-curl',
      label: 'cURL',
      code: `curl "${this.baseUrl}/filters"`,
    },
  ];

  example(id: string): { id: string; label: string; code: string } {
    return this.examples.find((e) => e.id === id)!;
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
}
