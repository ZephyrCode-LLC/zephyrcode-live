/** Pure maths for the section nav tracker — kept out of the component so it is testable
 *  without a DOM (scripts/test-section-progress.ts). */

export type SceneBox = { top: number; bottom: number };

/** Which of the (visible, document-ordered) scenes holds the viewport centre `mid`, and how far
 *  through it the centre is (0..1). Same rule SceneAccent has always used for the accent shift:
 *  top <= mid <= bottom, earliest wins on a shared seam — so `k + frac` is continuous across
 *  seams. Beyond the last scene (the footer) it holds the last scene at 1; above the first, 0.
 *  Returns null when nothing is visible (every scene door-gated away). */
export function locate(boxes: SceneBox[], mid: number): { k: number; frac: number } | null {
  if (!boxes.length) return null;
  for (let k = 0; k < boxes.length; k++) {
    const { top, bottom } = boxes[k];
    if (top <= mid && bottom >= mid) {
      const h = bottom - top;
      return { k, frac: h > 0 ? (mid - top) / h : 0 };
    }
  }
  return mid < boxes[0].top ? { k: 0, frac: 0 } : { k: boxes.length - 1, frac: 1 };
}

/** Where the progress head sits on the spine, in *rail-list index* units. `slots[k]` is the
 *  position, in the full rail list, of the k-th visible scene. Interpolating between slots (not
 *  between visible ranks) makes the head land exactly on a node at each scene start even when a
 *  door has dimmed the nodes in between. The last visible scene parks on its own node. */
export function spinePos(slots: number[], k: number, frac: number): number {
  if (!slots.length) return 0;
  const here = slots[k] ?? slots[slots.length - 1];
  const next = slots[k + 1];
  return next === undefined ? here : here + frac * (next - here);
}

/** Whole-page scroll progress 0..1 (the pill's hairline). */
export function pageProgress(scrollY: number, docHeight: number, viewportHeight: number): number {
  const span = docHeight - viewportHeight;
  return span > 0 ? Math.min(1, Math.max(0, scrollY / span)) : 0;
}
