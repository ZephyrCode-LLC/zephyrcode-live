"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/posthog";
import { DOORS, HUB_ACCENT, doorsFor } from "@/components/system/doors";

/**
 * Door controller — the homepage serves different audiences. The DOORS *section*
 * (scene 01, server-rendered) is the picker; there is no modal. A visitor lands
 * on the welcome, scrolls into the doors section, and can focus a door — the
 * page then keeps the always-on essentials (welcome, method, library, operator)
 * and reveals only that audience's product rooms, themed to the door's colour;
 * the chosen door card widens and highlights, the rest tuck below it.
 *
 * Mechanism: a single `data-door` attr on the root drives static CSS keyed off
 * each scene/rail's `data-doors` token list. No attr = everything shown (also
 * what SEO/no-JS get, since the boot script only stamps a *remembered* choice).
 * "Everything" (data-door=__all) and the chip's "reveal everything" always
 * un-focus. This component renders only the persistent "reading as X" chip and
 * wires click/keyboard selection onto the section's cards.
 */

const VALID = new Set([...Object.keys(DOORS), "__all"]);
const root = () => (typeof document !== "undefined" ? (document.querySelector('[data-site="home"]') as HTMLElement | null) : null);
const reduce = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function DoorGate() {
  const [active, setActive] = useState<string | null>(null); // door key, "__all", or null (unpicked)

  function markRail(el: HTMLElement) {
    const door = el.getAttribute("data-door");
    el.querySelectorAll<HTMLAnchorElement>(".rail a").forEach((a) => {
      const tokens = (a.getAttribute("data-doors") || "").split(/\s+/);
      const off = !!door && door !== "__all" && !tokens.includes("*") && !tokens.includes(door);
      a.setAttribute("aria-disabled", off ? "true" : "false");
      a.tabIndex = off ? -1 : 0;
    });
  }

  // reflect the picked door into the doors section: widen + highlight the match,
  // let the rest recede below it.
  function markSection(el: HTMLElement, key: string | null) {
    const wrap = el.querySelector<HTMLElement>("#doors .doors");
    if (!wrap) return;
    let picked = false;
    wrap.querySelectorAll<HTMLElement>(".door").forEach((c) => {
      const on = key != null && key !== "__all" && c.getAttribute("data-door-key") === key;
      c.classList.toggle("is-picked", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) picked = true;
    });
    wrap.classList.toggle("has-pick", picked);
  }

  function apply(key: string) {
    const el = root();
    if (!el) return;
    if (key === "none") {
      el.removeAttribute("data-door");
      el.style.removeProperty("--door-accent");
    } else {
      el.setAttribute("data-door", key);
      el.style.setProperty("--door-accent", key === "__all" ? HUB_ACCENT : DOORS[key].accent);
    }
    markRail(el);
    markSection(el, key === "none" ? null : key);
    window.dispatchEvent(new Event("zc:regate"));
    setActive(key === "none" ? null : key);
  }

  function goToDoors() {
    document.querySelector("#doors")?.scrollIntoView({ behavior: reduce() ? "auto" : "smooth", block: "start" });
  }

  // the room a door drops you into: its first audience-specific scene ("everything"
  // has none, so it falls back to the picker).
  function landingFor(key: string): HTMLElement | null {
    const room = key !== "__all" ? DOORS[key]?.scenes?.[0] : null;
    const el = (room && document.getElementById(room)) || document.getElementById("doors");
    return el && el.offsetHeight > 0 ? el : null;
  }
  function scrollTo(el: HTMLElement, behavior: ScrollBehavior) {
    const HEADER = 64; // clear the fixed wordmark / chip so the heading isn't tucked under it
    const y = Math.max(0, window.scrollY + el.getBoundingClientRect().top - HEADER);
    window.scrollTo({ top: y, behavior });
  }

  function choose(key: string) {
    if (!VALID.has(key)) return;
    apply(key);
    try { localStorage.setItem("zc-door", key); } catch {}
    history.replaceState(null, "", key === "__all" ? "?door=all" : `?door=${key}`);
    track(key === "__all" ? "door_revealed_all" : "door_selected", { door: key });
    // Jump to the door's first room. Do it AFTER two frames so the scene hides +
    // the picker's widen-reflow have settled (else we scroll to a stale position),
    // then correct once more when the reveal fully lands — smooth scroll can
    // undershoot a shifting layout, which read as "it didn't jump".
    const smooth: ScrollBehavior = reduce() ? "auto" : "smooth";
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const t = landingFor(key);
        if (t) scrollTo(t, smooth);
        setTimeout(() => {
          const t2 = landingFor(key);
          if (t2 && Math.abs(t2.getBoundingClientRect().top - 64) > 24) scrollTo(t2, "auto");
        }, 460);
      })
    );
  }

  // Land on a section by id, revealing it first if a door filter has hidden it.
  // Used by the door cards' internal room links (#samhita, #audits, #library…) so
  // they always reach their section instead of silently doing nothing.
  function landOn(id: string) {
    const el0 = document.getElementById(id);
    if (!el0) return;
    if (el0.offsetHeight === 0) {
      const owner = doorsFor(id); // "*" | "creators" | "readers creators" | …
      const key = owner === "*" ? "__all" : owner.split(/\s+/)[0];
      apply(key);
      try { localStorage.setItem("zc-door", key); } catch {}
      history.replaceState(null, "", key === "__all" ? "?door=all" : `?door=${key}`);
    }
    const smooth: ScrollBehavior = reduce() ? "auto" : "smooth";
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const t = document.getElementById(id);
        if (t) scrollTo(t, smooth);
        setTimeout(() => {
          const t2 = document.getElementById(id);
          if (t2 && Math.abs(t2.getBoundingClientRect().top - 64) > 24) scrollTo(t2, "auto");
        }, 460);
      })
    );
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
    } else {
      apply("none"); // default: everything shown, nothing focused, no modal
    }

    // selection via the section: click the card (or its focus button / press
    // Enter on it) to focus a door; room links inside still navigate normally.
    const section = el.querySelector<HTMLElement>("#doors");
    const keyFromTarget = (t: HTMLElement): string | null => {
      if (t.closest("a")) return null; // a room link → handled below / navigates
      const btn = t.closest<HTMLElement>("[data-focus]");
      const card = t.closest<HTMLElement>(".door[data-door-key]");
      return btn?.getAttribute("data-focus") || card?.getAttribute("data-door-key") || null;
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      // an internal room link (#samhita, #audits, #library…) → land on that section,
      // revealing it first if the current door hid it. External links navigate as normal.
      const anchor = t.closest<HTMLAnchorElement>('a[href^="#"]');
      if (anchor && section?.contains(anchor)) {
        const id = anchor.getAttribute("href")!.slice(1);
        if (document.getElementById(id)) { e.preventDefault(); landOn(id); return; }
      }
      const key = keyFromTarget(t);
      if (key && VALID.has(key)) { e.preventDefault(); choose(key); }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = (e.target as HTMLElement).closest<HTMLElement>(".door[data-door-key]");
      if (!card || (e.target as HTMLElement).closest("a, button")) return; // buttons/links handle themselves
      const key = card.getAttribute("data-door-key");
      if (key && VALID.has(key)) { e.preventDefault(); choose(key); }
    };
    section?.addEventListener("click", onClick);
    section?.addEventListener("keydown", onKey);
    return () => {
      section?.removeEventListener("click", onClick);
      section?.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`doorchip${active != null ? " on" : ""}`} aria-hidden={active == null}>
      <span>reading as <b>{active === "__all" ? "everything" : active ? DOORS[active]?.label : ""}</b></span>
      <button type="button" onClick={goToDoors}>switch door</button>
      {active !== "__all" && <button type="button" onClick={() => choose("__all")}>reveal everything</button>}
    </div>
  );
}
