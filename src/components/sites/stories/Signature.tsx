"use client";

/**
 * stories.zephyrcode.live — SIGNATURE MOTION: "The room allowed to bounce."
 *
 * A playful hero: a mint (var(--accent)) ball drops and BOUNCES with springy
 * overshoot, then settles onto a thin baseline. A witty caption gets a late
 * comedic "pop" (scale-in on reveal). This is the ONE room where bounce belongs.
 *
 * Self-contained: keyframes live in the inline <style> below (scoped to a unique
 * class so nothing leaks; no edits to globals.css / motion.css). Honours
 * prefers-reduced-motion — renders a STILL ball at rest on the line with the
 * caption shown. SSR-safe: no window/document at module scope.
 *
 * Colour comes ONLY from var(--accent)/var(--accent-2) (the room resolves these
 * to fridge-mint + cow-violet under [data-site="stories"]) plus neutral ink.
 */

import { usePrefersReducedMotion, useReveal } from "@/lib/motion-hooks";

export function Signature({ caption = "Some stories don't sit still." }: { caption?: string }) {
  const reduced = usePrefersReducedMotion();
  const { ref, shown } = useReveal<HTMLDivElement>({ threshold: 0.35 });

  // Play once revealed and motion is allowed; otherwise hold the still end-state.
  const playing = shown && !reduced;
  const cls = `sig-bounce${playing ? " is-playing" : " is-still"}`;

  return (
    <div
      ref={ref}
      className={cls}
      role="img"
      aria-label="A mint ball drops and bounces, settling on a line."
    >
      <style>{`
        [data-site="stories"] .sig-bounce {
          position: relative;
          margin: 6vh auto 0;
          max-width: 760px;
          height: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-bottom: 22px;
        }
        /* the stage the ball plays on */
        [data-site="stories"] .sig-bounce .sig-stage {
          position: relative;
          width: 100%;
          height: 150px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        /* the thin baseline the ball sits on */
        [data-site="stories"] .sig-bounce .sig-line {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: min(360px, 80%);
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            color-mix(in srgb, var(--accent) 55%, var(--line)) 18%,
            color-mix(in srgb, var(--accent) 55%, var(--line)) 82%,
            transparent
          );
        }
        /* squashed contact shadow that pulses with the bounce */
        [data-site="stories"] .sig-bounce .sig-shadow {
          position: absolute;
          bottom: -3px;
          left: 50%;
          width: 56px;
          height: 9px;
          border-radius: 50%;
          background: radial-gradient(
            ellipse at center,
            color-mix(in srgb, var(--accent) 38%, transparent),
            transparent 72%
          );
          transform: translateX(-50%) scale(1);
          opacity: 0.4;
        }
        /* the mint ball — sits ON the baseline by default (still end-state) */
        [data-site="stories"] .sig-bounce .sig-ball {
          position: relative;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 32% 30%,
            color-mix(in srgb, var(--accent) 100%, white 22%),
            var(--accent) 64%,
            color-mix(in srgb, var(--accent) 70%, var(--ink)) 100%
          );
          box-shadow:
            0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent),
            0 10px 22px color-mix(in srgb, var(--accent) 32%, transparent);
          will-change: transform;
        }
        /* the witty caption — still end-state is fully shown, on the line */
        [data-site="stories"] .sig-bounce .sig-caption {
          margin-top: 20px;
          font-family: var(--serif);
          font-style: italic;
          font-size: clamp(1.05rem, 2.4vw, 1.5rem);
          line-height: 1.2;
          color: var(--bone);
          text-align: center;
          transform: scale(1);
          opacity: 1;
          transform-origin: center bottom;
        }

        /* === playing === */
        [data-site="stories"] .sig-bounce.is-playing .sig-ball {
          animation: zc-stories-bounce 2.4s cubic-bezier(.5,.05,.3,1) infinite;
        }
        [data-site="stories"] .sig-bounce.is-playing .sig-shadow {
          animation: zc-stories-shadow 2.4s cubic-bezier(.5,.05,.3,1) infinite;
        }
        /* caption starts hidden, then fires its late comedic pop once */
        [data-site="stories"] .sig-bounce.is-playing .sig-caption {
          transform: scale(0.6);
          opacity: 0;
          animation: zc-stories-pop 0.62s cubic-bezier(.34,1.56,.64,1) 1.05s 1 forwards;
        }

        /* the bounce: translateY 0 -> -28px -> 0 -> -9px -> 0 -> -3px -> 0 (~2.4s) */
        @keyframes zc-stories-bounce {
          0%   { transform: translateY(0); }
          25%  { transform: translateY(-28px); }
          45%  { transform: translateY(0); }
          62%  { transform: translateY(-9px); }
          78%  { transform: translateY(0); }
          88%  { transform: translateY(-3px); }
          100% { transform: translateY(0); }
        }
        /* shadow squashes wide on each contact, shrinks at apex */
        @keyframes zc-stories-shadow {
          0%   { transform: translateX(-50%) scale(1);    opacity: 0.40; }
          25%  { transform: translateX(-50%) scale(0.42); opacity: 0.16; }
          45%  { transform: translateX(-50%) scale(1);    opacity: 0.40; }
          62%  { transform: translateX(-50%) scale(0.7);  opacity: 0.26; }
          78%  { transform: translateX(-50%) scale(1);    opacity: 0.40; }
          88%  { transform: translateX(-50%) scale(0.88); opacity: 0.34; }
          100% { transform: translateX(-50%) scale(1);    opacity: 0.40; }
        }
        /* the late comedic pop — overshoot then settle */
        @keyframes zc-stories-pop {
          0%   { transform: scale(0.6);  opacity: 0; }
          60%  { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          [data-site="stories"] .sig-bounce .sig-ball,
          [data-site="stories"] .sig-bounce .sig-shadow,
          [data-site="stories"] .sig-bounce .sig-caption {
            animation: none !important;
            transform: scale(1);
            opacity: 1;
          }
          [data-site="stories"] .sig-bounce .sig-shadow {
            transform: translateX(-50%) scale(1);
          }
        }
      `}</style>

      <div className="sig-stage">
        <span className="sig-ball" aria-hidden="true" />
        <span className="sig-shadow" aria-hidden="true" />
        <span className="sig-line" aria-hidden="true" />
      </div>
      <p className="sig-caption">{caption}</p>
    </div>
  );
}
