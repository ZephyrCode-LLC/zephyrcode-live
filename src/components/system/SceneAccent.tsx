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

    const rail = document.querySelector<HTMLElement>(".rail");
    const links = rail ? Array.from(rail.querySelectorAll<HTMLAnchorElement>("a")) : [];

    const apply = (el: HTMLElement) => {
      const a = el.getAttribute("data-accent");
      if (a) root.style.setProperty("--accent", a);
      // rail: mark the active scene + fill the constellation spine up to it
      if (rail && el.id) {
        let idx = -1;
        links.forEach((l, i) => {
          const on = l.getAttribute("href") === `#${el.id}`;
          l.classList.toggle("on", on);
          if (on) idx = i;
        });
        links.forEach((l, i) => l.classList.toggle("past", idx >= 0 && i < idx));
        if (idx >= 0 && links.length > 1) {
          rail.style.setProperty("--rp", `${(idx / (links.length - 1)) * 100}%`);
        }
      }
    };

    // the active scene = the one under the viewport centre. A rAF-throttled
    // scroll handler is deterministic where IO entries can arrive stale/out of
    // order on long scrolls (which left the rail highlight stuck).
    let current: HTMLElement | null = null;
    let raf = 0;
    const pick = () => {
      raf = 0;
      const mid = (window.innerHeight || document.documentElement.clientHeight) / 2;
      let active: HTMLElement | null = null;
      for (const s of scenes) {
        const r = s.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) { active = s; break; }
        if (r.top > mid) break; // scenes are in document order — none further can contain mid
      }
      if (active && active !== current) { current = active; apply(active); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(pick); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    pick();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
