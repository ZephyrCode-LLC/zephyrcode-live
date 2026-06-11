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
    document.querySelectorAll(".rv").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [threshold]);
  return null;
}
