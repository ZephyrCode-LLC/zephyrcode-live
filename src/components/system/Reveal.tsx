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
    const scan = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      document.querySelectorAll<HTMLElement>(".rv:not(.in)").forEach((el) => {
        if (el.offsetParent === null && el.offsetHeight === 0) return; // hidden by a door gate — skip for now
        const r = el.getBoundingClientRect();
        // Above-the-fold elements reveal immediately (still CSS-fades in) so the
        // hero never flashes blank or stays hidden if the observer is slow or
        // suspended (e.g. backgrounded tab). Everything below the fold observes.
        if (r.top < vh && r.bottom > 0) el.classList.add("in");
        else io.observe(el);
      });
    };
    scan();
    // a door change reveals previously-hidden scenes — re-check their .rv children
    const onRegate = () => setTimeout(scan, 60);
    window.addEventListener("zc:regate", onRegate);
    return () => { io.disconnect(); window.removeEventListener("zc:regate", onRegate); };
  }, [threshold]);
  return null;
}
