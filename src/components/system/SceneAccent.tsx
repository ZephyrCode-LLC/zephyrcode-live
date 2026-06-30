"use client";

import { useEffect } from "react";

/**
 * Per-section identity shift. Each scene declares a `data-accent` (its room's
 * colour); as a scene takes the viewport, the hub's `--accent` transitions to it
 * (smoothly, via the @property registration + transition in home.css). So the
 * chrome — rail, nodes, eyebrows, section accents, buttons — subtly recolours to
 * denote whichever constellation property you're reading about. Reduced-motion
 * users get the value set with no animation (handled in CSS).
 */
export function SceneAccent() {
  useEffect(() => {
    const root =
      (document.querySelector('[data-site="home"]') as HTMLElement | null) ??
      document.documentElement;
    const scenes = Array.from(
      document.querySelectorAll<HTMLElement>("main .scene[data-accent]")
    );
    if (!scenes.length) return;

    const apply = (el: HTMLElement) => {
      const a = el.getAttribute("data-accent");
      if (a) root.style.setProperty("--accent", a);
    };

    // pick the scene occupying most of the viewport centre
    const io = new IntersectionObserver(
      (entries) => {
        let best: { el: HTMLElement; ratio: number } | null = null;
        for (const e of entries) {
          if (e.isIntersecting && (!best || e.intersectionRatio > best.ratio)) {
            best = { el: e.target as HTMLElement, ratio: e.intersectionRatio };
          }
        }
        if (best && best.ratio >= 0.5) apply(best.el);
      },
      { threshold: [0.5, 0.75] }
    );
    scenes.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return null;
}
