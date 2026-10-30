import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, effect, inject, input, untracked, viewChildren } from '@angular/core';
import { CYCLE_SECONDS, cellGeometry, kiraState } from './kira-logo.cycle';

@Component({
  selector: 'app-kira-logo',
  templateUrl: './kira-logo.component.html',
  styleUrl: './kira-logo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KiraLogoComponent {
  /** Mientras sea true el logo gira en bucle; al volver a false termina la vuelta en curso. */
  spinning = input(false);

  // La forma de reposo va en la plantilla para que el logo se vea desde el primer pintado. Durante
  // la animación los atributos se escriben en cada fotograma sin pasar por la detección de cambios.
  protected readonly cells = [0, 1, 2, 3].map(q => cellGeometry(q, kiraState(0)));

  private outlines = viewChildren<ElementRef<SVGRectElement>>('outline');
  private fills = viewChildren<ElementRef<SVGPathElement>>('fill');
  private frame = 0;
  private startTime: number | null = null;

  constructor() {
    effect(() => {
      if (this.spinning()) untracked(() => this.spin());
    });
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frame));
  }

  /** Da una vuelta completa, que deja el logo otra vez en su forma de reposo. */
  spin(): void {
    if (this.startTime !== null || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.startTime = performance.now();
    this.frame = requestAnimationFrame(now => this.tick(now));
  }

  private tick(now: number): void {
    let t = (now - this.startTime!) / 1000;
    if (t >= CYCLE_SECONDS) {
      if (!this.spinning()) {
        this.paint(0);
        this.startTime = null;
        return;
      }
      t %= CYCLE_SECONDS;
      this.startTime = now - t * 1000;
    }
    this.paint(t);
    this.frame = requestAnimationFrame(next => this.tick(next));
  }

  private paint(t: number): void {
    const state = kiraState(t);
    const outlines = this.outlines();
    const fills = this.fills();
    for (let q = 0; q < 4; q++) {
      const { outline, fill } = cellGeometry(q, state);
      const rect = outlines[q].nativeElement;
      const path = fills[q].nativeElement;
      rect.setAttribute('visibility', outline ? 'visible' : 'hidden');
      if (outline) {
        rect.setAttribute('x', String(outline.x));
        rect.setAttribute('y', String(outline.y));
        rect.setAttribute('width', String(outline.width));
        rect.setAttribute('height', String(outline.height));
        rect.setAttribute('rx', String(outline.rx));
        rect.setAttribute('stroke-width', String(outline.strokeWidth));
      }
      path.setAttribute('visibility', fill ? 'visible' : 'hidden');
      if (fill) path.setAttribute('d', fill);
    }
  }
}
