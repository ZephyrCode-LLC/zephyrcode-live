/**
 * ZephyrCode — the motion system.
 * One grammar across every room: two house curves, one ambient loop, a four-step
 * time scale. Pure + server-safe (no "use client", no React, no deps). The React
 * hooks live in ./motion-hooks. Drop in and import from anywhere.
 *
 *   import { SETTLE, DURATION, animate } from "@/lib/motion";
 */

export type Bezier = readonly [number, number, number, number];

/**
 * The only easings allowed. Ban the framework defaults (`ease`, `ease-in-out`,
 * the stock 300ms) — they are what makes effort read as generic.
 */
export const EASING = {
  /** fire — decisive arrivals: a submit, a lock-in, a verdict. Fast attack, hard stop. */
  strike: [0.2, 0.9, 0.1, 1] as Bezier,
  /** stillness — THE house curve. A long exponential decay; everything that arrives, settles. */
  settle: [0.16, 1, 0.3, 1] as Bezier,
  /** breath — the only loopable curve. Ambient, alive-but-calm, edges only — never near content. */
  breath: [0.65, 0, 0.35, 1] as Bezier,
} as const;

export const cssEase = (b: Bezier): string =>
  `cubic-bezier(${b[0]}, ${b[1]}, ${b[2]}, ${b[3]})`;

/** Ready-made CSS strings for `transition` / `animation` shorthands. */
export const STRIKE = cssEase(EASING.strike);
export const SETTLE = cssEase(EASING.settle);
export const BREATH = cssEase(EASING.breath);

/**
 * The time scale (ms). Fast where it serves the user, slow only where it earns a
 * memory. Cheaper interactions finish first.
 */
export const DURATION = {
  /** hover, toggle, tap feedback */
  flick: 120,
  /** panels, menus, position shifts */
  move: 240,
  /** content reveal, route change */
  settle: 480,
  /** the one hero moment you remember */
  resolve: 900,
} as const;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Sample a cubic-bezier easing at linear progress `t` ∈ [0,1].
 * Newton–Raphson solve for the parametric `u` where x(u) = t, then return y(u).
 */
export function bezier(b: Bezier, t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const [x1, y1, x2, y2] = b;
  const bx = (u: number) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  const by = (u: number) => 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = bx(u) - t;
    const dx =
      3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
    if (Math.abs(dx) < 1e-6) break;
    u = Math.max(0, Math.min(1, u - x / dx));
  }
  return by(u);
}

export interface AnimateOptions {
  /** ms */
  duration: number;
  ease?: Bezier;
  /** called every frame with eased progress ∈ [0,1] */
  onUpdate: (eased: number) => void;
  onComplete?: () => void;
  /** when true (or no rAF available), jump straight to the end-state — honours reduced-motion */
  reduced?: boolean;
}

/**
 * A tiny rAF tween. Returns a cancel function. Drives all imperative motion
 * (path morphs, count-ups, draw-ons) from one place so timing/easing stay
 * governed instead of scattered.
 */
export function animate(opts: AnimateOptions): () => void {
  const { duration, ease = EASING.settle, onUpdate, onComplete, reduced = false } = opts;
  if (reduced || duration <= 0 || typeof requestAnimationFrame === "undefined") {
    onUpdate(1);
    onComplete?.();
    return () => {};
  }
  let raf = 0;
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    onUpdate(bezier(ease, t));
    if (t < 1) raf = requestAnimationFrame(tick);
    else onComplete?.();
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
