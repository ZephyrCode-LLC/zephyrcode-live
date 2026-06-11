"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The lamp: a small fire that steadies when watched. Faithful port of the
 * antyodaya landing canvas — particle flame over a brass diya, calm easing
 * toward 1 while hovered, caption swap, reduced-motion = one static frame.
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  sz: number;
  seed: number;
};

export function DiyaFlame({ idleCaption, watchedCaption }: { idleCaption: string; watchedCaption: string }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const W = cv.width;
    const H = cv.height;
    const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let calm = 0;
    let calmT = 0;
    let t = 0;
    let raf = 0;
    const parts: Particle[] = [];

    const onEnter = () => (calmT = 1);
    const onLeave = () => (calmT = 0);
    cv.addEventListener("pointerenter", onEnter);
    cv.addEventListener("pointerleave", onLeave);

    function diya() {
      if (!ctx) return;
      ctx.strokeStyle = "rgba(201,164,92,.85)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(W / 2 - 46, H - 66);
      ctx.quadraticCurveTo(W / 2, H - 30, W / 2 + 46, H - 66);
      ctx.stroke();
      ctx.strokeStyle = "rgba(201,164,92,.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 58, H - 74);
      ctx.quadraticCurveTo(W / 2, H - 32, W / 2 + 58, H - 74);
      ctx.stroke();
      ctx.fillStyle = "rgba(236,226,211,.5)";
      ctx.fillRect(W / 2 - 2, H - 86, 4, 12); /* wick */
    }
    function spawn() {
      const jit = (1 - calm) * 1 + 0.25;
      parts.push({
        x: W / 2 + (Math.random() - 0.5) * 10 * jit,
        y: H - 88,
        vx: (Math.random() - 0.5) * 0.5 * jit,
        vy: -(1.4 + Math.random() * 1.3),
        life: 1,
        sz: 5 + Math.random() * 7,
        seed: Math.random() * 9,
      });
    }
    function frame() {
      if (!ctx) return;
      if (!RM) raf = requestAnimationFrame(frame);
      t += 0.016;
      calm += (calmT - calm) * 0.05;
      ctx.clearRect(0, 0, W, H);
      diya();
      if (parts.length < 90) {
        spawn();
        spawn();
      }
      ctx.globalCompositeOperation = "lighter";
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx + Math.sin(t * 3 + p.seed) * 0.55 * (1 - calm * 0.7);
        p.y += p.vy;
        p.life -= 0.012 + (1 - calm) * 0.004;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        const l = p.life;
        const r = p.sz * l;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.2);
        if (l > 0.6) {
          g.addColorStop(0, `rgba(255,196,128,${l * 0.95})`);
          g.addColorStop(0.4, `rgba(232,93,42,${l * 0.8})`);
        } else {
          g.addColorStop(0, `rgba(232,93,42,${l * 0.8})`);
          g.addColorStop(0.5, `rgba(201,164,92,${l * 0.45})`);
        }
        g.addColorStop(1, "rgba(16,14,12,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2.2, 0, 7);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    if (RM) {
      for (let k = 0; k < 60; k++) {
        spawn();
        parts.forEach((p) => {
          p.y -= 2;
          p.life -= 0.01;
        });
      }
      frame();
    } else {
      frame();
    }
    return () => {
      cancelAnimationFrame(raf);
      cv.removeEventListener("pointerenter", onEnter);
      cv.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="lampwrap rv">
      <canvas
        ref={cvRef}
        className="lamp"
        width={300}
        height={380}
        aria-hidden="true"
        onPointerEnter={() => setWatched(true)}
        onPointerLeave={() => setWatched(false)}
      />
      <p className={`lampcap${watched ? " watched" : ""}`}>
        {watched ? watchedCaption : idleCaption}
      </p>
    </div>
  );
}
