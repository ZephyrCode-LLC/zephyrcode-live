"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/posthog";

/**
 * The interactive-toy carousel — the ACTUAL playable arcade machines (standalone
 * same-origin files in /public/machines), iframed so they run live. One toy at a
 * time, prev/next + dots. The stage auto-sizes to each toy's real height (we drop
 * the toy's 100vh min-height and measure it, same-origin) so nothing scrolls
 * inside the frame — the whole toy is on the page.
 */

const TOYS = [
  { slug: "tax", name: "The Interruption Tax", blurb: "Tap the timeline — watch one “quick meeting” shred a maker's afternoon." },
  { slug: "leap", name: "The Leap", blurb: "Drag the month you quit your job; watch the valley floor rise to meet you." },
  { slug: "cascade", name: "Cascade", blurb: "How ideas actually spread — simple contagion vs. the complex kind that needs friends." },
  { slug: "plate", name: "The Plate", blurb: "Build the meal with your hands; the glucose curve answers in real time." },
  { slug: "bedtime", name: "Bedtime", blurb: "A dilemma deck with four meters that remember what you chose at 9:47pm." },
];

export function StudioToys() {
  const [i, setI] = useState(0);
  const [h, setH] = useState(520);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const t = TOYS[i];

  const go = (n: number) => {
    const x = (n + TOYS.length) % TOYS.length;
    setI(x);
    track("studio_toy_view", { toy: TOYS[x].slug });
  };

  const fit = () => {
    try {
      const doc = frameRef.current?.contentWindow?.document;
      if (!doc) return;
      const bh = Math.max(doc.body?.scrollHeight || 0, doc.documentElement?.scrollHeight || 0);
      if (bh > 80) setH(bh);
    } catch {}
  };

  const onLoad = () => {
    roRef.current?.disconnect();
    try {
      const doc = frameRef.current?.contentWindow?.document;
      if (!doc?.body) return;
      // drop the toy's 100vh min-height so it collapses to its true content height
      const s = doc.createElement("style");
      s.textContent = "html,body{min-height:0!important}";
      doc.head.appendChild(s);
      fit();
      const ro = new ResizeObserver(fit);
      ro.observe(doc.body);
      roRef.current = ro;
    } catch {}
  };

  useEffect(() => () => roRef.current?.disconnect(), []);

  return (
    <div className="studio-carousel rv">
      <div className="sc-head">
        <div className="sc-meta">
          <p className="sc-name">{t.name}</p>
          <p className="sc-blurb">{t.blurb}</p>
        </div>
        <div className="sc-nav">
          <button type="button" onClick={() => go(i - 1)} aria-label="Previous toy">←</button>
          <span className="sc-count mono">{i + 1} / {TOYS.length}</span>
          <button type="button" onClick={() => go(i + 1)} aria-label="Next toy">→</button>
        </div>
      </div>

      <div className="sc-stage" style={{ height: h }}>
        <iframe
          ref={frameRef}
          key={t.slug}
          className="sc-frame"
          src={`/machines/${t.slug}.html`}
          title={`${t.name} — interactive toy`}
          loading="lazy"
          onLoad={onLoad}
        />
      </div>

      <div className="sc-dots" role="tablist" aria-label="Interactive toys">
        {TOYS.map((toy, idx) => (
          <button
            key={toy.slug}
            type="button"
            role="tab"
            aria-selected={idx === i}
            aria-label={toy.name}
            className={idx === i ? "on" : ""}
            onClick={() => go(idx)}
          />
        ))}
      </div>
    </div>
  );
}
