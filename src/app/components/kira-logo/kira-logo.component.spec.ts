import { TestBed } from '@angular/core/testing';
import { KiraLogoComponent } from './kira-logo.component';

// Angular sin zone.js también programa la detección de cambios con requestAnimationFrame, así que
// los tests no cuentan llamadas: avanzan los fotogramas a mano y miran el dibujo.
describe('KiraLogoComponent', () => {
  const START = 1000;
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    frames = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.spyOn(performance, 'now').mockReturnValue(START);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function render(spinning = false) {
    const fixture = TestBed.createComponent(KiraLogoComponent);
    fixture.componentRef.setInput('spinning', spinning);
    fixture.detectChanges();
    return fixture;
  }

  /** Ejecuta los fotogramas pendientes como si hubieran pasado `seconds` desde START. */
  function frameAt(seconds: number) {
    const pending = frames;
    frames = [];
    pending.forEach(callback => callback(START + seconds * 1000));
  }

  const topLeftHeight = (el: HTMLElement) => el.querySelectorAll('rect')[0].getAttribute('height');

  it('draws the static logo: three outlines and the filled bottom-right cover', () => {
    const svg: SVGSVGElement = render().nativeElement.querySelector('svg');
    expect(svg.querySelectorAll('rect[visibility="visible"]')).toHaveLength(3);
    expect(svg.querySelectorAll('path[visibility="visible"]')).toHaveLength(1);
    expect(topLeftHeight(svg as unknown as HTMLElement)).toBe('26');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('stays still until something asks it to spin', () => {
    const el = render().nativeElement;
    frameAt(0.3);
    expect(topLeftHeight(el)).toBe('26');
  });

  it('gives one full turn and comes back to rest', () => {
    const fixture = render();
    fixture.componentInstance.spin();
    frameAt(0.3);
    expect(topLeftHeight(fixture.nativeElement)).not.toBe('26');
    frameAt(4.3);
    expect(topLeftHeight(fixture.nativeElement)).toBe('26');
    expect(frames).toHaveLength(0);
  });

  it('keeps looping while spinning is on', () => {
    const el = render(true).nativeElement;
    frameAt(4.2 + 0.3);
    expect(topLeftHeight(el)).not.toBe('26');
    expect(frames).toHaveLength(1);
  });

  it('never moves with reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }) as MediaQueryList);
    const fixture = render(true);
    fixture.componentInstance.spin();
    frameAt(0.3);
    expect(topLeftHeight(fixture.nativeElement)).toBe('26');
  });
});
