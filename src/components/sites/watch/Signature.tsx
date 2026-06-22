"use client";

import { usePrefersReducedMotion, useReveal } from "@/lib/motion-hooks";

/**
 * WATCH signature motion — "Channels cross-dissolve like reels."
 *
 * A letterboxed projector panel (black bars top & bottom, ~14px) where two
 * full-bleed mood gradients CROSS-DISSOLVE into one another on a ~4s loop:
 * mood A (brain-on-fire purple→rose) fades out as mood B (decompress blue→teal)
 * fades in, then back — never a hard cut. A mono caption reads the transition.
 *
 * Self-contained: keyframes live in the <style> tag below. Reduced motion shows
 * one static mood (B, the decompress pole) with no animation. SSR-safe — the
 * reduced/shown flags only flip after mount, so the first paint is the animated
 * end-state markup (which is harmless on the server).
 *
 * Mirrors the placement of operator's ConsequenceMonth: a self-contained
 * "use client" signature dropped into a room <section> near the top of the page.
 */

const ID = "zc-watch-sig";

/* The two mood poles. Neutral letterbox ink stays hard-coded (it is paper/ink,
   not room colour); the caption uses var(--accent) so it auto-matches the room. */
const MOOD_A = "linear-gradient(135deg, #3a1f4d, #7a2d3a)"; /* BRAIN ON FIRE */
const MOOD_B = "linear-gradient(135deg, #15324d, #2d6a6a)"; /* DECOMPRESS */

export function Signature() {
  const reduced = usePrefersReducedMotion();
  const { ref, shown } = useReveal<HTMLDivElement>({ threshold: 0.3 });

  // Only run the loop once the panel is seen AND motion is allowed.
  const animating = shown && !reduced;

  return (
    <div ref={ref} className={`zc-watch-sig${animating ? " is-live" : ""}`} aria-hidden="true">
      <style>{`
        .zc-watch-sig {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 7;
          margin: 26px 0 0;
          border: 1px solid var(--line);
          background: #050403;
          overflow: hidden;
          /* letterbox: black bars top & bottom (~14px) framing the reel */
          padding: 14px 0;
          box-sizing: border-box;
        }
        .zc-watch-sig .reel {
          position: absolute;
          left: 0;
          right: 0;
          top: 14px;
          bottom: 14px;
        }
        .zc-watch-sig .reel > .mood {
          position: absolute;
          inset: 0;
        }
        .zc-watch-sig .mood-a { background: ${MOOD_A}; opacity: 1; }
        .zc-watch-sig .mood-b { background: ${MOOD_B}; opacity: 0; }

        /* film grain / projector veil on top of the moods */
        .zc-watch-sig .grain {
          position: absolute;
          inset: 14px 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            0deg,
            rgba(236, 226, 211, 0.05) 0 2px,
            transparent 2px 5px
          );
          mix-blend-mode: overlay;
        }

        .zc-watch-sig .caption {
          position: absolute;
          left: clamp(16px, 3vw, 30px);
          bottom: clamp(20px, 3vw, 30px);
          z-index: 2;
          font-family: var(--mono);
          font-size: clamp(10px, 1.4vw, 12.5px);
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--accent);
          text-shadow: 0 1px 14px rgba(0, 0, 0, 0.85);
        }
        .zc-watch-sig .caption .arrow { opacity: 0.7; margin: 0 0.55em; }

        /* the cross-dissolve: A fades out while B fades in, then back — never a cut */
        @keyframes ${ID}-dissolveA {
          0%, 18%   { opacity: 1; }
          50%, 68%  { opacity: 0; }
          100%      { opacity: 1; }
        }
        @keyframes ${ID}-dissolveB {
          0%, 18%   { opacity: 0; }
          50%, 68%  { opacity: 1; }
          100%      { opacity: 0; }
        }
        /* the caption swaps direction at the crossover so the words track the reel */
        @keyframes ${ID}-caption {
          0%, 40%   { opacity: 1; }
          45%, 55%  { opacity: 0.35; }
          60%, 100% { opacity: 1; }
        }

        .zc-watch-sig.is-live .mood-a {
          animation: ${ID}-dissolveA 4s var(--ease-breath) infinite;
        }
        .zc-watch-sig.is-live .mood-b {
          animation: ${ID}-dissolveB 4s var(--ease-breath) infinite;
        }
        .zc-watch-sig.is-live .caption {
          animation: ${ID}-caption 4s var(--ease-breath) infinite;
        }

        /* Reduced motion: render ONE static mood (the decompress pole), no loop. */
        @media (prefers-reduced-motion: reduce) {
          .zc-watch-sig .mood-a { opacity: 0; animation: none; }
          .zc-watch-sig .mood-b { opacity: 1; animation: none; }
          .zc-watch-sig .caption { opacity: 1; animation: none; }
        }
      `}</style>

      <div className="reel">
        <div className="mood mood-a" />
        <div className="mood mood-b" />
      </div>
      <div className="grain" />
      <p className="caption">
        BRAIN ON FIRE<span className="arrow">-&gt;</span>DECOMPRESS
      </p>
    </div>
  );
}
