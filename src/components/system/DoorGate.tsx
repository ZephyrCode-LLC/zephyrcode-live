"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/posthog";
import { DOORS, HUB_ACCENT, type GateCard } from "@/components/system/doors";

/**
 * Door-gate — the homepage serves different audiences, so a visitor picks a
 * "door" and sees only that door's sections (+ the always-on frame), themed to
 * the door's colour. Mechanism: the server renders ALL scenes (SEO / no-JS get
 * the full page); gating is a single `data-door` attribute on the root, driving
 * static CSS keyed off each scene's `data-doors` token list. A pre-paint boot
 * script (rendered in Page.tsx) stamps the remembered door before first paint so
 * returning visitors never flash the full page. "Reveal everything" (data-door
 * = __all) is always one click away, so nothing is ever unreachable.
 */

const VALID = new Set([...Object.keys(DOORS), "__all"]);
const root = () => (typeof document !== "undefined" ? (document.querySelector('[data-site="home"]') as HTMLElement | null) : null);

export function DoorGate({ cards }: { cards: GateCard[] }) {
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null); // door key or "__all"
  const gateRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // pending choose() commit
  const restoreRef = useRef<HTMLElement | null>(null); // focus to restore when the gate closes

  function markRail(el: HTMLElement) {
    const door = el.getAttribute("data-door");
    el.querySelectorAll<HTMLAnchorElement>(".rail a").forEach((a) => {
      const tokens = (a.getAttribute("data-doors") || "").split(/\s+/);
      const off = !!door && door !== "__all" && !tokens.includes("*") && !tokens.includes(door);
      a.setAttribute("aria-disabled", off ? "true" : "false");
      a.tabIndex = off ? -1 : 0;
    });
  }

  function apply(key: string) {
    const el = root();
    if (!el) return;
    el.setAttribute("data-door", key);
    el.style.setProperty("--door-accent", key === "__all" ? HUB_ACCENT : DOORS[key].accent);
    markRail(el);
    window.dispatchEvent(new Event("zc:regate"));
    setActive(key);
  }

  function clearPending() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }

  function choose(key: string) {
    if (!DOORS[key]) return;
    setPicking(key);
    const finish = () => {
      timerRef.current = null;
      apply(key);
      try { localStorage.setItem("zc-door", key); } catch {}
      history.replaceState(null, "", `?door=${key}`);
      track("door_selected", { door: key });
      setOpen(false);
      setPicking(null);
      setTimeout(() => {
        const first = [...document.querySelectorAll<HTMLElement>("main .scene")].find(
          (s) => s.offsetHeight > 0 && s.id !== "signal" && s.id !== "doors"
        );
        first?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      }, 280);
    };
    timerRef.current = setTimeout(finish, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 330);
  }

  function revealAll() {
    clearPending(); // a late choose() commit must not override an explicit reveal-all
    setPicking(null);
    apply("__all");
    try { localStorage.setItem("zc-door", "__all"); } catch {}
    history.replaceState(null, "", "?door=all");
    track("door_revealed_all", {});
    setOpen(false);
  }

  useEffect(() => {
    const el = root();
    if (!el) return;
    requestAnimationFrame(() => el.classList.remove("gate-boot"));

    let choice = new URL(location.href).searchParams.get("door");
    if (choice === "all") choice = "__all";
    if (!choice || !VALID.has(choice)) {
      try { choice = localStorage.getItem("zc-door"); } catch { choice = null; }
      if (choice === "all") choice = "__all";
    }
    if (choice && VALID.has(choice)) {
      apply(choice); // idempotent with the boot script
      try { localStorage.setItem("zc-door", choice); } catch {}
    } else if (cards.length) {
      markRail(el);
      setOpen(true);
    } else {
      // no doors configured — never strand the visitor behind an empty modal on
      // a dimmed page; just show everything.
      apply("__all");
    }

    return () => clearPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // while the gate is open: focus it, trap Tab inside it, wire Esc, and restore
  // focus to the trigger on close (a11y — it's an aria-modal dialog).
  useEffect(() => {
    const el = gateRef.current;
    if (!open || !el) return;
    restoreRef.current = (document.activeElement as HTMLElement) ?? null;
    el.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        // first visit (no door yet): Esc reveals all so the page un-dims.
        // reopened over an active door: Esc just closes, keeping the theme.
        if (root()?.getAttribute("data-door") != null) setOpen(false);
        else revealAll();
        return;
      }
      if (e.key !== "Tab") return;
      const items = el.querySelectorAll<HTMLElement>("button:not([disabled])");
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const a = document.activeElement;
      if (e.shiftKey && (a === first || a === el)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || a === el)) { e.preventDefault(); first.focus(); }
    };
    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("keydown", onKey);
      restoreRef.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {/* the fullscreen chooser — authored hidden so no-JS/crawlers never see it */}
      <div
        className={`gate${open ? " show" : ""}${picking ? " picking" : ""}`}
        ref={gateRef}
        hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Choose where to start"
        tabIndex={-1}
      >
        <div className="gate-inner">
          {/* close is offered only when a door is already active; on first visit the
              only exits are picking a door or "show everything" (both un-dim) */}
          {active != null && (
            <button type="button" className="gate-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
          )}
          <p className="gate-eyebrow">zephyrcode.live — one studio, many rooms</p>
          <h2 className="gate-h2">Where do you want in?</h2>
          <p className="gate-sub">Everything here is real and live, but it serves different people. Pick a door — you can open the rest anytime.</p>
          <div className="gate-grid">
            {cards.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`door door-enter${picking === c.key ? " chosen" : ""}`}
                style={{ ["--dc" as string]: c.accent }}
                onClick={() => choose(c.key)}
                aria-pressed={active === c.key}
              >
                <span className="door-who">{c.who}</span>
                <span className="door-vibe">{c.vibe}</span>
                <span className="door-enter-cta mono">{c.scenes} room{c.scenes === 1 ? "" : "s"} + the essentials <span className="door-arrow">→</span></span>
              </button>
            ))}
          </div>
          <button type="button" className="gate-all" onClick={revealAll}>show everything instead</button>
        </div>
      </div>

      {/* persistent "you're reading as X" pill — shown (via .on) once a door resolves */}
      <div className={`doorchip${active != null ? " on" : ""}`} aria-hidden={active == null}>
        <span>reading as <b>{active === "__all" ? "everything" : active ? DOORS[active]?.label : ""}</b></span>
        <button type="button" onClick={() => setOpen(true)}>{active === "__all" ? "choose a door" : "switch door"}</button>
        {active !== "__all" && <button type="button" onClick={revealAll}>reveal everything</button>}
      </div>
    </>
  );
}
