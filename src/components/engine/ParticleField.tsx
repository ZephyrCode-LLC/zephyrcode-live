"use client";

import { useEffect, useRef } from "react";

/**
 * The hub's signature field — a faithful port of the Constellation Review demo's
 * "particles resolve" MATRIX, driven by the reader's own descent (no buttons):
 *
 *   • At the top (arrival) the grid drifts in CHAOS — warm raudra vermillion (fire).
 *   • As you scroll DOWN into the method it RESOLVES into a cool slate CONNECTED
 *     MATRIX (architecture): each node eases to its lattice home and the connecting
 *     lines draw in. Scrolling back up disperses it.
 *
 * "Descend into the research → it resolves into structure" — the background performs
 * the method. Colour lerps vermillion rgb(211,74,52) → slate rgb(120,150,196), and
 * the grid lines fade in with the resolve, exactly as the demo. Honours
 * prefers-reduced-motion (no drift; resolves on scroll to a still matrix).
 */
export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    type P = { hx: number; hy: number; x: number; y: number; ph: number; sp: number };
    let parts: P[] = [];

    function build() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      c!.width = w * dpr;
      c!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // ~one node per 58px, clamped — a legible matrix at any viewport.
      cols = Math.max(10, Math.min(34, Math.round(w / 58)));
      rows = Math.max(7, Math.min(22, Math.round(h / 58)));
      const gx0 = w * 0.06,
        gx1 = w * 0.94,
        gy0 = h * 0.08,
        gy1 = h * 0.92;
      parts = [];
      for (let r = 0; r < rows; r++)
        for (let col = 0; col < cols; col++) {
          const hx = gx0 + (gx1 - gx0) * (cols > 1 ? col / (cols - 1) : 0.5);
          const hy = gy0 + (gy1 - gy0) * (rows > 1 ? r / (rows - 1) : 0.5);
          parts.push({ hx, hy, x: Math.random() * w, y: Math.random() * h, ph: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.7 });
        }
    }
    build();
    window.addEventListener("resize", build);

    // Resolve progress driven by the descent: 0 (top, chaos) → 1 (scrolled into the
    // method, architecture). Fully resolves within ~1.2 viewports, then holds.
    let kTarget = 0;
    let k = 0;
    function onScroll() {
      const y = window.scrollY || window.pageYOffset;
      kTarget = Math.max(0, Math.min(1, y / (window.innerHeight * 1.2)));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const idx = (r: number, col: number) => r * cols + col;
    const t0 = performance.now();
    let raf = 0;

    function frame(now: number) {
      const t = (now - t0) / 1000;
      k += (kTarget - k) * 0.05; // ease toward the scroll-driven target (settles on stop)
      const drift = RM ? 0 : 1;
      ctx!.clearRect(0, 0, w, h);

      for (const p of parts) {
        const wx = p.hx + Math.sin(t * p.sp + p.ph) * 30 * drift + Math.cos(t * 0.5 * p.sp + p.ph) * 16 * drift;
        const wy = p.hy + Math.cos(t * p.sp + p.ph) * 22 * drift + Math.sin(t * 0.4 * p.sp) * 14 * drift;
        p.x = wx * (1 - k) + p.hx * k;
        p.y = wy * (1 - k) + p.hy * k;
      }

      // The connected matrix draws in as it resolves (the architecture), in slate.
      // Lines strengthen with the resolve so the lattice reads clearly through the
      // scene scrim and dominates the structural gaps between scenes.
      if (k > 0.1) {
        ctx!.lineWidth = 1.1;
        for (let r = 0; r < rows; r++)
          for (let col = 0; col < cols; col++) {
            const p = parts[idx(r, col)];
            if (col < cols - 1) {
              const q = parts[idx(r, col + 1)];
              ctx!.strokeStyle = "rgba(120,150,196," + 0.42 * k + ")";
              ctx!.beginPath();
              ctx!.moveTo(p.x, p.y);
              ctx!.lineTo(q.x, q.y);
              ctx!.stroke();
            }
            if (r < rows - 1) {
              const q = parts[idx(r + 1, col)];
              ctx!.strokeStyle = "rgba(120,150,196," + 0.42 * k + ")";
              ctx!.beginPath();
              ctx!.moveTo(p.x, p.y);
              ctx!.lineTo(q.x, q.y);
              ctx!.stroke();
            }
          }
      }

      // Colour: vermillion (fire / chaos) → slate (stillness / order), with a soft
      // bloom so the nodes glow through the scrim at the edges and in the gaps.
      const cr = Math.round(211 * (1 - k) + 120 * k);
      const cg = Math.round(74 * (1 - k) + 150 * k);
      const cb = Math.round(52 * (1 - k) + 196 * k);
      ctx!.fillStyle = "rgba(" + cr + "," + cg + "," + cb + ",0.95)";
      ctx!.shadowColor = "rgba(" + cr + "," + cg + "," + cb + ",0.9)";
      ctx!.shadowBlur = 6;
      const rad = 1.8 + 1.4 * k;
      for (const p of parts) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, rad, 0, 6.283);
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <canvas ref={canvasRef} id="field" aria-hidden="true" />;
}
