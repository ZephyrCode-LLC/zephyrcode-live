"use client";

import posthog from "posthog-js";

/**
 * Shared PostHog client for the Constellation. ONE EU project for every property
 * (segment by the `app`/`site` super-properties set in registerSite). No-ops
 * cleanly when the key is absent (local dev / preview without env). Events ingest
 * through the `/ingest` reverse proxy (next.config rewrites) so ad-blockers don't
 * silently drop them.
 */
let started = false;

/**
 * Is this internal (my own) traffic that should be filtered out of analytics?
 * True on localhost automatically, and on any device that opts in once via
 * `?zc_internal=1` (persisted; `?zc_internal=0` clears it). Emitted as the
 * `internal` super-property so ONE PostHog test-account filter (internal = true)
 * hides my dev + QA traffic across every property — including my own visits to
 * the LIVE sites, which a host-based filter can't distinguish from real users.
 */
function isInternalTraffic(): boolean {
  try {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h.endsWith(".local")) return true;
    const flag = new URLSearchParams(window.location.search).get("zc_internal");
    if (flag === "1") localStorage.setItem("zc-internal", "1");
    else if (flag === "0") localStorage.removeItem("zc-internal");
    return localStorage.getItem("zc-internal") === "1";
  } catch {
    return false;
  }
}

export function initPosthog(): void {
  if (started || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return; // unconfigured → analytics is a no-op
  started = true;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "/ingest",
    ui_host: "https://eu.posthog.com",
    capture_pageview: false, // manual — App Router doesn't auto-fire on route change
    capture_pageleave: true,
    autocapture: true,
    persistence: "localStorage+cookie",
  });
  posthog.register({ internal: isInternalTraffic() });
}

/** Attach app + site to every subsequent event (super-properties). */
export function registerSite(site: string): void {
  if (!started) return;
  try {
    posthog.register({ app: "hub", site });
  } catch {
    /* ignore */
  }
}

export function track(event: string, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || !started) return;
  try {
    posthog.capture(event, props);
  } catch {
    /* ignore */
  }
}

export function capturePageview(): void {
  if (!started) return;
  try {
    posthog.capture("$pageview");
  } catch {
    /* ignore */
  }
}
