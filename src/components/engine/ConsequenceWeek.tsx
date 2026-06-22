"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, EASING, DURATION, lerp } from "../../lib/motion";
import { usePrefersReducedMotion, useReveal } from "../../lib/motion-hooks";

/**
 * The 7-day consequence toy — UPGRADED (drop-in replacement; same props API).
 *
 * What changed vs. the original snap-redraw:
 *  - The earned curve no longer jumps on toggle — it MORPHS on the house Settle
 *    curve (the point series is tweened, the path rebuilt each frame).
 *  - First time it scrolls into view, the line DRAWS ON (stroke-dashoffset),
 *    so the section arrives instead of just being there.
 *  - The line is no longer hard-coded ember. It reads GREEN when you're earning
 *    (>= the bought trajectory) and RED when you're corrupting it — the save-file
 *    metaphor, made visible. The gap between bought and earned is shaded.
 *  - A live data readout (no invented copy — just your own series) names the gap.
 *  - Fully honours prefers-reduced-motion (jumps to the end-state, no rAF).
 *
 * Requires src/lib/motion.ts + src/lib/motion-hooks.ts and the --earn/--corrupt
 * tokens from src/app/motion.css.
 */

const W = 600;
const H = 84;

export function ConsequenceWeek({
  dayLabels,
  seriesParams,
  capHtml,
  k,
}: {
  dayLabels: string[];
  seriesParams: { start: number; hit: number; miss: number };
  capHtml: string;
  k: string;
}) {
  const [state, setState] = useState<number[]>(() => dayLabels.map(() => 1));
  const reduced = usePrefersReducedMotion();
  const { ref: rootRef, shown } = useReveal<HTMLDivElement>({ threshold: 0.3 });

  const earnedRef = useRef<SVGPathElement>(null);
  const gapRef = useRef<SVGPathElement>(null);
  const dispRef = useRef<number[] | null>(null);
  const cancelRef = useRef<() => void>(() => {});
  const drawnRef = useRef(false);

  /* ---- series math (unchanged from the source) ---- */
  const series = useMemo(
    () => (arr: number[]) => {
      let v = seriesParams.start;
      const pts = [v];
      for (let i = 0; i < arr.length; i++) {
        v += arr[i] ? seriesParams.hit : seriesParams.miss;
        v = Math.max(0, Math.min(100, v));
        pts.push(v);
      }
      return pts;
    },
    [seriesParams]
  );

  const ghostVals = useMemo(
    () => series(dayLabels.map(() => 1)),
    [series, dayLabels]
  );
  const targetVals = useMemo(() => series(state), [series, state]);

  if (dispRef.current === null) dispRef.current = ghostVals.slice();

  /* ---- geometry helpers ---- */
  const xAt = (i: number, n: number) => (i / (n - 1)) * W;
  const yAt = (v: number) => H - 6 - (v / 100) * (H - 14);

  // smooth bezier line (same control-point scheme as the original `path()`)
  const linePath = (pts: number[]) => {
    const n = pts.length;
    let d = "";
    for (let i = 0; i < n; i++) {
      const x = xAt(i, n);
      const y = yAt(pts[i]);
      if (i === 0) d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
      else {
        const px = xAt(i - 1, n);
        const py = yAt(pts[i - 1]);
        const mx = (px + x) / 2;
        d += ` C${mx.toFixed(1)} ${py.toFixed(1)} ${mx.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    }
    return d;
  };

  // shaded area between the earned curve (top) and the bought curve (bottom)
  const fillPath = (top: number[], bottom: number[]) => {
    const n = top.length;
    let d = `M${xAt(0, n).toFixed(1)} ${yAt(top[0]).toFixed(1)}`;
    for (let i = 1; i < n; i++) d += ` L${xAt(i, n).toFixed(1)} ${yAt(top[i]).toFixed(1)}`;
    for (let i = n - 1; i >= 0; i--) d += ` L${xAt(i, n).toFixed(1)} ${yAt(bottom[i]).toFixed(1)}`;
    return d + " Z";
  };

  const [readout, setReadout] = useState(() => {
    const last = ghostVals[ghostVals.length - 1];
    return { earned: Math.round(last), bought: Math.round(last), gap: 0, earning: true };
  });

  // paint the SVG imperatively from a values array (no React churn mid-tween)
  const paint = (vals: number[]) => {
    const gl = ghostVals[ghostVals.length - 1];
    const last = vals[vals.length - 1];
    const earning = last >= gl - 0.001;
    const color = earning ? "var(--earn, #5bb98b)" : "var(--corrupt, #c8553a)";
    if (earnedRef.current) {
      earnedRef.current.setAttribute("d", linePath(vals));
      earnedRef.current.style.stroke = color;
    }
    if (gapRef.current) {
      gapRef.current.setAttribute("d", fillPath(vals, ghostVals));
      gapRef.current.style.fill = color;
      gapRef.current.style.fillOpacity = String(Math.min(0.16, (Math.abs(last - gl) / 100) * 0.7));
    }
    return { earned: Math.round(last), bought: Math.round(gl), gap: Math.round(Math.abs(last - gl)), earning };
  };

  /* ---- morph displayed -> target whenever a day toggles ---- */
  useEffect(() => {
    cancelRef.current();
    const from = (dispRef.current ?? ghostVals).slice();
    const to = targetVals;
    cancelRef.current = animate({
      duration: DURATION.settle,
      ease: EASING.settle,
      reduced,
      onUpdate: (p) => {
        const cur = from.map((v, i) => lerp(v, to[i], p));
        dispRef.current = cur;
        const r = paint(cur);
        if (p === 1) setReadout(r);
      },
    });
    return () => cancelRef.current();
  }, [targetVals, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- draw the earned line on, the first time it's seen ---- */
  useEffect(() => {
    if (!shown || drawnRef.current) return;
    drawnRef.current = true;
    const el = earnedRef.current;
    if (!el) return;
    paint(dispRef.current ?? ghostVals);
    if (reduced) return;
    const len = el.getTotalLength();
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    animate({
      duration: DURATION.resolve,
      ease: EASING.settle,
      onUpdate: (p) => {
        el.style.strokeDashoffset = String(len * (1 - p));
      },
      onComplete: () => {
        el.style.strokeDasharray = "";
        el.style.strokeDashoffset = "";
      },
    });
  }, [shown, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  const initialEarned = linePath(ghostVals);

  return (
    <div className="toy rv" ref={rootRef}>
      <p className="k">{k}</p>
      <div className="days" role="group" aria-label="Toggle adherence per day">
        {dayLabels.map((l, i) => (
          <button
            key={i}
            type="button"
            className={`day${state[i] ? " onf" : ""}`}
            aria-pressed={state[i] ? "true" : "false"}
            onClick={() => setState((s) => s.map((v, j) => (j === i ? (v ? 0 : 1) : v)))}
          >
            {l}
          </button>
        ))}
      </div>
      <svg id="curve" viewBox="0 0 600 84" preserveAspectRatio="none" aria-hidden="true">
        {/* shaded gap between bought + earned */}
        <path ref={gapRef} d="" fill="var(--earn, #5bb98b)" fillOpacity="0" stroke="none" />
        {/* bought = dotted ghost */}
        <path d={initialEarned} fill="none" stroke="rgba(236,226,211,.18)" strokeWidth="1.5" strokeDasharray="3 5" />
        {/* earned = the line you're actually drawing */}
        <path ref={earnedRef} d={initialEarned} fill="none" stroke="var(--earn, #5bb98b)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <p
        className="delta"
        aria-live="polite"
        style={{
          fontFamily: "var(--mono)",
          fontSize: "10px",
          letterSpacing: "0.16em",
          color: readout.earning ? "var(--earn, #5bb98b)" : "var(--corrupt, #c8553a)",
          margin: "6px 0 0",
        }}
      >
        EARNED {readout.earned} · BOUGHT {readout.bought} · GAP {readout.gap}
      </p>
      <p className="cap" dangerouslySetInnerHTML={{ __html: capHtml }} />
    </div>
  );
}
