"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPosthog, registerSite, capturePageview, track } from "@/lib/posthog";

/** host → room slug (mirrors middleware HOSTS; client-side, to tag the `site`). */
const HOST_SITE: Record<string, string> = {
  "zephyrcode.live": "home",
  "www.zephyrcode.live": "home",
  "antyodaya.zephyrcode.live": "antyodaya",
  "stories.zephyrcode.live": "stories",
  "operator.zephyrcode.live": "operator",
  "temper.zephyrcode.live": "temper",
  "arcade.zephyrcode.live": "arcade",
  "read.zephyrcode.live": "read",
  "watch.zephyrcode.live": "watch",
  "listen.zephyrcode.live": "listen",
  "audits.zephyrcode.live": "audits",
};

function siteForHost(): string {
  if (typeof window === "undefined") return "home";
  const h = window.location.hostname.toLowerCase();
  if (HOST_SITE[h]) return HOST_SITE[h];
  const q = new URLSearchParams(window.location.search).get("site");
  if (q) return q;
  if (h.endsWith(".localhost")) return h.replace(/\.localhost$/, "") || "home";
  return "home";
}

// useSearchParams must live under a Suspense boundary in the App Router.
function Pageviews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    capturePageview();
  }, [pathname, searchParams]);
  return null;
}

export function PostHogProvider() {
  useEffect(() => {
    initPosthog();
    const site = siteForHost();
    registerSite(site);
    track("room_view", { site });
  }, []);
  return (
    <Suspense fallback={null}>
      <Pageviews />
    </Suspense>
  );
}
