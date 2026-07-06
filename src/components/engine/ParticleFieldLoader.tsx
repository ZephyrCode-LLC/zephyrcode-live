"use client";

import dynamic from "next/dynamic";
import type { Grade } from "./ParticleField";

/** three.js is the home page's one indulgence — lazy-loaded, never blocking LCP (BRIEF §6). */
const ParticleField = dynamic(() => import("./ParticleField"), { ssr: false });

/**
 * The hub's per-room palette: the field is coloured to befit each section it sits behind,
 * telling a warm→cool→warm story as you scroll. It opens warm (the studio's welcome),
 * cools into the systems core (the ∞ method loop + the audit lattice = cyan/indigo
 * telemetry), flares into ARENA's own voltage-lime, then settles into a warm amber
 * workspace orbit for SAGE. Code-owned + version-controlled (overrides the CMS grades).
 * 6 scenes / formations: wind(signal) · doors · loop(method) · lattice(audits) · bars(arena) · orbit(sage).
 * Values are RGB 0–1 (THREE.Color); each scene is [colA, colB, gradMix] (gradMix 1 = ordered
 * gradient along the shape, 0 = per-particle two-tone speckle).
 */
const SECTION_GRADES: Grade[] = [
  [[0.92, 0.4, 0.18], [0.82, 0.68, 0.4], 0.45], // signal — ember → brass, the warm opening
  [[0.62, 0.55, 0.45], [0.97, 0.75, 0.38], 0.4], // doors — stone figure + gold threshold light
  [[0.26, 0.86, 0.95], [0.5, 0.42, 0.92], 1.0], // method — cyan → indigo flowing around the ∞ loop
  [[0.24, 0.85, 0.9], [0.82, 0.92, 0.96], 0.5], // audits — telemetry cyan → icy white (the system under glass)
  [[0.34, 0.5, 0.14], [0.78, 1.0, 0.28], 1.0], // arena — dim base → voltage-lime tops (the climb)
  [[0.98, 0.72, 0.32], [0.93, 0.42, 0.2], 0.5], // sage — amber → ember, the lit workspace orbit
];

export function ParticleFieldLoader({ grades }: { grades: Grade[] }) {
  // `grades` (from the CMS) is kept in the signature for compatibility but intentionally
  // overridden — the hub's per-room identity palette lives here now.
  void grades;
  return <ParticleField grades={SECTION_GRADES} />;
}
