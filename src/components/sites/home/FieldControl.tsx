"use client";

import type { CSSProperties } from "react";

/**
 * The hub's Disperse / Resolve control (Constellation Review). Drives the
 * ParticleField between chaos (weather/vermillion) and architecture (lattice/slate)
 * on demand by dispatching a `zc-field` window event the field listens for. The
 * field still resolves on scroll; this makes the signature explicit and clickable,
 * mirroring the design demo. No-op + harmless if the field isn't mounted.
 */
export function FieldControl() {
  const fire = (mode: "disperse" | "resolve") => () => {
    window.dispatchEvent(new CustomEvent("zc-field", { detail: mode }));
  };
  const base: CSSProperties = {
    fontFamily: "var(--mono)",
    fontSize: 10.5,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    cursor: "pointer",
    padding: "9px 16px",
    borderRadius: 2,
    background: "transparent",
    transition: "color 0.25s, border-color 0.25s, background 0.25s",
  };
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }} role="group" aria-label="Particle field — chaos to architecture">
      <button type="button" onClick={fire("disperse")} style={{ ...base, border: "1px solid var(--line)", color: "var(--bone-dim)" }}>
        Disperse
      </button>
      <button type="button" onClick={fire("resolve")} style={{ ...base, border: "1px solid var(--accent)", color: "var(--accent)" }}>
        Resolve &rarr;
      </button>
    </div>
  );
}
