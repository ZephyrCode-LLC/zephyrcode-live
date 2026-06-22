"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion, useReveal } from "@/lib/motion-hooks";

/**
 * TEMPER signature motion — "Focus, and the tax on breaking it."
 *
 * A focus bar ACCRUES smoothly (scaleX 0->1, transform-origin left, the house
 * settle curve, ~3s) in var(--accent) (focus-violet). Then an INTERRUPTION
 * SPIKE in var(--corrupt) (red) stabs up at ~64% of the run and the focus bar
 * SHATTERS back to a fraction (drops to ~36% width). Then it loops.
 *
 * This is a compact, distinct hero strip — it does NOT duplicate the room's
 * blade/clock interactive below. It is the one-line emotional thesis of the OS:
 * focus compounds, an interruption is a cliff not a dip.
 *
 * Self-contained: keyframes live in the inline <style> tag, scoped by a unique
 * class so nothing leaks. Colour comes from --accent / --corrupt (auto-matches
 * the room). Honours prefers-reduced-motion (steady mid-state, no spike loop).
 * SSR-safe: no window/document access at module scope.
 */

// One full cycle, in ms. Accrue ~3s, hold a beat, shatter, settle, restart.
const CYCLE = 4600;
const SPIKE_AT = 0.64; // interruption stabs at ~64% of the accrue
const SHATTER_TO = 36; // focus bar drops to ~36% width on the break

export function Signature() {
  const reduced = usePrefersReducedMotion();
  const { ref, shown } = useReveal<HTMLDivElement>({ threshold: 0.4 });
  // `run` bumps each cycle to retrigger the CSS animations from scratch.
  const [run, setRun] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reduced || !shown) return;
    timerRef.current = setInterval(() => setRun((r) => r + 1), CYCLE);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [reduced, shown]);

  const animating = shown && !reduced;

  return (
    <div className={`tmpr-sig${animating ? " is-animating" : ""}`} ref={ref} role="img" aria-label="A focus bar accrues, then an interruption shatters it back to a fraction.">
      <style>{`
        .tmpr-sig {
          --sig-shatter: ${SHATTER_TO}%;
          margin: 34px 0 6px;
          max-width: 720px;
        }
        .tmpr-sig .sig-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-family: var(--mono);
          font-size: 9.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
          margin-bottom: 9px;
        }
        .tmpr-sig .sig-head .lhs { color: var(--accent); }
        .tmpr-sig .sig-rail {
          position: relative;
          height: 30px;
          border: 1px solid var(--line);
          background: rgba(0, 0, 0, 0.34);
          border-radius: 3px;
          overflow: hidden;
        }
        /* the accruing focus bar */
        .tmpr-sig .sig-fill {
          position: absolute;
          inset: 0;
          transform-origin: left center;
          transform: scaleX(var(--sig-shatter-x, 0.5));
          background: linear-gradient(
            90deg,
            color-mix(in oklab, var(--accent) 55%, transparent),
            var(--accent)
          );
          box-shadow: inset 0 0 24px color-mix(in oklab, var(--accent) 30%, transparent);
        }
        /* the leading edge — the present moment of focus */
        .tmpr-sig .sig-edge {
          position: absolute;
          top: -2px;
          bottom: -2px;
          width: 2px;
          left: var(--sig-edge-x, 50%);
          background: var(--accent);
          box-shadow: 0 0 12px color-mix(in oklab, var(--accent) 90%, transparent);
        }
        /* the interruption spike — a red stab */
        .tmpr-sig .sig-spike {
          position: absolute;
          top: -6px;
          bottom: -6px;
          left: ${SPIKE_AT * 100}%;
          width: 3px;
          background: var(--corrupt);
          box-shadow: 0 0 14px color-mix(in oklab, var(--corrupt) 90%, transparent);
          opacity: 0;
          z-index: 3;
        }
        .tmpr-sig .sig-spike::after {
          content: "";
          position: absolute;
          left: -4px;
          top: -7px;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 8px solid var(--corrupt);
        }
        .tmpr-sig .sig-cap {
          margin-top: 11px;
          font-style: italic;
          color: var(--dim);
          font-size: 0.95rem;
          min-height: 1.4em;
        }
        .tmpr-sig .sig-cap b { color: var(--corrupt); font-style: normal; font-weight: 600; }

        /* --- the run --- */
        .tmpr-sig.is-animating .sig-fill {
          animation: tmpr-accrue ${CYCLE}ms linear infinite;
        }
        .tmpr-sig.is-animating .sig-edge {
          animation: tmpr-edge ${CYCLE}ms linear infinite;
        }
        .tmpr-sig.is-animating .sig-spike {
          animation: tmpr-spike ${CYCLE}ms linear infinite;
        }

        /* scaleX 0 -> 1 on the house settle curve over ~3s (0%-65% of cycle),
           then SHATTER (snap to a fraction at the spike), then hold + reset. */
        @keyframes tmpr-accrue {
          0%   { transform: scaleX(0.02); }
          /* accrue with the settle feel: front-loaded, long decay into 1 */
          16%  { transform: scaleX(0.34); }
          34%  { transform: scaleX(0.62); }
          52%  { transform: scaleX(0.84); }
          63.9% { transform: scaleX(0.97); }
          /* the break: shatter back to a fraction, hard and instant */
          64%  { transform: scaleX(${SHATTER_TO / 100}); }
          88%  { transform: scaleX(${SHATTER_TO / 100}); }
          100% { transform: scaleX(${SHATTER_TO / 100}); }
        }
        /* the leading edge tracks the fill's right boundary, then drops back */
        @keyframes tmpr-edge {
          0%   { left: 2%; }
          16%  { left: 34%; }
          34%  { left: 62%; }
          52%  { left: 84%; }
          63.9% { left: 97%; }
          64%  { left: ${SHATTER_TO}%; }
          88%  { left: ${SHATTER_TO}%; }
          100% { left: ${SHATTER_TO}%; }
        }
        /* the interruption spike: invisible, then a fast stab at ~64%, fades */
        @keyframes tmpr-spike {
          0%, 62% { opacity: 0; transform: scaleY(0.2); }
          63%     { opacity: 0; transform: scaleY(0.2); }
          64%     { opacity: 1; transform: scaleY(1.15); }
          70%     { opacity: 1; transform: scaleY(1); }
          82%     { opacity: 0; transform: scaleY(1); }
          100%    { opacity: 0; transform: scaleY(0.2); }
        }

        @media (prefers-reduced-motion: reduce) {
          .tmpr-sig .sig-fill,
          .tmpr-sig .sig-edge,
          .tmpr-sig .sig-spike { animation: none !important; }
        }
      `}</style>

      <div className="sig-head">
        <span className="lhs">Focus accruing</span>
        <span>Interruption tax</span>
      </div>
      <div className="sig-rail">
        {/* `key={run}` forces a fresh CSS animation each cycle. In reduced /
            pre-reveal mode the elements render their still mid-state. */}
        <div
          key={`fill-${run}`}
          className="sig-fill"
          style={animating ? undefined : { transform: "scaleX(0.5)" }}
        />
        <div
          key={`edge-${run}`}
          className="sig-edge"
          style={animating ? undefined : { left: "50%" }}
        />
        <div key={`spike-${run}`} className="sig-spike" />
      </div>
      <p className="sig-cap">
        {reduced
          ? "Focus compounds. Every interruption is a cliff, not a dip."
          : <>Focus compounds — then an <b>interruption</b> shatters it back to a fraction.</>}
      </p>
    </div>
  );
}
