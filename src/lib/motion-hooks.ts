"use client";

/**
 * ZephyrCode — React bindings for the motion system (./motion).
 * Client-only hooks: reduced-motion awareness, scroll reveal, and count-up.
 */

import { useEffect, useRef, useState } from "react";
import { animate, EASING, DURATION, type Bezier } from "./motion";

/** Live `prefers-reduced-motion` flag. Re-renders on OS setting change. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export interface RevealOptions {
  threshold?: number;
  /** reveal once and stop observing (default true) */
  once?: boolean;
  /** class toggled when in view — defaults to "in" to match the existing `.rv.in` CSS */
  className?: string;
}

/**
 * Replaces the ad-hoc global reveal observer. Attach `ref` to any `.rv` element;
 * it gets the `in` class when it scrolls into view (instantly, if reduced-motion).
 *
 *   const { ref, shown } = useReveal<HTMLDivElement>();
 *   return <div ref={ref} className="rv">…</div>;
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(opts: RevealOptions = {}) {
  const { threshold = 0.2, once = true, className = "in" } = opts;
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add(className);
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add(className);
            setShown(true);
            if (once) io.disconnect();
          } else if (!once) {
            el.classList.remove(className);
            setShown(false);
          }
        });
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once, className]);
  return { ref, shown };
}

export interface CountUpOptions {
  duration?: number;
  ease?: Bezier;
  reduced?: boolean;
  /** wait until true before counting (e.g. wire to useReveal's `shown`) */
  start?: boolean;
}

/**
 * Count a number up with house easing. One number animates at a time — wire each
 * call to a reveal so the count fires when the element is actually seen.
 *
 *   const { ref, shown } = useReveal();
 *   const n = useCountUp(2617, { start: shown });
 */
export function useCountUp(target: number, opts: CountUpOptions = {}): number {
  const { duration = DURATION.resolve, ease = EASING.settle, reduced = false, start = true } = opts;
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    return animate({ duration, ease, reduced, onUpdate: (p) => setVal(target * p) });
  }, [target, duration, reduced, start]); // eslint-disable-line react-hooks/exhaustive-deps
  return val;
}
