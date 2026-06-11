"use client";

import dynamic from "next/dynamic";
import type { Grade } from "./ParticleField";

/** three.js is the home page's one indulgence — lazy-loaded, never blocking LCP (BRIEF §6). */
const ParticleField = dynamic(() => import("./ParticleField"), { ssr: false });

export function ParticleFieldLoader({ grades }: { grades: Grade[] }) {
  return <ParticleField grades={grades} />;
}
