"use client";

import { useState } from "react";
import { track } from "@/lib/posthog";

/**
 * The studio's interactive-toy carousel — showing the ACTUAL playable toys
 * (the arcade machines live as standalone same-origin files in /public/machines),
 * not descriptions of them. One live toy at a time, iframed so it runs with its
 * own logic; prev/next + dots to browse. Lazy: only the active toy is mounted.
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
  const go = (n: number) => {
    const x = (n + TOYS.length) % TOYS.length;
    setI(x);
    track("studio_toy_view", { toy: TOYS[x].slug });
  };
  const t = TOYS[i];

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

      <div className="sc-stage">
        {/* key on slug so the live toy (re)loads when you switch — one iframe mounted at a time */}
        <iframe
          key={t.slug}
          className="sc-frame"
          src={`/machines/${t.slug}.html`}
          title={`${t.name} — interactive toy`}
          loading="lazy"
        />
        <a className="sc-open mono" href={`/m/${t.slug}`} target="_blank" rel="noopener" aria-label={`Open ${t.name} full-screen`}>
          open ↗
        </a>
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
