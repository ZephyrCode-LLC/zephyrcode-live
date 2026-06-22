"use client";

import { usePrefersReducedMotion, useReveal } from "@/lib/motion-hooks";

/**
 * THE ARCADE — signature motion. "The most kinetic room."
 *
 * A CRT screen treatment on a hero panel:
 *   • a repeating-scanline overlay that subtly FLICKERS (crtFlicker ~3s)
 *   • a brighter SCANLINE WASH band that sweeps top->bottom
 *     (scanMove ~2.4s linear loop) in var(--accent) (phosphor green)
 *   • 3 snappy "blips" — dots in var(--accent) / var(--accent-2) / cyan that
 *     pulse (scale + opacity, staggered)
 *   • a "PLAY ▸" mono label
 *
 * Full game-juice but tasteful. Honours prefers-reduced-motion: when reduced
 * we render a STILL end-state — static scanlines, no sweep / flicker / blip.
 * Self-contained: all @keyframes live in the scoped <style> below; colour comes
 * from the room's --accent / --accent-2 tokens (cyan is the only literal, as the
 * third phosphor). SSR-safe — no window/document at module scope.
 */
export function Signature() {
  const reduced = usePrefersReducedMotion();
  // Scroll-trigger: the screen "powers on" the first time it's seen.
  const { ref, shown } = useReveal<HTMLDivElement>({ threshold: 0.25 });
  const live = shown && !reduced;

  return (
    <section
      ref={ref}
      className={`arc-sig rv${shown || reduced ? " in" : ""}${live ? " is-live" : ""}`}
      aria-label="Arcade CRT screen"
    >
      <style>{`
        [data-site="arcade"] .arc-sig {
          position: relative;
          margin-top: 6vh;
          border: 1px solid var(--line);
          background: radial-gradient(120% 140% at 50% 0%, #0d1a12 0%, #070a08 60%, #050605 100%);
          overflow: hidden;
          isolation: isolate;
        }
        [data-site="arcade"] .arc-sig .crt {
          position: relative;
          aspect-ratio: 16 / 7;
          min-height: 260px;
          display: grid;
          place-items: center;
          /* slight barrel/curvature feel via inset shadow vignette */
          box-shadow: inset 0 0 120px rgba(0,0,0,0.85), inset 0 0 36px rgba(0,0,0,0.6);
        }

        /* repeating scanline overlay — always present (static when reduced) */
        [data-site="arcade"] .arc-sig .scanlines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 3;
          background: repeating-linear-gradient(
            0deg,
            rgba(0,0,0,0) 0px,
            rgba(0,0,0,0) 2px,
            rgba(0,0,0,0.28) 3px,
            rgba(0,0,0,0.28) 4px
          );
          mix-blend-mode: multiply;
        }
        [data-site="arcade"] .arc-sig.is-live .scanlines {
          animation: zc-arc-crtFlicker 3s steps(1, end) infinite;
        }

        /* brighter scanline-wash band sweeping top -> bottom, phosphor green */
        [data-site="arcade"] .arc-sig .wash {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 26%;
          pointer-events: none;
          z-index: 2;
          background: linear-gradient(
            180deg,
            transparent 0%,
            color-mix(in srgb, var(--accent) 16%, transparent) 45%,
            color-mix(in srgb, var(--accent) 30%, transparent) 50%,
            color-mix(in srgb, var(--accent) 16%, transparent) 55%,
            transparent 100%
          );
          opacity: 0;
        }
        [data-site="arcade"] .arc-sig.is-live .wash {
          animation: zc-arc-scanMove 2.4s linear infinite;
        }

        /* faint phosphor glow over the whole tube */
        [data-site="arcade"] .arc-sig .glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          background: radial-gradient(
            80% 120% at 50% 100%,
            color-mix(in srgb, var(--accent) 12%, transparent) 0%,
            transparent 70%
          );
        }

        /* screen content */
        [data-site="arcade"] .arc-sig .content {
          position: relative;
          z-index: 4;
          text-align: center;
          padding: 0 24px;
          /* phosphor text-glow */
          text-shadow: 0 0 14px color-mix(in srgb, var(--accent) 55%, transparent);
        }
        [data-site="arcade"] .arc-sig .play {
          font-family: var(--mono);
          font-size: clamp(1.5rem, 5vw, 3rem);
          font-weight: 600;
          letter-spacing: 0.28em;
          color: var(--accent);
          margin: 0;
        }
        [data-site="arcade"] .arc-sig .play .arrow { display: inline-block; }
        [data-site="arcade"] .arc-sig.is-live .play .arrow {
          animation: zc-arc-blink 1s steps(1, end) infinite;
        }
        [data-site="arcade"] .arc-sig .insert {
          font-family: var(--mono);
          font-size: 10.5px;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          color: var(--dim);
          margin: 14px 0 0;
        }

        /* the three snappy blips */
        [data-site="arcade"] .arc-sig .blips {
          position: absolute;
          z-index: 4;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 14px;
        }
        [data-site="arcade"] .arc-sig .blips i {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: block;
          opacity: 0.32;
        }
        [data-site="arcade"] .arc-sig .blips i:nth-child(1) {
          background: var(--accent);
          box-shadow: 0 0 12px var(--accent);
        }
        [data-site="arcade"] .arc-sig .blips i:nth-child(2) {
          background: var(--accent-2);
          box-shadow: 0 0 12px var(--accent-2);
        }
        [data-site="arcade"] .arc-sig .blips i:nth-child(3) {
          background: #5be3e3; /* cyan — the third phosphor */
          box-shadow: 0 0 12px #5be3e3;
        }
        [data-site="arcade"] .arc-sig.is-live .blips i {
          animation: zc-arc-blip 1.4s var(--ease-strike) infinite;
        }
        [data-site="arcade"] .arc-sig.is-live .blips i:nth-child(1) { animation-delay: 0s; }
        [data-site="arcade"] .arc-sig.is-live .blips i:nth-child(2) { animation-delay: 0.18s; }
        [data-site="arcade"] .arc-sig.is-live .blips i:nth-child(3) { animation-delay: 0.36s; }

        @keyframes zc-arc-crtFlicker {
          0%, 100%   { opacity: 1; }
          92%        { opacity: 1; }
          93%        { opacity: 0.72; }
          94%        { opacity: 1; }
          96%        { opacity: 0.85; }
          97%        { opacity: 1; }
        }
        @keyframes zc-arc-scanMove {
          0%   { transform: translateY(-120%); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateY(420%); opacity: 0; }
        }
        @keyframes zc-arc-blip {
          0%, 100% { transform: scale(1);   opacity: 0.32; }
          18%      { transform: scale(1.7); opacity: 1; }
          40%      { transform: scale(1);   opacity: 0.32; }
        }
        @keyframes zc-arc-blink {
          0%, 49%   { opacity: 1; }
          50%, 100% { opacity: 0.15; }
        }

        /* belt-and-braces still end-state under reduced motion */
        @media (prefers-reduced-motion: reduce) {
          [data-site="arcade"] .arc-sig .scanlines,
          [data-site="arcade"] .arc-sig .wash,
          [data-site="arcade"] .arc-sig .play .arrow,
          [data-site="arcade"] .arc-sig .blips i {
            animation: none !important;
          }
          [data-site="arcade"] .arc-sig .wash { opacity: 0; }
          [data-site="arcade"] .arc-sig .blips i { opacity: 0.9; }
        }
      `}</style>

      <div className="crt">
        <div className="glow" aria-hidden="true" />
        <div className="wash" aria-hidden="true" />
        <div className="content">
          <p className="play">
            PLAY <span className="arrow">&#9656;</span>
          </p>
          <p className="insert">Insert coin · select a simulator</p>
        </div>
        <div className="blips" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="scanlines" aria-hidden="true" />
      </div>
    </section>
  );
}
