"use client";

import { useEffect } from "react";
import "@/styles/sites/home-spotlight.css";

/**
 * The field's pointer lantern, carried onto the interface: cards near the cursor catch its light
 * on their rims and faces, in their own room's colour (home-spotlight.css draws it). Each card in
 * reach gets --lx/--ly (the pointer, in the card's own box) and --lit; cards out of reach drop
 * them so the light fades off as the lantern moves on. Fine pointers only — a tap has no position
 * worth lighting, and touch would leave a card lit after the finger lifts.
 */
const CARDS = ".ma-card, .short-card, .sp-card, .sys-panel-in, .os-card, .audit-card, .door";
const REACH = 280; // px past a card's edge that its rim still catches the light (the CSS light's radius)

export function Spotlight() {
  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let x = 0;
    let y = 0;
    let on = false;
    let raf = 0;
    let lit = new Set<HTMLElement>();

    const paint = () => {
      raf = 0;
      const next = new Set<HTMLElement>();
      if (on) {
        // queried each frame, not cached: story/system tabs swap their cards in and out
        document.querySelectorAll<HTMLElement>(CARDS).forEach((el) => {
          const r = el.getBoundingClientRect();
          if (!r.width || r.right < x - REACH || r.left > x + REACH || r.bottom < y - REACH || r.top > y + REACH) return;
          el.style.setProperty("--lx", `${(x - r.left).toFixed(1)}px`);
          el.style.setProperty("--ly", `${(y - r.top).toFixed(1)}px`);
          el.style.setProperty("--lit", "1");
          next.add(el);
        });
      }
      lit.forEach((el) => { if (!next.has(el)) el.style.removeProperty("--lit"); });
      lit = next;
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(paint); };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      x = e.clientX;
      y = e.clientY;
      on = true;
      schedule();
    };
    const onLeave = () => { on = false; schedule(); };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", schedule, { passive: true }); // the cards move under a still pointer
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", schedule);
      lit.forEach((el) => el.style.removeProperty("--lit"));
    };
  }, []);
  return null;
}
