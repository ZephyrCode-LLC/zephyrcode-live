/**
 * Behaviour tests for the section-nav tracker maths (src/components/system/sectionProgress.ts).
 * No test runner in this repo, so: `pnpm exec tsx scripts/test-section-progress.ts`
 * (exits non-zero on the first failed assertion).
 */
import assert from "node:assert/strict";
import { locate, spinePos, pageProgress } from "../src/components/system/sectionProgress";

// three stacked scenes, viewport-relative, 1000px tall each; viewport centre at y=500
const stack = (scrollY: number) => [0, 1, 2].map((i) => ({ top: i * 1000 - scrollY, bottom: (i + 1) * 1000 - scrollY }));

// 1. the scene holding the viewport centre is active; frac = how far the centre is through it
{
  const r = locate(stack(1250), 500); // centre = page y 1750 -> scene 1, 75% through
  assert.equal(r?.k, 1);
  assert.equal(r?.frac, 0.75);
}

// 2. continuity at a seam: end of scene A (frac 1) and start of scene B (frac 0) are the same p
{
  const a = locate(stack(500), 500)!; // centre = page y 1000 -> exactly the A|B seam
  const p = a.k + a.frac;
  const b = locate(stack(500.001), 500)!; // a hair further -> inside B
  assert.ok(Math.abs(b.k + b.frac - p) < 0.001, `p jumped across the seam: ${p} -> ${b.k + b.frac}`);
}

// 3. past the last scene (the footer): hold the last scene, fully through it
{
  const r = locate(stack(2900), 500)!; // centre well below scene 2's bottom
  assert.deepEqual(r, { k: 2, frac: 1 });
}

// 4. above the first scene: first scene, zero progress
{
  const r = locate([{ top: 900, bottom: 1900 }], 500)!;
  assert.deepEqual(r, { k: 0, frac: 0 });
}

// 5. nothing visible (every scene door-gated away): no answer, not a crash
assert.equal(locate([], 500), null);

// 6. a zero-height box must never produce NaN
{
  const r = locate([{ top: 500, bottom: 500 }], 500)!;
  assert.ok(Number.isFinite(r.frac));
}

// 7. spine position: progress runs between the *list slots* of the visible scenes, so the fill
//    lands exactly on a node at each scene start even when door-gating dims nodes in between
{
  const slots = [0, 1, 2, 5, 6]; // visible scenes' positions in the full rail list
  assert.equal(spinePos(slots, 2, 0), 2);
  assert.equal(spinePos(slots, 2, 0.5), 3.5); // halfway across the three dimmed-node gap
  assert.equal(spinePos(slots, 2, 1), 5); // arrives on the next visible node as the scene ends
  assert.equal(spinePos(slots, 4, 0.8), 6); // last scene: parked on its own node
  assert.equal(spinePos([], 0, 0), 0);
}

// 8. whole-page progress for the pill hairline is clamped to 0..1 and survives a short page
assert.equal(pageProgress(0, 3000, 800), 0);
assert.equal(pageProgress(1100, 3000, 800), 0.5);
assert.equal(pageProgress(9999, 3000, 800), 1);
assert.equal(pageProgress(10, 700, 800), 0); // page shorter than the viewport

console.log("section-progress: all assertions passed");
