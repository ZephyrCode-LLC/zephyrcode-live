"use client";

import { useState } from "react";
import { ConsequenceWeek } from "@/components/engine/ConsequenceWeek";

/**
 * The "personal operating systems" deck — FORGE (the body), TEMPER (the mind),
 * and a forthcoming money planner — switchable as tabs (same footprint as the
 * StoriesTabs novel deck). Each tab leads with a plain, benefit-first line and a
 * signature teaser animation; FORGE carries the live "tap your week" consequence
 * toy. No studio/operator copy here — this section is only about the products.
 */

type Toy = {
  k: string;
  dayLabels: string[];
  seriesParams: { start: number; hit: number; miss: number };
  capHtml: string;
};

const ECG = "M0 12 H38 l4 -9 l4 17 l4 -9 H92 l4 -9 l4 17 l4 -9 H146 l4 -9 l4 17 l4 -9 H200";
const WAVE = "M0 12 Q12.5 3 25 12 T50 12 T75 12 T100 12 T125 12 T150 12 T175 12 T200 12";
const ROADMAP = "M0 21 C 40 20, 60 15, 90 12 S 130 7, 200 3"; // net-worth climbing to a goal

type Tab = {
  key: string;
  name: string;
  os: string;
  state: "live" | "soon";
  accent: string;
  prop: string;
  points: string[];
  vital: "ecg" | "wave" | "roadmap";
  toy?: boolean;
  cta?: { label: string; href: string };
};

export function SystemsDeck({ toy }: { toy: Toy }) {
  const tabs: Tab[] = [
    {
      key: "forge",
      name: "FORGE",
      os: "OS 01 · The body",
      state: "live",
      accent: "#e0673a",
      prop: "Training and nutrition tuned to your genetics and bloodwork — so you build the body your data says you can.",
      points: [
        "Three sessions a day, built around your DNA",
        "Audited by bloodwork that actually moved",
        "See where this week's choices land — before you make them",
      ],
      vital: "ecg",
      toy: true,
      cta: { label: "Open FORGE →", href: "https://forge-app.zephyrcode.live?utm_source=hub-systems" },
    },
    {
      key: "temper",
      name: "TEMPER",
      os: "OS 02 · The mind",
      state: "live",
      accent: "#8b7fd4",
      prop: "Train your attention like a muscle. Focus longer, get interrupted less, and see exactly what distraction is costing you.",
      points: [
        "The real price a “quick meeting” charges your afternoon",
        "A day-clock that proves your best hours",
        "Eight weeks of moved focus metrics",
      ],
      vital: "wave",
      cta: { label: "Enter TEMPER →", href: "https://temper.zephyrcode.live?utm_source=hub-systems" },
    },
    {
      key: "money",
      name: "The financial planner",
      os: "OS 03 · The money",
      state: "soon",
      accent: "#54c38a",
      prop: "Feed in what you own, owe, and want — and get a clear, simulated roadmap to the number you're aiming for.",
      points: [
        "Assets, liabilities, goals and ambitions — in",
        "A year-by-year roadmap you can steer — out",
        "Watch a decision today move the finish line",
      ],
      vital: "roadmap",
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

          <div className={`sys-vital-wrap vital-${t.vital}`} aria-hidden="true">
            <svg className="sys-vital" viewBox="0 0 200 24" preserveAspectRatio="none">
              {t.vital === "roadmap" ? (
                <>
                  <path className="sv-target" d="M200 3 v18" />
                  <path className="sv-base" d={ROADMAP} />
                  <path className="sv-scan" d={ROADMAP} />
                  <circle className="sv-dot" r="2.6" cx="200" cy="3" />
                </>
              ) : (
                <>
                  <path className="sv-base" d={t.vital === "ecg" ? ECG : WAVE} />
                  <path className="sv-scan" d={t.vital === "ecg" ? ECG : WAVE} />
                </>
              )}
            </svg>
            <span className="sys-vital-cap mono">
              {t.vital === "ecg" ? "vitals, live" : t.vital === "wave" ? "attention, live" : "your roadmap, simulated"}
            </span>
          </div>
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
