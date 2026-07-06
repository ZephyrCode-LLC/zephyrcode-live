"use client";

/**
 * THE FIELD — one particle system, six formations; the scroll is the score.
 * Exact port of the homepage engine (BRIEF §6): 9000/4200 particles, six
 * formations (wind → funnel/lattice → flame → cube lattice → fire/violet
 * wave → breathing ring), scroll keyframes with inertia, mouse parallax,
 * per-scene color grades, DPR cap 2.5/2, crisp-core fragment shader.
 * Dynamically imported (ssr:false) — never blocks LCP.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type Grade = [number[], number[], number];

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
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      canvas.style.display = "none";
      return;
    }

    const DPR = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 2 : 2.5);
    renderer.setPixelRatio(DPR);
    renderer.setClearColor(0x000000, 0);

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
      const S = 14;
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
      // ---- THE THINKER: a hunched seated silhouette (contour + masses), head bowed onto the fist, facing left ----
      const blob = (cx: number, cy: number, rx: number, ry: number, n: number) => { for (let s = 0; s < n; s++) { const ang = Math.random() * 6.283, rr = Math.sqrt(Math.random()); push(cx + Math.cos(ang) * rr * rx, cy + Math.sin(ang) * rr * ry); } };
      const V: Array<[number, number]> = [
        [1.4, 8.9], [-0.5, 9.0], [-2.2, 8.2], [-3.0, 6.9], [-2.6, 5.7], [-3.5, 4.1],
        [-4.2, 3.6], [-4.4, 1.1], [-4.5, 0.6], [0.8, 0.5], [2.7, 1.0], [3.0, 4.2], [2.4, 6.9],
      ];
      for (let i = 0; i < V.length; i++) { const p = V[i], q = V[(i + 1) % V.length]; seg(pts, p[0], p[1], q[0], q[1], 52); } // silhouette outline
      blob(0.9, 5.2, 2.0, 2.6, 240);        // back / torso mass (hunched)
      blob(-1.1, 3.2, 2.9, 0.9, 190);       // thigh mass
      blob(-2.3, 7.4, 1.35, 1.4, 210);      // the bowed head (solid)
      blob(-2.75, 5.7, 0.7, 0.72, 70);      // fist under the chin
      seg(pts, 1.0, 7.9, -3.5, 4.1, 72);    // the diagonal upper arm crossing to the elbow on the knee
      blob(0, 1.5, 3.5, 0.9, 120);          // the rock he sits on
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
    const LOOP_W = 13.5, LOOP_H = 6.2, LOOP_FLOW = 0.06; // flow = loop-fractions per second
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
          const ang = rnd(0, 6.283), r = 2.7 * Math.sqrt(Math.random());
          a[i * 3] = Math.cos(ang) * r; a[i * 3 + 1] = Math.sin(ang) * r * 0.95; a[i * 3 + 2] = rnd(-1.6, 1.6);
        } else {                                 // orbit ring
          const ang = (i / N) * Math.PI * 2;
          const R = 10.6 + rnd(-0.5, 0.5) + Math.sin(ang * 3) * 0.4;
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
      fillPts(a, pts, 0.14, 1.2);
      return a;
    }

    // KSHETRA scene — a conch (shankha): a fat teardrop body, a spiralling spire of decreasing
    // whorls up to the right, and a crescent aperture down the left lip. (kshetra = the interactive Gītā.)
    function fConch() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      // body — a fat teardrop: rounded wide bottom (the mouth end) tapering to a point up top
      for (let s = 0; s < 1600; s++) {
        const u = Math.random(); // 0 bottom → 1 top
        const y = -6.5 + u * 9.6;
        const w = 3.0 * Math.pow(1 - u, 0.55) * Math.min(1, (u + 0.05) * 6);
        pts.push([(Math.random() * 2 - 1) * w, y]);
      }
      // spire — decreasing whorl bumps spiralling up-right to a point
      const spire: Array<[number, number, number]> = [[1.3, 3.4, 1.25], [2.0, 4.4, 0.95], [2.6, 5.2, 0.68], [3.1, 5.9, 0.46], [3.4, 6.4, 0.28]];
      for (const sp of spire) for (let s = 0; s < Math.round(sp[2] * 170); s++) { const ang = Math.random() * 6.283, rr = sp[2] * Math.sqrt(Math.random()); pts.push([sp[0] + Math.cos(ang) * rr, sp[1] + Math.sin(ang) * rr]); }
      // aperture — a crescent opening down the left lip
      for (let s = 0; s < 300; s++) { const t = Math.random(); const y = -5.6 + t * 8.2; const x = -0.5 - 2.5 * Math.sin(Math.PI * t); pts.push([x + (Math.random() * 2 - 1) * 0.2, y]); }
      fillPts(a, pts, 0.12, 1.2);
      return a;
    }

    // SAMHITA scene — two streams merging into one, with commit nodes (prose reviewed & merged like code).
    function fMerge() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      const jx = 0, jy = 1.5;
      seg(pts, -9, 11, jx, jy, 820);   // left branch
      seg(pts, 9, 11, jx, jy, 820);    // right branch
      seg(pts, jx, jy, 0, -11, 1100);  // merged trunk
      const nodes: Array<[number, number]> = [[-9, 11], [-4.5, 6.2], [9, 11], [4.5, 6.2], [0, 1.5], [0, -3], [0, -7.2], [0, -11]];
      for (const nd of nodes) for (let s = 0; s < 80; s++) { const ang = Math.random() * 6.283, r = 0.7 * Math.sqrt(Math.random()); pts.push([nd[0] + Math.cos(ang) * r, nd[1] + Math.sin(ang) * r]); }
      fillPts(a, pts, 0.14, 1.3);
      return a;
    }

    // STUDIO scene — a wireframe browser window (we build creators their own interactive site).
    function fBlueprint() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      const L = -13, R = 13, TP = 9, BT = -9;
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
      const ghost = (gx: number, gy: number, R: number) => {
        const BH = R * 1.3;
        for (let s = 0; s < Math.round(R * 26); s++) { const t = Math.random() * Math.PI; pts.push([gx + Math.cos(t) * R, gy + Math.sin(t) * R]); } // dome
        for (let s = 0; s < Math.round(R * 30); s++) { const u = Math.random() * 2 - 1; pts.push([gx + u * R, gy - BH + 0.42 * R * Math.abs(Math.sin(u * 3 * Math.PI))]); } // wavy skirt
        for (let s = 0; s < Math.round(R * R * 11); s++) pts.push([gx + (Math.random() * 2 - 1) * R * 0.88, gy - Math.random() * BH]); // body
        for (const ex of [-0.4, 0.4]) for (let s = 0; s < 9; s++) { const ang = Math.random() * 6.283, rr = 0.28 * R * Math.sqrt(Math.random()); pts.push([gx + ex * R + Math.cos(ang) * rr, gy + 0.32 * R + Math.sin(ang) * rr]); } // eyes
      };
      const pac = (px: number, py: number, R: number, face: number) => {
        const m = 0.42;
        for (let s = 0; s < Math.round(R * R * 58); s++) { const ang = face + m + Math.random() * (Math.PI * 2 - 2 * m), rr = R * Math.sqrt(Math.random()); pts.push([px + Math.cos(ang) * rr, py + Math.sin(ang) * rr]); }
      };
      const invader = (ix: number, iy: number, R: number) => {
        const g = R * 0.5;
        const cells: Array<[number, number]> = [[-1, 1], [1, 1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-2, -1], [-1, -1], [1, -1], [2, -1], [-1, -2], [1, -2]];
        for (const cl of cells) for (let s = 0; s < 8; s++) pts.push([ix + cl[0] * g + (Math.random() * 2 - 1) * g * 0.5, iy + cl[1] * g + (Math.random() * 2 - 1) * g * 0.5]);
      };
      const cols = 8, rows = 4, X0 = -24, X1 = 24, Y0 = 9.5, Y1 = -9.5, R = 1.35;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const gx = X0 + (X1 - X0) * (c / (cols - 1)), gy = Y0 + (Y1 - Y0) * (r / (rows - 1));
        const type = (r + c) % 3;
        if (type === 0) ghost(gx, gy, R);
        else if (type === 1) pac(gx, gy, R, c % 2 ? Math.PI : 0);
        else invader(gx, gy, R);
      }
      fillPts(a, pts, 0.1, 1.3);
      return a;
    }

    // SYSTEMS scene — three interlocking rings (FORGE · TEMPER · COMPASS — the body/mind/living OS).
    function fRings() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      const centers: Array<[number, number]> = [[-6.5, 2.2], [6.5, 2.2], [0, -4.4]];
      const R = 6.2;
      for (const ct of centers) for (let s = 0; s < 1200; s++) { const ang = Math.random() * 6.283, rr = R + (Math.random() * 2 - 1) * 0.35; pts.push([ct[0] + Math.cos(ang) * rr, ct[1] + Math.sin(ang) * rr]); }
      fillPts(a, pts, 0.12, 1.4);
      return a;
    }

    // LIBRARY scene — the three axes: crisp book spines (read), headphones (listen, top-left), a TV (watch, top-right).
    function fBooks() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      // ---- books: a tidy row of solid, well-separated spines on a shelf (lower half) ----
      const shelfY = -9;
      seg(pts, -13, shelfY, 13, shelfY, 200);
      const heights = [7.5, 6, 8.5, 5.5, 7, 9, 6.5, 8, 6, 7.5];
      let x = -12.5;
      for (let b = 0; b < heights.length && x < 12.5; b++) {
        const w = 1.7 + ((b * 0.53) % 1.0) * 0.7, h = heights[b], x0 = x, x1 = x + w, y1 = shelfY + h;
        seg(pts, x0, shelfY, x0, y1, 82); seg(pts, x1, shelfY, x1, y1, 82); seg(pts, x0, y1, x1, y1, 34); // crisp edges
        for (let s = 0; s < 88; s++) pts.push([x0 + 0.18 + (x1 - x0 - 0.36) * Math.random(), shelfY + 0.2 + (h - 0.4) * Math.random()]); // dense fill
        x = x1 + 0.55;
      }
      // ---- headphones (top-left): band arch + two ear cups ----
      const hx = -15, hy = 7;
      for (let s = 0; s < 220; s++) { const t = Math.PI * (0.04 + Math.random() * 0.92); pts.push([hx + Math.cos(t) * 3.2, hy + Math.sin(t) * 3.2]); } // band
      for (const side of [-1, 1]) for (let s = 0; s < 150; s++) { const ang = Math.random() * 6.283, rr = Math.sqrt(Math.random()); pts.push([hx + side * 3.05 + Math.cos(ang) * rr * 0.8, hy - 1.1 + Math.sin(ang) * rr * 1.15]); } // ear cups
      // ---- TV (top-right): screen frame + glow + stand + antennae ----
      const tx = 15, ty = 7;
      rectPts(pts, tx - 3.4, ty - 2.4, tx + 3.4, ty + 2.4, 90);
      for (let s = 0; s < 170; s++) pts.push([tx - 3.0 + Math.random() * 6.0, ty - 2.0 + Math.random() * 4.0]); // screen glow
      seg(pts, tx - 1.4, ty - 2.4, tx - 1.9, ty - 3.7, 24); seg(pts, tx + 1.4, ty - 2.4, tx + 1.9, ty - 3.7, 24); // stand
      seg(pts, tx - 1.0, ty + 2.4, tx - 2.6, ty + 4.6, 30); seg(pts, tx + 1.0, ty + 2.4, tx + 2.6, ty + 4.6, 30); // antennae
      fillPts(a, pts, 0.09, 1.2);
      return a;
    }

    // OPERATOR scene — "the maker": a side-view boy at his desk, headphones on, typing on a laptop,
    // a bulb glowing overhead, a stack of books in the far corner, coffee at hand. (the real setup.)
    function fMaker() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      const disc = (cx: number, cy: number, r: number, ry: number, n: number) => { for (let s = 0; s < n; s++) { const ang = Math.random() * 6.283, rr = Math.sqrt(Math.random()); pts.push([cx + Math.cos(ang) * rr * r, cy + Math.sin(ang) * rr * ry]); } };
      const ring = (cx: number, cy: number, r: number, ry: number, n: number) => { for (let s = 0; s < n; s++) { const ang = Math.random() * 6.283; pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * ry]); } };
      // ---- desk ----
      seg(pts, -10, -3.5, 13, -3.5, 240);
      seg(pts, -8, -3.5, -8, -10, 90); seg(pts, 11, -3.5, 11, -10, 90);
      // ---- laptop (right of desk, open screen facing the boy) ----
      seg(pts, 3, -3.5, 8.4, -3.7, 90);          // base
      seg(pts, 8.4, -3.7, 7.1, 1.4, 110);        // screen back edge
      seg(pts, 8.0, -3.7, 6.7, 1.4, 70);         // screen front edge
      for (let s = 0; s < 120; s++) pts.push([6.7 + (8.4 - 6.7) * Math.random(), -3.6 + Math.random() * 5.0]); // screen glow
      // ---- the boy: side profile, seated, facing right toward the laptop ----
      disc(-4, 3.2, 1.5, 1.6, 150);              // head
      for (let s = 0; s < 34; s++) pts.push([-2.55 + Math.random() * 0.5, 2.9 + (Math.random() * 2 - 1) * 0.38]); // nose (faces right)
      for (let s = 0; s < 210; s++) { const t = Math.PI * (0.08 + Math.random() * 0.84); pts.push([-4 + Math.cos(t) * 1.95, 3.3 + Math.sin(t) * 1.95]); } // headphone band
      disc(-5.5, 2.9, 0.75, 1.0, 120);           // near ear cup
      seg(pts, -4, 1.7, -2.9, -3.5, 150);        // torso (leaning to the desk)
      seg(pts, -3.6, 0.9, -1.2, -1.9, 60);       // upper arm
      seg(pts, -1.2, -1.9, 4.6, -3.3, 90);       // forearm → hand typing on the keyboard
      seg(pts, -6.4, -4.2, -6.4, 2.0, 90);       // chair back
      seg(pts, -6.4, -4.2, -2.6, -4.2, 60);      // seat
      seg(pts, -3, -4.2, 0.2, -4.6, 70); seg(pts, 0.2, -4.6, 0.2, -10, 80); // thigh + shin under the desk
      // ---- bulb hanging overhead (warm glow) ----
      seg(pts, 2.5, 14, 2.5, 6.4, 120);          // cord
      seg(pts, 2.0, 6.4, 3.0, 6.4, 16);          // base
      ring(2.5, 5.1, 1.35, 1.5, 110); disc(2.5, 5.1, 1.35, 1.5, 70); // bulb
      for (let s = 0; s < 90; s++) { const ang = Math.random() * 6.283, rr = 1.7 + Math.random() * 2.9; pts.push([2.5 + Math.cos(ang) * rr, 5.1 + Math.sin(ang) * rr]); } // glow halo
      // ---- books stacked in the far corner (top-left shelf) ----
      seg(pts, -21, 4.4, -13, 4.4, 70);
      for (let k = 0; k < 4; k++) { const yy = 4.6 + k * 0.85, off = (k % 2) * 0.6 - 0.3; rectPts(pts, -20 + off, yy, -14 + off, yy + 0.7, 20); }
      // ---- coffee mug on the desk ----
      seg(pts, -1.4, -3.5, -1.4, -2.2, 26); seg(pts, 0.2, -3.5, 0.2, -2.2, 26); seg(pts, -1.4, -3.5, 0.2, -3.5, 16); // body
      for (let s = 0; s < 40; s++) { const t = Math.random() * Math.PI; pts.push([0.2 + Math.sin(t) * 0.7, -2.85 + Math.cos(t) * 0.55]); } // handle
      fillPts(a, pts, 0.1, 1.2);
      return a;
    }

    void fFunnel; void fFlame; void fWave; void fRing; // superseded by the scene formations below
    const T = [
      fWind(), fDoors(), fLoop(), fLattice(), fBars(), fOrbit(),
      fLamp(), fConch(), fMerge(), fBlueprint(), fInvader(), fRings(), fBooks(), fMaker(),
    ];
    const GRADE = grades;

    /* ---------- geometry + shader ---------- */
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(T[0]);
    const aRand = new Float32Array(N);
    const aU = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      aRand[i] = Math.random();
      aU[i] = i / N;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aRand", new THREE.BufferAttribute(aRand, 1));
    geo.setAttribute("aU", new THREE.BufferAttribute(aU, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: window.innerWidth < 700 ? 1.35 : 1.6 },
        uGrad: { value: 0 },
        uAlpha: { value: 0.82 },
        uColA: { value: new THREE.Color(1, 1, 1) },
        uColB: { value: new THREE.Color(1, 1, 1) },
      },
      vertexShader: [
        "attribute float aRand; attribute float aU;",
        "uniform float uTime; uniform float uSize; uniform float uGrad;",
        "varying float vMix; varying float vSeed;",
        "void main(){",
        "  vSeed = aRand;",
        "  vMix = mix(aRand, aU, uGrad);",
        "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
        "  gl_PointSize = uSize * (0.55 + aRand*0.95) * (300.0 / -mv.z);",
        "  gl_Position = projectionMatrix * mv;",
        "}",
      ].join("\n"),
      fragmentShader: [
        "precision mediump float;",
        "uniform vec3 uColA; uniform vec3 uColB; uniform float uTime; uniform float uAlpha;",
        "varying float vMix; varying float vSeed;",
        "void main(){",
        "  vec2 p = gl_PointCoord - 0.5;",
        "  float d = length(p);",
        "  float glow = smoothstep(0.5, 0.30, d) * 0.38;",
        "  float core = smoothstep(0.20, 0.02, d);",
        "  float a = glow + core;",
        "  float fl = 0.78 + 0.22*sin(uTime*2.4 + vSeed*43.7);",
        "  vec3 col = mix(uColA, uColB, clamp(vMix,0.0,1.0));",
        // lift the crystals a touch lighter/warmer for a softer backdrop
        "  col = mix(col, vec3(0.96, 0.90, 0.80), 0.16);",
        "  gl_FragColor = vec4(col, a * fl * uAlpha);",
        "}",
      ].join("\n"),
    });
    const points = new THREE.Points(geo, mat);
    scene3d.add(points);

    /* ---------- scroll score ---------- */
    const sceneEls = Array.prototype.slice.call(document.querySelectorAll(".scene")) as HTMLElement[];
    const railLinks = document.querySelectorAll(".rail a");
    function setRail(idx: number) {
      railLinks.forEach((a) => {
        a.classList.toggle("on", +((a as HTMLElement).dataset.r ?? -1) === idx);
      });
    }
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
      setRail(Math.max(0, Math.min(SCENES - 1, Math.round(f))));
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ---------- mouse parallax ---------- */
    let mx = 0.5,
      my = 0.5,
      cx = 0,
      cy = 0;
    const onPointer = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth;
      my = e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    /* ---------- resize ---------- */
    function onResize() {
      if (!renderer) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      points.scale.x = Math.min(1, Math.max(0.55, w / h / 1.7));
      computeKeys();
      onScroll();
    }
    window.addEventListener("resize", onResize);
    onResize();
    const lateKeys = setTimeout(() => {
      computeKeys();
      onScroll();
    }, 700);

    /* ---------- frame loop ---------- */
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const colA = mat.uniforms.uColA.value as THREE.Color;
    const colB = mat.uniforms.uColB.value as THREE.Color;
    const t0 = performance.now();
    let raf = 0;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (document.hidden || !renderer) return;
      const t = RM ? 0 : (now - t0) / 1000;
      mat.uniforms.uTime.value = t;

      fSmooth += (fTarget - fSmooth) * (RM ? 1 : 0.06);
      const sa = Math.max(0, Math.min(SCENES - 2, Math.floor(fSmooth)));
      const te = Math.max(0, Math.min(1, fSmooth - sa));
      const e = te * te * (3 - 2 * te);
      const sb = sa + 1;

      const W = (s: number) => (sa === s ? 1 - e : 0) + (sb === s ? e : 0);
      const w0 = W(0),
        w4 = W(4),
        w5 = W(5),
        w6 = W(6);
      const rotC = Math.cos(t * 0.1),
        rotS = Math.sin(t * 0.1);
      const A = T[sa],
        B = T[sb];
      const p = posAttr.array as Float32Array;
      const breathe = 1 + Math.sin(t * 0.9) * 0.05 * w5;

      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const seed = aRand[i];
        let ax = A[i3];
        let ay = A[i3 + 1];
        let az = A[i3 + 2];
        let bx = B[i3];
        let by = B[i3 + 1];
        let bz = B[i3 + 2];
        // METHOD (formation 2): stream the particles live around the ∞ loop
        if (sa === 2) { const q = loopAt(i, t); ax = q[0]; ay = q[1]; az = q[2]; }
        if (sb === 2) { const q = loopAt(i, t); bx = q[0]; by = q[1]; bz = q[2]; }
        if (sa === 3) {
          const ax2 = ax * rotC - az * rotS;
          az = ax * rotS + az * rotC;
          ax = ax2;
        }
        if (sb === 3) {
          const bx2 = bx * rotC - bz * rotS;
          bz = bx * rotS + bz * rotC;
          bx = bx2;
        }
        let px = ax + (bx - ax) * e,
          py = ay + (by - ay) * e,
          pz = az + (bz - az) * e;

        if (!RM) {
          let dx = Math.sin(t * 0.6 + seed * 7.0) * 0.16;
          let dy = Math.cos(t * 0.5 + seed * 5.0) * 0.16;
          let dz = 0;
          if (w0 > 0) {
            dx += Math.sin(t * 0.32 + ay * 0.21 + seed * 4.0) * 2.6 * w0;
            dy += Math.cos(t * 0.27 + ax * 0.17 + seed * 1.7) * 1.5 * w0;
            dz += Math.sin(t * 0.22 + seed * 3.1) * 1.3 * w0;
          }
          if (w4 > 0) {
            // ARENA bars: a gentle per-column bob, like live values ticking up
            dy += Math.sin(t * 1.5 + Math.round(px * 0.4) * 1.3 + seed * 0.4) * 0.38 * w4;
          }
          if (w6 > 0 && py > -3) {
            // STORIES lamp: the flame dances (only the part above the wick)
            dx += Math.sin(t * 2.6 + seed * 7.0) * 0.3 * w6;
            dy += (0.12 + 0.32 * Math.abs(Math.sin(t * 3.1 + seed * 9.0))) * w6;
          }
          px += dx;
          py += dy;
          pz += dz;
        }
        if (w5 > 0) {
          px *= breathe;
          py *= breathe;
        }

        p[i3] = px;
        p[i3 + 1] = py;
        p[i3 + 2] = pz;
      }
      posAttr.needsUpdate = true;

      /* grade lerp */
      const ga = GRADE[sa],
        gb = GRADE[sb];
      colA.setRGB(
        ga[0][0] + (gb[0][0] - ga[0][0]) * e,
        ga[0][1] + (gb[0][1] - ga[0][1]) * e,
        ga[0][2] + (gb[0][2] - ga[0][2]) * e
      );
      colB.setRGB(
        ga[1][0] + (gb[1][0] - ga[1][0]) * e,
        ga[1][1] + (gb[1][1] - ga[1][1]) * e,
        ga[1][2] + (gb[1][2] - ga[1][2]) * e
      );
      mat.uniforms.uGrad.value = ga[2] + (gb[2] - ga[2]) * e;

      /* camera drift */
      cx += ((mx - 0.5) * 3.2 - cx) * 0.04;
      cy += (-(my - 0.5) * 2.0 - cy) * 0.04;
      camera.position.x = cx;
      camera.position.y = cy;
      camera.lookAt(0, 0, 0);

      renderer.render(scene3d, camera);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(lateKeys);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      renderer?.dispose();
    };
  }, [grades]);

  return <canvas ref={canvasRef} id="field" aria-hidden="true" />;
}
