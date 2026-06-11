"use client";

import { useState } from "react";

/**
 * The 28-day consequence engine, ported exactly from the source page:
 * a 7-column grid of aria-pressed toggle buttons, a ghost (all-hit) bezier
 * path versus the earned path (same path() math: W 640, H 96, insets 8/16),
 * save-file integrity % and the verdict ladder lookup. The initial draw
 * carries the two preloaded honest misses. All copy arrives as props.
 */

const W = 640;
const H = 96;
const DAYS = 28;

function path(pts: number[]): string {
  let d = "";
  for (let i = 0; i < pts.length; i++) {
    const x = (i / (pts.length - 1)) * W;
    const y = H - 8 - (pts[i] / 100) * (H - 16);
    if (i === 0) {
      d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
    } else {
      const px = ((i - 1) / (pts.length - 1)) * W;
      const py = H - 8 - (pts[i - 1] / 100) * (H - 16);
      const mx = (px + x) / 2;
      d += ` C${mx.toFixed(1)} ${py.toFixed(1)} ${mx.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }
  return d;
}

export function ConsequenceMonth({
  preloadedMisses,
  seriesParams,
  verdicts,
  integLabel,
  verdictLabel,
  monthAria,
}: {
  preloadedMisses: number[];
  seriesParams: { start: number; hit: number; miss: number };
  verdicts: [number, string][];
  integLabel: string;
  verdictLabel: string;
  monthAria: string;
}) {
  const [state, setState] = useState<number[]>(() => {
    const s: number[] = [];
    for (let i = 0; i < DAYS; i++) s.push(1);
    for (const m of preloadedMisses) s[m] = 0;
    return s;
  });

  function series(arr: number[]): number[] {
    let v = seriesParams.start;
    const pts = [v];
    for (let i = 0; i < arr.length; i++) {
      v += arr[i] ? seriesParams.hit : seriesParams.miss;
      v = Math.max(0, Math.min(100, v));
      pts.push(v);
    }
    return pts;
  }

  const earned = path(series(state));
  const ghost = path(series(state.map(() => 1)));
  const hit = state.reduce((a, b) => a + b, 0);
  const pct = Math.round((hit / DAYS) * 100);
  let verdict = "";
  for (const [threshold, label] of verdicts) {
    if (pct >= threshold) {
      verdict = label;
      break;
    }
  }

  return (
    <>
      <div className="month" role="group" aria-label={monthAria}>
        {state.map((on, i) => (
          <button
            key={i}
            type="button"
            className={on ? "cell" : "cell miss"}
            aria-pressed={on ? "true" : "false"}
            title={`Day ${i + 1}`}
            onClick={() =>
              setState((prev) => prev.map((v, j) => (j === i ? (v ? 0 : 1) : v)))
            }
          />
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <path
          d={ghost}
          fill="none"
          stroke="rgba(236,226,211,.18)"
          strokeWidth="1.5"
          strokeDasharray="3 5"
        />
        <path d={earned} fill="none" stroke="#E85D2A" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="readout">
        <span>
          <span className="l">{integLabel}</span>
          <span className="v">{pct}%</span>
        </span>
        <span>
          <span className="l">{verdictLabel}</span>
          <span className="grade">{verdict}</span>
        </span>
      </div>
    </>
  );
}
