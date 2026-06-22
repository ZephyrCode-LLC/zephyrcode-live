"use client";

import dynamic from "next/dynamic";
import type { Grade } from "./ParticleField";

/** three.js is the home page's one indulgence — lazy-loaded, never blocking LCP (BRIEF §6). */
const ParticleField = dynamic(() => import("./ParticleField"), { ssr: false });

/**
 * The hub's "resolve" palette (Constellation Review): the field reads as RAUDRA
 * VERMILLION in chaos (the wind/flame scenes) and cools to SLATE as it settles into
 * architecture (the lattice/ring scenes) — fire → stillness, and the framework amber
 * is gone. This overrides the CMS grades (which were ember→iris) so the recolour is
 * code-owned and version-controlled. 6 scenes: wind · funnel · flame · lattice · wave · ring.
 * Values are RGB 0–1 (THREE.Color); each scene is [colA, colB, gradMix].
 */
const VERMILLION_SLATE: Grade[] = [
  [[0.83, 0.29, 0.2], [1.0, 0.5, 0.34], 0.55], // wind — warm vermillion chaos
  [[0.8, 0.31, 0.22], [0.93, 0.62, 0.4], 0.5], // funnel — warm, cooling at the edges
  [[0.95, 0.42, 0.24], [1.0, 0.8, 0.55], 0.6], // flame — bright warm peak
  [[0.33, 0.55, 0.74], [0.66, 0.76, 0.91], 0.5], // lattice — cool slate (architecture)
  [[0.3, 0.5, 0.72], [0.55, 0.72, 0.86], 0.5], // wave — cool
  [[0.31, 0.48, 0.75], [0.62, 0.74, 0.9], 0.55], // ring — deep slate → light
];

export function ParticleFieldLoader({ grades }: { grades: Grade[] }) {
  // `grades` (from the CMS) is kept in the signature for compatibility but intentionally
  // overridden — the hub's identity palette lives here now, per the Review.
  void grades;
  return <ParticleField grades={VERMILLION_SLATE} />;
}
