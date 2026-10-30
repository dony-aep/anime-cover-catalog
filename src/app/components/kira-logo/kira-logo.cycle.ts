// Ciclo «forma antihoraria» del logo Kira, portado de su comp de After Effects: las portadas no
// salen de su cuadrante; los divisores de cada columna suben o bajan y el relleno con la estrella
// pasa a la portada siguiente en sentido antihorario. Medidas en unidades del viewBox de 64.

export type Curve = readonly [number, number, number, number];

// Las mismas curvas que la comp, en notación cubic-bezier.
const TRAVEL: Curve = [0.55, 0, 0.3, 1];
const SETTLE: Curve = [0.4, 0, 0.3, 1];
const ZOOM_IN_4: Curve = [0, 0.8, 0.2, 1];
const ZOOM_OUT_3: Curve = [0.75, 0, 1, 0.25];

export const STEP_SECONDS = 1.05;
export const STEPS = 4;
export const CYCLE_SECONDS = STEP_SECONDS * STEPS;

// Cuadrantes: 0 arriba izquierda, 1 arriba derecha, 2 abajo derecha, 3 abajo izquierda. El relleno
// sale de la destacada y vuelve a ella al cerrar la vuelta.
export const FILL_ORDER = [2, 1, 0, 3, 2] as const;

type PerCell = [number, number, number, number];

export interface KiraState {
  /** Alto de cada portada. Las dos de una columna suman 39: 48 de alto menos 9 de hueco. */
  heights: PerCell;
  /** 0 es solo contorno; 1, rellena. */
  fill: PerCell;
  /** Escala de la estrella, en %. */
  sparkleScale: PerCell;
  /** Giro de la estrella en grados; positivo es sentido horario. */
  sparkleRotation: PerCell;
}

export interface CellGeometry {
  outline: { x: number; y: number; width: number; height: number; rx: number; strokeWidth: number } | null;
  /** Path de la portada rellena con la estrella recortada (evenodd), o null si va en contorno. */
  fill: string | null;
}

function bezier(a: number, b: number, s: number): number {
  return 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
}

export function ease([x1, y1, x2, y2]: Curve, progress: number): number {
  // Bisección sobre x: con x1 y x2 entre 0 y 1 la curva es monótona en x.
  let lo = 0;
  let hi = 1;
  let s = progress;
  for (let i = 0; i < 24; i++) {
    s = (lo + hi) / 2;
    if (bezier(x1, x2, s) < progress) lo = s;
    else hi = s;
  }
  return bezier(y1, y2, s);
}

function track(t: number, keys: readonly (readonly [number, number])[], curves: readonly Curve[]): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < curves.length; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t < t1) return v0 + (v1 - v0) * ease(curves[i], (t - t0) / (t1 - t0));
  }
  return keys[keys.length - 1][1];
}

export function kiraState(t: number): KiraState {
  const cycleT = ((t % CYCLE_SECONDS) + CYCLE_SECONDS) % CYCLE_SECONDS;
  const step = Math.min(STEPS - 1, Math.floor(cycleT / STEP_SECONDS));
  const u = cycleT - step * STEP_SECONDS;

  // Los dos divisores se mueven a la vez y se pasan un 6 % antes de asentarse. Las portadas en
  // diagonal miden siempre lo mismo, así que basta con el alto de la de arriba a la izquierda.
  const from = step % 2 === 0 ? 26 : 13;
  const to = 39 - from;
  const topLeft = track(u, [[0.04, from], [0.6, to + (to - from) * 0.06], [0.84, to]], [TRAVEL, SETTLE]);

  const state: KiraState = {
    heights: [topLeft, 39 - topLeft, topLeft, 39 - topLeft],
    fill: [0, 0, 0, 0],
    sparkleScale: [0, 0, 0, 0],
    sparkleRotation: [0, 0, 0, 0],
  };

  const out = FILL_ORDER[step];
  state.sparkleScale[out] = track(u, [[0, 100], [0.18, 0]], [ZOOM_OUT_3]);
  state.sparkleRotation[out] = track(u, [[0, 0], [0.18, -90]], [ZOOM_OUT_3]);
  state.fill[out] = track(u, [[0.12, 1], [0.56, 0]], [TRAVEL]);

  // La siguiente empieza a llenarse antes de que la otra acabe de vaciarse, para que el relleno se
  // lea como un solo trazo que avanza.
  const into = FILL_ORDER[step + 1];
  state.fill[into] = track(u, [[0.06, 0], [0.5, 1]], [TRAVEL]);
  state.sparkleScale[into] = track(u, [[0.46, 0], [0.66, 112], [0.84, 100]], [ZOOM_IN_4, SETTLE]);
  state.sparkleRotation[into] = track(u, [[0.46, 90], [0.66, -6], [0.84, 0]], [ZOOM_IN_4, SETTLE]);
  return state;
}

const COLUMN_X = [18, 46, 46, 18];
const IS_TOP = [true, true, false, false];
// El relleno sustituye al contorno cuando el hueco ya está cerrado, así el cambio no se ve.
const SWAP_AT = 0.97;

type Point = readonly [number, number];

// La estrella de la comp, centrada en el origen: cuatro curvas de punta a punta, en sentido horario.
const SPARKLE_SIDES: readonly (readonly Point[])[] = [
  [[0, -6], [0.5, -2.2], [2.2, -0.5], [6, 0]],
  [[6, 0], [2.2, 0.5], [0.5, 2.2], [0, 6]],
  [[0, 6], [-0.5, 2.2], [-2.2, 0.5], [-6, 0]],
  [[-6, 0], [-2.2, -0.5], [-0.5, -2.2], [0, -6]],
];

// En la comp la estrella lleva Offset Paths de 0,5 con junta redonda, que es lo que redondea sus
// puntas. Aquí se reproduce: cada lado se desplaza 0,5 hacia fuera desplazando los tramos de su
// polígono de control (Tiller-Hanson) y cada punta se cierra con un arco de radio 0,5 centrado en ella.
const SPARKLE_OFFSET = 0.5;

function outward([ax, ay]: Point, [bx, by]: Point): Point {
  const len = Math.hypot(bx - ax, by - ay);
  return [(by - ay) / len, -(bx - ax) / len];
}

function shift([x, y]: Point, [nx, ny]: Point, d: number): Point {
  return [x + nx * d, y + ny * d];
}

/** Corte de las rectas a + t·u y b + s·v. */
function intersect(a: Point, u: Point, b: Point, v: Point): Point {
  const t = ((b[0] - a[0]) * v[1] - (b[1] - a[1]) * v[0]) / (u[0] * v[1] - u[1] * v[0]);
  return [a[0] + u[0] * t, a[1] + u[1] * t];
}

function offsetSide([p0, p1, p2, p3]: readonly Point[], d: number): Point[] {
  const dir = (a: Point, b: Point): Point => [b[0] - a[0], b[1] - a[1]];
  const n01 = outward(p0, p1);
  const n12 = outward(p1, p2);
  const n23 = outward(p2, p3);
  return [
    shift(p0, n01, d),
    intersect(shift(p0, n01, d), dir(p0, p1), shift(p1, n12, d), dir(p1, p2)),
    intersect(shift(p1, n12, d), dir(p1, p2), shift(p2, n23, d), dir(p2, p3)),
    shift(p3, n23, d),
  ];
}

const ROUNDED_SPARKLE = SPARKLE_SIDES.map(side => offsetSide(side, SPARKLE_OFFSET));

const num = (v: number) => +v.toFixed(3);

function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  return `M${num(x + r)} ${num(y)}H${num(x + w - r)}A${r} ${r} 0 0 1 ${num(x + w)} ${num(y + r)}` +
    `V${num(y + h - r)}A${r} ${r} 0 0 1 ${num(x + w - r)} ${num(y + h)}H${num(x + r)}` +
    `A${r} ${r} 0 0 1 ${num(x)} ${num(y + h - r)}V${num(y + r)}A${r} ${r} 0 0 1 ${num(x + r)} ${num(y)}Z`;
}

function sparkle(cx: number, cy: number, scale: number, degrees: number): string {
  if (scale < 0.5) return '';
  const k = scale / 100;
  const a = (degrees * Math.PI) / 180;
  const cos = Math.cos(a) * k;
  const sin = Math.sin(a) * k;
  const at = ([x, y]: Point) => `${num(cx + x * cos - y * sin)} ${num(cy + x * sin + y * cos)}`;
  const r = num(SPARKLE_OFFSET * k);
  let d = `M${at(ROUNDED_SPARKLE[0][0])}`;
  ROUNDED_SPARKLE.forEach((side, i) => {
    d += `C${at(side[1])} ${at(side[2])} ${at(side[3])}A${r} ${r} 0 0 1 ${at(ROUNDED_SPARKLE[(i + 1) % 4][0])}`;
  });
  return d + 'Z';
}

export function cellGeometry(quadrant: number, state: KiraState): CellGeometry {
  const h = state.heights[quadrant];
  // El borde exterior de cada columna no se mueve: la portada de arriba crece hacia abajo y la de
  // abajo, hacia arriba.
  const top = IS_TOP[quadrant] ? 8 : 56 - h;
  const cx = COLUMN_X[quadrant];
  const fill = state.fill[quadrant];

  if (fill > SWAP_AT) {
    return {
      outline: null,
      fill: roundedRect(cx - 11.5, top - 2.5, 23, h + 5, 7) +
        sparkle(cx, top + h / 2, state.sparkleScale[quadrant], state.sparkleRotation[quadrant]),
    };
  }
  // Rellenar es engordar el trazo hacia dentro: el rectángulo encoge lo mismo que crece el trazo,
  // así el borde exterior y su redondeo no cambian mientras el hueco se cierra.
  const w = 5 + 6.8 * fill;
  return {
    outline: {
      x: num(cx - 11.5 + w / 2),
      y: num(top - 2.5 + w / 2),
      width: num(23 - w),
      height: num(h + 5 - w),
      rx: num(Math.max(0, 7 - w / 2)),
      strokeWidth: num(w),
    },
    fill: null,
  };
}
