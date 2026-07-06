"use client";

import { useState } from "react";
import { ConsequenceWeek } from "@/components/engine/ConsequenceWeek";

/**
 * The "personal operating systems" deck — FORGE (the body), TEMPER (the mind),
 * and COMPASS (the money, forthcoming) — switchable as tabs. Each tab leads with
 * a plain, benefit-first line and its OWN signature teaser, matched to that
 * product's real identity on its subdomain: FORGE = a green adherence engine
 * (a save-file you level or corrupt); TEMPER = a blade run through the tempering
 * colours (straw → bronze → purple → blue); COMPASS = a roadmap climbing to your
 * number. No studio/operator copy here — the section is only about the products.
 */

type Toy = {
  k: string;
  dayLabels: string[];
  seriesParams: { start: number; hit: number; miss: number };
  capHtml: string;
};

type Tab = {
  key: string;
  name: string;
  os: string;
  state: "live" | "soon";
  accent: string;
  prop: string;
  points: string[];
  teaser: "engine" | "blade" | "roadmap";
  toy?: boolean;
  cta?: { label: string; href: string };
};

const ROADMAP = "M2 34 C 40 33, 60 24, 95 18 S 150 9, 198 4";

function Teaser({ kind }: { kind: Tab["teaser"] }) {
  if (kind === "engine") {
    // FORGE — the adherence engine (green save-file), like the ENGINE panel on forge-app
    return (
      <div className="sys-teaser forge-engine" aria-hidden="true">
        <div className="fe-head mono">ENGINE</div>
        <div className="fe-row">
          <span className="fe-label mono">ADHERENCE</span>
          <span className="fe-track"><i className="fe-fill up" /></span>
          <span className="fe-num mono up">74%</span>
        </div>
        <div className="fe-row">
          <span className="fe-label mono">SKIPPED DEBT</span>
          <span className="fe-track"><i className="fe-fill down" /></span>
          <span className="fe-num mono down">−2 wk</span>
        </div>
        <p className="fe-note mono">SAVE-FILE: leveling · goal date moved up 11 days</p>
      </div>
    );
  }
  if (kind === "blade") {
    // TEMPER — the blade run through the tempering colours
    return (
      <div className="sys-teaser blade-wrap" aria-hidden="true">
        <span className="temper-blade" />
        <span className="blade-cap mono">straw → bronze → purple → blue</span>
      </div>
    );
  }
  // COMPASS — the roadmap climbing to your number
  return (
    <div className="sys-teaser vital-roadmap" aria-hidden="true">
      <svg className="sys-vital" viewBox="0 0 200 40" preserveAspectRatio="none">
        <path className="sv-goal" d="M198 4 v34" />
        <path className="sv-base" d={ROADMAP} />
        <path className="sv-scan" d={ROADMAP} />
        <circle className="sv-dot" r="3" cx="198" cy="4" />
      </svg>
      <span className="blade-cap mono">your roadmap, simulated</span>
    </div>
  );
}

export function SystemsDeck({ toy }: { toy: Toy }) {
  const tabs: Tab[] = [
    {
      key: "forge",
      name: "FORGE",
      os: "OS 01 · The body",
      state: "live",
      accent: "#52c98a",
      prop: "Training and nutrition tuned to your genetics and bloodwork — so you build the body your data says you can.",
      points: [
        "Three sessions a day, built around your DNA",
        "Audited by bloodwork that actually moved",
        "A save-file you level or corrupt — see it before you skip",
      ],
      teaser: "engine",
      toy: true,
      cta: { label: "Open FORGE →", href: "https://forge-app.zephyrcode.live?utm_source=hub-systems" },
    },
    {
      key: "temper",
      name: "TEMPER",
      os: "OS 02 · The mind",
      state: "live",
      accent: "#8b7fd4",
      prop: "Train your attention like a blade. Focus longer, get interrupted less, and see exactly what distraction is costing you.",
      points: [
        "The real price a “quick meeting” charges your afternoon",
        "A day-clock that proves your best hours",
        "Eight weeks of moved focus metrics",
      ],
      teaser: "blade",
      cta: { label: "Enter TEMPER →", href: "https://temper.zephyrcode.live?utm_source=hub-systems" },
    },
    {
      key: "compass",
      name: "COMPASS",
      os: "OS 03 · The money",
      state: "soon",
      accent: "#cca24a",
      prop: "Feed in what you own, owe, and want — and get a clear, simulated roadmap to the number you're aiming for.",
      points: [
        "Assets, liabilities, goals and ambitions — in",
        "A year-by-year roadmap you can steer — out",
        "Watch one decision today move the finish line",
      ],
      teaser: "roadmap",
    },
  ];

  const [active, setActive] = useState(0);
  const t = tabs[active];

  return (
    <div className="sysdeck rv">
      <div className="sys-tabs" role="tablist" aria-label="Personal operating systems">
        {tabs.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`sys-tab${i === active ? " is-active" : ""}`}
            style={{ ["--dc" as string]: tab.accent }}
            onClick={() => setActive(i)}
          >
            <span className="sys-tab-name">{tab.name}</span>
            <span className={`sys-tab-state${tab.state === "soon" ? " soon" : ""}`}>
              {tab.state === "live" ? "LIVE" : "SOON"}
            </span>
          </button>
        ))}
      </div>

      <article className="sys-panel" style={{ ["--dc" as string]: t.accent }} key={t.key}>
        <div className="sys-panel-in">
          <div className="sys-lead">
            <p className="sys-os mono">{t.os}</p>
            <h3 className="sys-name">{t.name}</h3>
            <p className="sys-prop">{t.prop}</p>
            <ul className="sys-points">
              {t.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            {t.cta ? (
              <a className="btn solid sys-cta" href={t.cta.href} target="_blank" rel="noopener">
                {t.cta.label}
              </a>
            ) : (
              <span className="sys-soon-tag mono">In build — arriving soon</span>
            )}
          </div>
          <Teaser kind={t.teaser} />
        </div>

        {t.toy && (
          <div className="sys-toy">
            <ConsequenceWeek k={toy.k} dayLabels={toy.dayLabels} seriesParams={toy.seriesParams} capHtml={toy.capHtml} />
          </div>
        )}
      </article>
    </div>
  );
}
