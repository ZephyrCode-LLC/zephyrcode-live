"use client";

import { useState } from "react";

/**
 * The Stories deck — two interactive novels from the same desk (ANTYODAYA, KSHETRA),
 * switchable as tabs. Each book breathes its own accent: selecting a tab overrides
 * --accent on the card, so the accent bar, the log rule and the live-chips take that
 * book's colour (the per-room footprint). The card cross-fades on switch.
 */
type Cta = { label: string; href: string; style?: string };
type Chip = { label: string; live: boolean };
export type Feature = {
  key: string;
  tabDeva?: string;
  tabName?: string;
  accent?: string;
  hindi: string;
  h3: string;
  tag: string;
  logId: string;
  logText: string;
  blurbHtml: string;
  chips: Chip[];
  ctas: Cta[];
};

export function StoriesTabs({ features }: { features: Feature[] }) {
  const [active, setActive] = useState(0);
  const f = features[active] ?? features[0];
  if (!f) return null;
  const accentStyle = (a?: string) => (a ? ({ ["--accent"]: a } as React.CSSProperties) : undefined);

  return (
    <div className="stories-deck rv">
      {features.length > 1 && (
        <div className="story-tabs" role="tablist" aria-label="The novels">
          {features.map((feat, i) => (
            <button
              key={feat.key}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`story-tab${i === active ? " is-active" : ""}`}
              style={accentStyle(feat.accent)}
              onClick={() => setActive(i)}
            >
              {feat.tabDeva && <span className="st-deva" lang="sa">{feat.tabDeva}</span>}
              <span className="st-name">{feat.tabName ?? feat.h3}</span>
            </button>
          ))}
        </div>
      )}

      <article className="feature" style={accentStyle(f.accent)} key={f.key}>
        <div className="feature-fade">
          <p className="hindi">{f.hindi}</p>
          <h3>{f.h3}</h3>
          <p className="tag">{f.tag}</p>
          <div className="log">
            <span className="id">{f.logId}</span>
            {f.logText}
          </div>
          <p className="blurb" dangerouslySetInnerHTML={{ __html: f.blurbHtml }} />
          <div className="chips">
            {f.chips.map((c) => (
              <span key={c.label} className={`chip${c.live ? " live" : ""}`}>
                {c.label}
              </span>
            ))}
          </div>
          <div className="btnrow">
            {f.ctas.map((c) => (
              <a key={c.label} className={`btn ${c.style ?? ""}`} href={c.href}>
                {c.label}
              </a>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
