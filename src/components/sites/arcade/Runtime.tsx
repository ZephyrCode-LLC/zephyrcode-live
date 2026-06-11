"use client";

import { useEffect } from "react";

/**
 * Arcade page runtime: the global share helper + cookieless event wiring.
 *
 * shareVerdict(text, url) — copies a pre-written verdict line to the
 * clipboard so individual sims can call it from their verdict screens, e.g.
 *   window.shareVerdict("My Leap verdict: TIGHT · crossover M14",
 *                       "https://arcade.zephyrcode.live/m/leap")
 * → clipboard: "My Leap verdict: TIGHT · crossover M14 — play it: …/m/leap"
 *
 * Events (Plausible, cookieless): play_click, email_submit (fired by
 * Capture), share_copy, commission_click.
 */

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
    shareVerdict?: (text: string, url: string) => Promise<void>;
  }
}

function toast(msg: string) {
  const el = document.createElement("div");
  el.className = "arc-toast";
  el.setAttribute("role", "status");
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add("on"), 10);
  setTimeout(() => {
    el.classList.remove("on");
    setTimeout(() => el.remove(), 350);
  }, 1800);
}

export function ArcadeRuntime() {
  useEffect(() => {
    window.shareVerdict = async (text: string, url: string) => {
      const line = `${text} — play it: ${url}`;
      try {
        await navigator.clipboard.writeText(line);
        toast("Copied.");
        window.plausible?.("share_copy");
      } catch {
        toast(line); // clipboard blocked: show the line so it can be copied by hand
      }
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const play = t.closest("a.play");
      if (play) {
        const machine = play.closest("[id]")?.id ?? "";
        window.plausible?.("play_click", { props: { machine } });
        return;
      }
      if (t.closest(".studio a")) window.plausible?.("commission_click");
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      delete window.shareVerdict;
    };
  }, []);

  return null;
}
