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
    const SCENES = 6;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

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
    // DOORS scene formation — a thin standing figure (the visitor) facing a row of OPEN doors.
    // Smooth line-drawn glyphs (no pixel grid): a slim person on the left, four ajar doors
    // whose panels swing toward the viewer in light perspective, warm light spilling out.
    function fDoors() {
      const a = new Float32Array(N * 3);
      const pts: Array<[number, number]> = [];
      const push = (x: number, y: number) => pts.push([x, y]);
      const line = (x0: number, y0: number, x1: number, y1: number, n: number) => {
        for (let s = 0; s < n; s++) { const t = Math.random(); push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t); }
      };
      // ---- the visitor: a slim full-body silhouette, far left, facing the doors ----
      const FX = -23;
      for (let s = 0; s < 110; s++) { const ang = Math.random() * 6.283, r = 1.05 * Math.sqrt(Math.random()); push(FX + Math.cos(ang) * r, 7.3 + Math.sin(ang) * r); } // head
      line(FX, 6.0, FX, -1.4, 190);                 // spine / torso (thin)
      line(FX - 1.5, 5.2, FX + 1.5, 5.2, 55);       // shoulders
      line(FX - 1.5, 5.2, FX - 2.7, 0.4, 85);       // left arm
      line(FX + 1.5, 5.2, FX + 2.7, 0.4, 85);       // right arm
      line(FX, -1.4, FX - 1.7, -9.2, 115);          // left leg
      line(FX, -1.4, FX + 1.7, -9.2, 115);          // right leg
      // ---- four OPEN doors across the right ----
      // Each is a portal (frame) with the leaf swung open INTO the room: hinged on the right
      // jamb, its tall near/free edge sits left of centre and the top & bottom edges recede to
      // the hinge — leaving a dark opening on the left with faint light spilling out.
      const XC = [-11, -2, 7, 16], DB = -9.4, DT = 1.8, DW = 2.15;
      for (const xc of XC) {
        const xL = xc - DW, xR = xc + DW;
        line(xL, DB, xL, DT, 120);                  // left jamb
        line(xR, DB, xR, DT, 120);                  // right jamb (hinge side)
        line(xL, DT, xR, DT, 62);                   // lintel
        line(xL, DB, xR, DB, 62);                   // threshold
        const xn = xc - DW * 0.25, ins = 0.9;       // near (free) edge x + perspective inset at the hinge
        line(xn, DB - 0.4, xn, DT + 0.4, 120);      // near edge — tallest, closest to viewer
        line(xn, DT + 0.4, xR, DT - ins, 85);       // top edge receding to the hinge
        line(xn, DB - 0.4, xR, DB + ins, 85);       // bottom edge receding to the hinge
        for (let s = 0; s < 58; s++) { const u = Math.random(); const xx = xn + (xR - xn) * u; const yT = (DT + 0.4) + ((DT - ins) - (DT + 0.4)) * u, yB = (DB - 0.4) + ((DB + ins) - (DB - 0.4)) * u; push(xx, yB + (yT - yB) * Math.random()); } // leaf face
        for (let s = 0; s < 12; s++) push(xn - 0.28, (DB + DT) / 2 + (Math.random() * 2 - 1) * 0.25); // knob on the free edge
        for (let s = 0; s < 26; s++) push(xL + (xn - xL) * Math.random() * 0.9, DB + Math.random() * (DT - DB)); // light spilling from the opening
      }
      for (let i = 0; i < N; i++) {
        const q = pts[i % pts.length];
        a[i * 3] = q[0] + rnd(-0.12, 0.12);
        a[i * 3 + 1] = q[1] + rnd(-0.12, 0.12);
        a[i * 3 + 2] = rnd(-1.1, 1.1);
      }
      return a;
    }

    // METHOD scene formation — a horizontal figure-8 (∞), particles circulating around it.
    // "One loop that transfers." Gerono lemniscate x=W·cosθ, y=H·sin2θ; each particle keeps a
    // phase θ0 (∝ index → an even cyan→indigo gradient around the curve) and flows in the frame loop.
    const loopTheta = new Float32Array(N);
    const loopOx = new Float32Array(N), loopOy = new Float32Array(N), loopZ = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      loopTheta[i] = (i / N) * Math.PI * 2;
      loopOx[i] = rnd(-0.5, 0.5); loopOy[i] = rnd(-0.5, 0.5); loopZ[i] = rnd(-1.4, 1.4);
    }
    const LOOP_W = 15, LOOP_H = 6.6, LOOP_SPD = 0.5;
    const loopAt = (i: number, tt: number): [number, number, number] => {
      const th = loopTheta[i] + tt * LOOP_SPD;
      const c = Math.cos(th), s = Math.sin(th);
      return [LOOP_W * c + loopOx[i], LOOP_H * 2 * s * c + loopOy[i], loopZ[i]];
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

    void fFunnel; void fFlame; void fWave; void fRing; // superseded by fLoop / fBars / fOrbit
    const T = [fWind(), fDoors(), fLoop(), fLattice(), fBars(), fOrbit()];
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
      keys = sceneEls.map((el) =>
        Math.max(0, el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2)
      );
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
        w5 = W(5);
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
