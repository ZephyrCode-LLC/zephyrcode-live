"use client";

/**
 * antyodaya.zephyrcode.live — SIGNATURE MOTION: "Document, not modal" / redaction reveal.
 *
 * A short declassified-dossier block. On scroll-into-view, the oxblood redaction
 * bars RETRACT (scaleX 1->0, transform-origin left, staggered ~120ms apart, on the
 * house settle curve) to reveal the words beneath; then a "DECLASSIFIED" stamp lands
 * (scale 1.4->1 + slight rotate, on the strike curve).
 *
 * Self-contained: keyframes live in the inline <style> below, all scoped under
 * [data-site="antyodaya"]. Colour comes from var(--accent)/var(--accent-2) so it
 * auto-matches the room (oxblood). Honours prefers-reduced-motion via a still
 * end-state (bars already retracted, stamp already placed).
 *
 * SSR-safe: no window/document at module scope; all DOM access is inside hooks.
 */

import { usePrefersReducedMotion, useReveal } from "@/lib/motion-hooks";

/** Stagger between consecutive bars retracting (ms). */
const STAGGER = 120;
/** Each bar's retract duration (ms) — content reveal beat. */
const BAR_MS = 480;
/** Stamp lands after the last bar has cleared. */
const NUM_BARS = 3;

export function Signature() {
  const reduced = usePrefersReducedMotion();
  const { ref, shown } = useReveal<HTMLDivElement>({ threshold: 0.35 });

  // Play once the block is in view (or immediately under reduced-motion, where
  // useReveal sets shown=true synchronously and the CSS still-state takes over).
  const play = shown;
  const stampDelay = reduced ? 0 : NUM_BARS * STAGGER + BAR_MS - 120;

  return (
    <div
      ref={ref}
      className={`adya-dossier${play ? " is-open" : ""}${reduced ? " is-reduced" : ""}`}
      role="group"
      aria-label="Declassified dossier excerpt"
    >
      <style>{`
        [data-site="antyodaya"] .adya-dossier {
          position: relative;
          max-width: 720px;
          margin: 7vh 0;
          padding: clamp(26px, 4vw, 40px) clamp(24px, 4vw, 44px);
          border: 1px solid var(--line);
          border-left: 2px solid var(--accent);
          background:
            linear-gradient(160deg, rgba(23, 19, 16, 0.92), rgba(12, 10, 8, 0.86));
        }
        [data-site="antyodaya"] .adya-dossier .adya-dateline {
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--faint);
          margin: 0 0 22px;
        }
        [data-site="antyodaya"] .adya-dossier .adya-dateline b {
          color: var(--accent-2);
          font-weight: 600;
        }
        [data-site="antyodaya"] .adya-dossier .adya-body {
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(1.12rem, 1.9vw, 1.4rem);
          line-height: 1.95;
          color: var(--bone);
          margin: 0;
        }
        /* A redaction span: the word sits beneath, the bar overlays it. */
        [data-site="antyodaya"] .adya-dossier .adya-redact {
          position: relative;
          display: inline-block;
          white-space: nowrap;
          color: var(--bone);
        }
        [data-site="antyodaya"] .adya-dossier .adya-redact > .adya-bar {
          position: absolute;
          inset: -0.06em -0.18em;
          background: var(--accent);
          transform-origin: left center;
          transform: scaleX(1);
          border-radius: 1px;
          /* faint authentic ink-edge */
          box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 60%, black);
        }
        [data-site="antyodaya"] .adya-dossier.is-open .adya-redact > .adya-bar {
          animation: adya-retract ${BAR_MS}ms var(--ease-settle) forwards;
        }
        [data-site="antyodaya"] .adya-dossier.is-open .adya-redact:nth-of-type(1) > .adya-bar { animation-delay: 0ms; }
        [data-site="antyodaya"] .adya-dossier.is-open .adya-redact:nth-of-type(2) > .adya-bar { animation-delay: ${STAGGER}ms; }
        [data-site="antyodaya"] .adya-dossier.is-open .adya-redact:nth-of-type(3) > .adya-bar { animation-delay: ${STAGGER * 2}ms; }

        @keyframes adya-retract {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }

        /* DECLASSIFIED stamp — lands after the bars clear. */
        [data-site="antyodaya"] .adya-dossier .adya-stamp {
          position: absolute;
          right: clamp(18px, 3vw, 34px);
          bottom: clamp(16px, 3vw, 28px);
          font-family: var(--mono);
          font-size: clamp(13px, 1.6vw, 17px);
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
          padding: 6px 12px;
          border: 2px solid var(--accent);
          border-radius: 3px;
          transform: rotate(-9deg) scale(1.4);
          opacity: 0;
          pointer-events: none;
          /* slightly worn-stamp blend over the paper */
          mix-blend-mode: screen;
        }
        [data-site="antyodaya"] .adya-dossier.is-open .adya-stamp {
          animation: adya-stamp-land 360ms var(--ease-strike) ${stampDelay}ms forwards;
        }
        @keyframes adya-stamp-land {
          from { opacity: 0; transform: rotate(2deg) scale(1.4); }
          60%  { opacity: 1; }
          to   { opacity: 0.92; transform: rotate(-9deg) scale(1); }
        }

        /* Reduced motion: still end-state — bars gone, stamp placed, no animation. */
        [data-site="antyodaya"] .adya-dossier.is-reduced .adya-redact > .adya-bar {
          transform: scaleX(0);
          animation: none;
        }
        [data-site="antyodaya"] .adya-dossier.is-reduced .adya-stamp {
          opacity: 0.92;
          transform: rotate(-9deg) scale(1);
          animation: none;
        }
        @media (prefers-reduced-motion: reduce) {
          [data-site="antyodaya"] .adya-dossier .adya-redact > .adya-bar { transform: scaleX(0); animation: none; }
          [data-site="antyodaya"] .adya-dossier .adya-stamp { opacity: 0.92; transform: rotate(-9deg) scale(1); animation: none; }
        }
      `}</style>

      <p className="adya-dateline">
        File 04-A &middot; Intercept &middot; <b>Eyes only</b> &middot; Disposition: retained
      </p>

      <p className="adya-body">
        The witness signed at the lower margin, then named the&nbsp;
        <span className="adya-redact">
          office that issued the order
          <span className="adya-bar" aria-hidden="true" />
        </span>
        . What followed was logged out of sequence and the&nbsp;
        <span className="adya-redact">
          second courier
          <span className="adya-bar" aria-hidden="true" />
        </span>
        &nbsp;was never recalled. The remainder of the page records only the&nbsp;
        <span className="adya-redact">
          time the lamp went dark
          <span className="adya-bar" aria-hidden="true" />
        </span>
        .
      </p>

      <span className="adya-stamp" aria-hidden="true">
        Declassified
      </span>
    </div>
  );
}
