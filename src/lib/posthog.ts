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
