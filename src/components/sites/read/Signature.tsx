"use client";

import { useState, type CSSProperties } from "react";
import { usePrefersReducedMotion, useReveal } from "@/lib/motion-hooks";

/**
 * read.zephyrcode.live — SIGNATURE MOTION: "The gradient is the control."
 *
 * A draggable range slider (0–100). Above it sit 6 vertical bars coloured along
 * a fire→stillness gradient. As you drag, the bar matching the slider position
 * RAISES (translateY −10px) and goes full-opacity while the others dim to .55
 * (transition .35s var(--ease-settle)). A state label flips
 * FIRE (<33) / TEMPERED (33–66) / STILLNESS (>66) and a generic volume title
 * cycles per position.
 *
 * The endpoints use the room tokens var(--accent) (fire) and var(--accent-2)
 * (stillness) so the whole gradient auto-matches whatever the room's poles are;
 * the four interior stops are colour-mixed between those two poles. The motion
 * is fully user-driven (onInput), so transitions stay on under
 * prefers-reduced-motion — only the scroll-reveal entrance is suppressed.
 *
 * Self-contained "use client" component; SSR-safe (no window/document at module
 * scope). Keyframes live in the <style> tag below, scoped to [data-site="read"].
 */

const BARS = 6;

/* Six stops along fire→stillness. Endpoints track the room's --accent /
   --accent-2 poles; the interior stops are colour-mixed between them so the
   ramp re-tints automatically if the room palette changes. Mix weights are
   evenly spaced (0/20/40/60/80/100%) and read as fire toward --accent. */
const STOPS = [
  "var(--accent)",
  "color-mix(in srgb, var(--accent) 80%, var(--accent-2))",
  "color-mix(in srgb, var(--accent) 60%, var(--accent-2))",
  "color-mix(in srgb, var(--accent) 40%, var(--accent-2))",
  "color-mix(in srgb, var(--accent) 20%, var(--accent-2))",
  "var(--accent-2)",
];

/* Generic placeholders — NOT real Antyodaya content. */
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

function stateFor(v: number): { label: string; tone: string } {
  if (v < 33) return { label: "FIRE", tone: "var(--accent)" };
  if (v <= 66) return { label: "TEMPERED", tone: "var(--brass)" };
  return { label: "STILLNESS", tone: "var(--accent-2)" };
}

export function Signature({
  ariaLabel = "Heat — drag from fire to stillness",
  books = [],
}: {
  ariaLabel?: string;
  /** Real shelf, mapped along fire→stillness by `pos`; the nearest book to the slider shows. */
  books?: { title: string; pos: number }[];
}) {
  const [value, setValue] = useState(18);
  const reduced = usePrefersReducedMotion();
  const { ref, shown } = useReveal<HTMLDivElement>({ threshold: 0.25 });

  /* Which of the 6 bars the slider currently selects (0..5). */
  const active = Math.min(BARS - 1, Math.floor((value / 100) * BARS));
  const st = stateFor(value);
  /* The nearest real book to the slider. `pos` is normalised to 0–100 so either a
     0–1 or 0–100 source works; falls back to a generic volume label if no books. */
  const activeTitle = (() => {
    if (!books.length) return `Volume ${ROMAN[active]}`;
    const ps = books.map((b) => b.pos);
    const lo = Math.min(...ps);
    const hi = Math.max(...ps);
    const norm = (p: number) => (hi > lo ? ((p - lo) / (hi - lo)) * 100 : 50);
    let best = books[0];
    let bd = Infinity;
    for (const b of books) {
      const d = Math.abs(norm(b.pos) - value);
      if (d < bd) {
        bd = d;
        best = b;
      }
    }
    return best.title;
  })();

  return (
    <section
      ref={ref}
      className={`heat rv${shown || reduced ? " in" : ""}`}
      data-reduced={reduced ? "true" : "false"}
    >
      <style>{`
        [data-site="read"] .heat {
          margin: 6vh 0 5vh;
          border: 1px solid var(--line);
          background: rgba(10, 8, 6, 0.7);
          padding: 30px 30px 26px;
        }
        [data-site="read"] .heat .heat-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 16px;
          margin-bottom: 22px;
        }
        [data-site="read"] .heat .heat-k {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--faint);
        }
        [data-site="read"] .heat .heat-state {
          font-family: var(--mono);
          font-size: 12px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          font-weight: 600;
          transition: color 0.35s var(--ease-settle);
        }
        [data-site="read"] .heat .bars {
          display: flex;
          align-items: flex-end;
          gap: clamp(8px, 2.2vw, 18px);
          height: 132px;
          padding: 12px 4px 0;
        }
        [data-site="read"] .heat .bar {
          flex: 1;
          height: 100%;
          border-radius: 4px 4px 2px 2px;
          opacity: 0.55;
          transform: translateY(0);
          transition: transform 0.35s var(--ease-settle),
            opacity 0.35s var(--ease-settle),
            box-shadow 0.35s var(--ease-settle);
        }
        [data-site="read"] .heat .bar.on {
          opacity: 1;
          transform: translateY(-10px);
          box-shadow: 0 10px 26px -8px var(--bar-c, var(--accent));
        }
        /* Entrance: bars rise from the floor when scrolled into view. */
        [data-site="read"] .heat.rv .bar {
          transform-origin: bottom;
          transform: translateY(0) scaleY(0.04);
        }
        [data-site="read"] .heat.rv.in .bar {
          transform: translateY(0) scaleY(1);
          transition: transform 0.7s var(--ease-settle) calc(var(--bar-i, 0) * 70ms),
            opacity 0.35s var(--ease-settle),
            box-shadow 0.35s var(--ease-settle);
        }
        [data-site="read"] .heat.rv.in .bar.on {
          transform: translateY(-10px) scaleY(1);
        }
        /* Reduced motion: no entrance / scale-in; render the still end-state. */
        [data-site="read"] .heat[data-reduced="true"] .bar,
        [data-site="read"] .heat[data-reduced="true"].rv.in .bar {
          transition: transform 0.35s var(--ease-settle),
            opacity 0.35s var(--ease-settle);
          transform: translateY(0) scaleY(1);
        }
        [data-site="read"] .heat[data-reduced="true"] .bar.on,
        [data-site="read"] .heat[data-reduced="true"].rv.in .bar.on {
          transform: translateY(-10px) scaleY(1);
        }
        [data-site="read"] .heat .heat-title {
          margin-top: 22px;
          min-height: 1.7em;
          font-style: italic;
          font-size: clamp(1.1rem, 2.4vw, 1.5rem);
          color: var(--bone);
        }
        [data-site="read"] .heat .heat-title small {
          display: block;
          margin-top: 4px;
          font-style: normal;
          font-family: var(--mono);
          font-size: 9.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
        }
        [data-site="read"] .heat input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          margin-top: 18px;
          border-radius: 3px;
          outline: none;
          background: linear-gradient(90deg, var(--accent), var(--brass), var(--accent-2));
          cursor: grab;
        }
        [data-site="read"] .heat input[type="range"]:active {
          cursor: grabbing;
        }
        [data-site="read"] .heat input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--bone);
          border: 3px solid var(--ink);
          box-shadow: 0 0 0 2px var(--bone), 0 0 18px rgba(236, 226, 211, 0.45);
          cursor: grab;
        }
        [data-site="read"] .heat input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--bone);
          border: 3px solid var(--ink);
          cursor: grab;
        }
        [data-site="read"] .heat .scale {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          font-family: var(--mono);
          font-size: 9.5px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        [data-site="read"] .heat .scale .f { color: var(--accent); }
        [data-site="read"] .heat .scale .s { color: var(--accent-2); }
      `}</style>

      <div className="heat-head">
        <span className="heat-k">The gradient is the control</span>
        <span className="heat-state" style={{ color: st.tone }}>
          {st.label}
        </span>
      </div>

      <div className="bars" aria-hidden="true">
        {STOPS.map((c, i) => (
          <div
            key={i}
            className={`bar${i === active ? " on" : ""}`}
            style={{ background: c, "--bar-c": c, "--bar-i": i } as CSSProperties}
          />
        ))}
      </div>

      <p className="heat-title" aria-live="polite">
        {activeTitle}
        <small>
          {st.label} · position {value}
        </small>
      </p>

      <input
        type="range"
        min={0}
        max={100}
        value={value}
        aria-label={ariaLabel}
        onInput={(e) => setValue(Number((e.target as HTMLInputElement).value))}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <div className="scale">
        <span className="f">Fire</span>
        <span className="s">Stillness</span>
      </div>
    </section>
  );
}
