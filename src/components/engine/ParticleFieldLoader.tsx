"use client";

import dynamic from "next/dynamic";
import type { Grade } from "./ParticleField";

/** three.js is the home page's one indulgence — lazy-loaded, never blocking LCP (BRIEF §6). */
const ParticleField = dynamic(() => import("./ParticleField"), { ssr: false });

/**
 * The hub's per-room palette: the field is coloured AND shaped to befit each of the 13
 * sections it sits behind, changing all the way down the page. Code-owned + version-controlled
 * (overrides the CMS grades). Formations, in scroll order:
 * signal(wind) · doors(figure+open doors) · method(∞ loop) · audits(lattice) · arena(bars) ·
 * sage(orbit) · stories(lamp) · kshetra(conch) · samhita(merge) · studio(browser wireframe) ·
 * arcade(Pac-Man chase) · systems(3 rings) · library(books+headphones+TV) · operator(the maker at his desk).
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
  [[0.95, 0.5, 0.15], [1.0, 0.83, 0.42], 1.0], // stories — a lamp: ember base → golden flame (antyodaya)
  [[0.95, 0.86, 0.62], [0.55, 0.68, 0.9], 0.5], // kshetra — a conch: pearly cream ↔ soft blue (the Gītā)
  [[0.42, 0.55, 0.78], [0.5, 0.82, 0.86], 0.5], // samhita — slate → cyan, the review/merge
  [[0.55, 0.45, 0.85], [0.78, 0.72, 0.98], 0.5], // studio — violet, the build/blueprint
  [[1.0, 0.85, 0.2], [1.0, 0.35, 0.7], 0.0], // arcade — BRIGHT neon: Pac-Man yellow ↔ ghost magenta
  [[0.32, 0.79, 0.55], [0.6, 0.92, 0.72], 0.5], // systems — forge green, the three OS rings
  [[0.79, 0.64, 0.36], [0.95, 0.82, 0.5], 0.5], // library — brass, the books/headphones/TV
  [[0.91, 0.4, 0.18], [1.0, 0.6, 0.3], 0.4], // operator — ember, the maker at his desk
];

export function ParticleFieldLoader({ grades }: { grades: Grade[] }) {
  // `grades` (from the CMS) is kept in the signature for compatibility but intentionally
  // overridden — the hub's per-room identity palette lives here now.
  void grades;
  return <ParticleField grades={SECTION_GRADES} />;
}
