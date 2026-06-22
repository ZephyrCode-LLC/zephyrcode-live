"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, EASING, DURATION, lerp } from "../../lib/motion";
import { usePrefersReducedMotion, useReveal } from "../../lib/motion-hooks";

/**
 * The 28-day consequence engine — UPGRADED (drop-in replacement; same props).
 *
 * Same treatment as ConsequenceWeek: the earned curve MORPHS on Settle as cells
 * toggle (instead of snapping), DRAWS ON the first time it's seen, and reads
 * GREEN earning / RED corrupting vs. the bought line with the gap shaded.
 * Integrity %, the verdict ladder and the two preloaded misses are unchanged.
 * Fully honours prefers-reduced-motion.
 *
 * Requires src/lib/motion.ts + src/lib/motion-hooks.ts and the --earn/--corrupt
 * tokens from src/app/motion.css.
 */

const W = 640;
const H = 96;
const DAYS = 28;

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
  const reduced = usePrefersReducedMotion();
  const { ref: rootRef, shown } = useReveal<HTMLDivElement>({ threshold: 0.3 });

  const earnedRef = useRef<SVGPathElement>(null);
  const gapRef = useRef<SVGPathElement>(null);
  const dispRef = useRef<number[] | null>(null);
  const cancelRef = useRef<() => void>(() => {});
  const drawnRef = useRef(false);

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

  const ghostVals = useMemo(() => series(state.map(() => 1)), [series, state]);
  const targetVals = useMemo(() => series(state), [series, state]);
  if (dispRef.current === null) dispRef.current = ghostVals.slice();

  const xAt = (i: number, n: number) => (i / (n - 1)) * W;
  const yAt = (v: number) => H - 8 - (v / 100) * (H - 16);

  const linePath = (pts: number[]) => {
    const n = pts.length;
    let d = "";
    for (let i = 0; i < n; i++) {
      const x = xAt(i, n);
      const y = yAt(pts[i]);
      if (i === 0) d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
      else {
        const px = xAt(i - 1, n);
        const py = yAt(pts[i - 1]);
        const mx = (px + x) / 2;
        d += ` C${mx.toFixed(1)} ${py.toFixed(1)} ${mx.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    }
    return d;
  };
  const fillPath = (top: number[], bottom: number[]) => {
    const n = top.length;
    let d = `M${xAt(0, n).toFixed(1)} ${yAt(top[0]).toFixed(1)}`;
    for (let i = 1; i < n; i++) d += ` L${xAt(i, n).toFixed(1)} ${yAt(top[i]).toFixed(1)}`;
    for (let i = n - 1; i >= 0; i--) d += ` L${xAt(i, n).toFixed(1)} ${yAt(bottom[i]).toFixed(1)}`;
    return d + " Z";
  };

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
  };

  /* morph displayed -> target whenever a cell toggles */
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
        paint(cur);
      },
    });
    return () => cancelRef.current();
  }, [targetVals, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  /* draw the earned line on, first time it's seen */
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

  const hit = state.reduce((a, b) => a + b, 0);
  const pct = Math.round((hit / DAYS) * 100);
  let verdict = "";
  for (const [threshold, label] of verdicts) {
    if (pct >= threshold) {
      verdict = label;
      break;
    }
  }
  const initial = linePath(ghostVals);

  return (
    <div ref={rootRef}>
      <div className="month" role="group" aria-label={monthAria}>
        {state.map((on, i) => (
          <button
            key={i}
            type="button"
            className={on ? "cell" : "cell miss"}
            aria-pressed={on ? "true" : "false"}
            title={`Day ${i + 1}`}
            onClick={() => setState((prev) => prev.map((v, j) => (j === i ? (v ? 0 : 1) : v)))}
          />
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <path ref={gapRef} d="" fill="var(--earn, #5bb98b)" fillOpacity="0" stroke="none" />
        <path d={initial} fill="none" stroke="rgba(236,226,211,.18)" strokeWidth="1.5" strokeDasharray="3 5" />
        <path ref={earnedRef} d={initial} fill="none" stroke="var(--earn, #5bb98b)" strokeWidth="2.5" strokeLinecap="round" />
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
    </div>
  );
}
