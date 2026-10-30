import { CYCLE_SECONDS, FILL_ORDER, STEP_SECONDS, STEPS, cellGeometry, ease, kiraState } from './kira-logo.cycle';

const filledQuadrant = (t: number) => kiraState(t).fill.findIndex(f => f === 1);

describe('kira logo cycle', () => {
  it('rests on the static logo: tall top-left, filled bottom-right with its sparkle', () => {
    const state = kiraState(0);
    expect(state.heights).toEqual([26, 13, 26, 13]);
    expect(state.fill).toEqual([0, 0, 1, 0]);
    expect(state.sparkleScale).toEqual([0, 0, 100, 0]);
  });

  it('ends the cycle where it started, so the loop has no jump', () => {
    const end = kiraState(CYCLE_SECONDS - 0.001);
    const start = kiraState(0);
    end.heights.forEach((h, q) => expect(h).toBeCloseTo(start.heights[q], 3));
    end.fill.forEach((f, q) => expect(f).toBeCloseTo(start.fill[q], 3));
    end.sparkleScale.forEach((s, q) => expect(s).toBeCloseTo(start.sparkleScale[q], 3));
  });

  it('moves the fill counterclockwise: top-right, top-left, bottom-left, back to bottom-right', () => {
    const settled = Array.from({ length: STEPS }, (_, k) => filledQuadrant(k * STEP_SECONDS + 0.95));
    expect(settled).toEqual([1, 0, 3, 2]);
    expect(settled).toEqual(FILL_ORDER.slice(1));
  });

  it('flips both dividers every step', () => {
    expect(kiraState(STEP_SECONDS - 0.01).heights).toEqual([13, 26, 13, 26]);
    expect(kiraState(2 * STEP_SECONDS - 0.01).heights).toEqual([26, 13, 26, 13]);
  });

  it('keeps every column at 39 units plus its gap at any moment', () => {
    for (let t = 0; t < CYCLE_SECONDS; t += 0.05) {
      const [tl, tr, br, bl] = kiraState(t).heights;
      expect(tl + bl).toBeCloseTo(39, 9);
      expect(tr + br).toBeCloseTo(39, 9);
    }
  });

  it('keeps the outer edge of a cell fixed while it fills', () => {
    const empty = cellGeometry(0, kiraState(0)).outline!;
    const half = cellGeometry(0, { ...kiraState(0), fill: [0.5, 0, 1, 0] }).outline!;
    expect(half.x - half.strokeWidth / 2).toBeCloseTo(empty.x - empty.strokeWidth / 2, 3);
    expect(half.width + half.strokeWidth).toBeCloseTo(empty.width + empty.strokeWidth, 3);
    expect(half.rx + half.strokeWidth / 2).toBeCloseTo(7, 3);
  });

  it('draws the filled cell as one path with the sparkle cut out', () => {
    const geometry = cellGeometry(2, kiraState(0));
    expect(geometry.outline).toBeNull();
    expect(geometry.fill!.match(/M/g)).toHaveLength(2);
  });

  it('rounds the sparkle tips like the 0.5 Offset Paths of the comp', () => {
    const sparkle = cellGeometry(2, kiraState(0)).fill!.split('Z')[1];
    const arcEnds = [...sparkle.matchAll(/A0\.5 0\.5 0 0 1 (-?[\d.]+) (-?[\d.]+)/g)].map(m => [Number(m[1]), Number(m[2])]);
    expect(arcEnds).toHaveLength(4);
    // Cada arco termina a 0,5 de su punta; la de arriba está en (46, 37), 6 por encima del centro.
    const [x, y] = arcEnds.reduce((top, p) => (p[1] < top[1] ? p : top));
    expect(Math.hypot(x - 46, y - 37)).toBeCloseTo(0.5, 2);
  });

  it('eases from 0 to 1 along the curve', () => {
    const travel = [0.55, 0, 0.3, 1] as const;
    expect(ease(travel, 0)).toBeCloseTo(0, 5);
    expect(ease(travel, 1)).toBeCloseTo(1, 5);
    expect(ease(travel, 0.25)).toBeLessThan(0.25);
  });
});
