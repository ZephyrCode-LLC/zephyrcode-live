"use client";

import { usePrefersReducedMotion, useReveal } from "@/lib/motion-hooks";

/**
 * listen.zephyrcode.live — SIGNATURE MOTION ("Audio deserves audio-reactive.")
 *
 * A row of 8 VU bars in var(--accent) (VU-teal) that pulse with staggered phase,
 * scaleY .22 <-> 1 from a bottom transform-origin, ~1.1s ease-in-out, each bar
 * offset ~.15s — like a live meter. A thin frequency curve breathes beneath the
 * eyebrow. Mono spec labels frame the meter.
 *
 * Self-contained: keyframes live in the inline <style> tag below, scoped to the
 * room via [data-site="listen"] so they auto-match the room's accent and can't
 * leak into the shared stylesheets. SSR-safe: no window/document at module scope.
 * Honours prefers-reduced-motion — bars freeze at a static mid height, the curve
 * stops breathing, and no animation is emitted.
 */

const BARS = 8;
/** A musically uneven static silhouette used as the reduced-motion end-state. */
const STILL_HEIGHTS = [0.42, 0.66, 0.54, 0.78, 0.5, 0.7, 0.46, 0.6];

export function Signature() {
  const reduced = usePrefersReducedMotion();
  const { ref, shown } = useReveal<HTMLDivElement>({ threshold: 0.3 });
  const animating = shown && !reduced;

  return (
    <section ref={ref} className={`sig rv${shown || reduced ? " in" : ""}${animating ? " is-live" : ""}`} aria-hidden="true">
      <style>{`
        @keyframes listen-vu-pulse {
          0%, 100% { transform: scaleY(0.22); }
          50%      { transform: scaleY(1); }
        }
        @keyframes listen-freq-breathe {
          0%, 100% { transform: scaleY(0.62); opacity: 0.5; }
          50%      { transform: scaleY(1); opacity: 0.85; }
        }
        [data-site="listen"] .sig {
          margin-top: 5vh;
          border: 1px solid color-mix(in srgb, var(--accent) 26%, transparent);
          background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--accent) 8%, transparent),
            rgba(8, 6, 4, 0.7)
          );
          border-radius: 2px;
          padding: clamp(24px, 4vw, 40px) clamp(20px, 4vw, 44px);
        }
        [data-site="listen"] .sig .sig-head {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 18px;
          align-items: baseline;
          justify-content: space-between;
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--faint);
        }
        [data-site="listen"] .sig .sig-head .ch {
          color: var(--accent);
        }
        [data-site="listen"] .sig .meter {
          margin-top: 22px;
          display: flex;
          align-items: flex-end;
          gap: clamp(8px, 2.4vw, 18px);
          height: clamp(110px, 22vw, 168px);
        }
        [data-site="listen"] .sig .bar {
          flex: 1 1 0;
          min-width: 8px;
          height: 100%;
          transform-origin: bottom center;
          border-radius: 2px 2px 0 0;
          background: linear-gradient(
            to top,
            var(--accent),
            color-mix(in srgb, var(--accent) 55%, var(--accent-2))
          );
          box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 30%, transparent);
          will-change: transform;
        }
        [data-site="listen"] .sig.is-live .bar {
          animation: listen-vu-pulse 1.1s ease-in-out infinite;
        }
        [data-site="listen"] .sig .freq {
          display: block;
          width: 100%;
          height: 38px;
          margin-top: 18px;
          overflow: visible;
        }
        [data-site="listen"] .sig .freq path {
          fill: none;
          stroke: var(--accent);
          stroke-width: 1.5;
          stroke-linecap: round;
          transform-origin: center;
          transform-box: fill-box;
          opacity: 0.7;
        }
        [data-site="listen"] .sig.is-live .freq path {
          animation: listen-freq-breathe 2.6s ease-in-out infinite;
        }
        [data-site="listen"] .sig .scale {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          font-family: var(--mono);
          font-size: 8.5px;
          letter-spacing: 0.18em;
          color: var(--faint);
        }
        @media (prefers-reduced-motion: reduce) {
          [data-site="listen"] .sig .bar,
          [data-site="listen"] .sig .freq path {
            animation: none !important;
          }
        }
      `}</style>

      <div className="sig-head">
        <span>
          VU · <span className="ch">CH-1 / 2</span> · −20 → 0 dBFS
        </span>
        <span>{animating ? "● LIVE METER" : "○ HOLD"}</span>
      </div>

      <div ref={ref} className={animating ? "meter is-live" : "meter"}>
        {Array.from({ length: BARS }, (_, i) => {
          const live = animating
            ? {
                animationDelay: `${(i * 0.15).toFixed(2)}s`,
              }
            : {
                // Reduced / pre-reveal: frozen at a static mid height, no pulse.
                transform: `scaleY(${STILL_HEIGHTS[i % STILL_HEIGHTS.length]})`,
              };
          return <span key={i} className="bar" style={live} />;
        })}
      </div>

      <svg
        className="freq"
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        role="presentation"
      >
        <path d="M0 10 Q 8 2, 16 10 T 32 10 T 48 10 T 64 10 T 80 10 T 96 10 L 100 10" />
      </svg>

      <div className="scale">
        <span>−∞</span>
        <span>−20</span>
        <span>−6</span>
        <span>0 dB</span>
      </div>
    </section>
  );
}
