"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The listen.zephyrcode.live oscilloscope, ported 1:1 from the inline script
 * in /_reference/listen.html: a canvas trace morphs per proof tab, crossfading
 * (blend += .04) between the previous and current proof's voices. The fit(),
 * n1() and yOf() math is copied verbatim. Reduced motion renders the single
 * static frame at t=1.2 exactly like the source. All copy arrives via
 * props/rows — this component contains zero content strings.
 */

export type WaveVoice = {
  c: string;
  w: number;
  f: number;
  a: number;
  sp: number;
  ph?: number;
  off?: number;
  sub?: number;
  noise?: number;
  ripF?: number;
  ripA?: number;
  burst?: boolean;
};

export type WaveTrack = {
  title: string;
  artist: string;
  why: string;
  position: number;
};

export type WaveProof = {
  n: string;
  name: string;
  claim: string;
  voices: WaveVoice[];
  position: number;
  tracks: WaveTrack[];
};

function n1(x: number): number {
  return Math.sin(x * 1.7) + Math.sin(x * 2.9 + 1.3) * 0.6 + Math.sin(x * 4.7 + 2.7) * 0.35;
}

function yOf(v: WaveVoice, x: number, t: number, W: number, H: number): number {
  const ph = v.ph || 0,
    off = v.off || 0;
  let y = Math.sin((x / W) * Math.PI * 2 * v.f + t * v.sp + ph) * v.a;
  if (v.sub) y += Math.sin((x / W) * Math.PI * 2 * v.f * 0.5 + t * v.sp * 0.6) * v.a * v.sub;
  if (v.noise) y += n1(x * 0.05 + t * 1.2) * v.noise;
  if (v.ripF) y += Math.sin((x / W) * Math.PI * 2 * v.ripF + t * 3.4) * (v.ripA || 0);
  if (v.burst) {
    const cyc = t % 2.1,
      e = cyc < 0.34 ? Math.pow(1 - cyc / 0.34, 2) : 0;
    y += Math.sin((x / W) * Math.PI * 2 * 16 + t * 9) * e * 58;
    y *= 1 + e * 0.4;
  }
  return H / 2 + y + off;
}

export function ProofWaveform({
  proofs,
  labPrefix,
  hzLine,
  tablistLabel,
}: {
  proofs: WaveProof[];
  labPrefix: string;
  hzLine: string;
  tablistLabel: string;
}) {
  const [cur, setCur] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Crossfade state lives in a ref so the rAF loop reads it without re-running the effect.
  const waveRef = useRef({ cur: 0, prev: 0, blend: 1 });

  function tune(i: number): void {
    const s = waveRef.current;
    if (i !== s.cur) {
      s.prev = s.cur;
      s.cur = i;
      s.blend = 0;
    }
    setCur(i);
  }

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = waveRef.current;

    function fit(): void {
      if (!cv) return;
      const w = cv.parentElement ? cv.parentElement.clientWidth : cv.clientWidth;
      cv.width = w * 2;
      cv.height = 340;
      cv.style.height = "170px";
    }
    window.addEventListener("resize", fit);
    fit();

    function drawSet(voices: WaveVoice[], t: number, alpha: number): void {
      if (!cv || !ctx) return;
      const W = cv.width,
        H = cv.height;
      voices.forEach((v) => {
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = v.c;
        ctx.lineWidth = v.w * 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let x = 0; x <= W; x += 4) {
          const y = yOf(v, x, t, W, H);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    let t = 0;
    let raf = 0;
    function frame(): void {
      if (!cv || !ctx) return;
      if (!RM) raf = requestAnimationFrame(frame);
      t += 0.016;
      s.blend = Math.min(1, s.blend + 0.04);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.strokeStyle = "rgba(236,226,211,.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cv.height / 2);
      ctx.lineTo(cv.width, cv.height / 2);
      ctx.stroke();
      const prev = proofs[s.prev];
      const curr = proofs[s.cur];
      if (s.blend < 1 && prev) drawSet(prev.voices, t, 1 - s.blend);
      if (curr) drawSet(curr.voices, t, s.blend);
    }
    if (RM) {
      t = 1.2;
      frame();
    } else {
      frame();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [proofs]);

  const p = proofs[cur];
  if (!p) return null;

  return (
    <>
      <div className="proofs rv" role="tablist" aria-label={tablistLabel}>
        {proofs.map((pr, i) => (
          <button
            key={pr.n}
            type="button"
            className={i === cur ? "pf on" : "pf"}
            role="tab"
            aria-selected={i === cur}
            onClick={() => tune(i)}
          >
            {`${pr.n} · ${pr.name}`}
          </button>
        ))}
      </div>

      <section className="scope rv">
        <span className="lab">{`${labPrefix}${p.n} · ${p.name}`}</span>
        <canvas ref={canvasRef} width={920} height={170} aria-hidden="true" />
        <span className="hz">{hzLine}</span>
      </section>
      <p className="claim rv">{p.claim}</p>

      <section className="tracks rv" aria-live="polite">
        {p.tracks.map((tr) => (
          <div key={tr.title} className="trk">
            <span className="t">{tr.title}</span>
            <span className="a">{tr.artist}</span>
            <span className="why">{tr.why}</span>
          </div>
        ))}
      </section>
    </>
  );
}
