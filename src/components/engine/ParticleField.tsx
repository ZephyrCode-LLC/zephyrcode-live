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
import { goTo } from "@/components/system/SectionNav";
import "@/styles/sites/home-starmap.css";

export type Grade = [number[], number[], number];

/** The hero's star chart: one star per section, in page order (same ids + labels as the section nav). */
const STAR_IDS = ["signal", "doors", "method", "audits", "arena", "sage", "stories", "kshetra", "samhita", "studio", "arcade", "systems", "library", "operator"];
const STAR_LABELS = ["You are here", "Doors", "Method", "Audits", "Arena", "Sage", "Stories", "Kshetra", "Samhita", "Studio", "Arcade", "Systems", "Library", "Maker"];
// x, y, magnitude — laid out for the 1440-wide view, hugging its right edge and clear of the
// headline column; the figure climbs from "you are here" (bottom) to the maker (top).
const STARS: Array<[number, number, number]> = [
  [7.5, -12.0, 1.45], [11.5, -9.8, 1.1], [15.5, -11.3, 0.9], [19.0, -8.6, 1.0], [22.0, -5.4, 0.95],
  [18.2, -4.0, 0.85], [14.6, -2.2, 1.0], [12.4, 1.2, 0.9], [16.0, 3.4, 0.85], [20.8, 2.0, 0.9],
  [22.8, 6.0, 0.95], [19.4, 8.6, 0.9], [14.8, 7.4, 0.85], [17.2, 12.0, 1.15],
];
// which side of its star each label sits on, chosen so labels stay outside the figure
const CHART_CX = 15.15; // the chart's centre column; portrait screens turn it about (CHART_CX, 0)
const LABEL_LEFT = [1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1];
const LINKS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [4, 9], [6, 12],
];

export default function ParticleField({ grades }: { grades: Grade[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

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
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    // shared glyph helpers: draw a line of points into `pts`, and scatter `pts` across all particles.
    const seg = (pts: Array<[number, number]>, x0: number, y0: number, x1: number, y1: number, n: number) => {
      for (let s = 0; s < n; s++) { const t = Math.random(); pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); }
    };
    const rectPts = (pts: Array<[number, number]>, x0: number, y0: number, x1: number, y1: number, n: number) => {
      seg(pts, x0, y0, x1, y0, n); seg(pts, x0, y1, x1, y1, n); seg(pts, x0, y0, x0, y1, n); seg(pts, x1, y0, x1, y1, n);
    };
    // a SOLID band of half-width w along a segment (a fat limb / body mass) — reads cleanly as particles.
    const bar = (pts: Array<[number, number]>, x0: number, y0: number, x1: number, y1: number, w: number, n: number) => {
      const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, px = -dy / L, py = dx / L;
      for (let s = 0; s < n; s++) { const t = Math.random(), o = (Math.random() * 2 - 1) * w; pts.push([x0 + dx * t + px * o, y0 + dy * t + py * o]); }
    };
    // an elliptical arc from angle a0→a1 with a little radial jitter jr (fraction of radius) — crisp curves.
    const arc = (pts: Array<[number, number]>, cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number, jr = 0.03) => {
      for (let s = 0; s < n; s++) { const t = a0 + Math.random() * (a1 - a0), rr = 1 + (Math.random() * 2 - 1) * jr; pts.push([cx + Math.cos(t) * rx * rr, cy + Math.sin(t) * ry * rr]); }
    };
    // a point on a quadratic bezier, and a soft dotted stroke of half-width w along one.
    const qAt = (p0: [number, number], p1: [number, number], p2: [number, number], t: number): [number, number] => {
      const m = 1 - t; return [m * m * p0[0] + 2 * m * t * p1[0] + t * t * p2[0], m * m * p0[1] + 2 * m * t * p1[1] + t * t * p2[1]];
    };
    const qcurve = (pts: Array<[number, number]>, p0: [number, number], p1: [number, number], p2: [number, number], n: number, w: number) => {
      for (let s = 0; s < n; s++) {
        const t = Math.random(), m = 1 - t, q = qAt(p0, p1, p2, t);
        const dx = 2 * m * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]), dy = 2 * m * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
        const L = Math.hypot(dx, dy) || 1, o = (Math.random() * 2 - 1) * w;
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
        const R = 6.4 * prof * Math.sqrt(Math.random());
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
      const blob = (cx: number, cy: number, rx: number, ry: number, n: number) => { for (let s = 0; s < n; s++) { const ang = Math.random() * 6.283, rr = Math.sqrt(Math.random()); push(cx + Math.cos(ang) * rr * rx, cy + Math.sin(ang) * rr * ry); } };
      // (slim torso + elbows swung WIDE so real daylight separates the raised arm from the body)
      blob(0.0, 9.2, 1.18, 1.34, 105);                       // head, slightly bowed
      bar(pts, 0.02, 7.95, 0.1, 7.4, 0.52, 18);              // neck
      for (let s = 0; s < 205; s++) { const t = Math.random(), y = 7.3 - t * 4.0, hw = 1.62 - 0.55 * t; push((Math.random() * 2 - 1) * hw + 0.15 * t, y); } // torso, shoulders → waist
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
        for (let s = 0; s < 40; s++) { const u = Math.random(); const xx = xF + (xL - xF) * u; const yT = (DT + tilt) - tilt * u, yB = (DB + tilt) - tilt * u; push(xx, yB + (yT - yB) * Math.random()); } // leaf face
        for (let s = 0; s < 10; s++) push(xF + 0.35, (DB + DT) / 2 + tilt / 2 + (Math.random() * 2 - 1) * 0.25); // knob on the free edge
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
        const k = span > 0 ? lo + Math.floor(Math.random() * span) : NB - 1;
        a[i * 3] = xcs[k] + (Math.random() * 2 - 1) * BW;
        a[i * 3 + 1] = BASE + y + (Math.random() * 2 - 1) * 0.14;
        a[i * 3 + 2] = rnd(-1.4, 1.4);
      }
      return a;
    }

    // SAGE scene formation — a breathing orbit with a bright nucleus (the ops "brain" + its satellites).
    function fOrbit() {
      const a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        if (Math.random() < 0.28) {             // nucleus
          const ang = rnd(0, 6.283), r = 3.0 * Math.sqrt(Math.random());
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
      for (let s = 0; s < 640; s++) { const t = Math.PI + Math.random() * Math.PI; pts.push([BX * Math.cos(t), BCY + BY * Math.sin(t)]); } // bowl (lower half-ellipse)
      for (let s = 0; s < 240; s++) pts.push([(Math.random() * 2 - 1) * BX * 0.9, BCY - Math.random() * BY * 0.85]); // oil fill
      for (let s = 0; s < 220; s++) { const u = Math.random() * 2 - 1; pts.push([u * BX, BCY + 0.15 - Math.abs(u) * 0.55]); } // rim with a slight spout at the ends
      for (let s = 0; s < 120; s++) pts.push([(Math.random() * 2 - 1) * 3.2, -8.0 + Math.random() * 0.6]); // base
      for (let s = 0; s < 70; s++) pts.push([(Math.random() * 2 - 1) * 0.25, -4.3 + Math.random() * 2.1]); // wick
      for (let s = 0; s < 1400; s++) { // flame — teardrop rising to a tip
        const h = Math.random(), y = -2.2 + h * 9.4;
        const w = 2.5 * (h < 0.32 ? 0.15 + 0.85 * Math.sqrt(h / 0.32) : Math.pow((1 - h) / 0.68, 0.8));
        pts.push([(Math.random() * 2 - 1) * w, y]);
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
      const dot = (cx: number, cy: number, r: number, n: number) => { for (let s = 0; s < n; s++) { const ang = Math.random() * 6.283, rr = Math.sqrt(Math.random()); pts.push([cx + Math.cos(ang) * rr * r, cy + Math.sin(ang) * rr * r]); } };
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
      for (let d = 0; d < 3; d++) for (let s = 0; s < 22; s++) { const ang = Math.random() * 6.283, r = 0.35 * Math.sqrt(Math.random()); pts.push([L + 1.4 + d * 1.3 + Math.cos(ang) * r, TP - 1.2 + Math.sin(ang) * r]); } // window dots
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
          const u = Math.random() * 2 - 1, x = gx + u * R;
          const yTop = gy + Math.sqrt(Math.max(0.02, 1 - u * u)) * R;                 // the dome
          const yBot = gy - BH + 0.3 * R * Math.abs(Math.sin(u * 3 * Math.PI));      // the scalloped skirt
          const y = yBot + Math.random() * Math.max(0.05, yTop - yBot);
          if ((x - eyes[0][0]) ** 2 + (y - eyes[0][1]) ** 2 < er * er) continue;
          if ((x - eyes[1][0]) ** 2 + (y - eyes[1][1]) ** 2 < er * er) continue;
          pts.push([x, y]);
        }
      };
      const pac = (px: number, py: number, R: number, face: number) => {
        const m = 0.55, ea = face + (Math.cos(face) >= 0 ? 1.15 : -1.15);            // the eye sits above the mouth
        const ex = px + Math.cos(ea) * 0.48 * R, ey = py + Math.sin(ea) * 0.48 * R, er = 0.21 * R;
        for (let s = 0; s < Math.round(R * R * 50); s++) {
          const ang = face + m + Math.random() * (Math.PI * 2 - 2 * m), rr = R * Math.sqrt(Math.random());
          const x = px + Math.cos(ang) * rr, y = py + Math.sin(ang) * rr;
          if ((x - ex) ** 2 + (y - ey) ** 2 < er * er) continue;
          pts.push([x, y]);
        }
      };
      const invader = (ix: number, iy: number, R: number) => {
        const g = R * 0.5;
        const cells: Array<[number, number]> = [[-1, 1], [1, 1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-2, -1], [-1, -1], [1, -1], [2, -1], [-1, -2], [1, -2]];
        for (const cl of cells) for (let s = 0; s < 9; s++) pts.push([ix + cl[0] * g + (Math.random() * 2 - 1) * g * 0.36, iy + cl[1] * g + (Math.random() * 2 - 1) * g * 0.36]);
        seg(pts, ix - 1.7 * g, iy + 2.5 * g, ix - g, iy + 1.3 * g, 8); seg(pts, ix + 1.7 * g, iy + 2.5 * g, ix + g, iy + 1.3 * g, 8); // antennae
      };
      // the chase, centre stage: a big Pac gobbling a pellet trail toward a fleeing ghost pack
      pac(-16.5, 0, 2.8, 0);
      for (const px of [-11.6, -9.2, -6.8, -4.4, -2.0]) for (let s = 0; s < 26; s++) { const ang = Math.random() * 6.283, rr = 0.4 * Math.sqrt(Math.random()); pts.push([px + Math.cos(ang) * rr, Math.sin(ang) * rr]); }
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
      for (const ct of centers) for (let s = 0; s < 1600; s++) { const ang = Math.random() * 6.283, rr = R + (Math.random() * 2 - 1) * 0.18; pts.push([ct[0] + Math.cos(ang) * rr, ct[1] + Math.sin(ang) * rr]); }
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
        for (let s = 0; s < 62; s++) { const ang = Math.random() * 6.283, rr = Math.sqrt(Math.random()); pts.push([hx + side * 4.05 + Math.cos(ang) * rr * 0.55, hy - 2.5 + Math.sin(ang) * rr * 0.85]); } // pad
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

    // OPERATOR scene — "the maker": a side-view boy at his desk, headphones on, typing on a laptop,
    // a bulb glowing overhead, a stack of books in the far corner, coffee at hand. (the real setup.)
    function fMaker() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      const disc = (cx: number, cy: number, r: number, ry: number, n: number) => { for (let s = 0; s < n; s++) { const ang = Math.random() * 6.283, rr = Math.sqrt(Math.random()); pts.push([cx + Math.cos(ang) * rr * r, cy + Math.sin(ang) * rr * ry]); } };
      // ---- the room: a floor line grounds the whole scene ----
      seg(pts, -22, -11, 23, -11, 140);
      // ---- books stacked on the floor, far corner (they stay left, under the copy) ----
      bar(pts, -20.8, -10.5, -15.6, -10.5, 0.42, 58);
      bar(pts, -20.4, -9.6, -16.0, -9.6, 0.4, 52);
      bar(pts, -20.6, -8.8, -16.2, -8.8, 0.38, 48);
      bar(pts, -15.0, -10.9, -12.9, -7.6, 0.45, 58);       // one leaning on the pile
      const MARK = pts.length;                             // everything after this shifts right, clear of the heading
      // ---- desk, long and clean, with a slight top thickness ----
      seg(pts, -12, -3, 15, -3, 190);
      seg(pts, -12, -3.5, 15, -3.5, 80);
      seg(pts, -10.5, -3.5, -10.5, -11, 62); seg(pts, 13.5, -3.5, 13.5, -11, 62); // legs
      // ---- laptop, open toward the boy, its light spilling his way ----
      bar(pts, 0.8, -2.8, 6.8, -2.8, 0.2, 72);              // base
      bar(pts, 6.8, -2.8, 5.3, 3.4, 0.18, 92);              // screen, tilted back
      for (let s = 0; s < 100; s++) { const t = Math.random(); pts.push([(6.5 - 1.45 * t) - Math.random() * 1.6, -2.7 + t * 5.7]); } // screen light
      // ---- the maker, side view, leaning into the work — larger, so the pose stays crisp ----
      disc(-5.3, 4.3, 1.7, 1.85, 185);                      // head
      arc(pts, -5.3, 4.45, 2.5, 2.5, Math.PI * 0.06, Math.PI * 0.94, 160, 0.02); // headphone band
      disc(-6.2, 3.8, 0.75, 1.05, 80);                      // near ear cup
      for (let s = 0; s < 480; s++) { const t = Math.random(), y = 2.2 - t * 5.1, hw = 2.0 - 0.5 * t, xc = -4.9 - 1.9 * t; pts.push([xc + (Math.random() * 2 - 1) * hw, y]); } // torso, leaning in
      bar(pts, -4.4, 1.3, -2.6, -1.4, 0.6, 82);             // upper arm
      bar(pts, -2.6, -1.4, 2.9, -2.5, 0.52, 100);           // forearm → hands on the keys
      bar(pts, -6.6, -3.1, -2.9, -3.5, 1.15, 175);          // lap
      bar(pts, -2.9, -3.5, -2.5, -11, 0.65, 110);           // shin
      disc(-1.7, -10.8, 1.05, 0.4, 24);                     // foot
      seg(pts, -9.3, -3.5, -9.7, 2.8, 82);                  // chair back
      seg(pts, -9.5, -3.5, -9.0, -11, 56);                  // chair leg
      // ---- the bulb, centre stage between maker and machine: cord, glass, filament, rays ----
      seg(pts, 0.3, 15.5, 0.3, 8.6, 96);                    // cord
      arc(pts, 0.3, 7.0, 1.5, 1.7, 0, Math.PI * 2, 125, 0.028); // glass
      disc(0.3, 6.8, 0.5, 0.5, 40);                         // filament glow
      for (let k = 0; k < 12; k++) {                        // radiating dashes
        const ang = (k / 12) * Math.PI * 2 + 0.26; if (Math.abs(ang - Math.PI / 2) < 0.5) continue;
        bar(pts, 0.3 + Math.cos(ang) * 2.6, 7.0 + Math.sin(ang) * 2.8, 0.3 + Math.cos(ang) * 3.9, 7.0 + Math.sin(ang) * 4.1, 0.08, 14);
      }
      // ---- coffee at hand, steam curling up ----
      bar(pts, 9.6, -2.35, 10.9, -2.35, 0.62, 54);          // mug
      arc(pts, 11.1, -2.35, 0.42, 0.55, -Math.PI / 2, Math.PI / 2, 22, 0.08); // handle
      qcurve(pts, [9.9, -1.5], [9.55, -0.4], [10.1, 0.6], 24, 0.05);          // steam
      qcurve(pts, [10.6, -1.5], [11.0, -0.2], [10.5, 0.9], 24, 0.05);
      for (let i = MARK; i < pts.length; i++) pts[i][0] += 4.5; // slide the working scene right, off the heading
      fillPts(a, pts, 0.1, 1.2);
      return a;
    }


    // HERO — the studio as a star chart. Each star is a section, lit in its room's own colour
    // (read from the scene's data-accent) with a core and diffraction spikes; links run in page
    // order; a faint atlas ring frames the figure; the remaining particles are the ember dust.
    // `starAttr` (rgb tint + role) and `starIdx` only mean anything while this formation shows.
    const starAttr = new Float32Array(N * 4); // role: 0 dust · .3 ring · .45 link · .85 spike · 1 core
    const starIdx = new Float32Array(N).fill(-1);
    const accents = (Array.prototype.slice.call(document.querySelectorAll(".scene")) as HTMLElement[]).map(
      (el) => new THREE.Color(el.getAttribute("data-accent") || "#e85d2a")
    );
    function fConstellation() {
      const a = new Float32Array(N * 3);
      const k9 = N / 9000;
      let i = 0;
      const put = (x: number, y: number, z: number, c: THREE.Color, role: number, si: number) => {
        if (i >= N) return;
        a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
        starAttr[i * 4] = c.r; starAttr[i * 4 + 1] = c.g; starAttr[i * 4 + 2] = c.b; starAttr[i * 4 + 3] = role;
        starIdx[i] = si;
        i++;
      };
      STARS.forEach(([x, y, mag], si) => {
        const c = accents[si] ?? accents[0];
        const nCore = Math.round(90 * mag * k9), nSpike = Math.round(64 * mag * k9);
        for (let k = 0; k < nCore; k++) {
          const r = 0.16 * mag * Math.sqrt(-2 * Math.log(Math.random() + 1e-6)), th = Math.random() * 6.283;
          put(x + r * Math.cos(th), y + r * Math.sin(th), rnd(-0.15, 0.15), c, 1, si);
        }
        for (let k = 0; k < nSpike; k++) {
          // an X-shaped glint (diagonal, so the arms never run through a label beside the star)
          const u = Math.random() * 2 - 1, t = (Math.sign(u) * u * u * 1.15 * mag) / Math.SQRT2, d = k % 2 === 0 ? 1 : -1;
          put(x + t + rnd(-0.025, 0.025), y + d * t + rnd(-0.025, 0.025), 0, c, 0.85, si);
        }
      });
      LINKS.forEach(([p, q]) => {
        const [x0, y0] = STARS[p], [x1, y1] = STARS[q];
        const n = Math.round(Math.hypot(x1 - x0, y1 - y0) * 7 * k9);
        for (let k = 0; k < n; k++) {
          const t = 0.1 + Math.random() * 0.8; // a gap at each end, so the stars read as stars
          put(x0 + (x1 - x0) * t + rnd(-0.04, 0.04), y0 + (y1 - y0) * t + rnd(-0.04, 0.04), 0, accents[p].clone().lerp(accents[q], t), 0.45, -1);
        }
      });
      const atlas = new THREE.Color(0.72, 0.64, 0.56);
      for (let k = 0, n = Math.round(700 * k9); k < n; k++) {
        const th = Math.random() * 6.283, rr = k % 3 === 0 ? 14.6 : 11.2, x = 15.6 + rr * 1.08 * Math.cos(th), y = rr * Math.sin(th);
        if (x < 8.5) continue; // the atlas ring never runs behind the headline
        put(x, y, 0, atlas, 0.3, -1);
      }
      while (i < N) put(rnd(-27, 27), rnd(-16, 16), rnd(-12, 6), atlas, 0, -1); // the ember dust
      return a;
    }

    void fFunnel; void fFlame; void fWave; void fRing; void fWind; // superseded by the scene formations below
    const T = [
      fConstellation(), fDoors(), fLoop(), fLattice(), fBars(), fOrbit(),
      fLamp(), fConch(), fMerge(), fBlueprint(), fInvader(), fRings(), fBooks(), fMaker(),
    ];
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
      aRand[i] = Math.random();
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
    geo.setAttribute("aStar", new THREE.BufferAttribute(starAttr, 4));
    geo.setAttribute("aSi", new THREE.BufferAttribute(starIdx, 1));

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
        uWindY: { value: 1 },
        uStarShift: { value: 0 },
        uStarShiftY: { value: 0 },
        uStarTurn: { value: 0 },
        uHover: { value: -1 },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aTo; attribute float aRand; attribute float aU; attribute vec3 aLoop; attribute vec4 aStar; attribute float aSi;
        uniform float uTime, uMix, uFrom, uTo, uSize, uRM, uAspect, uSweep, uPtrOn, uLoopFlow, uWindY, uStarShift, uStarShiftY, uStarTurn, uHover;
        uniform vec2 uPtr, uLoopWH;
        uniform sampler2D uLoopLUT;
        varying float vMix, vSeed, vLight, vSweep, vDof, vArc, vStarW, vHot, vDust;
        varying vec2 vLdir;
        varying vec3 vTint;
        const float PI = 3.14159265;

        // each scene's living motion — the same choreography v3 ran per particle on the CPU
        vec3 live(vec3 p, float s, float t) {
          if (s < 0.5 && aStar.w > 0.01) {                 // 00 SIGNAL: the star chart holds still (its labels
            const float CX = ${CHART_CX.toFixed(2)};      // are pinned to it) and hugs the right edge — or, on
            if (uStarTurn > 0.5) p.xy = vec2(CX + p.y, CX - p.x); // portrait, turns a quarter and rides the page
            p.x += uStarShift;
            p.y += uStarShiftY;
          } else if (s < 0.5) {                            // 00 SIGNAL: the ember dust drifts
            p.y *= uWindY; // the dust fills the screen's height even where drawings are fit to its width
            vec3 q = p;
            p.x += sin(t * 0.32 + q.y * 0.21 + aRand * 4.0) * 2.6;
            p.y += cos(t * 0.27 + q.x * 0.17 + aRand * 1.7) * 1.5;
            p.z += sin(t * 0.22 + aRand * 3.1) * 1.3;
          } else if (abs(s - 2.0) < 0.5) {                 // 02 METHOD: stream round the ∞
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

        void main() {
          float t = uTime;
          vSeed = aRand;
          vec3 A = live(position, uFrom, t);
          vec3 B = live(aTo, uTo, t);

          // staggered departure: each particle leaves on its own beat, so a scene change reads
          // as a murmuration rather than every point sliding in lockstep
          float lag = aRand * 0.45 * (1.0 - uRM);
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

          // the star chart's own light: tinted stars, brighter cores, a flare on the hovered star
          float w0 = (uFrom < 0.5 ? 1.0 - m : 0.0) + (uTo < 0.5 ? m : 0.0);
          vTint = aStar.rgb;
          vStarW = aStar.w * w0;
          vDust = aStar.w < 0.01 ? w0 : 0.0; // the ember dust steps back while the chart is up
          vHot = (uHover > -0.5 && abs(aSi - uHover) < 0.5) ? w0 : 0.0;

          vMix = aU; // gradient position along the drawing (uGrad picks ordered vs speckled)
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vec4 clip = projectionMatrix * mv;
          vec2 ndc = clip.xy / clip.w;

          // the pointer is a lantern: it lights what it nears and gently parts the field
          vec2 d = (ndc - uPtr) * vec2(uAspect, 1.0);
          float d2 = dot(d, d);
          vLight = exp(-d2 / 0.07) * uPtrOn;
          vLdir = uPtrOn > 0.01 ? normalize(-d + vec2(0.0001)) : vec2(-0.55, 0.8);
          ndc += normalize(d + vec2(0.0001)) * vec2(1.0 / uAspect, 1.0) * exp(-d2 / 0.02) * 0.035 * uPtrOn * (1.0 - uRM);
          clip.xy = ndc * clip.w;

          // a light sweep crosses each formation once as it settles
          float s = dot(ndc, normalize(vec2(1.0, 0.55)));
          vSweep = uSweep >= 0.0 ? exp(-pow((s - mix(-1.7, 1.7, uSweep)) * 3.0, 2.0)) : 0.0;

          // focus plane at the formation: points off it grow soft and dim (a little depth of field)
          vDof = clamp(abs(mv.z + 34.0) / 11.0, 0.0, 1.0);
          gl_PointSize = uSize * (0.42 + aRand * 0.8) * (300.0 / -mv.z) * (1.0 + vDof * 1.3) * (1.0 + arc * 0.25) * (1.0 + vStarW * 0.5 + vHot * 0.45);
          gl_Position = clip;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform vec3 uColA, uColB;
        uniform float uTime, uAlpha, uGrad;
        varying float vMix, vSeed, vLight, vSweep, vDof, vArc, vStarW, vHot, vDust;
        varying vec2 vLdir;
        varying vec3 vTint;
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
          base = mix(base, vTint, clamp(vStarW * 1.15, 0.0, 1.0));
          // stars scintillate; everything else breathes gently
          float tw = mix(0.84 + 0.16 * sin(uTime * 2.2 + vSeed * 43.7), 0.7 + 0.3 * sin(uTime * 3.4 + vSeed * 61.0), step(0.8, vStarW));
          float lift = 1.0 + vLight * 2.6 + vSweep * 0.75 + vStarW * 1.25 + vHot * 2.4;
          vec3 col = base * diff * lift + spec * (0.18 + vLight * 0.9 + vSweep * 0.3) + vSweep * vec3(0.06, 0.05, 0.04);
          float a = (core + halo) * tw * uAlpha * (1.0 - vDof * 0.5) * (1.0 - vArc * 0.18) * (1.0 - vDust * 0.5);
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
    const bloom = MOBILE ? null : new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.34, 0.3, 0.72);
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
    function computeKeys() {
      // A door-gated (display:none) scene has offsetParent===null; reuse the previous key so the
      // formation index → scene mapping doesn't jump when some scenes are hidden.
      let last = 0;
      keys = sceneEls.map((el) => {
        if (el.offsetParent === null && el.offsetHeight === 0) return last;
        last = Math.max(0, el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2);
        return last;
      });
      if (keys.length > 1) keys[0] = Math.min(Math.max(keys[0], chartHold), keys[1] * 0.6);
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
    const onRegate = () => { computeKeys(); onScroll(); placeLabels(); };
    window.addEventListener("zc:regate", onRegate);

    /* ---------- the star chart's labels: real links pinned over each star ---------- */
    const map = mapRef.current;
    const starEls = map ? (Array.prototype.slice.call(map.querySelectorAll("a")) as HTMLAnchorElement[]) : [];
    const starV = new THREE.Vector3();
    let starShift = 0;
    let starShiftY = 0;
    let starTurn = false;
    let starLift = 0; // portrait: how far the page has carried the chart up, in chart units
    let chartHold = 0; // portrait: the scroll the chart holds its shape until, so it's seen whole
    let starFit = 1;
    let chartVisW = 0;
    let chartVisH = 0;
    const heroText = Array.prototype.slice.call(
      document.querySelectorAll("#signal h1, #signal .lede, #signal .hero-cta, #signal .eyebrow, #signal .scrollcue")
    ) as HTMLElement[];
    const project = (s: number) => {
      const [x, y] = starTurn ? [CHART_CX + STARS[s][1], CHART_CX - STARS[s][0]] : STARS[s]; // as the shader places it
      starV.set((x + starShift) * starFit, (y + starShiftY + starLift) * starFit, 0).project(camera);
      return [((starV.x + 1) / 2) * window.innerWidth, ((1 - starV.y) / 2) * window.innerHeight];
    };
    // Labels that would land on the hero's text stay hidden until their star is hovered; labels
    // near the right edge read leftwards. Door-hidden sections dim and stop taking clicks.
    function placeLabels() {
      const rects = heroText.map((el) => el.getBoundingClientRect());
      starEls.forEach((el, s) => {
        const [x, y] = project(s);
        const scene = document.getElementById(STAR_IDS[s]);
        el.classList.toggle("off", !!scene && scene.offsetHeight === 0);
        el.classList.toggle("left", (!starTurn && !!LABEL_LEFT[s]) || x > window.innerWidth - 150);
        const lx0 = el.classList.contains("left") ? x - 150 : x + 14, lx1 = lx0 + 136;
        el.classList.toggle("quiet", rects.some((r) => lx1 > r.left && lx0 < r.right && y + 8 > r.top && y - 8 < r.bottom));
      });
    }
    // Landscape: the chart hugs the right edge, its rightmost column where it sits at 1440. Portrait:
    // the headline and buttons take the width and (on a phone) the whole first screen, and the tall
    // figure ran behind both. So it turns a quarter, reading left to right from "you are here", into
    // the slot home-starmap.css leaves under the hero's text: the page carries it up as you scroll
    // (starLift), and the field holds it whole until it's well in view (chartHold) before it
    // dissolves into DOORS.
    function placeChart() {
      if (!chartVisH) return;
      const h = window.innerHeight;
      starTurn = camera.aspect <= 1; // matches the slot's (max-aspect-ratio: 1/1)
      chartHold = 0;
      if (!starTurn) {
        starShift = chartVisW / 2 / starFit - 24.2;
        starShiftY = 0;
      } else {
        const floor = Math.max(h * 0.6, ...heroText.map((el) => el.getBoundingClientRect().bottom + window.scrollY)) + 14;
        const band = 17 * (h / chartVisH) * starFit; // px: the turned figure is ±7.65 units tall, plus glints
        const hero = document.getElementById("signal");
        const slotEnd = hero ? hero.getBoundingClientRect().bottom + window.scrollY : h;
        const bandY = (floor + Math.max(slotEnd, floor + band)) / 2; // page px: centred in the slot
        starShift = -CHART_CX;
        starShiftY = ((0.5 - bandY / h) * chartVisH) / starFit;
        chartHold = Math.max(0, bandY - h * 0.6);
      }
      mat.uniforms.uStarShift.value = starShift;
      mat.uniforms.uStarTurn.value = starTurn ? 1 : 0;
      placeLabels();
    }
    // the hero's text reflows when its webfonts land, which moves where the chart sits
    const heroRO = new ResizeObserver(() => { placeChart(); computeKeys(); onScroll(); });
    heroText.forEach((el) => heroRO.observe(el));
    const onStarEnter = (e: Event) => { mat.uniforms.uHover.value = +((e.currentTarget as HTMLElement).dataset.star ?? -1); };
    const onStarLeave = () => { mat.uniforms.uHover.value = -1; };
    const onStarClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab etc. stays native
      e.preventDefault();
      const id = (e.currentTarget as HTMLAnchorElement).getAttribute("href")!.slice(1);
      if (id !== "signal") goTo(id); // the field warps there
    };
    starEls.forEach((el, s) => {
      const accent = (document.getElementById(STAR_IDS[s]) as HTMLElement | null)?.dataset.accent;
      if (accent) el.style.setProperty("--star", accent);
      el.addEventListener("pointerenter", onStarEnter);
      el.addEventListener("pointerleave", onStarLeave);
      el.addEventListener("click", onStarClick);
    });

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
      mat.uniforms.uWindY.value = Math.max(1, (visH * 0.5) / (16 * fit));
      starFit = fit;
      chartVisW = visW;
      chartVisH = visH;
      placeChart();
      mat.uniforms.uSize.value = (w < 700 ? 1.0 : 1.15) * Math.sqrt(fit) * DPR; // ×DPR: the same dot size on every screen
      mat.uniforms.uAlpha.value = w < 700 ? 0.62 : 0.9; // text sits over the field on phones
      mat.uniforms.uAspect.value = camera.aspect;
      computeKeys();
      onScroll();
    }
    window.addEventListener("resize", onResize);
    onResize();
    const lateKeys = setTimeout(() => {
      computeKeys();
      onScroll();
    }, 700);

    /* ---------- frame loop: a handful of uniforms, nothing per particle ---------- */
    const U = mat.uniforms;
    const colA = U.uColA.value as THREE.Color;
    const colB = U.uColB.value as THREE.Color;
    const t0 = performance.now();
    let raf = 0;
    let pair = 0; // the scene index loaded into the `position` slot (-1 = reload)
    let swept = -1;
    let sweepStart = 0;
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
    const gradeLerp = (ga: Grade, gb: Grade, e: number) => {
      colA.setRGB(ga[0][0] + (gb[0][0] - ga[0][0]) * e, ga[0][1] + (gb[0][1] - ga[0][1]) * e, ga[0][2] + (gb[0][2] - ga[0][2]) * e, THREE.SRGBColorSpace);
      colB.setRGB(ga[1][0] + (gb[1][0] - ga[1][0]) * e, ga[1][1] + (gb[1][1] - ga[1][1]) * e, ga[1][2] + (gb[1][2] - ga[1][2]) * e, THREE.SRGBColorSpace);
      U.uGrad.value = ga[2] + (gb[2] - ga[2]) * e;
    };

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (document.hidden || !renderer) return;
      const t = RM ? 0 : (now - t0) / 1000;
      U.uTime.value = t;

      if (!RM && !warp && Math.abs(fTarget - fSmooth) > 1.5) {
        const from = Math.round(fSmooth),
          to = Math.round(fTarget);
        if (from !== to) {
          warp = { from, to, start: now };
          load(from, to);
          pair = -1;
        }
      }

      let mapVis = Math.max(0, 1 - fSmooth * 2.4);
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
        U.uFrom.value = warp.from;
        U.uTo.value = warp.to;
        U.uMix.value = k;
        gradeLerp(GRADE[warp.from], GRADE[warp.to], k * k * (3 - 2 * k));
        mapVis = warp.from === 0 ? 1 - Math.min(1, k * 2.4) : warp.to === 0 ? Math.max(0, k * 2 - 1) : 0;
        if (k >= 1) {
          fSmooth = warp.to; // land; if the reader kept scrolling, the next frame carries on from here
          warp = null;
        }
      } else {
        fSmooth += (fTarget - fSmooth) * (RM ? 1 : 0.06);
        const sa = Math.max(0, Math.min(SCENES - 2, Math.floor(fSmooth)));
        const te = Math.max(0, Math.min(1, fSmooth - sa));
        if (sa !== pair) {
          load(sa, sa + 1);
          pair = sa;
        }
        U.uFrom.value = sa;
        U.uTo.value = sa + 1;
        U.uMix.value = te;
        /* grade lerp (scene colours are authored in sRGB; the pipeline works in linear) */
        gradeLerp(GRADE[sa], GRADE[sa + 1], te * te * (3 - 2 * te));
      }

      // the settle sweep: once per arrival, when the scroll has come to rest on a scene
      const k = Math.round(fSmooth);
      const settled = !warp && Math.abs(fTarget - fSmooth) < 0.004 && Math.abs(fSmooth - k) < 0.012;
      if (!RM && settled && k !== swept) {
        swept = k;
        sweepStart = now;
      } else if (!settled && Math.abs(fSmooth - swept) > 0.5) {
        swept = -1;
      }
      const sw = (now - sweepStart) / 1900;
      U.uSweep.value = swept >= 0 && sw <= 1 ? sw : -1;

      /* the lantern eases in and out; a tap holds it for a moment */
      const on = ptrOnTarget || (now < tapUntil ? 1 : 0);
      U.uPtrOn.value += (on - U.uPtrOn.value) * 0.08;
      (U.uPtr.value as THREE.Vector2).lerp(ptrTarget, 0.18);

      /* camera drift */
      cx += ((mx - 0.5) * 3.2 - cx) * 0.04;
      cy += (-(my - 0.5) * 2.0 - cy) * 0.04;
      camera.position.x = cx;
      camera.position.y = cy;
      camera.lookAt(0, 0, 0);

      starLift = starTurn ? ((window.scrollY / window.innerHeight) * chartVisH) / starFit : 0;
      mat.uniforms.uStarShiftY.value = starShiftY + starLift;
      if (map && starEls.length) {
        map.style.opacity = mapVis.toFixed(3);
        map.style.visibility = mapVis < 0.02 ? "hidden" : "visible";
        if (mapVis >= 0.02) {
          for (let s = 0; s < starEls.length; s++) {
            const [x, y] = project(s);
            starEls[s].style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
          }
        }
      }

      composer.render();
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(lateKeys);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("zc:regate", onRegate);
      heroRO.disconnect();
      starEls.forEach((el) => {
        el.removeEventListener("pointerenter", onStarEnter);
        el.removeEventListener("pointerleave", onStarLeave);
        el.removeEventListener("click", onStarClick);
      });
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

  // The star labels duplicate the section nav for pointer users (the nav is the accessible path),
  // so they're hidden from assistive tech and out of the tab order.
  return (
    <>
      <canvas ref={canvasRef} id="field" aria-hidden="true" />
      <div className="starmap" ref={mapRef} aria-hidden="true">
        {STAR_IDS.map((id, s) => (
          <a key={id} href={`#${id}`} tabIndex={-1} data-star={s} className={s === 0 ? "here" : undefined}>
            <span>{s === 0 ? STAR_LABELS[0] : `${String(s + 1).padStart(2, "0")} ${STAR_LABELS[s]}`}</span>
          </a>
        ))}
      </div>
    </>
  );
}
