"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { doorsFor } from "@/components/system/doors";
import { locate, pageProgress, spinePos } from "@/components/system/sectionProgress";

/**
 * Section navigation for the hub. One scroll tracker feeds two presentations of the same list:
 *  - desktop (>900px): the constellation rail — a spine with a continuous progress fill + comet,
 *    one node per section, a `07 / 14` counter;
 *  - phones/tablets (<=900px): a floating section pill that opens a bottom sheet.
 *
 * Active scene = the one holding the viewport centre (the rule SceneAccent uses for --accent);
 * progress = index + fraction through it (sectionProgress.ts). Per-frame values go straight to CSS
 * custom properties (--pf on the rail, --pp on the pill wrapper) so scrolling never re-renders;
 * React state only changes at section boundaries.
 *
 * Door gating: a scene hidden by the active door has no layout (offsetHeight 0). That is the
 * single definition of "gated" here, re-read on mount, resize and the `zc:regate` event DoorGate
 * fires. home-nav.css *also* dims off-door links from data-door/data-doors so a door stamped by the
 * pre-paint boot script never flashes a full rail before hydration.
 *
 * The rail order must follow page order (it comes from the CMS chrome.rail block).
 */

type Item = { href: string; t: string };

const HEADER = 64; // clear the fixed wordmark — same clearance DoorGate.scrollTo uses
const idOf = (href: string) => href.replace(/^#/, "");
const num = (i: number) => String(i + 1).padStart(2, "0");
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const READER_INPUT = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/** Layout above a far target keeps growing while a long smooth scroll is in flight (lazy sections
 *  mount: measured 14134 -> 14333px of page during one jump), so the position computed up front
 *  lands short — 129px short on production. Once the scroll comes to rest, nudge to the section
 *  again (at most twice, like DoorGate's second pass). Any reader input cancels it: never fight
 *  someone who has taken over the scroll. */
let cancelSettle: (() => void) | null = null; // a newer jump supersedes an older one still settling

function settleOn(id: string, behavior: ScrollBehavior) {
  cancelSettle?.();
  let live = true;
  let last = -1;
  let still = 0; // consecutive frames at rest
  let passes = 0;
  const started = performance.now();
  const stop = () => {
    live = false;
    READER_INPUT.forEach((t) => window.removeEventListener(t, stop));
    if (cancelSettle === stop) cancelSettle = null;
  };
  cancelSettle = stop;
  READER_INPUT.forEach((t) => window.addEventListener(t, stop, { passive: true }));
  const step = () => {
    if (!live) return;
    if (performance.now() - started > 4000) return stop();
    const y = window.scrollY;
    still = y === last ? still + 1 : 0;
    last = y;
    if (still < 6) { requestAnimationFrame(step); return; }
    const drift = (document.getElementById(id)?.getBoundingClientRect().top ?? HEADER) - HEADER;
    if (Math.abs(drift) > 24 && passes++ < 2) {
      window.scrollTo({ top: y + drift, behavior });
      still = 0;
      last = -1;
      requestAnimationFrame(step);
      return;
    }
    stop();
  };
  requestAnimationFrame(step);
}

/** Smooth-scroll a section to just under the header (instant under reduced motion). The hash is
 *  mirrored with replaceState — like DoorGate does for ?door= — so a section link is copyable
 *  without stacking history entries or involving the router. The hero's star chart jumps through
 *  this too, so both land a section in the same place. */
export function goTo(id: string): boolean {
  const el = document.getElementById(id);
  if (!el || el.offsetHeight === 0) return false;
  const behavior: ScrollBehavior = reducedMotion() ? "instant" : "smooth";
  const top = Math.max(0, window.scrollY + el.getBoundingClientRect().top - HEADER);
  window.scrollTo({ top, behavior });
  try { history.replaceState(null, "", `#${id}`); } catch {}
  settleOn(id, behavior);
  return true;
}

/** Plain left-clicks scroll via goTo; modified clicks (new tab etc.) keep native anchor behaviour. */
function plainClick(e: React.MouseEvent) {
  return !(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey);
}

export function SectionNav({ items }: { items: Item[] }) {
  const [active, setActive] = useState(0); // index into items; SSR shows the first
  const [off, setOff] = useState<number[]>([]); // door-gated (or missing) items
  const [accents, setAccents] = useState<string[]>([]); // each scene's data-accent, for the sheet dots
  const [showPill, setShowPill] = useState(false);
  const [open, setOpen] = useState(false);

  const railRef = useRef<HTMLElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const pendingJump = useRef<string | null>(null); // section to scroll to once the sheet has released the scroll lock
  const drag = useRef<{ id: number; y0: number; t0: number; dy: number } | null>(null);

  /* ---------- the tracker ---------- */
  useEffect(() => {
    let vis: { slot: number; el: HTMLElement }[] = [];
    let raf = 0;

    const collect = () => {
      const els = items.map((it) => document.getElementById(idOf(it.href)));
      vis = [];
      const hidden: number[] = [];
      els.forEach((el, slot) => (el && el.offsetHeight > 0 ? vis.push({ slot, el }) : hidden.push(slot)));
      setOff((prev) => (prev.join() === hidden.join() ? prev : hidden));
      const acc = els.map((el) => el?.getAttribute("data-accent") ?? "");
      setAccents((prev) => (prev.join() === acc.join() ? prev : acc));
      tick();
    };

    const tick = () => {
      raf = 0;
      const mid = (window.innerHeight || document.documentElement.clientHeight) / 2;
      const at = locate(
        vis.map(({ el }) => {
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom };
        }),
        mid
      );
      if (at) {
        const slots = vis.map((v) => v.slot);
        const pos = spinePos(slots, at.k, at.frac);
        railRef.current?.style.setProperty("--pf", (items.length > 1 ? pos / (items.length - 1) : 0).toFixed(4));
        setActive(slots[at.k]);
      }
      const doc = document.documentElement;
      mobileRef.current?.style.setProperty("--pp", pageProgress(window.scrollY, doc.scrollHeight, window.innerHeight).toFixed(4));
      const hero = document.getElementById("signal") ?? vis[0]?.el;
      setShowPill(!!hero && window.scrollY > hero.offsetHeight * 0.6);
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", collect, { passive: true });
    window.addEventListener("zc:regate", collect);
    collect();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", collect);
      window.removeEventListener("zc:regate", collect);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items]);

  /* ---------- the sheet: scroll lock, focus in/out, Escape, focus trap ---------- */
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prev = { h: html.style.overflow, b: body.style.overflow, p: body.style.paddingRight };
    const bar = window.innerWidth - html.clientWidth; // keep layout still when a classic scrollbar vanishes
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (bar > 0) body.style.paddingRight = `${bar}px`;

    const panel = panelRef.current;
    const pill = pillRef.current; // always mounted; captured so the cleanup doesn't read a ref that may have moved on
    panel?.focus({ preventScroll: true });
    const list = listRef.current;
    const cur = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (list && cur) list.scrollTop = cur.offsetTop - list.clientHeight / 2 + cur.offsetHeight / 2;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
      if (e.key !== "Tab" || !panel) return;
      const f = Array.from(panel.querySelectorAll<HTMLElement>('a[href], button')).filter(
        (n) => n.tabIndex >= 0 && n.getAttribute("aria-disabled") !== "true"
      );
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0];
      const last = f[f.length - 1];
      const here = document.activeElement;
      if (e.shiftKey && (here === first || here === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (here === last || !panel.contains(here))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const wide = matchMedia("(min-width: 901px)"); // the sheet has no desktop form
    const onWide = () => { if (wide.matches) setOpen(false); };
    wide.addEventListener("change", onWide);

    return () => {
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
      html.style.overflow = prev.h;
      body.style.overflow = prev.b;
      body.style.paddingRight = prev.p;
      pill?.focus({ preventScroll: true });
      const id = pendingJump.current;
      pendingJump.current = null;
      if (id) requestAnimationFrame(() => goTo(id)); // lock is released, so the scroll can run
    };
  }, [open]);

  /* ---------- drag the handle down to dismiss ---------- */
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>, allowClose: boolean) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    const p = panelRef.current;
    if (p) { p.style.transition = ""; p.style.transform = ""; } // hand back to the stylesheet; it animates from here
    const v = d.dy / Math.max(1, performance.now() - d.t0); // px per ms
    if (allowClose && (d.dy > 90 || (d.dy > 24 && v > 0.5))) setOpen(false);
  };
  const onHeadDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, y0: e.clientY, t0: performance.now(), dy: 0 };
    if (panelRef.current) panelRef.current.style.transition = "none";
  };
  const onHeadMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id || !panelRef.current) return;
    d.dy = Math.max(0, e.clientY - d.y0);
    panelRef.current.style.transform = `translate(-50%, ${d.dy}px)`;
  };

  const isOff = (i: number) => off.includes(i);
  const rowClass = (i: number) => (i === active ? "is-on" : i < active ? "is-past" : "");

  return (
    <>
      {/* ===== desktop: the constellation rail ===== */}
      <nav ref={railRef} className="snav" aria-label="Sections" style={{ ["--n" as string]: items.length } as CSSProperties}>
        <span className="snav-spine" aria-hidden="true">
          <i className="snav-fill" />
          <i className="snav-comet" />
        </span>
        <ol className="snav-list">
          {items.map((r, i) => (
            <li key={r.href}>
              <a
                className={rowClass(i)}
                href={r.href}
                data-doors={doorsFor(idOf(r.href))}
                aria-current={i === active ? "true" : undefined}
                aria-disabled={isOff(i) ? "true" : undefined}
                tabIndex={isOff(i) ? -1 : undefined}
                onClick={(e) => {
                  if (isOff(i)) { e.preventDefault(); return; }
                  if (plainClick(e) && goTo(idOf(r.href))) e.preventDefault();
                }}
              >
                <span className="snav-node" aria-hidden="true">
                  <i className="nd" />
                  <i className="ns" />
                </span>
                <span className="snav-lab">
                  <span className="snav-num" aria-hidden="true">{num(i)}</span>
                  <span className="snav-t">{r.t}</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
        <p className="snav-count" aria-hidden="true">
          <b key={active}>{num(active)}</b> / {items.length}
        </p>
      </nav>

      {/* ===== phones & tablets: section pill + bottom sheet ===== */}
      <div ref={mobileRef} className="snav-m">
        <button
          ref={pillRef}
          type="button"
          className={`snav-pill${showPill ? " is-on" : ""}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="snav-sheet"
          inert={!showPill}
          onClick={() => setOpen(true)}
        >
          <i className="snav-pill-dot" aria-hidden="true" />
          <span className="snav-sr">Sections, current: </span>
          <span className="snav-pill-cur" key={active}>
            <span className="snav-pill-n">{num(active)}</span>
            <span className="snav-pill-t">{items[active]?.t}</span>
          </span>
          <svg className="snav-pill-chev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">
            <path d="M2.5 7.5 6 4l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="snav-pill-bar" aria-hidden="true"><i /></span>
        </button>

        <div className={`snav-backdrop${open ? " is-open" : ""}`} aria-hidden="true" onClick={() => setOpen(false)} />

        <div
          id="snav-sheet"
          ref={panelRef}
          className={`snav-sheet${open ? " is-open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Sections"
          tabIndex={-1}
          inert={!open}
        >
          <div
            className="snav-head"
            onPointerDown={onHeadDown}
            onPointerMove={onHeadMove}
            onPointerUp={(e) => endDrag(e, true)}
            onPointerCancel={(e) => endDrag(e, false)}
          >
            <span className="snav-grab" aria-hidden="true" />
            <h2 className="snav-title">Jump to a section</h2>
            <button type="button" className="snav-close" aria-label="Close sections" onClick={() => setOpen(false)}>
              <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true" focusable="false">
                <path d="m2.5 2.5 9 9m0-9-9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <ol ref={listRef} className="snav-rows">
            {items.map((r, i) => (
              <li key={r.href}>
                <a
                  className={`snav-row ${rowClass(i)}`}
                  href={r.href}
                  data-doors={doorsFor(idOf(r.href))}
                  aria-current={i === active ? "true" : undefined}
                  aria-disabled={isOff(i) ? "true" : undefined}
                  tabIndex={isOff(i) ? -1 : undefined}
                  style={accents[i] ? ({ ["--sc" as string]: accents[i] } as CSSProperties) : undefined}
                  onClick={(e) => {
                    if (isOff(i)) { e.preventDefault(); return; }
                    if (!plainClick(e)) return;
                    e.preventDefault();
                    pendingJump.current = idOf(r.href);
                    setOpen(false);
                  }}
                >
                  <span className="rn" aria-hidden="true">{num(i)}</span>
                  <span className="rt">{r.t}</span>
                  <span className="rd" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
