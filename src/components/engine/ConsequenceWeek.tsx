"use client";

import { useMemo, useState } from "react";

/**
 * The 7-day consequence toy from the homepage — ghost vs earned SVG bezier
 * curves redrawn as days toggle. Exact port of the source math.
 */
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

  const series = (arr: number[]) => {
    let v = seriesParams.start;
    const pts = [v];
    for (let i = 0; i < arr.length; i++) {
      v += arr[i] ? seriesParams.hit : seriesParams.miss;
      v = Math.max(0, Math.min(100, v));
      pts.push(v);
    }
    return pts;
  };
  const path = (pts: number[]) => {
    const W = 600,
      H = 84,
      n = pts.length;
    let d = "";
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * W;
      const y = H - 6 - (pts[i] / 100) * (H - 14);
      if (i === 0) d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
      else {
        const px = ((i - 1) / (n - 1)) * W;
        const py = H - 6 - (pts[i - 1] / 100) * (H - 14);
        const mx = (px + x) / 2;
        d += ` C${mx.toFixed(1)} ${py.toFixed(1)} ${mx.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    }
    return d;
  };

  const earned = path(series(state));
  const ghost = useMemo(() => path(series(dayLabels.map(() => 1))), [dayLabels]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="toy rv">
      <p className="k">{k}</p>
      <div className="days" role="group" aria-label="Toggle adherence per day">
        {dayLabels.map((l, i) => (
          <button
            key={i}
            type="button"
            className={`day${state[i] ? " onf" : ""}`}
            aria-pressed={state[i] ? "true" : "false"}
            onClick={() =>
              setState((s) => s.map((v, j) => (j === i ? (v ? 0 : 1) : v)))
            }
          >
            {l}
          </button>
        ))}
      </div>
      <svg id="curve" viewBox="0 0 600 84" preserveAspectRatio="none" aria-hidden="true">
        <path d={ghost} fill="none" stroke="rgba(236,226,211,.18)" strokeWidth="1.5" strokeDasharray="3 5" />
        <path d={earned} fill="none" stroke="#E85D2A" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <p className="cap" dangerouslySetInnerHTML={{ __html: capHtml }} />
    </div>
  );
}
