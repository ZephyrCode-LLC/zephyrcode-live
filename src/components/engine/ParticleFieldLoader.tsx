"use client";

import dynamic from "next/dynamic";

/**
 * The hub's signature field — lazy-loaded so it never blocks LCP (BRIEF §6). It is the
 * Constellation Review's "particles resolve" matrix: a vermillion chaos at the top that
 * resolves into a slate connected matrix as the reader descends. Colour + motion live
 * inside ParticleField (no CMS grades, no controls) — the field reads its own scroll.
 */
const ParticleField = dynamic(() => import("./ParticleField"), { ssr: false });

export function ParticleFieldLoader() {
  return <ParticleField />;
}
