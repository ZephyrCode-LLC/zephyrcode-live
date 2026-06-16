"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The hero blade — drag the gauge and the steel runs the tempering-colour
 * spectrum (straw → bronze → purple → blue). Ambient sweep until first touch,
 * then it locks to the slider. Reduced-motion = one static "working edge" frame.
 * Faithful port of /_reference/temper.html; all copy/params come from the DB.
 */

type Stop = { h: number; rgb: [number, number, number] };
type Grade = { max: number; hex: string; label: string; desc: string };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function TemperBlade({
  stops,
  grades,
  hint,
}: {
  stops: Stop[];
  grades: Grade[];
  hint: string;
}) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const userHRef = useRef<number | null>(null);
  const [grade, setGrade] = useState<Grade>(grades[0]);

  function heatColor(h: number): [number, number, number] {
    for (let i = 0; i < stops.length - 1; i++) {
      if (h >= stops[i].h && h <= stops[i + 1].h) {
        const t = (h - stops[i].h) / (stops[i + 1].h - stops[i].h);
        const a = stops[i].rgb;
        const b = stops[i + 1].rgb;
        return [
          Math.round(lerp(a[0], b[0], t)),
          Math.round(lerp(a[1], b[1], t)),
          Math.round(lerp(a[2], b[2], t)),
        ];
      }
    }
    return stops[stops.length - 1].rgb;
  }
  function gradeFor(v: number): Grade {
    for (const g of grades) if (v <= g.max) return g;
    return grades[grades.length - 1];
  }

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let phase = 0;
    let dir = 1;
    let raf = 0;

    function fit() {
      const w = cv!.parentElement?.clientWidth ?? 700;
      cv!.width = w * 2;
      cv!.height = 256;
      cv!.style.height = "128px";
    }
    function bladePath(W: number, H: number) {
      const cy = H / 2;
      const tang = W * 0.1;
      const tip = W * 0.97;
      const half = H * 0.18;
      ctx!.beginPath();
      ctx!.moveTo(W * 0.03, cy - H * 0.06);
      ctx!.lineTo(tang, cy - H * 0.06);
      ctx!.lineTo(tang, cy - half);
      ctx!.lineTo(tip - half, cy - half);
      ctx!.quadraticCurveTo(tip, cy - half * 0.4, tip, cy);
      ctx!.quadraticCurveTo(tip, cy + half * 0.4, tip - half, cy + half);
      ctx!.lineTo(tang, cy + half);
      ctx!.lineTo(tang, cy + H * 0.06);
      ctx!.lineTo(W * 0.03, cy + H * 0.06);
      ctx!.closePath();
    }
    function paintColored(colorAt: (x: number) => [number, number, number], frontX: number | null) {
      const W = cv!.width;
      const H = cv!.height;
      ctx!.clearRect(0, 0, W, H);
      bladePath(W, H);
      ctx!.save();
      ctx!.clip();
      const tang = W * 0.1;
      const tip = W * 0.97;
      const g = ctx!.createLinearGradient(tang, 0, tip, 0);
      for (let s = 0; s <= 24; s++) {
        const x = s / 24;
        const c = colorAt(x);
        g.addColorStop(x, `rgb(${c[0]},${c[1]},${c[2]})`);
      }
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, W, H);
      const sh = ctx!.createLinearGradient(0, H * 0.28, 0, H * 0.72);
      sh.addColorStop(0, "rgba(255,255,255,.18)");
      sh.addColorStop(0.5, "rgba(255,255,255,0)");
      sh.addColorStop(1, "rgba(0,0,0,.24)");
      ctx!.fillStyle = sh;
      ctx!.fillRect(0, 0, W, H);
      if (frontX != null) {
        const rg = ctx!.createRadialGradient(frontX, H / 2, 0, frontX, H / 2, H * 1.1);
        rg.addColorStop(0, "rgba(255,140,70,.4)");
        rg.addColorStop(1, "rgba(255,140,70,0)");
        ctx!.fillStyle = rg;
        ctx!.fillRect(frontX - H, 0, H * 2, H);
      }
      ctx!.restore();
      bladePath(W, H);
      ctx!.strokeStyle = "rgba(236,226,211,.22)";
      ctx!.lineWidth = 2;
      ctx!.stroke();
    }
    function paint() {
      const uh = userHRef.current;
      if (uh != null) {
        paintColored((x) => heatColor(Math.max(0, uh - (1 - x) * 0.05)), null);
      } else {
        const W = cv!.width;
        const tang = W * 0.1;
        const tip = W * 0.97;
        const span = tip - tang;
        paintColored(
          (x) => {
            const local = phase - x;
            return heatColor(local < 0 ? 0 : Math.min(1, local * 1.6));
          },
          phase > 0 && phase < 1.05 ? tang + span * Math.min(phase, 1) : null
        );
      }
    }
    function ambient() {
      if (userHRef.current != null || RM) return;
      raf = requestAnimationFrame(ambient);
      phase += 0.0016 * dir;
      if (phase > 1.18) {
        phase = 1.18;
        dir = -1;
      }
      if (phase < 0) {
        phase = 0;
        dir = 1;
      }
      paint();
    }
    const onResize = () => {
      fit();
      paint();
    };
    window.addEventListener("resize", onResize);
    fit();
    if (RM) {
      userHRef.current = 0.78;
      paint();
    } else {
      paint();
      ambient();
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    userHRef.current = v / 100;
    setGrade(gradeFor(v));
    const cv = cvRef.current;
    const ctx = cv?.getContext("2d");
    if (cv && ctx) {
      // redraw immediately at the new temper (ambient loop has stopped)
      const W = cv.width;
      const H = cv.height;
      const uh = v / 100;
      const cy = H / 2;
      const tang = W * 0.1;
      const tip = W * 0.97;
      const half = H * 0.18;
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(W * 0.03, cy - H * 0.06);
        ctx.lineTo(tang, cy - H * 0.06);
        ctx.lineTo(tang, cy - half);
        ctx.lineTo(tip - half, cy - half);
        ctx.quadraticCurveTo(tip, cy - half * 0.4, tip, cy);
        ctx.quadraticCurveTo(tip, cy + half * 0.4, tip - half, cy + half);
        ctx.lineTo(tang, cy + half);
        ctx.lineTo(tang, cy + H * 0.06);
        ctx.lineTo(W * 0.03, cy + H * 0.06);
        ctx.closePath();
      };
      ctx.clearRect(0, 0, W, H);
      path();
      ctx.save();
      ctx.clip();
      const g = ctx.createLinearGradient(tang, 0, tip, 0);
      for (let s = 0; s <= 24; s++) {
        const x = s / 24;
        const c = heatColor(Math.max(0, uh - (1 - x) * 0.05));
        g.addColorStop(x, `rgb(${c[0]},${c[1]},${c[2]})`);
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const sh = ctx.createLinearGradient(0, H * 0.28, 0, H * 0.72);
      sh.addColorStop(0, "rgba(255,255,255,.18)");
      sh.addColorStop(0.5, "rgba(255,255,255,0)");
      sh.addColorStop(1, "rgba(0,0,0,.24)");
      ctx.fillStyle = sh;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      path();
      ctx.strokeStyle = "rgba(236,226,211,.22)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  return (
    <div className="bladestage rv">
      <canvas ref={cvRef} id="blade" width={1000} height={128} aria-hidden="true" />
      <div className="gauge">
        <input
          type="range"
          min={0}
          max={100}
          defaultValue={8}
          onChange={onInput}
          aria-label="Temper the blade from straw to blue"
        />
        <div className="read">
          <span className="nm" style={{ ["--c" as string]: grade.hex }}>
            {grade.label}
          </span>
          <span className="ds">{grade.desc}</span>
        </div>
        <p className="hintline">{hint}</p>
      </div>
    </div>
  );
}
