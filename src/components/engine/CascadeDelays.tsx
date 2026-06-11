"use client";

/**
 * The CASCADE cabinet's attract loop, ported exactly from the source page:
 * fills the .s-casc grid with 28 dots (4 rows × 7 columns) whose ignite
 * animation is delayed by manhattan distance from the seed cell (1,1)
 * × 0.22s — the JS-seeded cascade. Design parameters, not copy.
 */

const SEED_X = 1;
const SEED_Y = 1;
const STEP_S = 0.22;

export function CascadeDelays() {
  const dots: React.ReactNode[] = [];
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 7; x++) {
      const d = Math.abs(x - SEED_X) + Math.abs(y - SEED_Y);
      dots.push(<i key={`${x}-${y}`} style={{ animationDelay: `${d * STEP_S}s` }} />);
    }
  }
  return <>{dots}</>;
}
