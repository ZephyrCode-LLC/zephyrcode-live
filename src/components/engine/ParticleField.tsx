"use client";

/**
 * THE FIELD — one particle system, fourteen formations; the scroll is the score.
 * v4 (2026-10-20): the morph, each scene's living motion and the light all run on the GPU —
 * the CPU swaps two formation buffers at scene boundaries and sets a few uniforms per frame.
 * Particles are lit beads (sphere-shaded, a pointer "lantern" that lights and parts them, a
 * light sweep as each formation settles), transitions are staggered and ride a curl-like flow,
 * and an HDR pipeline (half-float target → bloom on desktop → hue-preserving tonemap) keeps
 * dense overlaps glowing in their own colour instead of burning white.
 * The formation drawings below are unchanged from v3 (user-approved shapes).
 * Dynamically imported (ssr:false) — never blocks LCP.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export type Grade = [number[], number[], number];

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Seeded PRNG: every formation draws from this, so two loads build the identical field (screenshot diffs, A10). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type V2 = [number, number];
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A chain of cubic Béziers resampled at EQUAL ARC LENGTH, so `at(u)` is the point u of the way along
 * the whole line and particle i (u = i/N) is spaced evenly whatever the curve's speed. The normal is
 * always (-ty, tx).
 */
function cubicChain(segs: V2[][], M = 2048) {
  const pts: V2[] = [];
  segs.forEach((S, k) => {
    for (let j = 0; j < M; j++) {
      if (k && !j) continue; // the joint is shared
      const t = j / (M - 1), m = 1 - t;
      pts.push([
        m * m * m * S[0][0] + 3 * m * m * t * S[1][0] + 3 * m * t * t * S[2][0] + t * t * t * S[3][0],
        m * m * m * S[0][1] + 3 * m * m * t * S[1][1] + 3 * m * t * t * S[2][1] + t * t * t * S[3][1],
      ]);
    }
  });
  const cum = new Float64Array(pts.length);
  for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const L = cum[cum.length - 1];
  const at = (u: number) => {
    const target = clamp(u, 0, 1) * L;
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= target) lo = mid; else hi = mid; }
    const f = (target - cum[lo]) / (cum[hi] - cum[lo] || 1);
    const a = pts[Math.max(0, lo - 1)], b = pts[Math.min(pts.length - 1, hi + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1;
    return { x: pts[lo][0] + (pts[hi][0] - pts[lo][0]) * f, y: pts[lo][1] + (pts[hi][1] - pts[lo][1]) * f, tx: dx / n, ty: dy / n };
  };
  return { at, L };
}

/* ---------- 00 ONE BREATH — the hero's single calligraphic stroke ----------
   Authored in formation units for 1440x900 (landscape) and 390x844 (portrait). The lead-in is off-frame,
   so the line has no visible start. It enters light, presses on the upper bow, thins to a hairline at the
   S inflection, presses hardest on the lower bow and lifts away pointing west along the CTA row: a loose
   end, never a head. Bone above the inflection, ember below — the headline's own two inks. */
type Cubics = { lead: V2[]; A: V2[]; B: V2[] };
const BREATH_LAND: Cubics = {
  lead: [[31.0, 12.2], [29.5, 11.73], [28.0, 11.27], [26.5, 10.8]],
  A: [[26.5, 10.8], [19.0, 8.0], [15.2, 4.4], [16.6, -0.4]],
  B: [[16.6, -0.4], [17.6, -3.9], [20.2, -9.6], [11.0, -10.7]],
};
const BREATH_PORT: Cubics = {
  lead: [[23.0, -4.6], [21.6, -5.2], [20.3, -5.8], [19.0, -6.4]],
  A: [[19.0, -6.4], [14.8, -8.6], [12.8, -11.8], [13.3, -15.6]],
  B: [[13.3, -15.6], [13.8, -19.6], [15.4, -26.0], [5.6, -27.6]],
};
/** brush pressure along the line, 0.08-1: light entry, press, hairline at the inflection, hardest press, lift */
const press = (s: number) =>
  clamp(0.3 + 0.45 * Math.exp(-(((s - 0.3) / 0.1) ** 2)) + 0.7 * Math.exp(-(((s - 0.8) / 0.075) ** 2)) - 0.22 * Math.exp(-(((s - 0.56) / 0.05) ** 2)), 0.08, 1);
const gaussFrom = (r: () => number) => () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(6.2831853 * r());
// the stroke's centre-line keeps this clear of the headline's longest line. The brush's lit edge reaches
// ~0.55 fu left of the centre-line, and the acceptance gate wants >= 4.5 fu from any lit pixel.
const GAP_H1 = 5.5;
const HERO_GAIN = 1; // the one knob for the stroke's brightness (acceptance A5/A6)

/** a rect in viewport px, taken at a scene's settled scroll */
type Box = { l: number; r: number; t: number; b: number };
type MakerAnchors = { tt: Box; strip: Box; eyebrow: Box; solid: Box; hdr: Box | null; h2Right: number };
/** 13 TIED OFF, as it falls on the 1440x900 reference: the thread's pins in fu. Also where a text-only maker flies its particles. */
const TIE_REF = { pin: [11.3, 10.5] as V2, knot: [19.4, -9.8] as V2, bulge: 22.27 };
const DAYS = [1, 3, 10, 14];
const SD = DAYS.map((d) => (d - 1) / 13); // 0, .154, .692, 1: the timetable's real rhythm along the thread
const TIE_GAIN = 1; // the one knob for the thread's brightness (acceptance C2/C3)
// Per-particle ink along the thread: thread < knots (a crescendo, Day 1 < 3 < 10) < the lamp, which is the brightest
// thing on the scene yet stays under the CTA. The authored values (thread 0.06, knots .07/.08/.095) put the
// knots above the lamp in this renderer (measured: Day 10 0.58, lamp 0.48 above the page), so they are halved.
const TIE_INK = { thread: 0.014, knots: [0.013, 0.016, 0.019], lampCore: 0.09, lampHalo: 0.022 };
type HeroAnchors = { h1Right: number; ctaY: number; cueY: number; cueBottom: number; bandTop: number; avoid: Box[] };

export default function ParticleField({ grades }: { grades: Grade[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false, // opaque: the final pass composites the page background itself
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      canvas.style.display = "none";
      return;
    }

    const DPR = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.75 : 2); // HDR targets scale with DPR²
    renderer.setPixelRatio(DPR);
    renderer.setClearColor(0x000000, 1);

    const scene3d = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
    camera.position.set(0, 0, 34);

    const N = window.innerWidth < 700 ? 4200 : 9000;
    const SCENES = 14;
    const rand = mulberry32(0x5eed14);
    const rnd = (a: number, b: number) => a + rand() * (b - a);

    // shared glyph helpers: draw a line of points into `pts`, and scatter `pts` across all particles.
    const seg = (pts: Array<[number, number]>, x0: number, y0: number, x1: number, y1: number, n: number) => {
      for (let s = 0; s < n; s++) { const t = rand(); pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); }
    };
    const rectPts = (pts: Array<[number, number]>, x0: number, y0: number, x1: number, y1: number, n: number) => {
      seg(pts, x0, y0, x1, y0, n); seg(pts, x0, y1, x1, y1, n); seg(pts, x0, y0, x0, y1, n); seg(pts, x1, y0, x1, y1, n);
    };
    // a SOLID band of half-width w along a segment (a fat limb / body mass) — reads cleanly as particles.
    const bar = (pts: Array<[number, number]>, x0: number, y0: number, x1: number, y1: number, w: number, n: number) => {
      const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, px = -dy / L, py = dx / L;
      for (let s = 0; s < n; s++) { const t = rand(), o = (rand() * 2 - 1) * w; pts.push([x0 + dx * t + px * o, y0 + dy * t + py * o]); }
    };
    // an elliptical arc from angle a0→a1 with a little radial jitter jr (fraction of radius) — crisp curves.
    const arc = (pts: Array<[number, number]>, cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number, jr = 0.03) => {
      for (let s = 0; s < n; s++) { const t = a0 + rand() * (a1 - a0), rr = 1 + (rand() * 2 - 1) * jr; pts.push([cx + Math.cos(t) * rx * rr, cy + Math.sin(t) * ry * rr]); }
    };
    // a point on a quadratic bezier, and a soft dotted stroke of half-width w along one.
    const qAt = (p0: [number, number], p1: [number, number], p2: [number, number], t: number): [number, number] => {
      const m = 1 - t; return [m * m * p0[0] + 2 * m * t * p1[0] + t * t * p2[0], m * m * p0[1] + 2 * m * t * p1[1] + t * t * p2[1]];
    };
    const qcurve = (pts: Array<[number, number]>, p0: [number, number], p1: [number, number], p2: [number, number], n: number, w: number) => {
      for (let s = 0; s < n; s++) {
        const t = rand(), m = 1 - t, q = qAt(p0, p1, p2, t);
        const dx = 2 * m * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]), dy = 2 * m * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
        const L = Math.hypot(dx, dy) || 1, o = (rand() * 2 - 1) * w;
        pts.push([q[0] - (dy / L) * o, q[1] + (dx / L) * o]);
      }
    };
    const fillPts = (a: Float32Array, pts: Array<[number, number]>, jit: number, zr: number) => {
      for (let i = 0; i < N; i++) { const q = pts[i % pts.length]; a[i * 3] = q[0] + rnd(-jit, jit); a[i * 3 + 1] = q[1] + rnd(-jit, jit); a[i * 3 + 2] = rnd(-zr, zr); }
    };

    /* ---------- formation targets ---------- */
    function fWind() {
      const a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        a[i * 3] = rnd(-27, 27);
        a[i * 3 + 1] = rnd(-16, 16);
        a[i * 3 + 2] = rnd(-12, 6);
      }
      return a;
    }
    function fFunnel() {
      const a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const u = i / N;
        let x = -26 + 52 * u + rnd(-0.8, 0.8);
        let order = Math.max(0, Math.min(1, (x + 8) / 22));
        order = order * order * (3 - 2 * order);
        let ang = rnd(0, Math.PI * 2);
        const snapped = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4);
        ang = ang + (snapped - ang) * order;
        const R = (1 - order) * rnd(4, 15) + order * rnd(5.2, 6.2);
        const y = Math.sin(ang) * R + (1 - order) * rnd(-3, 3);
        const z = Math.cos(ang) * R * 0.7 + (1 - order) * rnd(-3, 3) - 2;
        if (order > 0.92) {
          x = 8 + Math.round((x - 8) / 2.6) * 2.6;
        }
        a[i * 3] = x;
        a[i * 3 + 1] = y;
        a[i * 3 + 2] = z;
      }
      return a;
    }
    function fFlame() {
      const a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const u = i / N; /* aU == height → gradient hot base to brass tip */
        const yn = Math.pow(u, 1.25);
        const y = -9 + yn * 22;
        const prof = Math.pow(1 - yn, 1.15) * (0.5 + 0.5 * Math.sin(Math.min(yn * 3.4, Math.PI)));
        const R = 6.4 * prof * Math.sqrt(rand());
        const ang = rnd(0, Math.PI * 2);
        a[i * 3] = Math.cos(ang) * R;
        a[i * 3 + 1] = y + rnd(-0.5, 0.5);
        a[i * 3 + 2] = Math.sin(ang) * R * 0.65;
      }
      return a;
    }
    function fLattice() {
      const a = new Float32Array(N * 3);
      const n = Math.ceil(Math.cbrt(N));
      const S = 17;
      const step = S / (n - 1);
      for (let i = 0; i < N; i++) {
        const gx = i % n;
        const gy = Math.floor(i / n) % n;
        const gz = Math.floor(i / (n * n)) % n;
        a[i * 3] = -S / 2 + gx * step + rnd(-0.12, 0.12);
        a[i * 3 + 1] = -S / 2 + gy * step + rnd(-0.12, 0.12);
        a[i * 3 + 2] = -S / 2 + gz * step + rnd(-0.12, 0.12) - 1;
      }
      return a;
    }
    function fWave() {
      const a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const u = i / N; /* aU == x → ember→iris gradient */
        const x = -28 + 56 * u;
        a[i * 3] = x + rnd(-0.4, 0.4);
        a[i * 3 + 1] = Math.sin(u * Math.PI * 4 + 0.6) * 4.6 + rnd(-1.1, 1.1);
        a[i * 3 + 2] = rnd(-3, 3);
      }
      return a;
    }
    function fRing() {
      const a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const u = i / N;
        const ang = u * Math.PI * 2;
        const R = 10.5 + rnd(-0.55, 0.55) + Math.sin(ang * 3) * 0.4;
        a[i * 3] = Math.cos(ang) * R;
        a[i * 3 + 1] = Math.sin(ang) * R * 0.94;
        a[i * 3 + 2] = rnd(-1.6, 1.6);
      }
      return a;
    }
    // DOORS scene formation — a slim figure ON TOP, a row of 5 OPEN doors BELOW it.
    // Figure: a thin full-body silhouette (head, torso, arms, legs), centred up top.
    // Each door: a frame whose leaf is swung WIDE out to the left of the hinge (a clearly ajar
    // parallelogram jutting past the frame), leaving the doorway itself open — unmistakably open.
    function fDoors() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      const push = (x: number, y: number) => pts.push([x, y]);
      // ---- THE THINKER: a compact standing figure in the classic thinking pose — one arm folded
      // across the waist, the other elbow resting on it, hand raised to the chin, head gently bowed. ----
      const blob = (cx: number, cy: number, rx: number, ry: number, n: number) => { for (let s = 0; s < n; s++) { const ang = rand() * 6.283, rr = Math.sqrt(rand()); push(cx + Math.cos(ang) * rr * rx, cy + Math.sin(ang) * rr * ry); } };
      // (slim torso + elbows swung WIDE so real daylight separates the raised arm from the body)
      blob(0.0, 9.2, 1.18, 1.34, 105);                       // head, slightly bowed
      bar(pts, 0.02, 7.95, 0.1, 7.4, 0.52, 18);              // neck
      for (let s = 0; s < 205; s++) { const t = rand(), y = 7.3 - t * 4.0, hw = 1.62 - 0.55 * t; push((rand() * 2 - 1) * hw + 0.15 * t, y); } // torso, shoulders → waist
      blob(0.22, 3.0, 1.42, 0.62, 34);                       // hips
      bar(pts, -0.42, 2.8, -0.68, -0.3, 0.58, 95);           // near leg
      bar(pts, 0.84, 2.8, 1.24, -0.3, 0.58, 95);             // far leg
      blob(-0.82, -0.46, 0.94, 0.38, 20); blob(1.36, -0.46, 0.94, 0.38, 20); // feet
      bar(pts, 1.6, 6.75, 3.0, 4.55, 0.46, 50);              // far upper arm, elbow well out
      bar(pts, 3.0, 4.55, -1.2, 3.78, 0.42, 62);             // far forearm, folded across the waist
      bar(pts, -1.6, 6.75, -3.5, 4.05, 0.46, 50);            // near upper arm, elbow swung wide
      bar(pts, -3.5, 4.05, -1.45, 7.1, 0.4, 58);             // near forearm rising to the chin — clear of the body
      blob(-1.4, 7.42, 0.5, 0.46, 24);                       // the hand at the chin
      // ---- five OPEN doors in a row below (with a clear gap under the figure) ----
      const XC = [-20, -10, 0, 10, 20], DB = -12.0, DT = -3.2, DW = 1.7;
      for (const xc of XC) {
        const xL = xc - DW, xR = xc + DW;
        seg(pts, xL, DB, xL, DT, 92);               // left jamb (the hinge)
        seg(pts, xR, DB, xR, DT, 92);               // right jamb
        seg(pts, xL, DT, xR, DT, 46);               // lintel
        seg(pts, xL, DB, xR, DB, 40);               // threshold — the doorway itself stays empty (open)
        // the leaf swung WIDE open past the frame: a tilted parallelogram jutting out to the left
        const xF = xL - 2.6, tilt = -1.2;           // free edge shifted left + down (swung toward you)
        seg(pts, xL, DT, xF, DT + tilt, 78);        // top edge (slants down-left)
        seg(pts, xL, DB, xF, DB + tilt, 78);        // bottom edge (parallel)
        seg(pts, xF, DB + tilt, xF, DT + tilt, 96); // free edge (tall)
        for (let s = 0; s < 40; s++) { const u = rand(); const xx = xF + (xL - xF) * u; const yT = (DT + tilt) - tilt * u, yB = (DB + tilt) - tilt * u; push(xx, yB + (yT - yB) * rand()); } // leaf face
        for (let s = 0; s < 10; s++) push(xF + 0.35, (DB + DT) / 2 + tilt / 2 + (rand() * 2 - 1) * 0.25); // knob on the free edge
      }
      fillPts(a, pts, 0.12, 1.1);
      return a;
    }

    // METHOD scene formation — a CLOSED horizontal figure-8 (∞) the particles flow around.
    // Gerono lemniscate x=W·cosθ, y=H·sin2θ. Particles are spaced by ARC LENGTH (even density,
    // no thin/broken spots) and flow at constant speed around it, so it always reads as one
    // continuous closed curve. "One loop that transfers."
    const LOOP_W = 16.5, LOOP_H = 7.2, LOOP_FLOW = 0.06; // flow = loop-fractions per second
    const geroX = (th: number) => LOOP_W * Math.cos(th);
    const geroY = (th: number) => LOOP_H * Math.sin(2 * th);
    // build an arc-length table, then invert it: even fraction s∈[0,1) → theta
    const LK = 1200;
    const cumLen = new Float32Array(LK + 1);
    for (let k = 1, pxL = geroX(0), pyL = geroY(0); k <= LK; k++) {
      const th = (k / LK) * Math.PI * 2, x = geroX(th), y = geroY(th);
      cumLen[k] = cumLen[k - 1] + Math.hypot(x - pxL, y - pyL); pxL = x; pyL = y;
    }
    const totalLen = cumLen[LK];
    const KI = 1024;
    const sToTheta = new Float32Array(KI);
    for (let j = 0, k = 0; j < KI; j++) {
      const target = (j / KI) * totalLen;
      while (k < LK && cumLen[k] < target) k++;
      sToTheta[j] = (k / LK) * Math.PI * 2;
    }
    const loopFrac = new Float32Array(N), loopOn = new Float32Array(N * 2), loopZ = new Float32Array(N);
    for (let i = 0; i < N; i++) { loopFrac[i] = i / N; loopOn[i * 2] = rnd(-0.26, 0.26); loopOn[i * 2 + 1] = rnd(-0.26, 0.26); loopZ[i] = rnd(-1.3, 1.3); }
    const loopAt = (i: number, tt: number): [number, number, number] => {
      let sf = loopFrac[i] + tt * LOOP_FLOW; sf -= Math.floor(sf);
      const th = sToTheta[(sf * KI) | 0];
      return [geroX(th) + loopOn[i * 2], geroY(th) + loopOn[i * 2 + 1], loopZ[i]];
    };
    function fLoop() {
      const a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { const q = loopAt(i, 0); a[i * 3] = q[0]; a[i * 3 + 1] = q[1]; a[i * 3 + 2] = q[2]; }
      return a;
    }

    // ARENA scene formation — an ascending staircase of bars (a leaderboard / skill climb).
    // Each particle's height fraction = index/N (→ aU gradient dark base → voltage-lime top);
    // it joins any bar tall enough to reach that height, so taller bars stack on the right.
    function fBars() {
      const a = new Float32Array(N * 3);
      const NB = 11, X0 = -22, X1 = 22, MAXH = 15, BASE = -9, BW = 1.45;
      const hts: number[] = [], xcs: number[] = [];
      for (let k = 0; k < NB; k++) { hts.push(2 + (k / (NB - 1)) * (MAXH - 2)); xcs.push(X0 + (k / (NB - 1)) * (X1 - X0)); }
      for (let i = 0; i < N; i++) {
        const y = (i / N) * MAXH;               // desired height (correlates with aU)
        let lo = 0; while (lo < NB && hts[lo] < y) lo++; // bars lo..NB-1 are tall enough
        const span = NB - lo;
        const k = span > 0 ? lo + Math.floor(rand() * span) : NB - 1;
        a[i * 3] = xcs[k] + (rand() * 2 - 1) * BW;
        a[i * 3 + 1] = BASE + y + (rand() * 2 - 1) * 0.14;
        a[i * 3 + 2] = rnd(-1.4, 1.4);
      }
      return a;
    }

    // SAGE scene formation — a breathing orbit with a bright nucleus (the ops "brain" + its satellites).
    function fOrbit() {
      const a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        if (rand() < 0.28) {             // nucleus
          const ang = rnd(0, 6.283), r = 3.0 * Math.sqrt(rand());
          a[i * 3] = Math.cos(ang) * r; a[i * 3 + 1] = Math.sin(ang) * r * 0.95; a[i * 3 + 2] = rnd(-1.6, 1.6);
        } else {                                 // orbit ring
          const ang = (i / N) * Math.PI * 2;
          const R = 12.4 + rnd(-0.5, 0.5) + Math.sin(ang * 3) * 0.4;
          a[i * 3] = Math.cos(ang) * R; a[i * 3 + 1] = Math.sin(ang) * R * 0.94; a[i * 3 + 2] = rnd(-1.6, 1.6);
        }
      }
      return a;
    }

    // STORIES scene — a lamp (diya) of dots: a shallow oil-bowl with a flame rising. (antyodaya = a lamp.)
    function fLamp() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      const BX = 7, BY = 3, BCY = -4.5;
      for (let s = 0; s < 640; s++) { const t = Math.PI + rand() * Math.PI; pts.push([BX * Math.cos(t), BCY + BY * Math.sin(t)]); } // bowl (lower half-ellipse)
      for (let s = 0; s < 240; s++) pts.push([(rand() * 2 - 1) * BX * 0.9, BCY - rand() * BY * 0.85]); // oil fill
      for (let s = 0; s < 220; s++) { const u = rand() * 2 - 1; pts.push([u * BX, BCY + 0.15 - Math.abs(u) * 0.55]); } // rim with a slight spout at the ends
      for (let s = 0; s < 120; s++) pts.push([(rand() * 2 - 1) * 3.2, -8.0 + rand() * 0.6]); // base
      for (let s = 0; s < 70; s++) pts.push([(rand() * 2 - 1) * 0.25, -4.3 + rand() * 2.1]); // wick
      for (let s = 0; s < 1400; s++) { // flame — teardrop rising to a tip
        const h = rand(), y = -2.2 + h * 9.4;
        const w = 2.5 * (h < 0.32 ? 0.15 + 0.85 * Math.sqrt(h / 0.32) : Math.pow((1 - h) / 0.68, 0.8));
        pts.push([(rand() * 2 - 1) * w, y]);
      }
      for (const p of pts) { p[0] = p[0] * 1.4 + 5; p[1] *= 1.4; } // scale the lamp up + set it right of the copy
      fillPts(a, pts, 0.14, 1.2);
      return a;
    }

    // KSHETRA scene — a conch (shankha), drawn like a line etching: the big body whorl, a stepped
    // spire of shrinking whorls rising to the apex up-right, and the flared aperture lip sweeping
    // down-left to the siphonal point. Growth ridges give it shell texture. (the call to the Gītā.)
    function fConch() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      // ---- the silhouette: a crisp closed contour, DARK inside (bloom turns fills into white mush;
      //      negative space is what makes the shape read — same trick as the doors) ----
      const SC = 1.95;
      const V: Array<[number, number]> = [
        [7.5, 5.0], [5.8, 6.2], [3.6, 6.8], [1.2, 6.6], [-1.0, 5.7],   // spire top → crown
        [-3.2, 4.4], [-4.8, 2.6], [-5.6, 0.2], [-5.4, -2.4],           // flared outer lip
        [-4.4, -4.9], [-3.0, -6.3],                                     // siphonal point
        [-0.9, -5.9], [1.8, -4.8], [3.9, -3.2],                         // underside
        [5.3, -1.2], [6.3, 1.0], [7.0, 3.1],                            // back edge rising to the apex
      ].map(p => [p[0] * SC + 4.0, p[1] * SC] as [number, number]);
      for (let i = 0; i < V.length; i++) { const p = V[i], q = V[(i + 1) % V.length]; seg(pts, p[0], p[1], q[0], q[1], 58); }
      // ---- growth ridges sweeping down the body ----
      qcurve(pts, [3.4 * SC + 4.0, 5.6 * SC], [0.6 * SC + 4.0, 2.2 * SC], [0.2 * SC + 4.0, -4.4 * SC], 100, 0.07);
      qcurve(pts, [5.0 * SC + 4.0, 4.0 * SC], [2.6 * SC + 4.0, 0.6 * SC], [2.4 * SC + 4.0, -3.4 * SC], 84, 0.07);
      // ---- the aperture: one long bright inner lip, parallel to the flare ----
      qcurve(pts, [-1.6 * SC + 4.0, 4.5 * SC], [-3.5 * SC + 4.0, 0.6 * SC], [-2.4 * SC + 4.0, -4.8 * SC], 170, 0.1);
      fillPts(a, pts, 0.1, 1.2);
      return a;
    }

    // SAMHITA scene — a git-style branch graph, drawn wide: prose forks off the main line,
    // gathers commits, and merges back. One branch has landed (ringed merge node); a second
    // is still in review, flying with an arrowhead. Prose-as-code, literally.
    function fMerge() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      const dot = (cx: number, cy: number, r: number, n: number) => { for (let s = 0; s < n; s++) { const ang = rand() * 6.283, rr = Math.sqrt(rand()); pts.push([cx + Math.cos(ang) * rr * r, cy + Math.sin(ang) * rr * r]); } };
      bar(pts, -17, 0, 17, 0, 0.09, 300);                                   // the main line
      qcurve(pts, [-9, 0], [-8.4, 4.4], [-5.5, 4.4], 105, 0.08);            // branch out…
      bar(pts, -5.5, 4.4, 3.5, 4.4, 0.08, 130);                             // …the branch lane…
      qcurve(pts, [3.5, 4.4], [6.4, 4.4], [7, 0], 105, 0.08);               // …merge back in
      qcurve(pts, [-2, 0], [-1.2, -4.4], [1.5, -4.4], 88, 0.08);            // a second branch, still open
      bar(pts, 1.5, -4.4, 9.2, -4.4, 0.08, 110);
      seg(pts, 9.2, -4.4, 8.1, -3.7, 20); seg(pts, 9.2, -4.4, 8.1, -5.1, 20); // in-flight arrowhead
      for (const cx of [-15, -12, -4, 0, 4, 11, 15]) dot(cx, 0, 0.5, 26);   // commits on main
      for (const cx of [-5.5, -1, 3.5]) dot(cx, 4.4, 0.5, 26);              // commits on the branch
      for (const cx of [1.5, 5.2]) dot(cx, -4.4, 0.5, 26);
      dot(-9, 0, 0.6, 32); arc(pts, -9, 0, 1.05, 1.05, 0, Math.PI * 2, 42, 0.05); // the fork node, ringed
      dot(7, 0, 0.6, 32); arc(pts, 7, 0, 1.05, 1.05, 0, Math.PI * 2, 42, 0.05);   // the merge node, ringed
      fillPts(a, pts, 0.1, 1.3);
      return a;
    }

    // STUDIO scene — a wireframe browser window (we build creators their own interactive site).
    function fBlueprint() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      const L = -16, R = 16, TP = 10, BT = -10;
      rectPts(pts, L, BT, R, TP, 120);            // window frame
      seg(pts, L, TP - 2.4, R, TP - 2.4, 70);     // title-bar divider
      for (let d = 0; d < 3; d++) for (let s = 0; s < 22; s++) { const ang = rand() * 6.283, r = 0.35 * Math.sqrt(rand()); pts.push([L + 1.4 + d * 1.3 + Math.cos(ang) * r, TP - 1.2 + Math.sin(ang) * r]); } // window dots
      rectPts(pts, L + 2, 1.5, R - 2, TP - 4, 55); // hero block
      rectPts(pts, L + 2, BT + 2, -1, -0.5, 48);   // left column
      rectPts(pts, 1, BT + 2, R - 2, -0.5, 48);    // right column
      fillPts(a, pts, 0.12, 1.1);
      return a;
    }

    // ARCADE scene — a wave of small arcade minions (ghosts · Pac-Men · invaders) tiled in a
    // row/column grid across the whole width, bright and playful. The toys.
    function fInvader() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      // polished glyphs: solid silhouettes with PUNCHED-DARK eyes (holes read; bright-on-bright doesn't)
      const ghost = (gx: number, gy: number, R: number) => {
        const BH = R * 1.25, er = 0.27 * R;
        const eyes: Array<[number, number]> = [[gx - 0.42 * R, gy + 0.2 * R], [gx + 0.42 * R, gy + 0.2 * R]];
        for (let s = 0; s < Math.round(R * R * 46); s++) {
          const u = rand() * 2 - 1, x = gx + u * R;
          const yTop = gy + Math.sqrt(Math.max(0.02, 1 - u * u)) * R;                 // the dome
          const yBot = gy - BH + 0.3 * R * Math.abs(Math.sin(u * 3 * Math.PI));      // the scalloped skirt
          const y = yBot + rand() * Math.max(0.05, yTop - yBot);
          if ((x - eyes[0][0]) ** 2 + (y - eyes[0][1]) ** 2 < er * er) continue;
          if ((x - eyes[1][0]) ** 2 + (y - eyes[1][1]) ** 2 < er * er) continue;
          pts.push([x, y]);
        }
      };
      const pac = (px: number, py: number, R: number, face: number) => {
        const m = 0.55, ea = face + (Math.cos(face) >= 0 ? 1.15 : -1.15);            // the eye sits above the mouth
        const ex = px + Math.cos(ea) * 0.48 * R, ey = py + Math.sin(ea) * 0.48 * R, er = 0.21 * R;
        for (let s = 0; s < Math.round(R * R * 50); s++) {
          const ang = face + m + rand() * (Math.PI * 2 - 2 * m), rr = R * Math.sqrt(rand());
          const x = px + Math.cos(ang) * rr, y = py + Math.sin(ang) * rr;
          if ((x - ex) ** 2 + (y - ey) ** 2 < er * er) continue;
          pts.push([x, y]);
        }
      };
      const invader = (ix: number, iy: number, R: number) => {
        const g = R * 0.5;
        const cells: Array<[number, number]> = [[-1, 1], [1, 1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-2, -1], [-1, -1], [1, -1], [2, -1], [-1, -2], [1, -2]];
        for (const cl of cells) for (let s = 0; s < 9; s++) pts.push([ix + cl[0] * g + (rand() * 2 - 1) * g * 0.36, iy + cl[1] * g + (rand() * 2 - 1) * g * 0.36]);
        seg(pts, ix - 1.7 * g, iy + 2.5 * g, ix - g, iy + 1.3 * g, 8); seg(pts, ix + 1.7 * g, iy + 2.5 * g, ix + g, iy + 1.3 * g, 8); // antennae
      };
      // the chase, centre stage: a big Pac gobbling a pellet trail toward a fleeing ghost pack
      pac(-16.5, 0, 2.8, 0);
      for (const px of [-11.6, -9.2, -6.8, -4.4, -2.0]) for (let s = 0; s < 26; s++) { const ang = rand() * 6.283, rr = 0.4 * Math.sqrt(rand()); pts.push([px + Math.cos(ang) * rr, Math.sin(ang) * rr]); }
      ghost(3.8, 0.3, 2.4); ghost(9.4, -0.4, 2.2); ghost(14.6, 0.5, 2.05);
      // smaller creatures scattered across the whole width — loose, playful, not a grid
      invader(-20.0, 7.6, 1.7); invader(-7.0, 8.4, 1.5); invader(6.8, 7.8, 1.65); invader(18.5, 8.2, 1.55);
      invader(-12.5, -7.8, 1.55); invader(0.5, -8.4, 1.65); invader(12.0, -7.4, 1.5);
      pac(20.5, 3.8, 1.5, Math.PI); pac(-2.8, -5.2, 1.35, 0);
      ghost(-21.0, -3.8, 1.5); ghost(17.5, -4.6, 1.4); ghost(-14.0, 4.0, 1.35);
      for (let s = 0; s < 80; s++) pts.push([rnd(-23.5, 23.5), rnd(-10, 10)]); // stray pellets
      fillPts(a, pts, 0.1, 1.3);
      return a;
    }

    // SYSTEMS scene — three interlocking rings (FORGE · TEMPER · COMPASS — the body/mind/living OS).
    // Centres sit one R apart (equilateral) so the rings genuinely overlap into a triquetra; thin, crisp bands.
    function fRings() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      const R = 7.4;
      const centers: Array<[number, number]> = [[0, 4.3], [-3.7, -2.15], [3.7, -2.15]];
      for (const ct of centers) for (let s = 0; s < 1600; s++) { const ang = rand() * 6.283, rr = R + (rand() * 2 - 1) * 0.18; pts.push([ct[0] + Math.cos(ang) * rr, ct[1] + Math.sin(ang) * rr]); }
      fillPts(a, pts, 0.1, 1.4);
      return a;
    }

    // LIBRARY scene — the three axes: crisp book spines (read), headphones (listen, top-left), a TV (watch, top-right).
    function fBooks() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      // ---- the shelf ----
      const shelfY = -9.5;
      seg(pts, -15, shelfY, 15, shelfY, 240);
      // ---- spines as crisp OUTLINES with real gaps between them (fills bloom into mush) ----
      const books: Array<[number, number]> = [[3.0, 7.5], [2.6, 6.2], [3.4, 8.8], [2.8, 5.8], [3.1, 7.0]]; // [width, height]
      let x = -13.6;
      for (let b = 0; b < books.length; b++) {
        const w = books[b][0], h = books[b][1], x0 = x, x1 = x + w, y1 = shelfY + h;
        seg(pts, x0, shelfY, x0, y1, 90); seg(pts, x1, shelfY, x1, y1, 90); seg(pts, x0, y1, x1, y1, 44);
        bar(pts, x0 + 0.5, shelfY + h * 0.74, x1 - 0.5, shelfY + h * 0.74, 0.14, 26); // title band
        x = x1 + 1.5;
        if (b === 3) { // one book leaning against its neighbour
          const lw = 2.4, lx = x - 0.3, tilt = 2.1, lh = 6.6;
          seg(pts, lx, shelfY, lx + tilt, shelfY + lh, 84); seg(pts, lx + lw, shelfY, lx + lw + tilt, shelfY + lh, 84);
          seg(pts, lx + tilt, shelfY + lh, lx + lw + tilt, shelfY + lh, 34);
          x = lx + lw + tilt + 1.4;
        }
      }
      // ---- headphones (top-left): a padded double band, angled yokes, teardrop cups, a curling cable ----
      const hx = -16.5, hy = 6.8;
      arc(pts, hx, hy, 4.1, 4.1, Math.PI * 0.05, Math.PI * 0.95, 210, 0.018);  // band
      arc(pts, hx, hy, 3.45, 3.45, Math.PI * 0.32, Math.PI * 0.68, 56, 0.02);  // pad, top only
      for (const side of [-1, 1]) {
        seg(pts, hx + side * 4.05, hy + 0.3, hx + side * 4.2, hy - 1.1, 24);    // yoke
        arc(pts, hx + side * 4.05, hy - 2.5, 1.05, 1.4, 0, Math.PI * 2, 92, 0.035); // cup shell
        for (let s = 0; s < 62; s++) { const ang = rand() * 6.283, rr = Math.sqrt(rand()); pts.push([hx + side * 4.05 + Math.cos(ang) * rr * 0.55, hy - 2.5 + Math.sin(ang) * rr * 0.85]); } // pad
      }
      // ---- TV (top-right): a retro set — rounded shell, screen with an outlined ▶, knobs, speaker, V antennae ----
      const tx = 16, ty = 6.6, TW = 4.6, TH = 3.2, cr = 0.9;
      seg(pts, tx - TW + cr, ty + TH, tx + TW - cr, ty + TH, 58); seg(pts, tx - TW + cr, ty - TH, tx + TW - cr, ty - TH, 58);
      seg(pts, tx - TW, ty - TH + cr, tx - TW, ty + TH - cr, 42); seg(pts, tx + TW, ty - TH + cr, tx + TW, ty + TH - cr, 42);
      arc(pts, tx - TW + cr, ty + TH - cr, cr, cr, Math.PI / 2, Math.PI, 13, 0.05); arc(pts, tx + TW - cr, ty + TH - cr, cr, cr, 0, Math.PI / 2, 13, 0.05);
      arc(pts, tx - TW + cr, ty - TH + cr, cr, cr, Math.PI, Math.PI * 1.5, 13, 0.05); arc(pts, tx + TW - cr, ty - TH + cr, cr, cr, Math.PI * 1.5, Math.PI * 2, 13, 0.05);
      rectPts(pts, tx - 3.7, ty - 2.3, tx + 1.7, ty + 2.3, 64);               // the screen
      seg(pts, tx - 1.6, ty + 1.05, tx - 1.6, ty - 1.05, 26); seg(pts, tx - 1.6, ty + 1.05, tx + 0.4, ty, 28); seg(pts, tx - 1.6, ty - 1.05, tx + 0.4, ty, 28); // ▶
      arc(pts, tx + 2.95, ty + 1.3, 0.42, 0.42, 0, Math.PI * 2, 22, 0.08); arc(pts, tx + 2.95, ty + 0.1, 0.42, 0.42, 0, Math.PI * 2, 22, 0.08); // knobs
      for (let k = 0; k < 3; k++) seg(pts, tx + 2.45, ty - 1.3 - k * 0.5, tx + 3.45, ty - 1.3 - k * 0.5, 9); // speaker slits
      seg(pts, tx - 1.2, ty + TH, tx - 3.1, ty + TH + 2.7, 28); seg(pts, tx + 0.6, ty + TH, tx + 2.5, ty + TH + 2.7, 28); // V antennae
      arc(pts, tx - 3.1, ty + TH + 2.7, 0.24, 0.24, 0, Math.PI * 2, 11, 0.3); arc(pts, tx + 2.5, ty + TH + 2.7, 0.24, 0.24, 0, Math.PI * 2, 11, 0.3); // tip balls
      seg(pts, tx - 2.5, ty - TH, tx - 3.0, ty - TH - 1.2, 18); seg(pts, tx + 2.5, ty - TH, tx + 3.0, ty - TH - 1.2, 18); // feet
      fillPts(a, pts, 0.09, 1.2);
      return a;
    }

    void fFunnel; void fFlame; void fRing; void fWind; void fWave; // superseded by the scene formations below
    // T[0] and T[13] are the bookends: buildBookends fills them (fBreath, fTie) against the page's own text.
    const T = [
      new Float32Array(N * 3), fDoors(), fLoop(), fLattice(), fBars(), fOrbit(),
      fLamp(), fConch(), fMerge(), fBlueprint(), fInvader(), fRings(), fBooks(), new Float32Array(N * 3),
    ];
    // aForm: the bookend drawings' own ink — x = hero, y = maker, z = maker kind (0 thread/parked,
    // 1-3 the Day 1/3/10 knots, 4 the lamp). The other scenes ignore it. fBreath writes x, fTie writes y and z.
    const formAttr = new Float32Array(N * 3);
    const GRADE = grades;

    /* ---------- geometry: two formation slots, morphed on the GPU ---------- */
    // `position` holds the formation we're leaving and `aTo` the one we're heading to. The CPU
    // only swaps those two buffers when the scroll crosses into a new pair of scenes; every
    // per-frame motion (the morph, each scene's living motion, the light) runs in the shader.
    // (v3 moved all 9000 points in JS every frame and lerped them in straight lines.)
    const geo = new THREE.BufferGeometry();
    const fromAttr = new THREE.BufferAttribute(new Float32Array(T[0]), 3).setUsage(THREE.DynamicDrawUsage);
    const toAttr = new THREE.BufferAttribute(new Float32Array(T[1]), 3).setUsage(THREE.DynamicDrawUsage);
    const aRand = new Float32Array(N);
    const aU = new Float32Array(N);
    const aLoop = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      aRand[i] = rand();
      aU[i] = i / N; // doubles as the particle's place on the ∞ loop (loopFrac)
      aLoop[i * 3] = loopOn[i * 2];
      aLoop[i * 3 + 1] = loopOn[i * 2 + 1];
      aLoop[i * 3 + 2] = loopZ[i];
    }
    geo.setAttribute("position", fromAttr);
    geo.setAttribute("aTo", toAttr);
    geo.setAttribute("aRand", new THREE.BufferAttribute(aRand, 1));
    geo.setAttribute("aU", new THREE.BufferAttribute(aU, 1));
    geo.setAttribute("aLoop", new THREE.BufferAttribute(aLoop, 3));
    const formBuf = new THREE.BufferAttribute(formAttr, 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("aForm", formBuf);

    // the ∞ loop's arc-length → θ table, so the shader streams particles at an even pace
    const loopLUT = new THREE.DataTexture(sToTheta, KI, 1, THREE.RedFormat, THREE.FloatType);
    loopLUT.minFilter = loopLUT.magFilter = THREE.NearestFilter;
    loopLUT.needsUpdate = true;

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      // premultiplied additive: the fragment already carries its own alpha, and the HDR target
      // + hue-preserving tonemap downstream is what keeps dense overlaps from blowing out white
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      uniforms: {
        uTime: { value: 0 },
        uMix: { value: 0 },
        uFrom: { value: 0 },
        uTo: { value: 1 },
        uSize: { value: 1 },
        uAlpha: { value: 0.9 },
        uRM: { value: RM ? 1 : 0 },
        uGrad: { value: 0 },
        uColA: { value: new THREE.Color(1, 1, 1) },
        uColB: { value: new THREE.Color(1, 1, 1) },
        uPtr: { value: new THREE.Vector2(0, 0) },
        uPtrOn: { value: 0 },
        uAspect: { value: 1 },
        uSweep: { value: -1 },
        uLoopLUT: { value: loopLUT },
        uLoopWH: { value: new THREE.Vector2(LOOP_W, LOOP_H) },
        uLoopFlow: { value: LOOP_FLOW },
        uIntro: { value: 1.06 }, // hero draw-on: how far along the line (aU) has been drawn; 1.06 = all of it
        uBreath: { value: -1 }, // hero breath clock in seconds; negative = no light
        uArrive: { value: -1 }, // maker arrival clock in seconds; -1 = not yet, 99 = already lit
        uLift13: { value: 0 }, // fu the page has carried scene 13 past (or short of) its rest scroll
        uCta: { value: 0 }, // the page's "Request a pilot" echoing into the lamp, 0-1
        uOrdered: { value: 0 }, // 0 = departures on each particle's own beat, 0.7 = in line order (bookend pairs)
        uWinFrom: { value: new THREE.Vector2(0, 0) }, // per-scene colour window over aU; (0,0) = off
        uWinTo: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aTo; attribute float aRand; attribute float aU; attribute vec3 aLoop; attribute vec3 aForm;
        uniform float uTime, uMix, uFrom, uTo, uSize, uRM, uAspect, uSweep, uPtrOn, uLoopFlow, uIntro, uBreath, uArrive, uCta, uOrdered, uLift13;
        uniform vec2 uPtr, uLoopWH, uWinFrom, uWinTo;
        uniform sampler2D uLoopLUT;
        varying float vMix, vSeed, vLight, vSweep, vDof, vArc, vInk, vGlow, vQuiet;
        varying vec2 vLdir;
        const float PI = 3.14159265;

        // each scene's living motion — the same choreography v3 ran per particle on the CPU
        vec3 live(vec3 p, float s, float t) {
          if (s < 0.5 || s > 12.5) return p;                // 00 ONE BREATH, 13 TIED OFF: the drawing never moves — only light travels along it
          if (abs(s - 2.0) < 0.5) {                        // 02 METHOD: stream round the ∞
            float sf = fract(aU + t * uLoopFlow);
            float th = texture2D(uLoopLUT, vec2(sf, 0.5)).r;
            p = vec3(uLoopWH.x * cos(th) + aLoop.x, uLoopWH.y * sin(2.0 * th) + aLoop.y, aLoop.z);
          } else if (abs(s - 3.0) < 0.5) {                 // 03 AUDITS: the lattice turns
            float c = cos(t * 0.1), n = sin(t * 0.1);
            p = vec3(p.x * c - p.z * n, p.y, p.x * n + p.z * c);
          } else if (abs(s - 4.0) < 0.5) {                 // 04 ARENA: bars tick like live values
            p.y += sin(t * 1.5 + floor(p.x * 0.4 + 0.5) * 1.3 + aRand * 0.4) * 0.38;
          } else if (abs(s - 5.0) < 0.5) {                 // 05 SAGE: the orbit breathes
            p.xy *= 1.0 + sin(t * 0.9) * 0.05;
          } else if (abs(s - 6.0) < 0.5 && p.y > -3.0) {   // 06 STORIES: the lamp's flame dances
            p.x += sin(t * 2.6 + aRand * 7.0) * 0.3;
            p.y += 0.12 + 0.32 * abs(sin(t * 3.1 + aRand * 9.0));
          }
          return p;
        }

        // a per-scene colour window over aU, so a scene's gradient can sit on just part of its line
        float win(float x, vec2 w) { return w.y > w.x ? smoothstep(w.x, w.y, x) : x; }

        void main() {
          float t = uTime;
          vSeed = aRand;
          vec3 A = live(position, uFrom, t);
          vec3 B = live(aTo, uTo, t);
          // 13 is drawn against the maker's text at one scroll; the page carries it from there like the text
          // itself, so the lamp stays beside "Request a pilot" and leaves with it instead of hanging over the footer
          if (uFrom > 12.5) A.y += uLift13;
          if (uTo > 12.5) B.y += uLift13;

          // staggered departure: each particle leaves on its own beat, so a scene change reads
          // as a murmuration rather than every point sliding in lockstep
          // (the bookend pairs depart in line order instead, so a stroke is laid down or lifted like one)
          float lag = mix(aRand, aU, uOrdered) * 0.45 * (1.0 - uRM);
          float m = clamp((uMix - lag) / (1.0 - 0.45 * (1.0 - uRM)), 0.0, 1.0);
          m = m * m * (3.0 - 2.0 * m);
          vec3 p = mix(A, B, m);

          // mid-flight the particles ride a smooth rotational flow and lift out of the plane —
          // the arc is 0 at both ends, so every formation still lands exactly on its drawing
          float arc = sin(PI * m) * (1.0 - uRM);
          vec3 q = p * 0.11 + vec3(0.0, 0.0, t * 0.15);
          vec3 flow = vec3(sin(q.y * 2.1 + cos(q.z * 1.7)), sin(q.z * 1.9 + cos(q.x * 2.3)), sin(q.x * 1.7 + cos(q.y * 2.0)));
          p += flow * arc * 4.2;
          p.z += arc * (aRand - 0.5) * 9.0;
          vArc = arc;

          // this particle's weight in each bookend scene (its own staggered blend, not the scroll's)
          float w0 = (uFrom < 0.5 ? 1.0 - m : 0.0) + (uTo < 0.5 ? m : 0.0);
          float w13 = (uFrom > 12.5 ? 1.0 - m : 0.0) + (uTo > 12.5 ? m : 0.0);
          vQuiet = clamp(w0 + w13, 0.0, 1.0);

          // ink = the drawing's own weight at rest, 1.0 in flight (parked particles fade in as they leave)
          float ink0 = aForm.x * (1.0 - smoothstep(uIntro - 0.06, uIntro, aU)); // hero draw-on along the line, once per load
          float k = aForm.z;
          float P = clamp(uArrive / 3.2, 0.0, 1.0);                            // arrival light along the thread, linear in days
          float on = uArrive < 0.0 ? 0.45 : mix(0.45, 1.0, smoothstep(0.0, 0.04, P - aU)); // knots + lamp latch on as it passes
          float swell = (k > 3.5 && uArrive >= 0.0) ? 0.45 * exp(-pow((uArrive - 3.35) / 0.3, 2.0)) : 0.0;
          float m13 = k < 0.5 ? 1.0 : on * (1.0 + (k > 3.5 ? 0.3 * uCta : 0.0)) + swell;

          // light that travels along a still drawing
          float g0 = 0.0;
          if (uBreath >= 0.0 && uRM < 0.5) {                    // the breath: every 10 s, 6.2 s of light, leaves by the loose end
            float ph = fract(uBreath / 10.0);
            float h = smoothstep(0.0, 0.62, ph) * 1.04;
            float dh = h - aU;
            g0 = (dh >= 0.0 ? exp(-dh / 0.09) : exp(dh / 0.012)) * (1.0 - smoothstep(0.58, 0.66, ph)) * 0.6;
          }
          float g13 = (uArrive >= 0.0 && uArrive < 3.6 && k < 0.5) ? 0.9 * exp(-pow((aU - P) / 0.025, 2.0)) : 0.0;
          vGlow = g0 * w0 + g13 * w13;
          // the thread is faint, so the passing light brings ink of its own (the parked particles on the line join in)
          vInk = mix(1.0, ink0, w0) * mix(1.0, aForm.y * m13 + g13 * 0.022, w13);

          vMix = mix(win(aU, uWinFrom), win(aU, uWinTo), m); // gradient position along the drawing (uGrad picks ordered vs speckled)
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vec4 clip = projectionMatrix * mv;
          vec2 ndc = clip.xy / clip.w;

          // the pointer is a lantern: it lights what it nears and gently parts the field
          vec2 d = (ndc - uPtr) * vec2(uAspect, 1.0);
          float d2 = dot(d, d);
          vLight = exp(-d2 / 0.07) * uPtrOn * (1.0 - 0.5 * vQuiet);
          vLdir = uPtrOn > 0.01 ? normalize(-d + vec2(0.0001)) : vec2(-0.55, 0.8);
          ndc += normalize(d + vec2(0.0001)) * vec2(1.0 / uAspect, 1.0) * exp(-d2 / 0.02) * 0.035 * uPtrOn * (1.0 - uRM) * (1.0 - vQuiet);
          clip.xy = ndc * clip.w;

          // a light sweep crosses each formation once as it settles
          float s = dot(ndc, normalize(vec2(1.0, 0.55)));
          vSweep = uSweep >= 0.0 ? exp(-pow((s - mix(-1.7, 1.7, uSweep)) * 3.0, 2.0)) : 0.0;

          // focus plane at the formation: points off it grow soft and dim (a little depth of field)
          vDof = clamp(abs(mv.z + 34.0) / 11.0, 0.0, 1.0);
          gl_PointSize = uSize * (0.42 + aRand * 0.8) * (300.0 / -mv.z) * (1.0 + vDof * 1.3) * (1.0 + arc * 0.25) * (1.0 + vGlow * 0.1);
          gl_Position = clip;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform vec3 uColA, uColB;
        uniform float uTime, uAlpha, uGrad;
        varying float vMix, vSeed, vLight, vSweep, vDof, vArc, vInk, vGlow, vQuiet;
        varying vec2 vLdir;
        void main() {
          vec2 c = gl_PointCoord * 2.0 - 1.0;
          float r2 = dot(c, c);
          if (r2 > 1.0) discard;
          // a lit bead, not a bokeh blob: tight core, small halo, shaded like a tiny sphere
          float core = exp(-r2 * mix(10.0, 4.0, vDof));
          float halo = exp(-r2 * 3.2) * 0.16;
          vec3 n = vec3(c.x, -c.y, sqrt(max(0.0, 1.0 - r2)));
          vec3 L = normalize(vec3(vLdir, 0.85));
          float diff = 0.5 + 0.5 * max(dot(n, L), 0.0);
          float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 16.0);
          vec3 base = mix(uColA, uColB, clamp(mix(vSeed, vMix, uGrad), 0.0, 1.0));
          float tw = mix(0.84 + 0.16 * sin(uTime * 2.2 + vSeed * 43.7), 1.0, vQuiet); // everything breathes gently — except the bookends, which never twinkle
          float lift = (1.0 + vLight * 2.6 + vSweep * 0.75) * (1.0 + vGlow);
          vec3 col = base * diff * lift + spec * (0.18 + vLight * 0.9 + vSweep * 0.3) + vSweep * vec3(0.06, 0.05, 0.04);
          float a = (core + halo) * tw * uAlpha * (1.0 - vDof * 0.5) * (1.0 - vArc * 0.18) * vInk;
          gl_FragColor = vec4(col * a, a);
        }
      `,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false; // positions are computed in the shader
    scene3d.add(points);

    /* ---------- the light pipeline: HDR → bloom (desktop) → hue-preserving tonemap ---------- */
    // Additive points into a half-float target can sum past 1 without clipping; the final pass
    // compresses luminance but keeps hue, so where formations crowd they glow in their own
    // colour instead of burning to white. The page background is composited in that same pass.
    const MOBILE = window.innerWidth < 900;
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene3d, camera));
    const bloom = MOBILE ? null : new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.2, 0.3, 0.72);
    if (bloom) composer.addPass(bloom);
    const bgColor = new THREE.Color(getComputedStyle(document.body).backgroundColor || "#0d0b09");
    const finalPass = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uBg: { value: bgColor } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; uniform vec3 uBg; varying vec2 vUv;
        vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        void main() {
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          float L = dot(c, vec3(0.2126, 0.7152, 0.0722));
          float Lt = 1.0 - exp(-L * 1.2);
          vec3 tm = c * (Lt / max(L, 1e-4));
          tm = mix(tm, vec3(Lt), smoothstep(1.4, 6.0, L) * 0.3); // only the hottest cores whiten, a touch
          gl_FragColor = vec4(toSRGB(clamp(uBg + tm, 0.0, 1.0)), 1.0);
        }
      `,
    });
    composer.addPass(finalPass);

    /* ---------- scroll score ---------- */
    const sceneEls = Array.prototype.slice.call(document.querySelectorAll(".scene")) as HTMLElement[];
    let keys: number[] = [];
    let rest13 = 0; // the scroll at which scene 13 rests (its centre-on-screen key): where the maker's anchors are measured
    function computeKeys() {
      // A door-gated (display:none) scene has offsetParent===null; reuse the previous key so the
      // formation index → scene mapping doesn't jump when some scenes are hidden.
      let last = 0;
      keys = sceneEls.map((el) => {
        if (el.offsetParent === null && el.offsetHeight === 0) return last;
        last = Math.max(0, el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2);
        return last;
      });
      if (keys.length > 1) keys[0] = Math.min(keys[0], keys[1] * 0.6);
      // The section nav lands a scene 64px (its header clearance) above the scene's centred key. The maker's
      // lamp is the last thing to arrive, so landing there would leave it unformed and the arrival unplayed:
      // scene 13 counts as reached from the landing point, and its drawing is still anchored to the rest point.
      rest13 = keys[SCENES - 1];
      const op = sceneEls[SCENES - 1];
      if (op && op.offsetHeight > 0) keys[SCENES - 1] = Math.max(keys[SCENES - 2] + 1, rest13 - 64);
    }
    let fTarget = 0;
    let fSmooth = 0;
    function onScroll() {
      const y = window.scrollY || window.pageYOffset;
      let f = 0;
      if (y <= keys[0]) f = 0;
      else if (y >= keys[SCENES - 1]) f = SCENES - 1;
      else {
        for (let j = 0; j < SCENES - 1; j++) {
          if (y >= keys[j] && y < keys[j + 1]) {
            f = j + (y - keys[j]) / (keys[j + 1] - keys[j]);
            break;
          }
        }
      }
      fTarget = f;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    const onRegate = () => { computeKeys(); onScroll(); buildBookends(); };
    window.addEventListener("zc:regate", onRegate);

    // the hero's and the maker's text reflow when webfonts land: that moves every scene's scroll key, and
    // both bookend drawings are placed against that text, so they are rebuilt too (debounced — reflow arrives in bursts)
    let rebuildTimer = 0;
    const heroRO = new ResizeObserver(() => {
      computeKeys();
      onScroll();
      clearTimeout(rebuildTimer);
      rebuildTimer = window.setTimeout(buildBookends, 120);
    });
    document
      .querySelectorAll("#signal h1, #signal .lede, #signal .hero-cta, #signal .eyebrow, #signal .scrollcue, #operator .shead, #operator .op-grid, #operator .client-strip")
      .forEach((el) => heroRO.observe(el));
    // the page itself grows under the reader (the arcade scene is ~200px taller once revealed): every scene key
    // below it, and the maker's anchors, would otherwise go stale
    heroRO.observe(document.body);

    /* ---------- pointer: camera parallax + the lantern ---------- */
    let mx = 0.5,
      my = 0.5,
      cx = 0,
      cy = 0;
    const ptrTarget = new THREE.Vector2(0, 0);
    let ptrOnTarget = 0;
    let tapUntil = 0;
    const onPointer = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth;
      my = e.clientY / window.innerHeight;
      ptrTarget.set(mx * 2 - 1, -(my * 2 - 1));
      if (e.pointerType === "mouse" || e.pointerType === "pen") ptrOnTarget = 1;
    };
    // touch has no hover: a tap lights the spot for a moment instead
    const onTap = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      ptrTarget.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
      tapUntil = performance.now() + 700;
    };
    const onLeave = () => { ptrOnTarget = 0; };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onTap, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    /* ---------- resize ---------- */
    // The view, in the units the drawings are authored in: formation units (fu) × fit = world units.
    const view = { W: 1, H: 1, visW: 1, visH: 1, fit: 1 };
    function onResize() {
      if (!renderer) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      bloom?.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // Formations are drawn ~46 units wide. Fit them to the visible width (both axes, so
      // nothing squashes), and shrink the points with them so narrow screens don't turn the
      // shapes into thick ropes.
      const visW = 2 * Math.tan((camera.fov * Math.PI) / 360) * 34 * camera.aspect;
      const fit = Math.max(0.42, Math.min(1, visW / 44));
      points.scale.set(fit, fit, 1);
      const visH = 2 * Math.tan((camera.fov * Math.PI) / 360) * 34;
      view.W = w; view.H = h; view.visW = visW; view.visH = visH; view.fit = fit;
      mat.uniforms.uSize.value = (w < 700 ? 1.0 : 1.15) * Math.sqrt(fit) * DPR; // ×DPR: the same dot size on every screen
      mat.uniforms.uAlpha.value = w < 700 ? 0.62 : 0.9; // text sits over the field on phones
      mat.uniforms.uAspect.value = camera.aspect;
      computeKeys();
      onScroll();
      buildBookends(); // the bookends are anchored to the page's text, so they follow every resize / rotation
    }
    window.addEventListener("resize", onResize);

    /* ---------- frame loop: a handful of uniforms, nothing per particle ---------- */
    const U = mat.uniforms;
    const colA = U.uColA.value as THREE.Color;
    const colB = U.uColB.value as THREE.Color;
    let raf = 0;
    let pair = 0; // the scene index loaded into the `position` slot (-1 = reload)
    let swept = -1;
    let sweepStart = 0;
    // The Pause control (SectionNav, WCAG 2.2.2) and prefers-reduced-motion both land here: the field
    // treats a pause exactly like reduced motion — a finished still frame, morphs become cross-fades.
    let paused = false;
    try { paused = localStorage.getItem("zc-motion") === "paused"; } catch { /* storage blocked: default to motion on */ }
    paused = paused || document.documentElement.dataset.motion === "paused";
    const onMotion = (e: Event) => { paused = !!(e as CustomEvent<{ paused?: boolean }>).detail?.paused; };
    window.addEventListener("zc:motion", onMotion);
    const motionOff = () => RM || paused;
    // The field's clock runs only while motion is on, so a pause freezes it where it stands and
    // resuming carries on from there (nothing jumps either way).
    let tRun = 0;
    let tPrev = -1;
    let introDone = false;
    // the maker's arrival plays once per session: a light runs Day 1 to Day 14 and is caught in the lamp.
    let tieDone = false;
    try { tieDone = sessionStorage.getItem("zc-tie") === "1"; } catch { /* storage blocked: it just plays again */ }
    let arriveStart = -1;
    // the page's "Request a pilot" echoes into the lamp (hover, or keyboard focus)
    let ctaHot = 0;
    const ctaEl = document.querySelector<HTMLElement>("#operator .client-strip .btn.solid");
    const ctaOn = () => { ctaHot = 1; };
    const ctaOff = () => { ctaHot = 0; };
    const ctaFocus = () => { if (ctaEl?.matches(":focus-visible")) ctaHot = 1; };
    ctaEl?.addEventListener("pointerenter", ctaOn);
    ctaEl?.addEventListener("pointerleave", ctaOff);
    ctaEl?.addEventListener("focus", ctaFocus);
    ctaEl?.addEventListener("blur", ctaOff);
    // Per-scene rest values, indexed by scene. The bookends are calm: low bloom, a quarter of the pointer
    // drift (the thread at the end: none), and a colour window that parks each scene's gradient on its line.
    const BLOOM_REST = [0.2, ...Array<number>(12).fill(0.34), 0.18];
    const DRIFT = [0.35, ...Array<number>(12).fill(1), 0];
    const WIN: Array<[number, number]> = Array.from({ length: SCENES }, () => [0, 0] as [number, number]);
    WIN[0] = [0.58, 0.95];
    WIN[13] = [0.55, 1.0];
    // A long jump (the section nav, a deep link) would otherwise drag the field through every
    // formation in between in about a second. Instead it warps: straight from where it is to
    // where it's going, along the same flowing path a neighbouring transition takes.
    let warp: { from: number; to: number; start: number } | null = null;
    const WARP_MS = 1300;
    const load = (a: number, b: number) => {
      (fromAttr.array as Float32Array).set(T[a]);
      (toAttr.array as Float32Array).set(T[b]);
      fromAttr.needsUpdate = true;
      toAttr.needsUpdate = true;
    };
    // `route`: pass through bone. A straight RGB lerp from brass/ember to mint crosses olive and khaki.
    const BONE = [0.92, 0.9, 0.85];
    function gradeLerp(ga: Grade, gb: Grade, e: number, route = false): void {
      if (route) {
        const mid: Grade = [BONE, BONE, gb[2]];
        if (e < 0.5) gradeLerp(ga, mid, e * 2);
        else gradeLerp(mid, gb, e * 2 - 1);
        return;
      }
      colA.setRGB(ga[0][0] + (gb[0][0] - ga[0][0]) * e, ga[0][1] + (gb[0][1] - ga[0][1]) * e, ga[0][2] + (gb[0][2] - ga[0][2]) * e, THREE.SRGBColorSpace);
      colB.setRGB(ga[1][0] + (gb[1][0] - ga[1][0]) * e, ga[1][1] + (gb[1][1] - ga[1][1]) * e, ga[1][2] + (gb[1][2] - ga[1][2]) * e, THREE.SRGBColorSpace);
      U.uGrad.value = ga[2] + (gb[2] - ga[2]) * e;
    }

    /* ---------- the bookends: drawn against the page's own text ---------- */
    // Particle i is LIT iff i % VIS === 0. Every other particle is PARKED: on the same drawing at ink 0,
    // invisible at rest and ramping to full ink in flight, so every transition grows out of (or
    // collapses into) one line. The stride also caps density near 50 lit per fu: particle grain, not a rope.
    const VIS = N === 9000 ? 5 : 4;
    const fuX = (px: number) => ((px / view.W - 0.5) * view.visW) / view.fit;
    const fuY = (py: number) => ((0.5 - py / view.H) * view.visH) / view.fit;
    const pxX = (x: number) => ((x * view.fit) / view.visW + 0.5) * view.W;
    const pxY = (y: number) => (0.5 - (y * view.fit) / view.visH) * view.H;
    // an unrevealed `.rv` is parked 24px low until it fades in: measure where its text will rest
    const rvShift = (el: Element) => {
      const rv = el.closest(".rv");
      const m = rv ? getComputedStyle(rv).transform : "none";
      return m && m !== "none" ? new DOMMatrixReadOnly(m).m42 : 0;
    };
    // an element's rect in viewport px as it sits when the scroll rests on `key`
    const boxOf = (el: Element | null, key: number): Box | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return null;
      const y = window.scrollY - key - rvShift(el);
      return { l: r.left, r: r.right, t: r.top + y, b: r.bottom + y };
    };

    function measureHero(): HeroAnchors {
      const h1 = document.querySelector("#signal h1");
      let h1Right = 0;
      if (h1) {
        const rg = document.createRange();
        rg.selectNodeContents(h1);
        for (const r of Array.from(rg.getClientRects())) h1Right = Math.max(h1Right, r.right);
      }
      const box = (sel: string) => boxOf(document.querySelector(sel), 0);
      // the scroll cue's <p> is a full-width flex row: only its trace and text are in the way
      const cueEl = document.querySelector("#signal .scrollcue");
      const cueBox = ((): Box | null => {
        const whole = boxOf(cueEl, 0);
        if (!cueEl || !whole) return null;
        const rg = document.createRange();
        rg.selectNodeContents(cueEl);
        const right = Math.max(...Array.from(rg.getClientRects()).map((r) => r.right), whole.l);
        return { ...whole, r: Math.min(whole.r, right) };
      })();
      const cta = box("#signal .hero-cta"), cue = cueBox, solid = box("#signal .btn.solid");
      return {
        // fall back to the 1440x900 reference the stroke was authored against
        h1Right: h1Right || pxX(11.27),
        ctaY: cta ? (cta.t + cta.b) / 2 : pxY(-9.1),
        cueY: cue ? (cue.t + cue.b) / 2 : pxY(-11.6),
        cueBottom: cue ? cue.b : view.H * 0.85,
        bandTop: solid ? solid.t : view.H * 0.6,
        avoid: [box("#signal .lede"), box("#signal .btn.solid"), box("#signal .btn.ghost"), cueBox].filter((b): b is Box => !!b),
      };
    }

    // Landscape: the stroke keeps the right third and a >= 5 fu gap to the headline's longest line.
    // Portrait: it is its own composition in the first screen — beside the CTAs, then sweeping through the
    // free band under the scroll cue — nudged clear of every text block, and scaled in if that is not enough.
    function placeHero(src: Cubics, a: HeroAnchors, isPort: boolean): V2[][] {
      let segs: V2[][] = [src.lead, src.A, src.B];
      const move = (dx: number, dy: number) => { segs = segs.map((S) => S.map(([x, y]) => [x + dx, y + dy] as V2)); };
      const halfW = view.visW / view.fit / 2;
      if (!isPort) {
        move(
          clamp(Math.max(fuX(a.h1Right) + GAP_H1 - 16.31, 0.6 * (halfW - 24.2)), -4, halfW - 19.2),
          clamp((fuY(a.ctaY) + fuY(a.cueY)) / 2 + 10.33, -2, 2)
        );
        return segs;
      }
      const end = src.B[3];
      move(fuX(0.66 * view.W) - end[0], fuY(Math.min(a.cueBottom + 0.4 * (view.H - a.cueBottom), view.H - 40)) - end[1]);
      const scaleAboutEnd = (k: number) => {
        const e = segs[2][3];
        segs = segs.map((S) => S.map(([x, y]) => [e[0] + (x - e[0]) * k, e[1] + (y - e[1]) * k] as V2));
      };
      // The stroke is ground in the band under the CTAs. On a tall tablet the band is shorter than the stroke,
      // so draw it smaller (never under 0.35 — below that it would only be a curl in the corner).
      {
        const chain = cubicChain(segs, 256);
        let top = Infinity;
        for (let u = 0; u <= 0.97; u += 0.01) {
          const c = chain.at(u), px = pxX(c.x);
          if (px >= 0 && px <= view.W) top = Math.min(top, pxY(c.y)); // only what is on screen counts
        }
        const endPy = pxY(segs[2][3][1]), limit = a.bandTop + 10; // 10px for the brush's own width
        if (top < limit && endPy > top) scaleAboutEnd(clamp((endPy - limit) / (endPy - top), 0.35, 1));
      }
      // how far right (px) the stroke would have to move to clear every text block, 0 if it already does
      const overlap = () => {
        const chain = cubicChain(segs, 256);
        let need = 0;
        for (let u = 0; u <= 0.97; u += 0.01) {
          const c = chain.at(u), px = pxX(c.x), py = pxY(c.y);
          if (px < -20 || px > view.W + 20) continue; // off screen: nothing to collide with
          for (const r of a.avoid) if (px > r.l - 14 && px < r.r + 14 && py > r.t - 14 && py < r.b + 14) need = Math.max(need, r.r + 14 - px);
        }
        return need;
      };
      let moved = 0;
      for (let pass = 0; pass < 3; pass++) {
        const sh = Math.min(overlap(), 30 - moved);
        if (sh <= 0) break;
        moved += sh;
        move((sh * view.visW) / view.fit / view.W, 0);
      }
      for (let k = 0; k < 3 && overlap() > 0; k++) scaleAboutEnd(0.9);
      return segs;
    }

    // 00 ONE BREATH. Each bookend builder reseeds its own PRNG, so a rebuild (a resize, a webfont
    // landing) draws the identical stroke instead of a fresh scatter of grain.
    function fBreath(isPort: boolean, anc: HeroAnchors) {
      const rand = mulberry32(0x5eed14 ^ 0xb0);
      const gauss = gaussFrom(rand);
      const [lead, A, B] = placeHero(isPort ? BREATH_PORT : BREATH_LAND, anc, isPort);
      const path = cubicChain([lead, A, B]);
      const pos = new Float32Array(N * 3);
      const INK = (N === 9000 ? 0.34 : 0.42) * HERO_GAIN;
      for (let i = 0; i < N; i++) {
        const s = clamp((i + (rand() - 0.5) * 0.6) / N, 0, 1);
        const { x, y, tx, ty } = path.at(s);
        const p = press(s), sig = 0.025 + 0.24 * p * p; // sigma 0.03 at the hairline ... 0.265 at full press
        const halo = rand() < 0.1; // a 10% Gaussian haze: a brush's soft edge
        const lat = halo ? clamp(gauss(), -1.8, 1.8) * (0.08 + 0.9 * sig) : clamp(gauss(), -2.5, 2.5) * sig;
        pos[i * 3] = x - ty * lat;
        pos[i * 3 + 1] = y + tx * lat;
        pos[i * 3 + 2] = halo ? clamp(gauss(), -1.8, 1.8) * 0.2 : gauss() * 0.1; // near the focal plane: a deeper haze would slide off the line in perspective
        const taper = 1 - Math.pow(smoothstep(0.93, 1.0, s), 1.4); // the brush lifts: a loose end, never a head
        formAttr[i * 3] = i % VIS === 0 ? INK * (0.35 + 0.65 * p) * taper * (halo ? 0.3 : 1) : 0;
      }
      return pos;
    }

    // 13 TIED OFF — measured at the scroll where scene 13 rests. A fine thread hangs from a Day-1 knot on
    // the eyebrow row, bows out into the right gutter and ends in a lamp level with "Request a pilot".
    // Text-only (no thread at all): portrait, a gutter under 4.5 fu, a door-hidden scene, or a curve that
    // would crowd the timetable, the client strip or the header CTA.
    function measureMaker(): MakerAnchors | null {
      const op = document.getElementById("operator");
      if (!op || (op.offsetParent === null && op.offsetHeight === 0)) return null;
      const box = (sel: string) => boxOf(document.querySelector(sel), rest13);
      const tt = box("#operator .timetable"), strip = box("#operator .client-strip");
      const eyebrow = box("#operator .shead .eyebrow"), solid = box("#operator .client-strip .btn.solid");
      if (!tt || !strip || !eyebrow || !solid) return null;
      const hr = document.querySelector(".top-cta")?.getBoundingClientRect(); // fixed: already in viewport px
      const h2 = document.querySelector("#operator .shead h2");
      let h2Right = 0;
      if (h2) {
        const rg = document.createRange();
        rg.selectNodeContents(h2);
        for (const r of Array.from(rg.getClientRects())) h2Right = Math.max(h2Right, r.right);
      }
      return { tt, strip, eyebrow, solid, hdr: hr ? { l: hr.left, r: hr.right, t: hr.top, b: hr.bottom } : null, h2Right };
    }
    const tieCurve = (pin: V2, knot: V2, bulge: number): V2[] => {
      const H = pin[1] - knot[1];
      return [pin, [pin[0] + 0.98 * (bulge - pin[0]), pin[1] - 0.02 * H], [bulge + 0.3 * (bulge - knot[0]), knot[1] + 0.4 * H], knot];
    };
    function placeTie(a: MakerAnchors | null, isPort: boolean) {
      const ref = { ...TIE_REF, textOnly: true };
      if (!a || isPort) return ref;
      const halfW = view.visW / view.fit / 2, xLim = halfW - 1.0;
      const xR = fuX(Math.max(a.tt.r, a.strip.r));
      if (halfW - xR < 4.5) return ref;
      const ppf = (view.W * view.fit) / view.visW; // px per fu
      // Day 1 hangs from the eyebrow row — but never left of the headline's longest line (+3.4 fu: Day 1's knot spreads ~1 fu along the thread), and never
      // up inside the fixed header's CTA: on a short viewport the eyebrow row sits right under it.
      const pinY = a.hdr ? Math.min(fuY((a.eyebrow.t + a.eyebrow.b) / 2), fuY(a.hdr.b + 1.5 * ppf + 6)) : fuY((a.eyebrow.t + a.eyebrow.b) / 2);
      const pin: V2 = [Math.max(xR - 6.0, fuX(a.h2Right) + 3.4), pinY];
      const knot: V2 = [xR + Math.min(2.2, 0.35 * (xLim - xR)), fuY((a.solid.t + a.solid.b) / 2)];
      let bulge = Math.min(xLim - 0.6, xR + 5.0);
      const away = (r: Box, px: number, py: number) => Math.hypot(Math.max(r.l - px, 0, px - r.r), Math.max(r.t - py, 0, py - r.b));
      const clear = () => {
        const chain = cubicChain([tieCurve(pin, knot, bulge)], 256);
        for (let u = 0; u <= 1; u += 0.01) {
          const c = chain.at(u), px = pxX(c.x), py = pxY(c.y);
          if (away(a.tt, px, py) < 1.2 * ppf || away(a.strip, px, py) < 1.2 * ppf || (a.hdr && away(a.hdr, px, py) < 1.5 * ppf)) return false;
        }
        return true;
      };
      for (let tries = 0; tries <= 3; tries++, bulge += 0.3) if (clear()) return { pin, knot, bulge, textOnly: false };
      return ref;
    }
    // the n indices nearest `idx` that are parked (not lit by the stride): the particles a knot or the lamp gathers
    const parkedNearest = (idx: number, n: number) => {
      const out: number[] = [];
      for (let d = 0; out.length < n && d < N; d++) {
        for (const i of d ? [idx - d, idx + d] : [idx]) if (i >= 0 && i < N && i % VIS !== 0 && out.length < n) out.push(i);
      }
      return out;
    };
    function fTie(isPort: boolean, anc: MakerAnchors | null) {
      const rand = mulberry32(0x5eed14 ^ 0x13);
      const gauss = gaussFrom(rand);
      const b = placeTie(anc, isPort);
      const path = cubicChain([tieCurve(b.pin, b.knot, b.bulge)]);
      const G = b.textOnly ? 0 : TIE_GAIN; // text-only: every ink is 0, so the library flies to the gutter and fades as it lands
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { // 1) every particle on the thread
        const s = clamp((i + (rand() - 0.5) * 0.6) / N, 0, 1), { x, y, tx, ty } = path.at(s), lat = gauss() * 0.035;
        pos[i * 3] = x - ty * lat;
        pos[i * 3 + 1] = y + tx * lat;
        pos[i * 3 + 2] = gauss() * 0.04;
        formAttr[i * 3 + 1] = i % VIS === 0 ? TIE_INK.thread * G : 0;
        formAttr[i * 3 + 2] = 0;
      }
      const nK = Math.round((240 * N) / 9000), nL = Math.round((320 * N) / 9000);
      for (let k = 0; k < 3; k++) { // 2) the knots: the thread gathered, elongated along it, never a round star
        const c = path.at(SD[k]);
        for (const i of parkedNearest(Math.round(SD[k] * N), nK)) {
          const a = clamp(gauss(), -2.2, 2.2) * 0.5, q = clamp(gauss(), -2.2, 2.2) * 0.13; // a swelling ~3:1 along the thread
          pos[i * 3] = c.x + c.tx * a - c.ty * q;
          pos[i * 3 + 1] = c.y + c.ty * a + c.tx * q;
          pos[i * 3 + 2] = gauss() * 0.03;
          formAttr[i * 3 + 1] = TIE_INK.knots[k] * G;
          formAttr[i * 3 + 2] = k + 1;
        }
      }
      const c = path.at(1); // 3) the lamp, Day 14
      for (const i of parkedNearest(N - 1, nL)) {
        // the halo is kept near the core: out of the focal plane, perspective slides it off the lamp as stray dots,
        // and it must stay clear of the client strip's border (acceptance C1)
        const halo = rand() < 0.45, r = halo ? 0.18 + Math.min(Math.abs(gauss()), 2) * 0.3 : Math.min(Math.abs(gauss()), 2) * 0.2, th = rand() * 6.2831853;
        pos[i * 3] = c.x + r * Math.cos(th);
        pos[i * 3 + 1] = c.y + r * Math.sin(th);
        pos[i * 3 + 2] = gauss() * 0.03;
        formAttr[i * 3 + 1] = (halo ? TIE_INK.lampHalo : TIE_INK.lampCore) * G;
        formAttr[i * 3 + 2] = 4;
      }
      return pos;
    }

    let alive = true;
    function buildBookends() {
      if (!alive) return;
      const isPort = camera.aspect <= 1;
      T[0] = fBreath(isPort, measureHero());
      T[13] = fTie(isPort, measureMaker());
      formBuf.needsUpdate = true;
      // force the GPU buffers to reload if a bookend is on show
      if (pair === 0 || pair === 12) pair = -1;
      if (warp && (warp.from === 0 || warp.to === 0 || warp.from === 13 || warp.to === 13)) {
        (fromAttr.array as Float32Array).set(T[warp.from]);
        (toAttr.array as Float32Array).set(T[warp.to]);
        fromAttr.needsUpdate = true;
        toAttr.needsUpdate = true;
      }
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (document.hidden || !renderer) { tPrev = -1; return; }
      const off = motionOff();
      if (tPrev >= 0 && !off) tRun += Math.min(0.25, (now - tPrev) / 1000);
      tPrev = now;
      U.uTime.value = tRun; // 0 for the whole of a reduced-motion session; frozen while paused
      U.uRM.value = off ? 1 : 0;

      if (!off && !warp && Math.abs(fTarget - fSmooth) > 1.5) {
        const from = Math.round(fSmooth),
          to = Math.round(fTarget);
        if (from !== to) {
          warp = { from, to, start: now };
          load(from, to);
          pair = -1;
        }
      }

      // the pair of scenes on show (a, b), how far through (te), and the eased blend (e)
      let a: number, b: number, e: number, te: number;
      if (warp) {
        let k = Math.min(1, (now - warp.start) / WARP_MS);
        // a nav click smooth-scrolls, so the destination keeps moving for a moment: while still
        // mostly in flight, re-aim at it rather than landing short and warping a second time
        const aim = Math.round(fTarget);
        if (aim !== warp.to && k < 0.6) {
          warp.to = aim;
          (toAttr.array as Float32Array).set(T[aim]);
          toAttr.needsUpdate = true;
          k = Math.min(1, (now - warp.start) / WARP_MS);
        }
        a = warp.from;
        b = warp.to;
        te = k;
        e = k * k * (3 - 2 * k);
        if (k >= 1) {
          fSmooth = warp.to; // land; if the reader kept scrolling, the next frame carries on from here
          warp = null;
        }
      } else {
        fSmooth += (fTarget - fSmooth) * (off ? 1 : 0.06);
        a = clamp(Math.floor(fSmooth), 0, SCENES - 2);
        b = a + 1;
        te = clamp(fSmooth - a, 0, 1);
        e = te * te * (3 - 2 * te);
        if (a !== pair) {
          load(a, b);
          pair = a;
        }
      }
      U.uFrom.value = a;
      U.uTo.value = b;
      U.uMix.value = te;
      /* grade lerp (scene colours are authored in sRGB; the pipeline works in linear) */
      // (routed through bone, the grade moves on the raw scroll progress: eased, a quarter of the way in it is
      // still library brass — hue 39°, saturation 0.37 — which reads as khaki against the mint it is heading for)
      const route = a === 13 || b === 13;
      gradeLerp(GRADE[a], GRADE[b], route ? te : e, route);
      (U.uWinFrom.value as THREE.Vector2).set(WIN[a][0], WIN[a][1]);
      (U.uWinTo.value as THREE.Vector2).set(WIN[b][0], WIN[b][1]);
      U.uOrdered.value = a === 0 || b === 0 || a === 13 || b === 13 ? 0.7 : 0;
      // each scene rests at its own bloom; the drama is in transit
      if (bloom) bloom.strength = BLOOM_REST[a] + (BLOOM_REST[b] - BLOOM_REST[a]) * e + 0.16 * Math.sin(Math.PI * te);

      // the settle sweep: once per arrival, when the scroll has come to rest on a scene (not on the bookends)
      const k = Math.round(fSmooth);
      const settled = !warp && Math.abs(fTarget - fSmooth) < 0.004 && Math.abs(fSmooth - k) < 0.012;
      if (!off && settled && k !== swept) {
        swept = k;
        sweepStart = now;
      } else if (!settled && Math.abs(fSmooth - swept) > 0.5) {
        swept = -1;
      }
      const sw = (now - sweepStart) / 1900;
      U.uSweep.value = swept >= 0 && sw <= 1 && swept !== 0 && swept !== 13 ? sw : -1;

      // the hero draws itself once per load, 300 ms after the field's first frame; the breath's first
      // light follows at 2.7 s. Motion off = the finished still: fully drawn, no light.
      const introP = clamp((tRun - 0.3) / 1.8, 0, 1);
      if (off || introP >= 1) introDone = true;
      U.uIntro.value = introDone ? 1.06 : 1.06 * easeOutCubic(introP);
      U.uBreath.value = off ? -1 : tRun - 2.7;

      // the maker's arrival, once per session and only once the scroll has come to rest on scene 13
      if (off || tieDone) U.uArrive.value = 99;
      else if (settled && k === 13) {
        if (arriveStart < 0) arriveStart = tRun;
        const sa = tRun - arriveStart;
        U.uArrive.value = sa;
        if (sa > 3.8) {
          tieDone = true;
          try { sessionStorage.setItem("zc-tie", "1"); } catch { /* storage blocked */ }
        }
      } else if (Math.abs(fSmooth - 13) > 0.5) {
        arriveStart = -1;
        U.uArrive.value = -1;
      }
      U.uLift13.value = ((window.scrollY - rest13) * view.visH) / view.H / view.fit;
      U.uCta.value += (ctaHot - U.uCta.value) * (ctaHot > U.uCta.value ? 0.25 : 0.1); // ~150 ms in, ~400 ms out

      /* the lantern eases in and out; a tap holds it for a moment */
      const on = ptrOnTarget || (now < tapUntil ? 1 : 0);
      U.uPtrOn.value += (on - U.uPtrOn.value) * 0.08;
      (U.uPtr.value as THREE.Vector2).lerp(ptrTarget, 0.18);

      /* camera drift: a quarter of it on the hero, none at the end. With motion off the camera is held where it
         stands (a paused field would otherwise keep gliding home for a second or two) */
      if (!off) {
        const dk = DRIFT[a] + (DRIFT[b] - DRIFT[a]) * e;
        cx += ((mx - 0.5) * 3.2 * dk - cx) * 0.04;
        cy += (-(my - 0.5) * 2.0 * dk - cy) * 0.04;
      }
      camera.position.x = cx;
      camera.position.y = cy;
      camera.lookAt(0, 0, 0);

      composer.render();
    }
    onResize();
    const lateKeys = setTimeout(() => {
      computeKeys();
      onScroll();
      buildBookends();
    }, 700);
    document.fonts?.ready.then(() => {
      computeKeys();
      onScroll();
      buildBookends();
    });
    raf = requestAnimationFrame(frame);

    return () => {
      alive = false;
      clearTimeout(rebuildTimer);
      cancelAnimationFrame(raf);
      clearTimeout(lateKeys);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("zc:regate", onRegate);
      window.removeEventListener("zc:motion", onMotion);
      ctaEl?.removeEventListener("pointerenter", ctaOn);
      ctaEl?.removeEventListener("pointerleave", ctaOff);
      ctaEl?.removeEventListener("focus", ctaFocus);
      ctaEl?.removeEventListener("blur", ctaOff);
      heroRO.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onTap);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      loopLUT.dispose();
      composer.dispose();
      renderer?.dispose();
    };
  }, [grades]);

  return <canvas ref={canvasRef} id="field" aria-hidden="true" />;
}
