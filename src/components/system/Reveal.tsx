"use client";

import { useEffect } from "react";

/**
 * The shared `.rv` IntersectionObserver reveal, exactly as in the HTML:
 * threshold .15, adds `.in`, unobserves. Reduced-motion is handled in CSS.
 */
export function RevealManager({ threshold = 0.15 }: { threshold?: number }) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold }
    );
    const vh = window.innerHeight || document.documentElement.clientHeight;
    document.querySelectorAll<HTMLElement>(".rv").forEach((el) => {
      const r = el.getBoundingClientRect();
      // Above-the-fold elements reveal immediately (still CSS-fades in) so the
      // hero never flashes blank or stays hidden if the observer is slow or
      // suspended (e.g. backgrounded tab). Everything below the fold observes.
      if (r.top < vh && r.bottom > 0) el.classList.add("in");
      else io.observe(el);
    });
    return () => io.disconnect();
  }, [threshold]);
  return null;
}
