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
    const SCENES = 13;
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
      // ---- the visitor: a slim full-body figure, centred, on top ----
      const FX = 0;
      for (let s = 0; s < 100; s++) { const ang = Math.random() * 6.283, r = 0.95 * Math.sqrt(Math.random()); push(FX + Math.cos(ang) * r, 11.0 + Math.sin(ang) * r); } // head
      seg(pts, FX, 9.7, FX, 2.6, 180);              // torso (thin spine)
      seg(pts, FX - 1.35, 8.9, FX + 1.35, 8.9, 50); // shoulders
      seg(pts, FX - 1.35, 8.9, FX - 2.5, 3.9, 80);  // left arm
      seg(pts, FX + 1.35, 8.9, FX + 2.5, 3.9, 80);  // right arm
      seg(pts, FX, 2.6, FX - 1.6, -1.3, 105);       // left leg
      seg(pts, FX, 2.6, FX + 1.6, -1.3, 105);       // right leg
      // ---- five OPEN doors in a row below ----
      const XC = [-20, -10, 0, 10, 20], DB = -11.4, DT = -2.2, DW = 1.7;
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

    // ARCADE scene — a classic pixel "space invader" (the playable toys).
    function fInvader() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      const rows = ["00100000100", "00010001000", "00111111100", "01101110110", "11111111111", "10111111101", "10100000101", "00011011000"];
      const cols = rows[0].length, rws = rows.length, G = 2.0;
      for (let r = 0; r < rws; r++) for (let c = 0; c < cols; c++) if (rows[r][c] === "1") {
        const cx = (c - (cols - 1) / 2) * G, cy = ((rws - 1) / 2 - r) * G;
        for (let s = 0; s < 26; s++) pts.push([cx + (Math.random() * 2 - 1) * G * 0.5, cy + (Math.random() * 2 - 1) * G * 0.5]);
      }
      fillPts(a, pts, 0.1, 1.2);
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

    // LIBRARY scene — a row of book spines on a shelf (books & films, by mood).
    function fBooks() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      const shelfY = -8.5;
      seg(pts, -22, shelfY, 22, shelfY, 240); // the shelf
      const heights = [10, 8.5, 11, 7.5, 9.5, 12, 8, 10.5, 9, 11.5, 7, 10, 8.5, 11, 9.5];
      let x = -21;
      for (let b = 0; b < heights.length && x < 21; b++) {
        const w = 1.4 + ((b * 0.37) % 1.0), h = heights[b], x0 = x, x1 = x + w, y0 = shelfY, y1 = shelfY + h;
        seg(pts, x0, y0, x0, y1, 68); seg(pts, x1, y0, x1, y1, 68); seg(pts, x0, y1, x1, y1, 26); // spine outline
        for (let s = 0; s < 40; s++) pts.push([x0 + (x1 - x0) * Math.random(), y0 + (y1 - y0) * Math.random()]); // spine fill
        x = x1 + 0.5;
      }
      fillPts(a, pts, 0.1, 1.2);
      return a;
    }

    // OPERATOR scene — a single figure (the maker), centred and grounded on a line.
    function fMaker() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      for (let s = 0; s < 160; s++) { const ang = Math.random() * 6.283, r = 1.25 * Math.sqrt(Math.random()); pts.push([Math.cos(ang) * r, 8.5 + Math.sin(ang) * r]); } // head
      seg(pts, 0, 7.0, 0, -1.0, 240);      // torso
      seg(pts, -1.9, 6.0, 1.9, 6.0, 70);   // shoulders
      seg(pts, -1.9, 6.0, -3.0, 0.4, 110); // left arm
      seg(pts, 1.9, 6.0, 3.0, 0.4, 110);   // right arm
      seg(pts, 0, -1.0, -2.0, -8.5, 150);  // left leg
      seg(pts, 0, -1.0, 2.0, -8.5, 150);   // right leg
      seg(pts, -7, -8.7, 7, -8.7, 180);    // ground line
      fillPts(a, pts, 0.12, 1.1);
      return a;
    }

    void fFunnel; void fFlame; void fWave; void fRing; // superseded by the scene formations below
    const T = [
      fWind(), fDoors(), fLoop(), fLattice(), fBars(), fOrbit(),
      fLamp(), fMerge(), fBlueprint(), fInvader(), fRings(), fBooks(), fMaker(),
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
