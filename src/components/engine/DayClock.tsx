"use client";

import { useState } from "react";

/**
 * Customer Zero: the author's own day, eight weeks apart. Toggle Week 0 ↔ Week 8
 * and the day re-architects — fragmented drift becomes protected deep blocks and
 * an 11:30 cool. Blocks span 06:00 (360) → 02:00 (1560). Copy comes from the DB.
 */

type Blk = { s: number; e: number; cls: string; label: string };
const DAY0 = 360;
const DAY1 = 1560;
const SPAN = DAY1 - DAY0;

export function DayClock({
  week0Label,
  week8Label,
  hours,
  week0,
  week8,
  cap0,
  cap8,
  moved,
}: {
  week0Label: string;
  week8Label: string;
  hours: string[];
  week0: Blk[];
  week8: Blk[];
  cap0: string;
  cap8: string;
  moved: [string, string, string][];
}) {
  const [eight, setEight] = useState(false);
  const blocks = eight ? week8 : week0;
  const cap = eight ? cap8 : cap0;

  return (
    <>
      <div className="toggle" role="tablist" aria-label="Before and after">
        <button
          type="button"
          className={eight ? "" : "on"}
          role="tab"
          aria-selected={!eight}
          onClick={() => setEight(false)}
        >
          {week0Label}
        </button>
        <button
          type="button"
          className={eight ? "on" : ""}
          role="tab"
          aria-selected={eight}
          onClick={() => setEight(true)}
        >
          {week8Label}
        </button>
      </div>

      <div className="clockwrap">
        <div className="clock-hours">
          {hours.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {/* key on week → blocks remount and re-run the CSS fade-in */}
        <div className="clock" aria-live="polite" key={eight ? "w8" : "w0"}>
          {blocks.map((b, i) => (
            <div
              key={`${b.s}-${i}`}
              className={`blk ${b.cls}`}
              style={{
                left: `${((b.s - DAY0) / SPAN) * 100}%`,
                width: `${((b.e - b.s) / SPAN) * 100}%`,
                animationDelay: `${i * 0.03}s`,
              }}
              title={b.label}
            >
              {b.label}
            </div>
          ))}
        </div>
        <div className="legend">
          <span>
            <i style={{ background: "linear-gradient(180deg,#E85D2A,#8B7FD4)" }} />
            DEEP WORK
          </span>
          <span>
            <i style={{ background: "#C9A45C" }} />
            TRAINING
          </span>
          <span>
            <i style={{ background: "#5E7BB0" }} />
            BOXED SYNC
          </span>
          <span>
            <i style={{ background: "rgba(236,226,211,.28)" }} />
            FAMILY
          </span>
          <span>
            <i style={{ background: "repeating-linear-gradient(135deg,rgba(232,93,42,.3) 0 4px,rgba(232,93,42,.12) 4px 8px)" }} />
            LEISURE DRIFT
          </span>
          <span>
            <i style={{ background: "repeating-linear-gradient(135deg,rgba(236,226,211,.12) 0 4px,rgba(236,226,211,.03) 4px 8px)" }} />
            FRAGMENTED
          </span>
          <span>
            <i style={{ background: "#141422" }} />
            RECOVERY
          </span>
        </div>
        <p className="clock-caption" dangerouslySetInnerHTML={{ __html: cap }} />
      </div>

      <div className="moved">
        {moved.map((m) => (
          <div key={m[0]} className="mv">
            <span className="l">{m[0]}</span>
            <div className="pair">
              <span className="a">{m[1]}</span>
              <span className="arr">→</span>
              <span className="b">{m[2]}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
