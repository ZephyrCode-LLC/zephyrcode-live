"use client";

import { useEffect } from "react";
import { animate, stagger, svg } from "animejs";

/**
 * The "etch" layer: anime.js-driven signature moments, additive to the CSS
 * `.rv` reveals. Three targets, each opted in via data-etch:
 *  - "trace":   the audits signal-trace draws itself in (measured, no hardcoded
 *               dasharray) while a glowing tip dot rides the drawing edge
 *               (SMIL animateMotion — it respects the stretched viewBox).
 *  - "cards":   children stagger up one by one instead of arriving as a block.
 *  - "cascade": footer constellation links cascade in with a soft stagger.
 * Reduced motion / no-JS: elements simply stay visible — every initial "hidden"
 * state is set from JS at observe time, never in CSS.
 */
export function EtchManager() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // drawables are created at scan time (to pre-hide via their own `draw` prop —
    // inline dasharray styles would override the attribute anime animates)
    const drawables = new WeakMap<Element, ReturnType<typeof svg.createDrawable>[0]>();

    const run = (el: HTMLElement) => {
      const kind = el.dataset.etch;
      if (kind === "trace") {
        const drawable = drawables.get(el);
        if (!drawable) return;
        animate(drawable, { draw: "0 1", duration: 1800, ease: "linear" });
        const tip = el.querySelector<SVGCircleElement>(".at-tip");
        const motion = tip?.querySelector("animateMotion") as (SVGElement & { beginElement?: () => void }) | null;
        if (tip && motion?.beginElement) {
          motion.beginElement();
          animate(tip, { opacity: [0, 0.9, 0.9, 0], duration: 1800, ease: "linear" });
        }
      } else if (kind === "cards" || kind === "cascade") {
        animate(el.children, {
          opacity: [0, 1],
          translateY: [kind === "cards" ? 18 : 10, 0],
          duration: kind === "cards" ? 700 : 550,
          delay: stagger(kind === "cards" ? 90 : 45),
          ease: "out(3)",
        });
      }
    };

    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          run(e.target as HTMLElement);
        });
      },
      { threshold: 0.25 }
    );

    const vh = window.innerHeight || document.documentElement.clientHeight;
    document.querySelectorAll<HTMLElement>("[data-etch]").forEach((el) => {
      if (el.offsetParent === null && el.offsetHeight === 0) return; // door-gated away
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) return; // already on screen at load — leave static, no pop
      // pre-hide from JS only, so no-JS visitors always see content
      if (el.dataset.etch === "trace") {
        const path = el.querySelector<SVGPathElement>("path");
        if (path) {
          const [drawable] = svg.createDrawable(path);
          drawable.draw = "0 0";
          drawables.set(el, drawable);
        }
      } else {
        Array.from(el.children).forEach((c) => {
          (c as HTMLElement).style.opacity = "0";
        });
      }
      io.observe(el);
    });

    return () => io.disconnect();
  }, []);
  return null;
}
