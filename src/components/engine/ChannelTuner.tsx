"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The watch.zephyrcode.live channel tuner, ported 1:1 from the inline script
 * in /_reference/watch.html: chip tablist tunes a now-playing panel with a
 * static-flicker transition (remove class → void offsetWidth → re-add class),
 * match-% bars and platform chips. All copy arrives via props/rows — this
 * component contains zero content strings.
 */

export type TunerTitle = {
  title: string;
  match: number;
  platform: string;
  why: string;
  position: number;
};

export type TunerChannel = {
  n: string;
  name: string;
  tagline: string;
  position: number;
  titles: TunerTitle[];
};

/** tune()'s static-flicker, verbatim: restart the CSS animation via reflow. */
function flick(np: HTMLElement): void {
  np.classList.remove("flick");
  void np.offsetWidth;
  np.classList.add("flick");
}

export function ChannelTuner({
  channels,
  tunedPrefix,
  footnote,
  tablistLabel,
}: {
  channels: TunerChannel[];
  tunedPrefix: string;
  footnote: string;
  tablistLabel: string;
}) {
  const [cur, setCur] = useState(0);
  const npRef = useRef<HTMLElement>(null);

  // The source runs tune(0) on load, which fires the flicker once.
  useEffect(() => {
    if (npRef.current) flick(npRef.current);
  }, []);

  function tune(i: number): void {
    setCur(i);
    if (npRef.current) flick(npRef.current);
  }

  const c = channels[cur];
  if (!c) return null;

  return (
    <>
      <div className="chans rv" role="tablist" aria-label={tablistLabel}>
        {channels.map((ch, i) => (
          <button
            key={ch.n}
            type="button"
            className={i === cur ? "ch on" : "ch"}
            role="tab"
            aria-selected={i === cur}
            onClick={() => tune(i)}
          >
            <span className="n">{ch.n}</span>
            {ch.name}
          </button>
        ))}
      </div>

      <section ref={npRef} className="np rv" aria-live="polite">
        <p className="k">{`${tunedPrefix} ${c.n}`}</p>
        <h2>{c.name}</h2>
        <p className="tagline">{`— ${c.tagline}`}</p>
        <div>
          {c.titles.map((t) => (
            <div key={t.title} className="title">
              <span className="t">{t.title}</span>
              <span className="side">
                <span className="pchip">{t.platform}</span>
                <span className="match">
                  <span className="bar">
                    <i style={{ width: `${t.match}%` }} />
                  </span>
                  {t.match}
                </span>
              </span>
              <span className="why">{t.why}</span>
            </div>
          ))}
        </div>
        <p className="footnote">{footnote}</p>
      </section>
    </>
  );
}
